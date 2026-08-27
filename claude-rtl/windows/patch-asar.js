#!/usr/bin/env node
/*
 * Persistent patch for Claude Desktop — no launcher needed.
 *
 * The obvious route (edit app.asar) is a trap on Windows. Electron verifies
 * the archive's hash, that hash lives inside claude.exe, and editing either
 * one invalidates claude.exe's Authenticode signature — which cowork-svc.exe
 * then checks. That is why the well-known community patch ends up swapping a
 * certificate inside cowork-svc.exe and adding a self-signed CA to the
 * Windows trusted root store. This script deliberately does not go there.
 *
 * It uses a quieter property of Electron instead: the app is resolved from
 * `resources/app/` BEFORE `resources/app.asar`. When the OnlyLoadAppFromAsar
 * fuse is disabled we can lay down an unpacked `resources/app/` directory and
 * leave app.asar, claude.exe and every signature completely untouched.
 *
 *   node patch-asar.js check     inspect this install and pick a strategy
 *   node patch-asar.js patch     apply
 *   node patch-asar.js restore   remove
 *
 * Requires Node.js. `patch` also uses `npx @electron/asar` (downloaded once).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// Electron stamps its fuse configuration into the binary after this sentinel.
const FUSE_SENTINEL = 'dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX';
const FUSE_NAMES = [
  'RunAsNode',
  'EnableCookieEncryption',
  'EnableNodeOptionsEnvironmentVariable',
  'EnableNodeCliInspectArguments',
  'EnableEmbeddedAsarIntegrityValidation',
  'OnlyLoadAppFromAsar',
  'LoadBrowserProcessSpecificV8Snapshot',
  'GrantFileProtocolExtraPrivileges'
];
const MARKER = 'claude-rtl-injected-v1';

// ------------------------------------------------------------- locating

function candidateRoots() {
  const roots = [];
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA;
    if (local) roots.push(path.join(local, 'AnthropicClaude'));
    if (process.env.ProgramFiles) roots.push(path.join(process.env.ProgramFiles, 'Claude'));
  } else if (process.platform === 'darwin') {
    roots.push('/Applications/Claude.app/Contents');
    roots.push(path.join(os.homedir(), 'Applications/Claude.app/Contents'));
  } else {
    roots.push('/opt/Claude', '/usr/lib/claude-desktop');
  }
  return roots.filter((r) => fs.existsSync(r));
}

function findInstall() {
  for (const root of candidateRoots()) {
    // Windows keeps versioned app-x.y.z directories side by side.
    const versioned = fs.readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^app-/.test(e.name))
      .map((e) => path.join(root, e.name))
      .sort()
      .reverse();

    for (const dir of [...versioned, root]) {
      const resources = fs.existsSync(path.join(dir, 'resources'))
        ? path.join(dir, 'resources')
        : dir;
      const asar = path.join(resources, 'app.asar');
      if (!fs.existsSync(asar)) continue;

      const exe = ['claude.exe', 'Claude', 'claude']
        .map((n) => path.join(dir, n))
        .find((p) => fs.existsSync(p));

      return { base: dir, resources, asar, exe: exe || null };
    }
  }
  return null;
}

// ---------------------------------------------------------------- fuses

function readFuses(exePath) {
  if (!exePath || !fs.existsSync(exePath)) return null;
  const needle = Buffer.from(FUSE_SENTINEL, 'utf8');
  const fd = fs.openSync(exePath, 'r');
  try {
    const CHUNK = 8 * 1024 * 1024;
    const overlap = needle.length + 64;
    const buf = Buffer.alloc(CHUNK + overlap);
    let filePos = 0;
    let carry = 0;

    for (;;) {
      const read = fs.readSync(fd, buf, carry, CHUNK, filePos);
      if (read <= 0) return null;
      const view = buf.subarray(0, carry + read);
      const idx = view.indexOf(needle);

      if (idx !== -1) {
        // [sentinel][version][wire length][fuse bytes...], '0' off / '1' on.
        const start = idx + needle.length;
        if (start + 2 >= view.length) return null;
        const wireLength = view[start + 1];
        const fuses = {};
        for (let i = 0; i < wireLength && i < FUSE_NAMES.length; i++) {
          const byte = view[start + 2 + i];
          fuses[FUSE_NAMES[i]] =
            byte === 0x31 ? 'enabled' : byte === 0x30 ? 'disabled' : 'removed';
        }
        return fuses;
      }

      filePos += read;
      carry = Math.min(overlap, view.length);
      view.subarray(view.length - carry).copy(buf, 0);
    }
  } finally {
    fs.closeSync(fd);
  }
}

// -------------------------------------------------------------- payload

function loadPayload() {
  const p = path.join(__dirname, '..', 'dist', 'claude-rtl.bundle.js');
  if (!fs.existsSync(p)) {
    throw new Error('dist/claude-rtl.bundle.js missing — run: node src/build.js');
  }
  return fs.readFileSync(p, 'utf8');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * Append the payload to the renderer's script bundles. Appending to an
 * existing script beats adding a <script> tag, which the app's
 * Content-Security-Policy would refuse to run.
 */
