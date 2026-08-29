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

test("Claude's own dir='ltr' on a Hebrew line is overridden", () => {
  // Claude resolves direction with the first-strong-character rule and writes
  // the result out, so deferring to an explicit dir means keeping the bug.
  const dom = mount('<p id="a" dir="ltr">שלום עולם ומה שלומך היום</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test("Claude's dir='ltr' on a line opening with English is still overridden", () => {
  const dom = mount('<p id="a" dir="ltr">3 Next.js הוא פריימוורק מצוין לאתרים</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('respectAppDir:true opts back out of overriding Claude', () => {
  const dom = mount('<p id="a" dir="ltr">שלום עולם ומה שלומך היום</p>');
  dom.window.claudeRtl.config({ respectAppDir: true });
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'ltr');
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

// ---------------------------------------------- sticky composer & overrides

test('a composer line opening with a number and English stays RTL', () => {
  const dom = mount('<div contenteditable="true"><p id="l">3 Next</p></div>');
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'rtl',
    'a half-typed prefix must not flip the box to LTR');
});

test('the composer holds RTL as a mixed sentence is typed out', () => {
  const dom = mount('<div contenteditable="true"><p id="l"></p></div>');
  const line = $(dom, '#l');
  const seen = new Set();
  for (const text of ['3', '3 N', '3 Next.js', '3 Next.js ה', '3 Next.js הוא טוב']) {
    line.textContent = text;
    dom.window.claudeRtl.resweep();
    seen.add(line.getAttribute('dir'));
  }
  assert.deepStrictEqual([...seen], ['rtl'], 'direction must never flip mid-sentence');
});

test('a genuinely English composer line does become LTR', () => {
  const dom = mount(
    '<div contenteditable="true"><p id="l">please write this in english</p></div>');
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'ltr');
});

test('composerSticky:false restores the naive per-keystroke behaviour', () => {
  const dom = mount('<div contenteditable="true"><p id="l">3 Next</p></div>');
  dom.window.claudeRtl.config({ composerSticky: false });
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'ltr');
});

test('lock() pins a block against the heuristic', () => {
  const dom = mount('<div contenteditable="true"><p id="l">hello there friends</p></div>');
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'ltr');

  const range = dom.window.document.createRange();
  range.selectNodeContents($(dom, '#l'));
  dom.window.getSelection().removeAllRanges();
  dom.window.getSelection().addRange(range);

  assert.strictEqual(dom.window.claudeRtl.lock('rtl'), true);
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#l').getAttribute('data-crtl-lock'), 'rtl');

  dom.window.claudeRtl.resweep();
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'rtl', 'lock survives a sweep');

  dom.window.claudeRtl.unlock();
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'ltr');
});

test('Ctrl+Alt+ArrowRight forces the focused line RTL', () => {
  const dom = mount('<div contenteditable="true"><p id="l">hello there friends</p></div>');
  const range = dom.window.document.createRange();
  range.selectNodeContents($(dom, '#l'));
  dom.window.getSelection().removeAllRanges();
  dom.window.getSelection().addRange(range);

  dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'ArrowRight', ctrlKey: true, altKey: true, bubbles: true, cancelable: true
  }));
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'rtl');

  dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'ArrowLeft', ctrlKey: true, altKey: true, bubbles: true, cancelable: true
  }));
  assert.strictEqual($(dom, '#l').getAttribute('dir'), 'ltr');
});

