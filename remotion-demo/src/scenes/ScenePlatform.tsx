import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticLine } from '../type';
import { C, SANS, SERIF, pop, ramp, rise } from '../theme';
import { LOOKS, Person } from '../rig';
import { CheckBadge, PaperSheet, UICard } from '../props';

/**
 * סצנה 3 — "הפלטפורמה" (המפנה).
 * שפה חזותית חדשה לגמרי: אין חדר, אין אופק — שדה גרפי לבן-נייר.
 * הדפים מהסצנה הקודמת עפים פנימה מהשוליים ונתקעים למקומם במערך
 * איזומטרי מסודר של כרטיסי ממשק. קווים דקים נמתחים ביניהם, וי-סימונים
 * נדלקים אחד-אחד. דמות אחת בפינה הימנית-תחתונה — קנה המידה האנושי.
 */

/* ================= מישור איזומטרי מזויף ================= */
const ROT = -9; // מעלות
const SKEW = 6.5; // מעלות
const FX = 706; // מרכז השדה על המסך
const FY = 600;

const D2R = Math.PI / 180;
const TAN = Math.tan(SKEW * D2R);
const COS = Math.cos(ROT * D2R);
const SIN = Math.sin(ROT * D2R);

/** הטלה של נקודה במרחב המישור אל קואורדינטות המסך. */
const proj = (u: number, v: number) => {
  const y1 = u * TAN + v;
  return { x: FX + u * COS - y1 * SIN, y: FY + u * SIN + y1 * COS };
};

const ISO_T = `translate(${FX} ${FY}) rotate(${ROT}) skewY(${SKEW})`;

/* ================= הדמות ================= */
const CHAR_X = 1364;
const CHAR_Y = 990;
const CHAR_SC = 1.66;

/* ================= פריסת הכרטיסים ================= */
type Pt = [number, number];

const HERO = { u: 0, v: -120, w: 440, h: 210, land: 10 };

type Pillar = {
  key: string;
  u: number;
  v: number;
  w: number;
  h: number;
  label: string;
  accent: string;
  glyph: 'person' | 'coin' | 'heart';
  land: number;
  labelAt: number;
  badgeAt: number;
  from: Pt;
  spin: number;
  ph: number;
};

const PILLARS: Pillar[] = [
  {
    key: 'giyus',
    u: 320,
    v: 175,
    w: 250,
    h: 140,
    label: 'גיוס',
    accent: C.clay,
    glyph: 'person',
    land: 19,
    labelAt: 58,
    badgeAt: 80,
    from: [2300, 330],
    spin: 128,
    ph: 1.1,
  },
  {
    key: 'sachar',
    u: 0,
    v: 175,
    w: 250,
    h: 140,
    label: 'שכר',
    accent: C.green,
    glyph: 'coin',
    land: 26,
    labelAt: 65,
    badgeAt: 88,
    from: [820, 1420],
    spin: -104,
    ph: 2.3,
  },
  {
    key: 'revacha',
    u: -320,
    v: 175,
    w: 250,
    h: 140,
    label: 'רווחה',
    accent: C.greenLight,
    glyph: 'heart',
    land: 33,
    labelAt: 72,
    badgeAt: 96,
    from: [-380, 760],
    spin: 152,
    ph: 3.5,
  },
];

type Chip = { key: string; u: number; v: number; w: number; h: number; land: number; from: Pt; spin: number; ph: number };
const CHIPS: Chip[] = [
  { key: 'chipR', u: 350, v: -255, w: 160, h: 96, land: 39, from: [2160, -150], spin: 74, ph: 4.6 },
  { key: 'chipL', u: -350, v: -255, w: 160, h: 96, land: 45, from: [-340, 150], spin: -68, ph: 5.7 },
];

const HERO_FROM: Pt = [1010, -340];
const HERO_SPIN = -142;