function injectInto(appDir, payload) {
  const files = walk(appDir);
  const htmls = files.filter((f) => /\.html$/i.test(f));
  const targets = new Set();

  for (const html of htmls) {
    const text = fs.readFileSync(html, 'utf8');
    const re = /<script[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const src = m[1].replace(/^\.?\//, '').split('?')[0];
      if (/^https?:/i.test(src)) continue;
      const resolved = path.resolve(path.dirname(html), src);
      if (fs.existsSync(resolved)) targets.add(resolved);
    }
  }

  if (targets.size === 0) {
    // Fall back to the largest renderer bundles.
    const js = files
      .filter((f) => /\.js$/i.test(f) && !/[\\/]node_modules[\\/]/.test(f))
      .map((f) => ({ f, size: fs.statSync(f).size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 2);
    js.forEach((x) => targets.add(x.f));
  }

  let count = 0;
  for (const file of targets) {
    const current = fs.readFileSync(file, 'utf8');
    if (current.includes(MARKER)) continue;
    fs.writeFileSync(file, current + '\n;/*' + MARKER + '*/\n' + payload + '\n');
    count++;
  }
  return { count, targets: [...targets] };
}

// -------------------------------------------------------------- commands

function cmdCheck() {
  const install = findInstall();
  if (!install) {
    console.log('Claude Desktop: NOT FOUND');
    console.log('Searched:', candidateRoots().join(', ') || '(no candidate roots exist)');
    process.exitCode = 1;
    return null;
  }

  console.log('Install       :', install.base);
  console.log('app.asar      :', install.asar,
    '(' + (fs.statSync(install.asar).size / 1048576).toFixed(1) + ' MB)');
  console.log('Executable    :', install.exe || '(not found)');

  const appDir = path.join(install.resources, 'app');
  console.log('resources/app :', fs.existsSync(appDir) ? 'PRESENT (patched?)' : 'absent');

  const fuses = readFuses(install.exe);
  if (!fuses) {
    console.log('Fuses         : could not read (binary layout unrecognised)');
  } else {
    console.log('Fuses:');
    for (const [name, state] of Object.entries(fuses)) {
      console.log('  ' + name.padEnd(38) + state);
    }
  }

  const coworkSvc = ['cowork-svc.exe', 'cowork-svc']
    .map((n) => path.join(install.base, n))
    .find((p) => fs.existsSync(p));
  console.log('cowork-svc    :', coworkSvc || 'not present');

  console.log('\nStrategy:');
  const onlyAsar = fuses && fuses.OnlyLoadAppFromAsar;
  if (onlyAsar === 'enabled') {
    console.log('  BLOCKED. OnlyLoadAppFromAsar is enabled, so Electron will ignore');
    console.log('  resources/app/ and load only the signed archive. Getting past this');
    console.log('  means editing claude.exe, which breaks its signature — this script');
    console.log('  will not do that. Use the launcher instead:');
    console.log('    windows\\claude-rtl.ps1 -Watch');
  } else {
    console.log('  OK to patch. resources/app/ will shadow app.asar; app.asar,');
    console.log('  claude.exe and every signature stay byte-for-byte unchanged.');
    if (coworkSvc) {
      console.log('  (cowork-svc.exe is present but verifies binaries, which we do');
      console.log('   not modify, so it should not object.)');
    }
    console.log('    node windows/patch-asar.js patch');
  }
  return install;
}

function cmdPatch() {
  const install = findInstall();
  if (!install) throw new Error('Claude Desktop not found. Run: node patch-asar.js check');

  const fuses = readFuses(install.exe);
  if (fuses && fuses.OnlyLoadAppFromAsar === 'enabled') {
    throw new Error(
      'OnlyLoadAppFromAsar is enabled on this build; a directory patch cannot ' +
      'work. Use windows\\claude-rtl.ps1 -Watch instead.');
  }

  const payload = loadPayload();
  const appDir = path.join(install.resources, 'app');

  if (fs.existsSync(appDir)) {
    throw new Error(appDir + ' already exists. Run `restore` first.');
  }

  console.log('Extracting app.asar (this takes a moment)...');
  execFileSync('npx', ['--yes', '@electron/asar', 'extract', install.asar, appDir], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  // Native modules live outside the archive; the unpacked tree has to be
  // merged in or requires resolving through __dirname will miss them.
  const unpacked = install.asar + '.unpacked';
  if (fs.existsSync(unpacked)) {
    console.log('Merging app.asar.unpacked...');
    fs.cpSync(unpacked, appDir, { recursive: true, force: true });
  }

  const result = injectInto(appDir, payload);
  if (result.count === 0) {
    fs.rmSync(appDir, { recursive: true, force: true });
    throw new Error('Found no renderer script to inject into; nothing changed.');
  }

  fs.writeFileSync(path.join(appDir, '.claude-rtl-patch.json'), JSON.stringify({
    marker: MARKER,
    patchedAt: new Date().toISOString(),
    sourceAsar: install.asar,
    injectedInto: result.targets.map((t) => path.relative(appDir, t))
  }, null, 2));

  console.log('\nPatched ' + result.count + ' script(s):');
  result.targets.forEach((t) => console.log('  ' + path.relative(appDir, t)));
  console.log('\nRestart Claude Desktop. Ctrl+Alt+R toggles RTL.');
  console.log('A Claude update replaces the install; re-run `patch` afterwards.');
  console.log('To undo: node windows/patch-asar.js restore');
}

function cmdRestore() {
  const install = findInstall();
  if (!install) throw new Error('Claude Desktop not found.');

  const appDir = path.join(install.resources, 'app');
  if (!fs.existsSync(appDir)) {
    console.log('Nothing to restore — resources/app does not exist.');
    return;
  }

  const stamp = path.join(appDir, '.claude-rtl-patch.json');
  if (!fs.existsSync(stamp)) {
    throw new Error(
      appDir + ' exists but was not created by this script. Refusing to delete ' +
      'it — inspect it yourself.');
  }

  fs.rmSync(appDir, { recursive: true, force: true });
  console.log('Removed ' + appDir);
  console.log('Claude loads the original signed app.asar again. Restart it.');
}

const COMMANDS = { check: cmdCheck, patch: cmdPatch, restore: cmdRestore };

module.exports = {
  findInstall, readFuses, injectInto, candidateRoots,
  FUSE_NAMES, FUSE_SENTINEL, MARKER
};

if (require.main === module) {
  const cmd = process.argv[2];
  if (!cmd || !COMMANDS[cmd]) {
    console.log('Usage: node patch-asar.js <check|patch|restore>');
    process.exit(cmd ? 1 : 0);
  }
  try {
    COMMANDS[cmd]();
  } catch (err) {
    console.error('\nError: ' + err.message);
    process.exit(1);
  }
}
