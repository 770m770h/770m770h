import { interpolate, spring } from 'remotion';

/** פלטה חמה, עריכתית — נייר/דיו/ירוק-אורן/טרקוטה. בלי סגול, בלי ניאון. */
export const C = {
  paper: '#ECE4D3',
  paperDeep: '#E2D7BF',
  paperWarm: '#F3EDE0',
  ink: '#211B13',
  inkSoft: '#3A3226',
  muted: '#6A6152',
  green: '#1E5A44',
  greenDeep: '#123526',
  greenLight: '#2E7A5E',
  clay: '#B9552F',
  clayLight: '#D0764F',
  sand: '#D9C9A8',
  sky: '#BFD3CB',
  white: '#FBF8F1',
  line: 'rgba(33,27,19,0.14)',
};

export const SERIF = "'Frank Ruhl Libre', 'Times New Roman', serif";
export const SANS = "'Assistant', 'Helvetica Neue', Arial, sans-serif";

/** קפיץ כניסה סטנדרטי. */
export const rise = (frame: number, fps: number, delay: number, damping = 200) =>
  spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });

/** קפיץ עם קפיצות קלות — לאלמנטים משחקיים. */
export const pop = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.5, stiffness: 120 } });

/** interpolate עם clamp בשני הצדדים (ברירת המחדל שאנחנו תמיד רוצים). */
export const ramp = (
  frame: number,
  range: [number, number],
  out: [number, number],
) =>
  interpolate(frame, range, out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** תנועת מצלמה: מחזיר transform של pan+zoom לאורך הסצנה. */
export const camera = (
  frame: number,
  opts: {
    from: { x: number; y: number; scale: number };
    to: { x: number; y: number; scale: number };
    over: [number, number];
  },
) => {
  const { from, to, over } = opts;
  const x = ramp(frame, over, [from.x, to.x]);
  const y = ramp(frame, over, [from.y, to.y]);
  const s = ramp(frame, over, [from.scale, to.scale]);
  return `translate(${x}px, ${y}px) scale(${s})`;
};