/* ================= קווי חיבור ================= */
type Conn = { key: string; pts: Pt[]; s: number; e: number; pulse?: number };
const CONNECTORS: Conn[] = [
  { key: 'trunk', pts: [[0, -15], [0, 60]], s: 45, e: 53 },
  { key: 'bR', pts: [[0, 60], [320, 60], [320, 105]], s: 51, e: 66, pulse: 0 },
  { key: 'bC', pts: [[0, 60], [0, 105]], s: 53, e: 63, pulse: 0.33 },
  { key: 'bL', pts: [[0, 60], [-320, 60], [-320, 105]], s: 55, e: 70, pulse: 0.66 },
  { key: 'cR', pts: [[350, -207], [350, -175], [222, -175]], s: 66, e: 76 },
  { key: 'cL', pts: [[-350, -207], [-350, -175], [-222, -175]], s: 68, e: 78 },
];

const polyLen = (pts: Pt[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i += 1) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
const polyPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
const polyAt = (pts: Pt[], s: number): Pt => {
  const total = polyLen(pts);
  let d = Math.max(0, Math.min(1, s)) * total;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg || i === pts.length - 1) {
      const k = seg === 0 ? 0 : d / seg;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
};

/* ================= עזרי הנפשה ================= */
const easeOut3 = (p: number) => 1 - (1 - p) ** 3;
const easeOut2 = (p: number) => 1 - (1 - p) ** 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ================= אריח אייקון ================= */
const Glyph: React.FC<{ kind: 'person' | 'coin' | 'heart' | 'grid'; size: number; accent: string }> = ({
  kind,
  size,
  accent,
}) => (
  <g>
    <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={size * 0.3} fill={accent} />
    {kind === 'person' && (
      <>
        <circle cx={0} cy={-4.4} r={4.4} fill={C.white} />
        <path d="M-7.6 8 Q-7.6 0.4 0 0.4 Q7.6 0.4 7.6 8 Z" fill={C.white} />
      </>
    )}
    {/* שטר — לא עיגול עם קו אופקי, שנקרא כסימן איסור. */}
    {kind === 'coin' && (
      <>
        <rect x={-9.4} y={-6.4} width={18.8} height={12.8} rx={2.8} fill={C.white} />
        <circle cx={0} cy={0} r={3.3} fill={accent} />
        <rect x={-7.2} y={-4.2} width={2} height={8.4} rx={1} fill={accent} opacity={0.5} />
        <rect x={5.2} y={-4.2} width={2} height={8.4} rx={1} fill={accent} opacity={0.5} />
      </>
    )}
    {kind === 'heart' && <path d="M0 7 C-9 -1 -7 -9 0 -5.4 C7 -9 9 -1 0 7 Z" fill={C.white} />}
    {kind === 'grid' && (
      <>
        <rect x={-8} y={-8} width={6.6} height={6.6} rx={1.6} fill={C.white} />
        <rect x={1.4} y={-8} width={6.6} height={6.6} rx={1.6} fill={C.white} />
        <rect x={-8} y={1.4} width={6.6} height={6.6} rx={1.6} fill={C.white} />
        <rect x={1.4} y={1.4} width={6.6} height={6.6} rx={1.6} fill={C.white} opacity={0.55} />
      </>
    )}
  </g>
);

/* ================= דף מעופף ================= */
const FlyPaper: React.FC<{ f: number; land: number; from: Pt; to: Pt; spin: number; endScale: number }> = ({
  f,
  land,
  from,
  to,
  spin,
  endScale,
}) => {
  const start = land - 22;
  const p = ramp(f, [start, land], [0, 1]);
  if (f > land + 2) return null;
  const e = easeOut3(p);
  const e2 = easeOut2(p);
  const x = lerp(from[0], to[0], e);
  const y = lerp(from[1], to[1], e);
  const rot = lerp(spin, ROT, e2);
  const sk = lerp(0, SKEW, p * p);
  const sc = lerp(2.5, endScale, e);
  const op = ramp(f, [land - 2, land + 0.5], [1, 0]) * ramp(f, [start, start + 4], [0, 1]);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) skewY(${sk}) scale(${sc})`} opacity={op}>
      <PaperSheet x={0} y={0} lines={4} />
    </g>
  );
};

/* ================= דף שנבלע לתוך המערכת ================= */
/**
 * מסלולי הכניסה נבחרו כך שלא יחצו את גוש הכותרת (ימין-למעלה)
 * ולא יעברו על הדמות — הם נכנסים משמאל, מלמעלה-שמאל ומלמטה.
 */
const ABSORB: Array<{ from: Pt; start: number; jitter: Pt; spin: number; sc: number }> = [
  { from: [-320, 1010], start: -16, jitter: [-215, -200], spin: -160, sc: 2.1 },
  { from: [-300, 300], start: -11, jitter: [-245, -95], spin: 165, sc: 2.0 },
  { from: [430, -330], start: -6, jitter: [-150, -190], spin: 130, sc: 2.3 },
  { from: [1520, -330], start: 0, jitter: [140, -200], spin: -120, sc: 1.9 },
  { from: [1180, 1370], start: 6, jitter: [255, -30], spin: -140, sc: 1.7 },
  { from: [-330, 660], start: 13, jitter: [-260, 20], spin: 145, sc: 2.2 },
  { from: [640, 1350], start: 21, jitter: [-300, -170], spin: 155, sc: 1.8 },
  { from: [1420, 1360], start: 28, jitter: [150, -250], spin: -175, sc: 1.9 },
];

const AbsorbPaper: React.FC<{ f: number; item: (typeof ABSORB)[number]; target: Pt }> = ({ f, item, target }) => {
  const dur = 34;
  const p = ramp(f, [item.start, item.start + dur], [0, 1]);
  if (p <= 0 || p >= 0.7) return null;
  const e = easeOut3(p);
  const tx = target[0] + item.jitter[0];
  const ty = target[1] + item.jitter[1];
  const x = lerp(item.from[0], tx, e);
  const y = lerp(item.from[1], ty, e);
  const rot = lerp(item.spin, ROT, easeOut2(p));
  const sc = lerp(item.sc, 0.5, p * p);
  const op = ramp(p, [0.02, 0.13], [0, 0.5]) * ramp(p, [0.26, 0.55], [1, 0]);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={op}>
      <PaperSheet x={0} y={0} lines={3} />
    </g>
  );
};

/* ================= טקסט על המישור ================= */
const PlaneLabel: React.FC<{ p: { x: number; y: number }; text: string; r: number }> = ({ p, text, r }) => (
  <div
    style={{
      position: 'absolute',
      left: p.x,
      top: p.y,
      transform: 'translate(-100%, -50%)',
      whiteSpace: 'nowrap',
    }}
  >
    <div
      style={{
        transformOrigin: '100% 50%',
        transform: `rotate(${ROT}deg) skewY(${SKEW}deg) translateY(${(1 - r) * 14}px)`,
        opacity: r,
        direction: 'rtl',
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1,
        letterSpacing: '0.005em',
        color: C.ink,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  </div>
);

/* ================= הסצנה ================= */
export const ScenePlatform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame;
  const t = f / fps;

  /* ---- מצלמה: ריחוף מסלולי איטי ---- */
  const orb = f * 0.0205 + 0.35;
  const camX = ramp(f, [0, 135], [24, -26]) + Math.cos(orb) * 15;
  const camY = ramp(f, [0, 135], [14, -14]) + Math.sin(orb) * 9;
  const camRot = ramp(f, [0, 135], [1.1, -0.85]) + Math.sin(f * 0.026) * 0.18;
  const camScale = ramp(f, [0, 135], [1.045, 1.0]);
  const camT = `translate(${camX}px, ${camY}px) rotate(${camRot}deg) scale(${camScale})`;

  /* ---- רשת ---- */
  const gridOp = ramp(f, [-4, 16], [0, 1]);
  const gridLines: React.ReactNode[] = [];
  for (let u = -620; u <= 620; u += 62) {
    gridLines.push(<line key={`gu${u}`} x1={u} y1={-430} x2={u} y2={430} stroke={C.ink} strokeWidth={1} />);
  }
  for (let v = -430; v <= 430; v += 62) {
    gridLines.push(<line key={`gv${v}`} x1={-620} y1={v} x2={620} y2={v} stroke={C.ink} strokeWidth={1} />);
  }

  /* ---- מסע העובד בכרטיס הראשי ---- */
  const jp = ramp(f, [60, 116], [0, 1]);
  const trackR = 170;
  const trackL = -170;
  const headX = lerp(trackR, trackL, jp);
  const stations = [170, 57, -57, -170];

  const heroCenter = proj(HERO.u, HERO.v);

  /* ---- דמות ---- */
  const charR = rise(f, fps, 0, 18);
  const charOp = ramp(f, [-3, 5], [0, 1]);

  /* ---- כותרת ---- */
  const rRule = rise(f, fps, 0, 22);
  const rL1 = rise(f, fps, 2, 20);
  const rL2 = rise(f, fps, 9, 20);

  /** כניסת כרטיס + ריחוף עדין אחרי הנחיתה (תנועה משנית). */
  const entryOf = (land: number, ph: number) => {
    const pv = pop(f, fps, land);
    const settle = ramp(f, [land + 3, land + 20], [0, 1]);
    const bob = Math.sin((f - land) * 0.052 + ph) * 2.6 * settle;
    return {
      sc: 0.88 + 0.12 * Math.min(pv, 1.08),
      dy: (1 - pv) * 22 + bob,
      bob,
      op: ramp(f, [land - 1.5, land + 0.5], [0, 1]),
    };
  };

  const allCards: Array<{ key: string; u: number; v: number; w: number; h: number; land: number; ph: number }> = [
    { key: 'hero', u: HERO.u, v: HERO.v, w: HERO.w, h: HERO.h, land: HERO.land, ph: 0 },
    ...PILLARS.map((p) => ({ key: p.key, u: p.u, v: p.v, w: p.w, h: p.h, land: p.land, ph: p.ph })),
    ...CHIPS.map((c) => ({ key: c.key, u: c.u, v: c.v, w: c.w, h: c.h, land: c.land, ph: c.ph })),
  ];

  /** גוף הכרטיס: עובי פיזי + לוח לבן נקי (בלי לשונית צבע כפולה). */
  const CardBody: React.FC<{ u: number; v: number; w: number; h: number; sc: number }> = ({ u, v, w, h, sc }) => (
    <g transform={`translate(${u} ${v}) scale(${sc})`}>
      <rect x={-w / 2} y={-h / 2 + 7} width={w} height={h} rx={13} fill="#D6CCB6" />
      <UICard x={0} y={0} w={w} h={h} accent="none" rows={0} />
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.paperWarm, overflow: 'hidden' }}>
      {/* ---------- רקע נייר ---------- */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(108% 78% at 36% 36%, rgba(255,255,255,0.74) 0%, rgba(255,255,255,0) 58%),' +
            'radial-gradient(120% 100% at 50% 108%, rgba(33,27,19,0.09) 0%, rgba(33,27,19,0) 62%),' +
            'radial-gradient(74% 62% at 96% 4%, rgba(217,201,168,0.5) 0%, rgba(217,201,168,0) 70%)',
        }}
      />

      {/* ---------- שכבת עולם עם תנועת מצלמה ---------- */}
      <AbsoluteFill style={{ transform: camT, transformOrigin: '50% 50%' }}>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <defs>
            <radialGradient id="plat-fade" cx="50%" cy="50%" r="52%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="52%" stopColor="#ffffff" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <mask id="plat-gridmask" maskUnits="userSpaceOnUse" x={-760} y={-560} width={1520} height={1120}>
              <rect x={-760} y={-560} width={1520} height={1120} fill="url(#plat-fade)" />
            </mask>
            <filter id="plat-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="11" />
            </filter>
            <filter id="plat-soft2" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <clipPath id="plat-slabclip">
              <rect x={-520} y={-345} width={1040} height={645} rx={46} />
            </clipPath>
          </defs>

          {/* ===== המישור האיזומטרי ===== */}
          <g transform={ISO_T}>
            {/* משטח הפלטפורמה — "פלטפורמה אחת" */}
            {(() => {
              const r = rise(f, fps, -5, 20);
              const s = 0.94 + 0.06 * r;
              return (
                <g opacity={Math.min(1, r * 1.35)}>
                  <rect
                    x={-520 * s + 10}
                    y={-345 * s + 34}
                    width={1040 * s}
                    height={645 * s}
                    rx={46}
                    fill="rgba(33,27,19,0.085)"
                    filter="url(#plat-soft)"
                  />
                  {/* עובי המשטח — נותן נפח פיזי */}
                  <rect
                    x={-520 * s}
                    y={-345 * s + 15}
                    width={1040 * s}
                    height={645 * s}
                    rx={46}
                    fill="#C6B492"
                  />
                  <rect
                    x={-520 * s}
                    y={-345 * s}
                    width={1040 * s}
                    height={645 * s}
                    rx={46}
                    fill="#E4D9C0"
                    stroke="rgba(33,27,19,0.15)"
                    strokeWidth={1.6}
                  />
                </g>
              );
            })()}

            {/* רשת דהויה */}
            <g clipPath="url(#plat-slabclip)">
              <g mask="url(#plat-gridmask)" opacity={0.55 * gridOp} stroke={C.ink}>
                <g opacity={0.34}>{gridLines}</g>
              </g>
            </g>

            {/* "שרטוט" — משבצות ריקות שמסמנות מראש איפה כל כרטיס ינחת.
                נותן לפתיחה מבנה במקום משטח ריק, ומתפוגג ברגע שהכרטיס נוחת. */}
            {allCards.map((c, i) => {
              const at = -2 + i * 1.6;
              const g = ramp(f, [at, at + 6], [0, 1]) * ramp(f, [c.land - 6, c.land - 1], [1, 0]);
              if (g <= 0.001) return null;
              const s = 0.97 + 0.03 * ramp(f, [at, at + 6], [0, 1]);
              return (
                <g key={`slot-${c.key}`} opacity={g}>
                  <rect
                    x={-(c.w / 2) * s + c.u}
                    y={-(c.h / 2) * s + c.v}
                    width={c.w * s}
                    height={c.h * s}
                    rx={13}
                    fill="rgba(33,27,19,0.035)"
                    stroke="rgba(33,27,19,0.26)"
                    strokeWidth={1.7}
                    strokeDasharray="11 9"
                  />
                  {/* פינות מודגשות — שפה של שרטוט */}
                  {[
                    [-1, -1],
                    [1, -1],
                    [-1, 1],
                    [1, 1],
                  ].map(([sx, sy]) => (
                    <path
                      key={`${sx}${sy}`}
                      d={`M ${c.u + sx * (c.w / 2 - 22)} ${c.v + sy * (c.h / 2)} L ${c.u + sx * (c.w / 2)} ${
                        c.v + sy * (c.h / 2)
                      } L ${c.u + sx * (c.w / 2)} ${c.v + sy * (c.h / 2 - 20)}`}
                      fill="none"
                      stroke={C.green}
                      strokeWidth={3}
                      opacity={0.55}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              );
            })}

            {/* צל רך מתחת לכל הכרטיסים — כיוון אור אחיד מלמעלה-שמאל */}
            <g filter="url(#plat-soft)">
              {allCards.map((c) => {
                const en = entryOf(c.land, c.ph);
                const drop = Math.max(0, en.dy);
                return (
                  <rect
                    key={`sh-${c.key}`}
                    x={c.u - (c.w / 2) * en.sc + 15 + en.bob * 0.5}
                    y={c.v - (c.h / 2) * en.sc + 28 + en.bob * 0.5}
                    width={c.w * en.sc}
                    height={c.h * en.sc}
                    rx={14}
                    fill="rgba(33,27,19,0.15)"
                    opacity={en.op * (1 - Math.min(0.5, drop * 0.02))}
                  />
                );
              })}
            </g>

            {/* ===== קווי חיבור ===== */}
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              {CONNECTORS.map((cn) => {
                const L = polyLen(cn.pts);
                const p = ramp(f, [cn.s, cn.e], [0, 1]);
                if (p <= 0) return null;
                return (
                  <path
                    key={cn.key}
                    d={polyPath(cn.pts)}
                    stroke={C.green}
                    strokeWidth={3.4}
                    opacity={0.6}
                    strokeDasharray={L}
                    strokeDashoffset={L * (1 - p)}
                  />
                );
              })}
            </g>

            {/* צמתים */}
            {[
              { p: [0, -15] as Pt, at: 51 },
              { p: [320, 105] as Pt, at: 66 },
              { p: [0, 105] as Pt, at: 63 },
              { p: [-320, 105] as Pt, at: 70 },
            ].map((n) => {
              const pv = pop(f, fps, n.at);
              if (f < n.at) return null;
              return (
                <circle
                  key={`n${n.p[0]}-${n.p[1]}`}
                  cx={n.p[0]}
                  cy={n.p[1]}
                  r={7 * Math.min(1.25, pv)}
                  fill={C.green}
                  opacity={0.85}
                />
              );
            })}

            {/* דופק זורם לאורך הענפים */}
            {CONNECTORS.filter((cn) => cn.pulse !== undefined).map((cn) => {
              if (f < cn.e + 4) return null;
              const cyc = ((f - cn.e - 4) / 46 + (cn.pulse ?? 0)) % 1;
              const [px, py] = polyAt(cn.pts, cyc);
              const op = Math.sin(Math.min(1, cyc) * Math.PI) * 0.75;
              return <circle key={`p${cn.key}`} cx={px} cy={py} r={5.4} fill={C.greenLight} opacity={op} />;
            })}

            {/* ===== הכרטיס הראשי ===== */}
            {f >= HERO.land - 1 &&
              (() => {
                const en = entryOf(HERO.land, 0);
                return (
                  <g transform={`translate(0 ${en.dy})`} opacity={en.op}>
                    <CardBody u={HERO.u} v={HERO.v} w={HERO.w} h={HERO.h} sc={en.sc} />
                    <g transform={`translate(${HERO.u} ${HERO.v}) scale(${en.sc})`}>
                      {/* אריח מותג — פינה ימנית עליונה (RTL) */}
                      <g transform="translate(176 -62)">
                        <Glyph kind="grid" size={46} accent={C.green} />
                      </g>
                      {/* כותרות דמה — זורמות שמאלה מהאריח */}
                      <rect x={-30} y={-70} width={170} height={13} rx={6.5} fill={C.ink} opacity={0.5} />
                      <rect x={52} y={-46} width={88} height={8.5} rx={4.2} fill={C.muted} opacity={0.34} />
                      <rect x={-56} y={-12} width={196} height={8} rx={4} fill={C.muted} opacity={0.26} />
                      <rect x={4} y={8} width={136} height={8} rx={4} fill={C.muted} opacity={0.19} />
                      {/* עמודות נתונים קטנות — פינה שמאלית */}
                      {[
                        { x: -196, h: 20, c: C.sand },
                        { x: -165, h: 34, c: C.greenLight },
                        { x: -134, h: 26, c: C.sand },
                        { x: -103, h: 44, c: C.green },
                      ].map((b, i) => {
                        const g = rise(f, fps, HERO.land + 9 + i * 4, 60);
                        return (
                          <rect
                            key={b.x}
                            x={b.x}
                            y={32 - b.h * g}
                            width={23}
                            height={Math.max(0.01, b.h * g)}
                            rx={5}
                            fill={b.c}
                            opacity={0.92}
                          />
                        );
                      })}
                      <line
                        x1={-200}
                        y1={33.5}
                        x2={-76}
                        y2={33.5}
                        stroke={C.line}
                        strokeWidth={2}
                        opacity={ramp(f, [HERO.land + 8, HERO.land + 13], [0, 1])}
                      />
                      {/* מסלול מסע העובד — מימין לשמאל */}
                      <line
                        x1={trackL}
                        y1={62}
                        x2={trackR}
                        y2={62}
                        stroke={C.sand}
                        strokeWidth={9}
                        strokeLinecap="round"
                      />
                      <line
                        x1={trackR}
                        y1={62}
                        x2={headX}
                        y2={62}
                        stroke={C.green}
                        strokeWidth={9}
                        strokeLinecap="round"
                        opacity={jp > 0 ? 1 : 0}
                      />
                      {stations.map((sx) => {
                        const on = headX <= sx + 3;
                        const hit = on ? ramp(headX, [sx - 26, sx + 3], [0, 1]) : 0;
                        return (
                          <g key={sx}>
                            {hit > 0 && (
                              <circle
                                cx={sx}
                                cy={62}
                                r={12 + hit * 13}
                                fill="none"
                                stroke={C.green}
                                strokeWidth={2.4}
                                opacity={hit * 0.5}
                              />
                            )}
                            <circle
                              cx={sx}
                              cy={62}
                              r={on ? 11.5 : 9.5}
                              fill={on ? C.green : C.paperDeep}
                              stroke={on ? C.white : C.line}
                              strokeWidth={on ? 3 : 1.5}
                            />
                          </g>
                        );
                      })}
                      <g transform={`translate(${headX} 62)`}>
                        <circle cx={0} cy={0} r={13.5} fill={C.clay} />
                        <circle cx={0} cy={0} r={4.8} fill={C.white} />
                      </g>
                    </g>
                  </g>
                );
              })()}

            {/* ===== כרטיסי העמודים ===== */}
            {PILLARS.map((p) => {
              if (f < p.land - 1) return null;
              const en = entryOf(p.land, p.ph);
              const bp = ramp(f, [p.badgeAt, p.badgeAt + 13], [0, 1]);
              const bpop = pop(f, fps, p.badgeAt);
              return (
                <g key={p.key} transform={`translate(0 ${en.dy})`} opacity={en.op}>
                  <CardBody u={p.u} v={p.v} w={p.w} h={p.h} sc={en.sc} />
                  <g transform={`translate(${p.u} ${p.v}) scale(${en.sc})`}>
                    {/* אייקון בפינה הימנית העליונה — כמו בכרטיס ממשק בעברית */}
                    <g transform="translate(88 -34)">
                      <Glyph kind={p.glyph} size={38} accent={p.accent} />
                    </g>
                    <rect x={-60} y={12} width={170} height={8} rx={4} fill={C.muted} opacity={0.3} />
                    <rect x={-10} y={32} width={120} height={8} rx={4} fill={C.muted} opacity={0.22} />
                    {f >= p.badgeAt && (
                      <g transform={`translate(-88 34) scale(${Math.min(1.2, bpop)})`}>
                        <CheckBadge x={0} y={0} scale={1} color={C.green} progress={bp} />
                      </g>
                    )}
                  </g>
                </g>
              );
            })}

            {/* ===== כרטיסי משנה ===== */}
            {CHIPS.map((c) => {
              if (f < c.land - 1) return null;
              const en = entryOf(c.land, c.ph);
              return (
                <g key={c.key} transform={`translate(0 ${en.dy})`} opacity={en.op}>
                  <CardBody u={c.u} v={c.v} w={c.w} h={c.h} sc={en.sc} />
                  <g transform={`translate(${c.u} ${c.v}) scale(${en.sc})`}>
                    <rect x={40} y={-34} width={24} height={24} rx={7} fill={C.sand} />
                    <rect x={-44} y={-30} width={72} height={8} rx={4} fill={C.muted} opacity={0.3} />
                    <rect x={-52} y={4} width={116} height={7} rx={3.5} fill={C.muted} opacity={0.22} />
                    <rect x={-16} y={22} width={80} height={7} rx={3.5} fill={C.muted} opacity={0.16} />
                  </g>
                </g>
              );
            })}

            {/* ===== טבעת "נעילה" ברגע הנחיתה ===== */}
            {allCards.map((c) => {
              const p = ramp(f, [c.land, c.land + 11], [0, 1]);
              if (p <= 0 || p >= 1) return null;
              const s = 1 + p * 0.12;
              return (
                <rect
                  key={`ring-${c.key}`}
                  x={c.u - (c.w / 2 + 9) * s}
                  y={c.v - (c.h / 2 + 9) * s}
                  width={(c.w + 18) * s}
                  height={(c.h + 18) * s}
                  rx={18}
                  fill="none"
                  stroke={C.green}
                  strokeWidth={2.6}
                  opacity={(1 - p) * 0.55}
                />
              );
            })}
          </g>

          {/* ===== דפים מעופפים (מעל המישור) ===== */}
          <FlyPaper
            f={f}
            land={HERO.land}
            from={HERO_FROM}
            to={[heroCenter.x, heroCenter.y]}
            spin={HERO_SPIN}
            endScale={3.4}
          />
          {PILLARS.map((p) => {
            const c = proj(p.u, p.v);
            return (
              <FlyPaper
                key={`fp-${p.key}`}
                f={f}
                land={p.land}
                from={p.from}
                to={[c.x, c.y]}
                spin={p.spin}
                endScale={2.3}
              />
            );
          })}
          {CHIPS.map((c) => {
            const q = proj(c.u, c.v);
            return (
              <FlyPaper
                key={`fp-${c.key}`}
                f={f}
                land={c.land}
                from={c.from}
                to={[q.x, q.y]}
                spin={c.spin}
                endScale={1.7}
              />
            );
          })}
          {ABSORB.map((item, i) => (
            <AbsorbPaper key={`ab${i}`} f={f} item={item} target={[heroCenter.x, heroCenter.y]} />
          ))}

          {/* ===== הדמות — קנה מידה אנושי, עומדת לפני המשטח ===== */}
          <g transform={`translate(${(1 - charR) * 46} ${(1 - charR) * 18})`} opacity={charOp}>
            {/* צל מגע רך, בכיוון האור של שאר הסצנה */}
            <ellipse
              cx={CHAR_X + 30}
              cy={CHAR_Y + 6}
              rx={92}
              ry={15}
              fill="rgba(33,27,19,0.13)"
              filter="url(#plat-soft2)"
            />
            <Person
              x={CHAR_X}
              y={CHAR_Y}
              scale={CHAR_SC}
              flip
              look={LOOKS[1]}
              pose="handshake"
              t={t}
              phase={0.2}
              rate={0.62}
            />
          </g>
        </svg>

        {/* ===== תוויות על המישור (HTML לשם RTL) ===== */}
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {PILLARS.map((p) => {
            const en = entryOf(p.land, p.ph);
            const anchor = proj(p.u + 60, p.v - 34 + en.dy);
            const r = rise(f, fps, p.labelAt, 30);
            return <PlaneLabel key={`lb-${p.key}`} p={anchor} text={p.label} r={r} />;
          })}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* ===== כותרת ===== */}
      <div
        style={{
          position: 'absolute',
          right: 104,
          top: 244,
          width: 700,
          direction: 'rtl',
          textAlign: 'right',
        }}
      >
        <div style={{ overflow: 'hidden', height: 8, marginBottom: 32 }}>
          <div
            style={{
              width: 108,
              height: 6,
              borderRadius: 3,
              background: C.clay,
              marginRight: 6,
              transform: `translateX(${(1 - rRule) * 140}px)`,
              opacity: rRule,
            }}
          />
        </div>
        {/* הכותרת נבנית מילה-מילה בקצב שבו הכרטיסים נוחתים על הלוח —
            הטקסט לא "מופיע", הוא מורכב יחד עם המערכת שמאחוריו. */}
        <KineticLine
          text="פלטפורמה אחת."
          delay={2}
          stagger={5}
          fontSize={90}
          weight={900}
          color={C.ink}
          lineHeight={1.14}
          style={{ letterSpacing: '-0.012em', whiteSpace: 'nowrap' }}
        />
        <KineticLine
          text="כל מסע העובד."
          delay={14}
          stagger={5}
          fontSize={90}
          weight={900}
          color={C.green}
          lineHeight={1.14}
          style={{ letterSpacing: '-0.012em', marginTop: -6, whiteSpace: 'nowrap' }}
        />
        <span style={{ display: 'none' }}>{rL1 + rL2}</span>
        <div
          style={{
            marginTop: 30,
            height: 1,
            width: ramp(f, [24, 54], [0, 392]),
            background: C.line,
            marginRight: 6,
          }}
        />
      </div>

      {/* ===== גרעין נייר ===== */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.045, mixBlendMode: 'multiply' }}
      >
        <filter id="plat-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#plat-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
