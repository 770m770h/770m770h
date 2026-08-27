const { test } = require('node:test');
const assert = require('node:assert');
const { detectDirection, hasRtl } = require('../src/rtl-core.js');

test('pure Hebrew is rtl', () => {
  assert.strictEqual(detectDirection('שלום עולם'), 'rtl');
});

test('pure English is ltr', () => {
  assert.strictEqual(detectDirection('hello world'), 'ltr');
});

test('Hebrew sentence with embedded English terms stays rtl', () => {
  assert.strictEqual(
    detectDirection('אני בונה פרויקט חדש עם Next.js ו-TypeScript'), 'rtl');
});

test('Hebrew sentence STARTING with English stays rtl (dir=auto gets this wrong)', () => {
  assert.strictEqual(
    detectDirection('Next.js הוא פריימוורק מצוין לבניית אתרים'), 'rtl');
});

test('English sentence with one Hebrew word stays ltr', () => {
  assert.strictEqual(
    detectDirection('The quick brown fox jumps over the lazy dog שלום'), 'ltr');
});

test('digits and punctuation alone give no signal', () => {
  assert.strictEqual(detectDirection('123 — 45.6 (7)'), null);
  assert.strictEqual(detectDirection(''), null);
  assert.strictEqual(detectDirection('   '), null);
});

test('digits do not sway a Hebrew line', () => {
  assert.strictEqual(detectDirection('יש לי 3 קבצים'), 'rtl');
});

test('Arabic is rtl', () => {
  assert.strictEqual(detectDirection('مرحبا بالعالم'), 'rtl');
});

test('threshold is configurable', () => {
  const t = 'שלום hello world everybody around here';
  assert.strictEqual(detectDirection(t, { threshold: 0.3 }), 'ltr');
  assert.strictEqual(detectDirection(t, { threshold: 0.1 }), 'rtl');
});

test('repeated calls are stable (no lastIndex leakage from /g regexes)', () => {
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(detectDirection('שלום עולם'), 'rtl', 'iteration ' + i);
    assert.strictEqual(hasRtl('שלום'), true, 'hasRtl iteration ' + i);
    assert.strictEqual(hasRtl('hello'), false, 'hasRtl-neg iteration ' + i);
  }
});

test('hasRtl detects Hebrew anywhere in the string', () => {
  assert.strictEqual(hasRtl('Deploy the שרת now'), true);
  assert.strictEqual(hasRtl('Deploy the server now'), false);
});
