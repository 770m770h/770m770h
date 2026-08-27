/*
 * claude-rtl payload — DOM layer.
 *
 * Design notes worth knowing before changing anything here:
 *
 * 1. No Claude-specific class names. The app's markup changes between
 *    releases, so instead of selecting `.font-claude-message` and friends we
 *    walk ordinary block elements and act ONLY on those that actually contain
 *    Hebrew/Arabic characters. English UI chrome — buttons, menus, the model
 *    picker — contains no RTL characters and is therefore never touched. That
 *    makes the patch survive UI rewrites.
 *
 * 2. Writes are idempotent. Applying a direction that is already set produces
 *    no mutation, so the MutationObserver settles instead of looping when
 *    React re-renders.
 *
 * 3. Code and math are never flipped, and inline code inside a Hebrew line is
 *    isolated so it cannot drag the line's punctuation to the wrong side.
 */
(function () {
  'use strict';

  if (window.__claudeRtlInstalled) return;
  window.__claudeRtlInstalled = true;

  // The two placeholders below are substituted by src/build.js with the
  // contents of rtl-core.js and rtl.css respectively.
  var core = (function () {
    var module = { exports: {} };
    __RTL_CORE__
    return module.exports;
  })();
  var STYLE_TEXT = __RTL_CSS__;

  var detectDirection = core.detectDirection;
  var hasRtl = core.hasRtl;

  // ---------------------------------------------------------------- config

  var DEFAULTS = {
    threshold: 0.3,        // share of strong chars that must be RTL
    composerMode: 'js',    // 'js' | 'css' | 'off'
    composerDefault: 'rtl',// direction of an empty input box
    tables: true,          // flip column order of Hebrew-dominant tables
    hotkey: true,          // Ctrl+Alt+R toggles
    maxWritesPerElement: 40
  };

  function loadConfig() {
    var cfg = {};
    for (var k in DEFAULTS) cfg[k] = DEFAULTS[k];
    var sources = [window.__CLAUDE_RTL_CONFIG__];
    try {
      var stored = localStorage.getItem('claude-rtl:config');
      if (stored) sources.push(JSON.parse(stored));
    } catch (e) { /* storage blocked — defaults are fine */ }
    sources.forEach(function (src) {
      if (!src || typeof src !== 'object') return;
      for (var key in src) if (key in DEFAULTS) cfg[key] = src[key];
    });
    return cfg;
  }

  var config = loadConfig();
  var enabled = true;
  try {
    enabled = localStorage.getItem('claude-rtl:enabled') !== '0';
  } catch (e) { /* ignore */ }

  // ------------------------------------------------------------- selectors

  var BLOCK_SELECTOR =
    'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd, ' +
    'figcaption, summary';

  // Subtrees whose text must not influence, or receive, a direction.
  var OPAQUE_SELECTOR =
    'pre, code, kbd, samp, var, tt, svg, math, mjx-container, ' +
    '.katex, .katex-display, .MathJax, [data-crtl-skip]';

  var BLOCKISH_DISPLAY = {
    block: 1, 'flow-root': 1, 'list-item': 1, flex: 1, grid: 1,
    'table-cell': 1, 'inline-block': 0
  };

  // ----------------------------------------------------------- text reading

  /**
   * Text of an element with code and math removed, so that a Hebrew sentence
   * quoting `npm install` is judged on its Hebrew, not on the command.
   */
  function directionalText(el) {
    var out = '';
    var walk = function (node) {
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3) {
          out += child.nodeValue;
        } else if (child.nodeType === 1) {
          if (child.matches && child.matches(OPAQUE_SELECTOR)) continue;
          walk(child);
        }
        if (out.length > 4000) return; // long enough to decide
      }
    };
    walk(el);
    return out;
  }

  function isOpaque(el) {
    return !!(el.closest && el.closest(OPAQUE_SELECTOR));
  }

  // ------------------------------------------------------------ applying

  var writeCounts = new WeakMap();

  function setDirection(el, dir) {
    if (!dir) return;
    if (el.getAttribute('dir') === dir && el.hasAttribute('data-crtl')) return;

    var n = (writeCounts.get(el) || 0) + 1;
    if (n > config.maxWritesPerElement) return; // stop fighting a re-render loop
    writeCounts.set(el, n);

    el.setAttribute('dir', dir);
    el.setAttribute('data-crtl', '1');
  }

  function clearDirection(el) {
    if (!el.hasAttribute('data-crtl')) return;
    el.removeAttribute('data-crtl');
    el.removeAttribute('dir');
  }

  /**
   * The app itself now ships some RTL handling. An explicit dir="rtl"/"ltr"
   * set by Claude is respected; dir="auto" is overridden, because the
   * first-strong-character rule it implements is exactly what we are here to
   * improve on.
   */
  function appOwnsDirection(el) {
    if (el.hasAttribute('data-crtl')) return false;
    var d = el.getAttribute('dir');
    return d === 'rtl' || d === 'ltr';
  }

  function processBlock(el) {
    if (appOwnsDirection(el) || isOpaque(el)) return;
    var text = directionalText(el);
    if (!hasRtl(text)) {
      // Never spend writes on the all-English UI.
      clearDirection(el);
      return;
    }
    setDirection(el, detectDirection(text, { threshold: config.threshold }));
  }

  /** Lists and tables get a container direction so markers and columns follow. */
  function processContainer(el) {
    if (appOwnsDirection(el) || isOpaque(el)) return;
    var text = directionalText(el);
    if (!hasRtl(text)) return;
    setDirection(el, detectDirection(text, { threshold: config.threshold }));
  }

  /**
   * Hebrew text that sits in a bare <div> rather than a <p> — common in user
   * messages. Climb to the nearest block-level ancestor and mark that.
   */
  function processOrphans(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return hasRtl(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    var seen = new Set();
    var node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!el || isOpaque(el)) continue;
      if (el.closest(BLOCK_SELECTOR)) continue; // already covered
      while (el && el !== document.body) {
        var display = getComputedStyle(el).display;
        if (BLOCKISH_DISPLAY[display]) break;
        el = el.parentElement;
      }
      if (!el || el === document.body || seen.has(el)) continue;
      seen.add(el);
      processBlock(el);
    }
  }

  // ------------------------------------------------------------- composer

  function processComposer(root) {
    if (config.composerMode === 'off') return;

    var editors = root.querySelectorAll
      ? root.querySelectorAll('[contenteditable="true"]')
      : [];
    for (var i = 0; i < editors.length; i++) {
      var editor = editors[i];
      if (isOpaque(editor)) continue;

      if (config.composerMode === 'css') {
        document.documentElement.classList.add('crtl-composer-css');
        continue;
      }

      var lines = editor.querySelectorAll('p, div, li, h1, h2, h3');
      var anyLine = false;
      for (var j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (isOpaque(line) || line.querySelector(BLOCK_SELECTOR)) continue;
        anyLine = true;
        var text = directionalText(line);
        var dir = detectDirection(text, { threshold: config.threshold });
        // An empty line keeps the writer's expected direction rather than
        // jumping to LTR the moment they delete a word.
        setDirection(line, dir || config.composerDefault);
      }

      var rootText = directionalText(editor);
      var rootDir = detectDirection(rootText, { threshold: config.threshold });
      setDirection(editor, rootDir || (anyLine ? null : config.composerDefault));
    }
  }

  // ---------------------------------------------------------------- sweep

  function sweep(root) {
    if (!enabled) return;
    if (!root || root.nodeType !== 1) root = document.body || document.documentElement;
    if (!root) return;

    var scope = (root === document.body || root === document.documentElement)
      ? document
      : root;

    var blocks = scope.querySelectorAll(BLOCK_SELECTOR);
    for (var i = 0; i < blocks.length; i++) processBlock(blocks[i]);

    var containers = scope.querySelectorAll('ul, ol' + (config.tables ? ', table' : ''));
    for (var k = 0; k < containers.length; k++) processContainer(containers[k]);

    processOrphans(root);
    processComposer(scope);
  }

  // -------------------------------------------------------- observe & batch

  var pending = new Set();
  var scheduled = false;

  function flush() {
    scheduled = false;
    var roots = Array.from(pending);
    pending.clear();
    if (!enabled) return;
    // A large batch during streaming is cheaper to handle as one full sweep.
    if (roots.length > 30) { sweep(null); return; }
    roots.forEach(function (r) {
      if (r.isConnected) sweep(r);
    });
  }

  function schedule(node) {
    pending.add(node);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  var observer = new MutationObserver(function (records) {
    if (!enabled) return;
    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      if (rec.type === 'childList') {
        for (var j = 0; j < rec.addedNodes.length; j++) {
          var n = rec.addedNodes[j];
          if (n.nodeType === 1) schedule(n);
          else if (n.nodeType === 3 && rec.target.nodeType === 1) schedule(rec.target);
        }
      } else if (rec.target.nodeType === 1) {
        schedule(rec.target);
      } else if (rec.target.parentElement) {
        schedule(rec.target.parentElement);
      }
    }
  });

  var observing = false;

  function startObserving() {
    var target = document.documentElement;
    if (!target || observing) return;
    observing = true;
    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['dir', 'class']
    });
  }

  // ---------------------------------------------------------------- toggle

  function removeAll() {
    var marked = document.querySelectorAll('[data-crtl]');
    for (var i = 0; i < marked.length; i++) clearDirection(marked[i]);
    document.documentElement.classList.remove('crtl-composer-css');
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem('claude-rtl:enabled', enabled ? '1' : '0'); }
    catch (e) { /* ignore */ }
    document.documentElement.classList.toggle('crtl-disabled', !enabled);
    if (enabled) sweep(null);
    else removeAll();
    return enabled;
  }

  // ------------------------------------------------------------------ boot

  function injectStyle() {
    if (document.getElementById('claude-rtl-style')) return;
    var style = document.createElement('style');
    style.id = 'claude-rtl-style';
    style.textContent = STYLE_TEXT;
    (document.head || document.documentElement).appendChild(style);
  }

  function boot() {
    injectStyle();
    document.documentElement.classList.toggle('crtl-disabled', !enabled);
    sweep(null);
    startObserving();
  }

  // The payload may be injected at document-start (CDP / userscript
  // run-at=document-start) or long after load (manual console paste), so boot
  // as soon as there is anything to work with and re-sweep at the later
  // milestones. boot() is idempotent, so running it more than once is free.
  if (document.documentElement) boot();
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);

  if (config.hotkey) {
    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setEnabled(!enabled);
      }
    }, true);
  }

  // Small console API, handy when tuning the threshold live.
  window.claudeRtl = {
    enable: function () { return setEnabled(true); },
    disable: function () { return setEnabled(false); },
    toggle: function () { return setEnabled(!enabled); },
    resweep: function () { sweep(null); },
    config: function (patch) {
      if (patch) {
        for (var k in patch) if (k in DEFAULTS) config[k] = patch[k];
        try {
          localStorage.setItem('claude-rtl:config', JSON.stringify(config));
        } catch (e) { /* ignore */ }
        removeAll();
        sweep(null);
      }
      return config;
    },
    detect: function (text) {
      return detectDirection(text, { threshold: config.threshold });
    }
  };
})();
