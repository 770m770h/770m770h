import React from 'react';

/**
 * ריג דמות וקטורית מונפשת.
 *
 * הדמות מצוירת במרחב SVG מקומי של 100x200, כשהעוגן הוא מרכז כפות הרגליים
 * בנקודה (50, 200). כל תנוחה מחשבת זוויות מפרקים לפי הפריים — לא תמונות
 * מוכנות, אלא שלד שזז.
 */

export type Pose =
  | 'idle'
  | 'walk'
  | 'wave'
  | 'type'
  | 'handshake'
  | 'cheer'
  | 'think'
  | 'sit';

export type Look = {
  skin: string;
  hair: string;
  outfit: string;
  outfitDark?: string;
};

/** מגוון מראה — גוונים חמים, ביגוד בטונים של הפלטה. */
export const LOOKS: Look[] = [
  { skin: '#E8B48C', hair: '#2E2118', outfit: '#1E5A44', outfitDark: '#174936' },
  { skin: '#C98A5E', hair: '#3A2A1C', outfit: '#B9552F', outfitDark: '#9A4526' },
  { skin: '#8D5A3B', hair: '#1C1410', outfit: '#3A5A7A', outfitDark: '#2E4860' },
  { skin: '#F0C9A8', hair: '#8A5A2B', outfit: '#6A6152', outfitDark: '#544D41' },
  { skin: '#A86B45', hair: '#241A12', outfit: '#2E7A5E', outfitDark: '#23604A' },
  { skin: '#E5A97E', hair: '#5A3A22', outfit: '#8C6A3F', outfitDark: '#6F5432' },
];

type Angles = {
  bodyY: number;
  bodyRot: number;
  headRot: number;
  armL: number;
  armR: number;
  foreL: number;
  foreR: number;
  legL: number;
  legR: number;
  shinL: number;
  shinR: number;
};

const TAU = Math.PI * 2;

