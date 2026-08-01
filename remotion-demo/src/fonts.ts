import { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

/** Display serif (headlines) and clean sans (body) — both Hebrew webfonts,
 *  bundled locally so rendering never depends on system or network fonts. */
export const SERIF = "'Frank Ruhl Libre', 'Times New Roman', serif";
export const SANS = "'Assistant', 'Helvetica Neue', Arial, sans-serif";

const FACES = `
@font-face{font-family:'Frank Ruhl Libre';font-weight:500;font-display:block;src:url('${staticFile('fonts/frank-ruhl-libre-hebrew-500-normal.woff2')}') format('woff2');}
@font-face{font-family:'Frank Ruhl Libre';font-weight:700;font-display:block;src:url('${staticFile('fonts/frank-ruhl-libre-hebrew-700-normal.woff2')}') format('woff2');}
@font-face{font-family:'Frank Ruhl Libre';font-weight:900;font-display:block;src:url('${staticFile('fonts/frank-ruhl-libre-hebrew-900-normal.woff2')}') format('woff2');}
@font-face{font-family:'Assistant';font-weight:400;font-display:block;src:url('${staticFile('fonts/assistant-hebrew-400-normal.woff2')}') format('woff2');}
@font-face{font-family:'Assistant';font-weight:600;font-display:block;src:url('${staticFile('fonts/assistant-hebrew-600-normal.woff2')}') format('woff2');}
@font-face{font-family:'Assistant';font-weight:700;font-display:block;src:url('${staticFile('fonts/assistant-hebrew-700-normal.woff2')}') format('woff2');}
`;

let injected = false;
function injectFaces() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.textContent = FACES;
  document.head.appendChild(el);
}

/** Blocks the render until the Hebrew fonts are actually ready. */
export function useHebrewFonts() {
  const [handle] = useState(() => delayRender('hebrew-fonts'));
  useEffect(() => {
    injectFaces();
    const anyDoc = document as unknown as { fonts: FontFaceSet };
    Promise.all([
      anyDoc.fonts.load('900 120px "Frank Ruhl Libre"', 'אבגדהוזאנושי'),
      anyDoc.fonts.load('700 120px "Frank Ruhl Libre"', 'אבגדה'),
      anyDoc.fonts.load('700 40px "Assistant"', 'אבגדה'),
      anyDoc.fonts.load('600 40px "Assistant"', 'אבגדה'),
      anyDoc.fonts.load('400 40px "Assistant"', 'אבגדה'),
    ])
      .then(() => anyDoc.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}