test('forceRtl() makes a single Hebrew word win the line', () => {
  const dom = mount('<p id="a">a very long english sentence with one word שלום</p>');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'ltr');
  dom.window.claudeRtl.forceRtl();
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('status() reports what Claude set versus what we set', () => {
  const dom = mount('<p id="a" dir="ltr">שלום עולם ומה שלומך</p><p id="b">plain</p>');
  const st = dom.window.claudeRtl.status();
  assert.strictEqual(st.enabled, true);
  assert.ok(st.marked >= 1);
  assert.strictEqual(typeof st.dirSetByClaude, 'number');
});

// ------------------------------------------------- bulleted lists (reported)

/**
 * Reported: a Hebrew bulleted list renders entirely left-to-right. Claude
 * resolves one direction for the whole <ul> from its first strong character,
 * so whatever the first item happens to open with decides the list. These
 * cover each opener that was suspected.
 */
const LIST_OPENERS = {
  'a number':        '3 קבצים חדשים נוצרו בתיקייה',
  'an English word': 'Next.js הותקן בהצלחה בפרויקט',
  'a dash':          '— התקנה הושלמה בהצלחה כאן',
  'a quote mark':    '"ציטוט" של משהו שנאמר בעברית',
  'a bracket':       '(הערה) שנכתבה כאן בעברית',
  'a percent sign':  '50% מהמשימות הושלמו בהצלחה'
};

for (const [label, first] of Object.entries(LIST_OPENERS)) {
  test(`a Hebrew list whose first item opens with ${label} stays RTL`, () => {
    const dom = mount(
      `<ul id="u"><li id="a">${first}</li><li id="b">עוד פריט ברשימה הזאת</li></ul>`);
    assert.strictEqual($(dom, '#u').getAttribute('dir'), 'rtl', 'list container');
    assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl', 'first item');
    assert.strictEqual($(dom, '#b').getAttribute('dir'), 'rtl', 'second item');
  });
}

test('an ordered list behaves the same as a bulleted one', () => {
  const dom = mount(
    '<ol id="o"><li id="a">1. שלב ראשון בתהליך ההתקנה</li>' +
    '<li id="b">שלב שני של התהליך</li></ol>');
  assert.strictEqual($(dom, '#o').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
});

test('markdown lists wrapping items in <p> get both levels', () => {
  const dom = mount(
    '<ul id="u"><li id="a"><p id="p">Next.js הותקן בהצלחה כאן</p></li></ul>');
  assert.strictEqual($(dom, '#u').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#a').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#p').getAttribute('dir'), 'rtl');
});

test('a nested Hebrew list is flipped at every level', () => {
  const dom = mount(
    '<ul id="outer"><li id="oi">פריט חיצוני ברשימה' +
    '<ul id="inner"><li id="ii">פריט פנימי מקונן</li></ul></li></ul>');
  assert.strictEqual($(dom, '#outer').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#inner').getAttribute('dir'), 'rtl');
  assert.strictEqual($(dom, '#ii').getAttribute('dir'), 'rtl');
});

test('a purely English list is left completely alone', () => {
  const dom = mount(
    '<ul id="u"><li id="a">install the package</li>' +
    '<li id="b">run the build command</li></ul>');
  assert.strictEqual($(dom, '#u').hasAttribute('dir'), false);
  assert.strictEqual($(dom, '#a').hasAttribute('dir'), false);
});

test('our list indentation outranks a physical padding-left utility', () => {
  // The bug this guards: Claude indents lists with padding-left, which does
  // not mirror when direction flips. padding-inline-start alone would leave
  // the list padded on both sides with bullets on the wrong edge.
  const dom = new JSDOM(
    '<!doctype html><html><head><style>' +
    '.pl-7{padding-left:1.75rem}' +
    '</style></head><body>' +
    '<ul id="u" class="pl-7"><li>פריט ראשון ברשימה בעברית</li></ul>' +
    '</body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://claude.ai/' });
  dom.window.eval(BUNDLE);

  const ul = dom.window.document.querySelector('#u');
  assert.strictEqual(ul.getAttribute('dir'), 'rtl');

  const cs = dom.window.getComputedStyle(ul);
  assert.strictEqual(cs.paddingLeft, '0px', 'left padding must be cleared');
  assert.strictEqual(cs.marginLeft, '0px', 'left margin must be cleared');
  assert.ok(parseFloat(cs.paddingRight) > 0,
    'indent moves to the right, got ' + cs.paddingRight);
});

test('our text-align outranks a text-left utility', () => {
  const dom = new JSDOM(
    '<!doctype html><html><head><style>.text-left{text-align:left}</style></head>' +
    '<body><p id="a" class="text-left">שלום עולם ומה שלומך היום</p></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://claude.ai/' });
  dom.window.eval(BUNDLE);

  const p = dom.window.document.querySelector('#a');
  assert.strictEqual(p.getAttribute('dir'), 'rtl');
  assert.strictEqual(dom.window.getComputedStyle(p).textAlign, 'start');
});
