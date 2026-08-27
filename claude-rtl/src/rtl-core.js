/*
 * rtl-core — pure, DOM-free direction detection.
 *
 * The interesting problem is not "Hebrew is RTL". It is deciding the base
 * direction of a paragraph that mixes Hebrew and English, which is the normal
 * case in technical Hebrew:
 *
 *     "Next.js הוא פריימוורק מצוין"
 *
 * The browser's own dir="auto" uses the Unicode "first strong character"
 * rule, so it reads the leading "Next.js" and picks LTR — which throws the
 * final punctuation to the wrong side and makes the line read backwards.
 *
 * We instead weigh how much of the strong-typed text is RTL. A line that is
 * mostly Hebrew stays RTL no matter which word happens to come first.
 */

// Strong RTL: Hebrew, Arabic (+supplement/extended), Syriac, Thaana, N'Ko,
// and the Hebrew/Arabic presentation-form blocks.
const RTL_STRONG =
  /[֐-׿؀-ۿ܀-ݏݐ-ݿހ-޿߀-߿ࡠ-࡯ࢠ-ࣿיִ-ﭏﭐ-﷿ﹰ-﻿]/g;

// Strong LTR: Latin (incl. extended), Greek, Cyrillic. Digits are deliberately
// excluded — they are weak in the bidi algorithm and "3" says nothing about
// whether a sentence is Hebrew or English.
const LTR_STRONG = /[A-Za-zÀ-ʯͰ-ϿЀ-ԯḀ-ỿ]/g;

const DEFAULT_THRESHOLD = 0.3;

function countMatches(text, re) {
  re.lastIndex = 0;
  let n = 0;
  while (re.exec(text) !== null) n++;
  return n;
}

/**
 * Decide the base direction of a run of text.
 *
 * @param {string} text
 * @param {{threshold?: number}} [opts] threshold is the share of strong
 *        characters that must be RTL for the block to count as RTL.
 * @returns {'rtl'|'ltr'|null} null when the text carries no directional
 *        signal at all (digits, punctuation, emoji) and should inherit.
 */
function detectDirection(text, opts) {
  if (!text) return null;
  const threshold = (opts && typeof opts.threshold === 'number')
    ? opts.threshold
    : DEFAULT_THRESHOLD;

  const rtl = countMatches(text, RTL_STRONG);
  const ltr = countMatches(text, LTR_STRONG);

  if (rtl === 0 && ltr === 0) return null;
  if (rtl === 0) return 'ltr';
  if (ltr === 0) return 'rtl';

  return rtl / (rtl + ltr) >= threshold ? 'rtl' : 'ltr';
}

/** True when the text contains any strong RTL character at all. */
function hasRtl(text) {
  RTL_STRONG.lastIndex = 0;
  return !!text && RTL_STRONG.test(text);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { detectDirection, hasRtl, DEFAULT_THRESHOLD };
}