/** מכהה/מבהיר צבע hex — כדי להפריד איברים רחוקים מקרובים ולקבל עומק. */
export function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amount));
  const g = clamp(((n >> 8) & 255) * (1 + amount));
  const b = clamp((n & 255) * (1 + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function angles(pose: Pose, t: number, phase: number): Angles {
  const base: Angles = {
    bodyY: 0,
    bodyRot: 0,
    headRot: 0,
    armL: 6,
    armR: -6,
    foreL: 4,
    foreR: -4,
    legL: 2,
    legR: -2,
    shinL: 0,
    shinR: 0,
  };
  const p = t + phase;

  switch (pose) {
    case 'walk': {
      const s = Math.sin(p * TAU);
      const c = Math.cos(p * TAU);
      return {
        bodyY: -Math.abs(Math.sin(p * TAU * 2)) * 3.5,
        bodyRot: s * 2,
        headRot: -s * 2.5,
        legL: s * 40,
        legR: -s * 40,
        // הברך מתכופפת רק ברגל שחוזרת קדימה — כך הצעד נקרא
        shinL: Math.max(0, -s) * 42,
        shinR: Math.max(0, s) * 42,
        armL: -s * 34,
        armR: s * 34,
        foreL: -14 - Math.max(0, c) * 16,
        foreR: -14 - Math.max(0, -c) * 16,
      };
    }
    case 'idle': {
      const b = Math.sin(p * TAU * 0.55);
      return { ...base, bodyY: b * 1.6, headRot: b * 1.6, armL: 6 + b * 2, armR: -6 - b * 2 };
    }
    case 'wave': {
      const w = Math.sin(p * TAU * 1.9);
      const b = Math.sin(p * TAU * 0.5);
      return {
        ...base,
        bodyY: b * 1.4,
        headRot: 4 + b,
        armR: -150,
        foreR: -28 + w * 22,
        armL: 8,
        foreL: 6,
      };
    }
    case 'type': {
      const k = Math.sin(p * TAU * 3.1);
      const k2 = Math.cos(p * TAU * 2.7);
      return {
        ...base,
        bodyY: 0,
        bodyRot: 2,
        headRot: 8,
        armL: 58,
        armR: 62,
        foreL: 52 + k * 7,
        foreR: 48 + k2 * 7,
        // ירך קדימה, שוק יורד אנכית חזרה — ישיבה אמיתית ולא כדור מקופל
        legL: 80,
        legR: 76,
        shinL: -80,
        shinR: -76,
      };
    }
    case 'sit': {
      const b = Math.sin(p * TAU * 0.5);
      return {
        ...base,
        bodyY: b * 1.2,
        headRot: b * 1.5,
        armL: 40,
        armR: -34,
        foreL: 34,
        foreR: 30,
        legL: 80,
        legR: 76,
        shinL: -80,
        shinR: -76,
      };
    }
    case 'handshake': {
      const sh = Math.sin(p * TAU * 2.4);
      return {
        ...base,
        bodyY: sh * 0.8,
        bodyRot: 3,
        headRot: 5,
        armR: -74 + sh * 5,
        foreR: -6,
        armL: 10,
        foreL: 8,
      };
    }
    case 'cheer': {
      const j = Math.abs(Math.sin(p * TAU * 1.3));
      return {
        ...base,
        bodyY: -j * 9,
        headRot: -3,
        armL: 158,
        armR: -158,
        foreL: 16,
        foreR: -16,
        legL: 6 + j * 6,
        legR: -6 - j * 6,
      };
    }
    case 'think': {
      const b = Math.sin(p * TAU * 0.6);
      return {
        ...base,
        bodyY: b * 1.2,
        headRot: -7 + b,
        armR: -145,
        foreR: -122,
        armL: 10,
        foreL: 8,
      };
    }
    default:
      return base;
  }
}

const Limb: React.FC<{
  x: number;
  y: number;
  upper: number;
  lower: number;
  a1: number;
  a2: number;
  w: number;
  color: string;
  hand?: string;
}> = ({ x, y, upper, lower, a1, a2, w, color, hand }) => (
  <g transform={`translate(${x} ${y}) rotate(${a1})`}>
    <line x1={0} y1={0} x2={0} y2={upper} stroke={color} strokeWidth={w} strokeLinecap="round" />
    <g transform={`translate(0 ${upper}) rotate(${a2})`}>
      <line x1={0} y1={0} x2={0} y2={lower} stroke={color} strokeWidth={w} strokeLinecap="round" />
      {hand ? <circle cx={0} cy={lower} r={w * 0.62} fill={hand} /> : null}
    </g>
  </g>
);

export const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  look: Look;
  pose: Pose;
  /** שניות — לרוב frame/fps */
  t: number;
  /** הסטת פאזה כדי שדמויות לא יזוזו בסנכרון */
  phase?: number;
  opacity?: number;
  /** קצב מחזור ההליכה (מחזורים לשנייה) */
  rate?: number;
}> = ({ x, y, scale = 1, flip = false, look, pose, t, phase = 0, opacity = 1, rate = 1.6 }) => {
  const a = angles(pose, t * rate, phase);

  // גוונים להפרדת עומק: איבר רחוק כהה יותר ומצויר מאחורי הגוף, קרוב מלפנים.
  const trouser = look.outfitDark ?? shade(look.outfit, -0.3);
  const trouserFar = shade(trouser, -0.22);
  const sleeveNear = look.outfit;
  const sleeveFar = shade(look.outfit, -0.2);
  const skinFar = shade(look.skin, -0.14);

  // בישיבה הירך יוצאת קדימה — מזיזים את הדמות כך שהרגליים באמת נוגעות בקרקע.
  const seated = pose === 'sit' || pose === 'type';
  const seatDrop = seated ? 30 : 0;

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale * (flip ? -1 : 1)} ${scale}) translate(-50 -200)`}
      opacity={opacity}
    >
      {/* צל רך */}
      <ellipse cx={50} cy={199} rx={26} ry={5} fill="rgba(33,27,19,0.16)" />

      <g transform={`translate(0 ${a.bodyY + seatDrop})`}>
        {/* --- שכבה רחוקה: יד ורגל שמאל, כהות ומאחור --- */}
        <Limb x={44} y={126} upper={38} lower={34} a1={a.legL} a2={a.shinL} w={13} color={trouserFar} hand={trouserFar} />
        <g transform={`rotate(${a.bodyRot} 50 130)`}>
          <Limb x={37} y={78} upper={30} lower={28} a1={a.armL} a2={a.foreL} w={10} color={sleeveFar} hand={skinFar} />
        </g>

        {/* --- רגל קרובה --- */}
        <Limb x={58} y={126} upper={38} lower={34} a1={a.legR} a2={a.shinR} w={13} color={trouser} hand={trouser} />

        {/* --- גוף וראש --- */}
        <g transform={`rotate(${a.bodyRot} 50 130)`}>
          <path d="M35 70 Q50 62 65 70 L69 128 Q50 134 31 128 Z" fill={look.outfit} />
          {/* צוואר */}
          <rect x={45} y={58} width={10} height={14} rx={5} fill={shade(look.skin, -0.12)} />

          {/* ראש */}
          <g transform={`rotate(${a.headRot} 50 44)`}>
            <circle cx={50} cy={40} r={19} fill={look.skin} />
            <path
              d="M31 38 Q34 18 50 18 Q66 18 69 38 Q62 27 50 27 Q38 27 31 38 Z"
              fill={look.hair}
            />
          </g>

          {/* --- זרוע קרובה, מלפנים --- */}
          <Limb x={64} y={78} upper={30} lower={28} a1={a.armR} a2={a.foreR} w={10} color={sleeveNear} hand={look.skin} />
        </g>
      </g>
    </g>
  );
};
