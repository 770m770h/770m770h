const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const P = require('../windows/patch-asar.js');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'crtl-'));
}

/** Build a fake Electron binary with a fuse wire embedded in padding. */
function fakeBinary(file, states) {
  const pad = Buffer.alloc(3 * 1024 * 1024, 0x41); // force multi-chunk scan
  const wire = Buffer.concat([
    Buffer.from(P.FUSE_SENTINEL, 'utf8'),
    Buffer.from([1, states.length]),
    Buffer.from(states.map((s) => (s ? 0x31 : 0x30)))
  ]);
  fs.writeFileSync(file, Buffer.concat([pad, wire, pad]));
}

test('readFuses decodes the fuse wire across chunk boundaries', () => {
  const dir = tmp();
  const exe = path.join(dir, 'claude.exe');
  // integrity(idx 4) on, OnlyLoadAppFromAsar(idx 5) off
  fakeBinary(exe, [false, true, false, false, true, false, false, true]);

  const fuses = P.readFuses(exe);
  assert.ok(fuses, 'fuses should be readable');
  assert.strictEqual(fuses.EnableEmbeddedAsarIntegrityValidation, 'enabled');
  assert.strictEqual(fuses.OnlyLoadAppFromAsar, 'disabled');
  assert.strictEqual(fuses.RunAsNode, 'disabled');
  assert.strictEqual(fuses.GrantFileProtocolExtraPrivileges, 'enabled');
});

test('readFuses returns null when the sentinel is absent', () => {
  const dir = tmp();
  const exe = path.join(dir, 'plain.exe');
  fs.writeFileSync(exe, Buffer.alloc(2 * 1024 * 1024, 0x42));
  assert.strictEqual(P.readFuses(exe), null);
});

test('readFuses tolerates a missing file', () => {
  assert.strictEqual(P.readFuses('/nonexistent/nope.exe'), null);
});

test('injectInto appends to scripts referenced by index.html', () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'),
    '<!doctype html><script src="./assets/main.js"></script>');
  fs.writeFileSync(path.join(dir, 'assets', 'main.js'), 'console.log(1);');
  fs.writeFileSync(path.join(dir, 'assets', 'other.js'), 'console.log(2);');

  const res = P.injectInto(dir, '/*payload*/');
  assert.strictEqual(res.count, 1);

  const main = fs.readFileSync(path.join(dir, 'assets', 'main.js'), 'utf8');
  assert.ok(main.startsWith('console.log(1);'), 'original code preserved');
  assert.ok(main.includes(P.MARKER));
  assert.ok(!fs.readFileSync(path.join(dir, 'assets', 'other.js'), 'utf8')
    .includes(P.MARKER), 'unreferenced script untouched');
});

test('injectInto is idempotent', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'index.html'), '<script src="a.js"></script>');
  fs.writeFileSync(path.join(dir, 'a.js'), 'x=1;');

  assert.strictEqual(P.injectInto(dir, '/*p*/').count, 1);
  assert.strictEqual(P.injectInto(dir, '/*p*/').count, 0, 'second pass is a no-op');

  const body = fs.readFileSync(path.join(dir, 'a.js'), 'utf8');
  assert.strictEqual(body.split(P.MARKER).length - 1, 1, 'injected exactly once');
});

test('injectInto skips remote scripts and falls back to the biggest bundle', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'index.html'),
    '<script src="https://cdn.example.com/x.js"></script>');
  fs.writeFileSync(path.join(dir, 'big.js'), 'a'.repeat(5000));
  fs.writeFileSync(path.join(dir, 'small.js'), 'b');

  const res = P.injectInto(dir, '/*p*/');
  assert.ok(res.count >= 1);
  assert.ok(fs.readFileSync(path.join(dir, 'big.js'), 'utf8').includes(P.MARKER));
});
