const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const BUNDLE = fs.readFileSync(
  path.join(__dirname, '..', 'dist', 'claude-rtl.bundle.js'), 'utf8');

function mount(bodyHtml) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${bodyHtml}</body></html>`,
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://claude.ai/' });
  dom.window.eval(BUNDLE);
  return dom;
}

const $ = (dom, sel) => dom.window.document.querySelector(sel);

test('Hebrew paragraph becomes rtl', () => {
  const dom = mount('<p id="a">שלום עולם</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('English paragraph is left alone entirely', () => {
  const dom = mount('<p id="a">hello world</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), null);
  assert.strictEqual($(dom, '#a').hasAttribute('data-crtl'), false);
});

test('Hebrew line starting with an English word is still rtl', () => {
  const dom = mount('<p id="a">Next.js הוא פריימוורק מצוין לבניית אתרים</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('English UI chrome is untouched', () => {
  const dom = mount(
    '<nav><button id="b">New chat</button><li id="l">Settings</li></nav>');
  assert.strictEqual($(dom, '#l').hasAttribute('dir'), false);
});

test('code inside a Hebrew paragraph does not flip the paragraph', () => {
  const dom = mount(
    '<p id="a">כדי להתקין הרץ <code>npm install --save-dev typescript</code> בתיקייה</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('code blocks are never marked', () => {
  const dom = mount('<pre id="p"><code>const x = "שלום";</code></pre>');
  assert.strictEqual($(dom, '#p').hasAttribute('data-crtl'), false);
});

test('per-item list direction: Hebrew and English items differ', () => {
  const dom = mount(
    '<ul id="u"><li id="h">פריט ראשון בעברית</li>' +
    '<li id="e">an entirely english item here</li></ul>');
  assert.strictEqual($(dom, '#h').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#e').getAttribute('dir'), null);
  assert.strictEqual($(dom, '#u').getAttribute('dir'), 'rtl');
});

test('per-cell table direction, and Hebrew table flips columns', () => {
  const dom = mount(
    '<table id="t"><tr><th id="c1">עמודה ראשונה</th>' +
    '<th id="c2">Column</th></tr>' +
    '<tr><td id="c3">ערך בעברית כאן</td><td id="c4">value</td></tr></table>');
  assert.strictEqual($(dom, '#c1').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#c3').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#c2').getAttribute('dir'), null);
  assert.strictEqual($(dom, '#t').getAttribute('dir'), 'rtl');
});

test('Hebrew in a bare div (user message) is caught by the orphan pass', () => {
  const dom = mount('<div id="m"><div id="inner">מה שלומך היום</div></div>');
  assert.strictEqual($(dom, '#inner').getAttribute('dir'), 'rtl');
});

test('an explicit dir set by the app is respected', () => {
  const dom = mount('<p id="a" dir="ltr">שלום עולם ומה שלומך</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'ltr');
  assert.strictEqual($(dom, '#a').hasAttribute('data-crtl'), false);
});

test('dir="auto" is overridden, since that is the rule we improve on', () => {
  const dom = mount('<p id="a" dir="auto">Next.js הוא פריימוורק מצוין לבניית אתרים</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('the stylesheet is injected once', () => {
  const dom = mount('<p>שלום</p>');
  const styles = dom.window.document.querySelectorAll('#claude-rtl-style');
  assert.strictEqual(styles.length, 1);
  assert.ok(styles[0].textContent.includes('unicode-bidi'));
});

test('empty composer takes the configured default direction', () => {
  const dom = mount('<div contenteditable="true" id="c"><p id="l"></p></div>');
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'rtl');
});

test('composer lines follow their own content', () => {
  const dom = mount(
    '<div contenteditable="true" id="c">' +
    '<p id="l1">שורה בעברית</p><p id="l2">an english line of text</p></div>');
  assert.strictEqual($(dom, '#l1').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#l2').getAttribute('dir'), 'ltr');
});

test('disable() strips every attribute we added', () => {
  const dom = mount('<p id="a">שלום עולם</p><ul id="u"><li id="l">פריט</li></ul>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
  dom.window.claudeRtl.disable();
  assert.strictEqual($(dom, '#a').hasAttribute('dir'), false);
  assert.strictEqual($(dom, '#a').hasAttribute('data-crtl'), false);
  assert.strictEqual($(dom, '#l').hasAttribute('dir'), false);
  dom.window.claudeRtl.enable();
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('streamed content is picked up by the observer', async () => {
  const dom = mount('<div id="msg"></div>');
  const p = dom.window.document.createElement('p');
  p.textContent = 'תשובה שמגיעה בזרימה מהמודל';
  $(dom, '#msg').appendChild(p);
  await new Promise((r) => dom.window.requestAnimationFrame(() => r()));
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(p.getAttribute('dir'), 'rtl');
});

test('threshold is tunable at runtime', () => {
  const dom = mount('<p id="a">שלום hello world everybody around here</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'ltr');
  dom.window.claudeRtl.config({ threshold: 0.1 });
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});
