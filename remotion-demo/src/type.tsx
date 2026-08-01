import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { C, SANS, SERIF } from './theme';

/**
 * טיפוגרפיה קינטית.
 *
 * העיקרון: טקסט בסרט לא "נדלק" — הוא **נחשף**. כל מילה יושבת בתוך חלון
 * חיתוך (overflow:hidden) ונדחפת מלמטה כלפי מעלה, מילה אחר מילה מימין
 * לשמאל. זה ההבדל בין כותרת במצגת לבין כותרת בסרט.
 *
 * בנוסף: המרווח בין האותיות מתחיל פתוח ונסגר בזמן הנחיתה, כך שהמילה
 * "מתיישבת" במקום להופיע.
 */

const descenderPad = (size: number) => Math.round(size * 0.26);

type Seg = { text: string; accent?: boolean };

/**
 * מפרק מחרוזת למילים; מילה שמסומנת ב-*כוכביות* היא מילת מפתח.
 * הזיהוי חסין לפיסוק צמוד — "*בניירת*." עדיין ייחשב מילת מפתח.
 */
function parse(text: string): Seg[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ text: w.replace(/\*/g, ''), accent: w.includes('*') }));
}

export type KineticLineProps = {
  text: string;
  /** פריים שבו המילה הראשונה מתחילה להיחשף */
  delay?: number;
  /** פריימים בין מילה למילה */
  stagger?: number;
  fontSize: number;
  fontFamily?: string;
  weight?: number;
  color?: string;
  accentColor?: string;
  lineHeight?: number;
  /** חלון יציאה [מפריים, עד פריים] — הטקסט נסוג חזרה אל מתחת למסכה */
  out?: [number, number];
  /** אנרגיה: 'calm' נחיתה רכה, 'urgent' מהירה עם overshoot קל */
  energy?: 'calm' | 'urgent';
  align?: 'right' | 'center';
  style?: React.CSSProperties;
};

export const KineticLine: React.FC<KineticLineProps> = ({
  text,
  delay = 0,
  stagger = 3,
  fontSize,
  fontFamily = SERIF,
  weight = 700,
  color = C.ink,
  accentColor = C.clay,
  lineHeight = 1.12,
  out,
  energy = 'calm',
  align = 'right',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = parse(text);
  const pad = descenderPad(fontSize);

  const cfg =
    energy === 'urgent'
      ? { damping: 16, mass: 0.42, stiffness: 190 }
      : { damping: 200, mass: 0.9 };

  // יציאה: המילים נסוגות מלמעלה כלפי מטה, בסדר הפוך
  const outP = out
    ? spring({ frame: frame - out[0], fps, config: { damping: 200, mass: 0.7 } })
    : 0;

  return (
    <div
      style={{
        direction: 'rtl',
        textAlign: align,
        fontFamily,
        fontWeight: weight,
        fontSize,
        lineHeight,
        color,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const inP = spring({ frame: frame - (delay + i * stagger), fps, config: cfg });
        // המילים יוצאות בסדר הפוך — האחרונה ראשונה
        const outDelayed = out
          ? spring({
              frame: frame - (out[0] + (words.length - 1 - i) * 2),
              fps,
              config: { damping: 200, mass: 0.7 },
            })
          : 0;
        const y = (1 - inP) * 105 + outDelayed * 105;
        const track = (1 - inP) * 0.05;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'bottom',
              paddingBottom: pad,
              marginBottom: -pad,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y}%)`,
                letterSpacing: `${track}em`,
                color: w.accent ? accentColor : undefined,
                paddingLeft: '0.26em',
              }}
            >
              {w.text}
            </span>
          </span>
        );
      })}
      {/* משתמשים ב-outP רק כדי לשמור על תלות מפורשת */}
      <span style={{ display: 'none' }}>{outP}</span>
    </div>
  );
};

/** קו שנמתח מימין לשמאל ואז נסוג — לא מופיע ולא נעלם. */
export const KineticRule: React.FC<{
  delay?: number;
  width: number;
  height?: number;
  color?: string;
  out?: number;
  style?: React.CSSProperties;
}> = ({ delay = 0, width, height = 4, color = C.clay, out, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.8 } });
  const o = out ? spring({ frame: frame - out, fps, config: { damping: 200, mass: 0.6 } }) : 0;
  const w = Math.max(0, width * p * (1 - o));
  return (
    <div
      style={{
        width: w,
        height,
        backgroundColor: color,
        borderRadius: height,
        marginRight: 0,
        ...style,
      }}
    />
  );
};

/**
 * מילת-על שנוחתת: מגיעה מעט גדולה מדי ומתיישבת, עם חשיפת מסכה.
 * לרגעי השיא — לא לשימוש חוזר.
 */
export const HeroWord: React.FC<{
  text: string;
  delay?: number;
  fontSize: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, fontSize, color = C.ink, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 26, mass: 0.9, stiffness: 90 } });
  const pad = descenderPad(fontSize);
  const scale = 1 + (1 - p) * 0.16;

  return (
    <div
      style={{
        direction: 'rtl',
        overflow: 'hidden',
        paddingBottom: pad,
        marginBottom: -pad,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.04,
          color,
          transform: `translateY(${(1 - p) * 108}%) scale(${scale})`,
          transformOrigin: 'right bottom',
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** תווית קטנה בסן-סריף עם קו מוביל — ל"עיניים" (eyebrow). */
export const Eyebrow: React.FC<{
  text: string;
  delay?: number;
  color?: string;
  fontSize?: number;
  out?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, color = C.green, fontSize = 26, out, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  const o = out ? spring({ frame: frame - out, fps, config: { damping: 200, mass: 0.6 } }) : 0;
  const vis = p * (1 - o);
  const pad = descenderPad(fontSize);

  return (
    <div
      style={{
        direction: 'rtl',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        ...style,
      }}
    >
      <div style={{ width: 34 * vis, height: 2, backgroundColor: C.clay, flexShrink: 0 }} />
      <div style={{ overflow: 'hidden', paddingBottom: pad, marginBottom: -pad }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize,
            letterSpacing: 2,
            color,
            transform: `translateY(${(1 - vis) * 110}%)`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
