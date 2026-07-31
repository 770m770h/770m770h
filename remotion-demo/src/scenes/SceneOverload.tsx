import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SERIF, SANS, ramp, pop } from '../theme';
import { LOOKS, Person } from '../rig';
import { Chair, CoffeeCup, Desk, Monitor, PaperSheet, Plant } from '../props';

/**
 * סצנה 2 — "העומס".
 * פנים משרד, מבט קרוב על עובדת מקלידה מאחורי שולחן. סופה של ניירת מסתחררת
 * סביבה, דמויות חולפות ברקע, המצלמה רועדת קלות ונכנסת פנימה.
 * הגריידינג קריר ואפרפר יותר מסצנה 1 — תחושת לחץ.
 */

const TAU = Math.PI * 2;

/** רעש דטרמיניסטי — כדי שהסופה תהיה זהה בכל רינדור. */
const rnd = (i: number, s = 0) => {
  const v = Math.sin(i * 12.9898 + s * 78.233 + 3.17) * 43758.5453;
  return v - Math.floor(v);
};

/* ---------- גאומטריית החדר ---------- */
const WALL_FLOOR = 700; // קו מפגש קיר/רצפה
const DESK_EDGE = 800; // הקצה הרחוק של משטח השולחן
const KEY_TOP = 748; // קצה עליון של המקלדת
const HERO_SCALE = 4.2;
const HERO_X = 1272;
const HAND_Y = 750; // מרכז כף היד — יושב על המקשים
/**
 * הריג מוריד תנוחת ישיבה ב-30 יחידות מקומיות, וכף היד בתנוחת 'type'
 * יושבת ב-y מקומי ≈ 83.4 → העוגן הוא גובה הידיים + 86.6 יחידות.
 */
const HERO_Y = HAND_Y + 86.6 * HERO_SCALE;
const HEAD_Y = HERO_Y - 130 * HERO_SCALE; // מרכז הראש
/** שרשרת הטרנספורם של הראש בתנוחת 'type' — כדי לצייר פנים שנצמדות אליו. */
const HEAD_TF =
  `translate(${HERO_X} ${HERO_Y}) scale(${HERO_SCALE}) translate(-50 -200) ` +
  `translate(0 30) rotate(2 50 130) rotate(8 50 44)`;

/* ---------- אזורים ששומרים נקיים ---------- */
const TEXT_BOX = { x0: 40, y0: 90, x1: 950, y1: 505 };
const HEAD_R = 285;

/* גוני הדמות הראשית — לזרועות שמצוירות ידנית מעל המקלדת */
const HERO_LOOK = LOOKS[0];
const SLEEVE_NEAR = HERO_LOOK.outfit;
const SLEEVE_FAR = HERO_LOOK.outfitDark ?? HERO_LOOK.outfit;
const SKIN_NEAR = HERO_LOOK.skin;
const SKIN_FAR = '#D3A078';

/** דהייה של ניירות שנכנסים לאזור הטקסט. */
const clearText = (x: number, y: number, guard: number) => {
  if (guard >= 1) return 1;
  const inside =
    x > TEXT_BOX.x0 && x < TEXT_BOX.x1 && y > TEXT_BOX.y0 && y < TEXT_BOX.y1;
  return inside ? guard + (1 - guard) * 0.13 : 1;
};

/** דהייה של ניירות שמכסים את הפנים. */
const clearHead = (x: number, y: number) => {
  const d = Math.hypot(x - HERO_X, y - (HEAD_Y + 10));
  if (d > HEAD_R) return 1;
  return 0.05 + 0.95 * (d / HEAD_R);
};

/** דף נעוץ על הקיר — ממלא את השוליים השמאליים. */
const PinnedSheet: React.FC<{ x: number; y: number; rot: number; scale: number }> = ({
  x,
  y,
  rot,
  scale,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-24} y={-30} width={52} height={68} rx={2} fill={C.ink} opacity={0.07} />
    <rect x={-26} y={-32} width={52} height={68} rx={2} fill={C.white} stroke={C.line} />
    {[0, 1, 2, 3].map((i) => (
      <rect
        key={i}
        x={-18}
        y={-20 + i * 12}
        width={i % 2 === 0 ? 36 : 24}
        height={4}
        rx={2}
        fill={C.muted}
        opacity={0.45}
      />
    ))}
    <circle cx={0} cy={-28} r={3.6} fill={C.clay} />
  </g>
);

/* ---------- דף שוכב שטוח על השולחן ---------- */
const FlatSheet: React.FC<{
  x: number;
  y: number;
  rot: number;
  scale: number;
  opacity?: number;
  lines?: number;
}> = ({ x, y, rot, scale, opacity = 1, lines = 3 }) => (
  <g transform={`translate(${x} ${y}) scale(1 0.44)`} opacity={opacity}>
    <PaperSheet x={0} y={0} rot={rot} scale={scale} lines={lines} />
  </g>
);

/** תיקייה צבעונית שוכבת — נקודת צבע בתוך ים הלבן. */
const Folder: React.FC<{
  x: number;
  y: number;
  rot: number;
  scale: number;
  color: string;
  opacity?: number;
}> = ({ x, y, rot, scale, color, opacity = 1 }) => (
  <g
    transform={`translate(${x} ${y}) scale(1 0.44) rotate(${rot}) scale(${scale})`}
    opacity={opacity}
  >
    <rect x={-29} y={-37} width={58} height={74} rx={3} fill={color} />
    <rect x={-29} y={-37} width={58} height={12} rx={3} fill={C.white} opacity={0.24} />
    <rect x={-16} y={-42} width={26} height={8} rx={3} fill={color} />
  </g>
);

/* ---------- ערימת ניירות שגדלה עם הזמן ---------- */
const Stack: React.FC<{
  f: number;
  fps: number;
  x: number;
  y: number;
  n: number;
  seed: number;
  sheet: number;
  delay: number;
  step?: number;
}> = ({ f, fps, x, y, n, seed, sheet, delay, step = 7 }) => (
  <g>
    <ellipse cx={x + 8} cy={y + 5} rx={32 * sheet} ry={8 * sheet} fill="rgba(33,27,19,0.22)" />
    {Array.from({ length: n }).map((_, i) => {
      const p = pop(f, fps, delay + i * 3.2);
      if (p <= 0.002) return null;
      const settle = Math.min(p, 1);
      const rot = (rnd(i, seed) - 0.5) * 62;
      const jx = (rnd(i, seed + 11) - 0.5) * 38 * sheet;
      const drop = (1 - settle) * -230;
      const tint = rnd(i, seed + 41);
      const ys = y - i * step * sheet + drop;
      if (tint > 0.86) {
        return (
          <Folder
            key={i}
            x={x + jx}
            y={ys}
            rot={rot * p}
            scale={sheet * 0.94}
            color={tint > 0.94 ? C.green : C.clay}
            opacity={Math.min(1, p * 1.6) * 0.92}
          />
        );
      }
      return (
        <FlatSheet
          key={i}
          x={x + jx}
          y={ys}
          rot={rot * p}
          scale={sheet}
          opacity={Math.min(1, p * 1.6)}
          lines={2 + (i % 3)}
        />
      );
    })}
  </g>
);

/* ---------- הגדרות הסופה ---------- */
const MID = Array.from({ length: 21 }, (_, i) => ({
  i,
  cx: 1130 + (rnd(i, 3) - 0.5) * 520,
  cy: 590 + (rnd(i, 4) - 0.5) * 300,
  rx: 300 + rnd(i, 1) * 600,
  ry: 140 + rnd(i, 2) * 230,
  sp: 0.3 + rnd(i, 5) * 0.46,
  ph: rnd(i, 6) * TAU,
  sc: 0.78 + rnd(i, 7) * 1.0,
  rot0: rnd(i, 8) * 360,
  rotSp: (rnd(i, 9) - 0.5) * 500,
  lines: 2 + Math.floor(rnd(i, 10) * 4),
}));

const NEAR = Array.from({ length: 6 }, (_, i) => ({
  i,
  per: 1.15 + rnd(i, 21) * 1.2,
  ph: rnd(i, 22),
  y0: 470 + rnd(i, 23) * 470,
  sc: 1.7 + rnd(i, 24) * 0.95,
  rot0: rnd(i, 25) * 360,
  dir: rnd(i, 26) > 0.5 ? 1 : -1,
  op: 0.3 + rnd(i, 27) * 0.2,
  arc: 110 + rnd(i, 28) * 210,
}));

const FAR = Array.from({ length: 12 }, (_, i) => ({
  i,
  cx: 300 + rnd(i, 31) * 1400,
  cy: 180 + rnd(i, 32) * 360,
  rx: 100 + rnd(i, 33) * 230,
  ry: 44 + rnd(i, 34) * 120,
  sp: 0.2 + rnd(i, 35) * 0.3,
  ph: rnd(i, 36) * TAU,
  sc: 0.32 + rnd(i, 37) * 0.26,
  rotSp: (rnd(i, 38) - 0.5) * 240,
}));

/* ---------- קלסרים על מדף ---------- */
const BINDERS: { x: number; h: number; w: number; c: string; lean: number }[] = [
  { x: 1210, h: 58, w: 20, c: C.green, lean: 0 },
  { x: 1234, h: 64, w: 24, c: C.clay, lean: 0 },
  { x: 1262, h: 54, w: 18, c: C.muted, lean: 0 },
  { x: 1284, h: 62, w: 22, c: C.inkSoft, lean: 0 },
  { x: 1310, h: 56, w: 20, c: C.green, lean: 0 },
  { x: 1334, h: 60, w: 24, c: C.sand, lean: 0 },
  { x: 1364, h: 50, w: 30, c: C.clay, lean: 22 },
];

export const SceneOverload: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;

  /* מצלמה: כניסה איטית + רעד יד */
  const push = ramp(f, [0, 105], [1.07, 1.235]);
  const shakeX = Math.sin(f * 0.83) * 3.6 + Math.sin(f * 2.31 + 1.2) * 1.7;
  const shakeY = Math.cos(f * 1.07 + 0.4) * 2.9 + Math.sin(f * 3.07) * 1.15;
  const shakeR = Math.sin(f * 0.61 + 2.1) * 0.27 + Math.sin(f * 1.9) * 0.1;
  const cam = `translate(${shakeX}px, ${shakeY}px) scale(${push}) rotate(${shakeR}deg)`;
  const camFore = `translate(${shakeX * 2}px, ${shakeY * 1.9}px) scale(${push * 1.14}) rotate(${
    shakeR * 1.7
  }deg)`;

  /* עוצמת הסופה עולה לאורך הסצנה */
  const heat = ramp(f, [0, 105], [0.9, 1.7]);
  const st = t * heat;

  /* דמויות שחולפות ברקע */
  const walkA = ramp(f, [0, 58], [2180, -300]);
  const walkB = ramp(f, [34, 112], [-300, 2060]);
  const edgeFade = (x: number) =>
    Math.max(0, Math.min(1, Math.min(x + 200, 2120 - x) / 220));

  /* מצמוץ */
  const bp = f % 53;
  const eyeOpen = bp < 2 ? 0.45 : bp < 4 ? 0.1 : bp < 6 ? 0.45 : 1;

  /* טקסט */
  const kick = ramp(f, [12, 24], [0, 1]);
  const l1 = ramp(f, [24, 38], [0, 1]);
  const l2 = ramp(f, [33, 47], [0, 1]);
  const ruleW = ramp(f, [46, 62], [0, 1]);
  const guard = ramp(f, [10, 22], [1, 0]); // 1 = אין טקסט, 0 = הטקסט מוגן

  /* קצב הקלדה — לזרועות שמצוירות ידנית */
  const kb1 = Math.sin(t * 1.3 * TAU * 3.1) * 4.2;
  const kb2 = Math.cos(t * 1.3 * TAU * 2.7) * 4.2;
  const tJit = (k: number) => Math.sin(f * 0.9 + k) * 1.7 + Math.sin(f * 2.7 + k * 2) * 0.9;

  const midPapers = MID.map((p) => {
    const a = p.ph + st * p.sp * TAU;
    const d = Math.sin(a);
    const x = p.cx + Math.cos(a) * p.rx;
    const y = p.cy + d * p.ry + Math.sin(a * 1.7 + p.ph) * 26;
    const sc = p.sc * (0.7 + 0.52 * (d + 1));
    const rot = p.rot0 + st * p.rotSp + d * 26;
    const front = d >= 0;
    let op = d < 0 ? 0.58 + 0.2 * (1 + d) : 0.9 - 0.34 * d;
    op *= clearText(x, y, guard);
    if (front) op *= clearHead(x, y);
    return { p, x, y, sc, rot, op, front };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.paperDeep, overflow: 'hidden' }}>
      {/* ======================= עולם ======================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: cam,
          transformOrigin: '58% 55%',
        }}
      >
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <defs>
            <filter id="ovl-b-sm" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
            <filter id="ovl-b-soft" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="46" />
            </filter>
            <filter id="ovl-mb" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2 0.8" />
            </filter>
            <filter id="ovl-mb2" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5.4 1.3" />
            </filter>
            <filter id="ovl-shadow" x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="52" />
            </filter>
            <filter id="ovl-fg" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <linearGradient id="ovl-wall" x1="0" y1="0" x2="0.34" y2="1">
              <stop offset="0%" stopColor="#EDE9DE" />
              <stop offset="62%" stopColor="#DCDACE" />
              <stop offset="100%" stopColor="#C6C5B9" />
            </linearGradient>
            <linearGradient id="ovl-deskg" x1="0" y1="0" x2="0.12" y2="1">
              <stop offset="0%" stopColor="#CFBE9C" />
              <stop offset="52%" stopColor="#B5A484" />
              <stop offset="100%" stopColor="#8E7F63" />
            </linearGradient>
            <linearGradient id="ovl-ceil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#211B13" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#211B13" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ovl-vig" cx="54%" cy="46%" r="72%">
              <stop offset="40%" stopColor="#211B13" stopOpacity="0" />
              <stop offset="100%" stopColor="#211B13" stopOpacity="0.5" />
            </radialGradient>
            <clipPath id="ovl-win">
              <rect x={1448} y={140} width={264} height={244} rx={4} />
            </clipPath>
          </defs>

          {/* ---------- קיר ---------- */}
          <rect x={-200} y={-200} width={2320} height={1480} fill="url(#ovl-wall)" />
          <rect x={-200} y={-200} width={2320} height={1480} fill={C.sky} opacity={0.2} />

          {/* אור רך מאחורי הכותרת */}
          <ellipse
            cx={470}
            cy={300}
            rx={430}
            ry={215}
            fill={C.paperWarm}
            opacity={0.72}
            filter="url(#ovl-b-soft)"
          />

          {/* ---------- חלון קריר ---------- */}
          <g>
            <rect x={1436} y={128} width={288} height={268} rx={4} fill={C.paperWarm} />
            <rect x={1448} y={140} width={264} height={244} rx={2} fill={C.sky} />
            <g clipPath="url(#ovl-win)">
              <rect x={1448} y={140} width={264} height={118} fill={C.white} opacity={0.46} />
              <rect x={1448} y={296} width={264} height={88} fill={C.muted} opacity={0.2} />
              <rect x={1448} y={258} width={264} height={4} fill={C.inkSoft} opacity={0.12} />
            </g>
            <rect x={1574} y={128} width={10} height={268} fill={C.paperWarm} />
            <rect x={1436} y={244} width={288} height={10} fill={C.paperWarm} />
            <rect
              x={1436}
              y={128}
              width={288}
              height={268}
              rx={4}
              fill="none"
              stroke={C.inkSoft}
              strokeWidth={5}
              opacity={0.44}
            />
            <rect x={1424} y={396} width={312} height={12} rx={3} fill={C.paperWarm} />
            <rect x={1424} y={408} width={312} height={5} fill={C.inkSoft} opacity={0.2} />
          </g>

          {/* ---------- דפים נעוצים בקיר, שוליים שמאליים ---------- */}
          <g opacity={0.9}>
            <PinnedSheet x={256} y={214} rot={-6} scale={1.5} />
            <PinnedSheet x={236} y={348} rot={7} scale={1.35} />
            <PinnedSheet x={272} y={468} rot={-3} scale={1.45} />
          </g>

          {/* ---------- שעון קיר, מחוג דקות מטורף ---------- */}
          <g transform="translate(1086 226) scale(1.16)">
            <ellipse cx={7} cy={10} rx={46} ry={46} fill="rgba(33,27,19,0.15)" filter="url(#ovl-b-sm)" />
            <circle r={45} fill={C.paperWarm} stroke={C.inkSoft} strokeWidth={4} opacity={0.97} />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x={-1.8}
                y={-38}
                width={3.6}
                height={i % 3 === 0 ? 10 : 5}
                rx={1.8}
                fill={C.muted}
                transform={`rotate(${i * 30})`}
              />
            ))}
            <rect
              x={-2.6}
              y={-19}
              width={5.2}
              height={21}
              rx={2.6}
              fill={C.inkSoft}
              transform={`rotate(${18 + f * 1.1})`}
            />
            <rect
              x={-1.9}
              y={-31}
              width={3.8}
              height={33}
              rx={1.9}
              fill={C.inkSoft}
              transform={`rotate(${f * 12.5})`}
            />
            <circle r={3.6} fill={C.clay} />
          </g>

          {/* ---------- מדף קלסרים ---------- */}
          <g>
            {BINDERS.map((b, i) => (
              <g key={i} transform={`translate(${b.x} 350) rotate(${b.lean} 0 0)`}>
                <rect x={0} y={-b.h} width={b.w} height={b.h} rx={2} fill={b.c} opacity={0.93} />
                <rect x={2} y={-b.h + 8} width={b.w - 4} height={7} rx={2} fill={C.paperWarm} opacity={0.75} />
                <rect x={2} y={-b.h + 22} width={b.w - 4} height={4} rx={2} fill={C.paperWarm} opacity={0.4} />
              </g>
            ))}
            <rect x={1190} y={350} width={232} height={11} rx={2} fill={C.sand} />
            <rect x={1190} y={361} width={232} height={5} fill={C.inkSoft} opacity={0.22} />
            <rect x={1190} y={366} width={232} height={16} fill={C.inkSoft} opacity={0.09} filter="url(#ovl-b-sm)" />
          </g>

          {/* ---------- רצפה ---------- */}
          <rect x={-200} y={WALL_FLOOR} width={2320} height={520} fill={C.sand} />
          <rect x={-200} y={WALL_FLOOR} width={2320} height={520} fill={C.inkSoft} opacity={0.44} />
          <rect x={-200} y={WALL_FLOOR - 22} width={2320} height={22} fill={C.paperWarm} opacity={0.55} />
          <rect x={-200} y={WALL_FLOOR - 3} width={2320} height={5} fill={C.inkSoft} opacity={0.34} />
          <rect x={-200} y={WALL_FLOOR} width={2320} height={34} fill={C.ink} opacity={0.12} filter="url(#ovl-b-sm)" />

          {/* ---------- עציץ שובר את קו הקיר ---------- */}
          <g transform="translate(244 708)">
            <ellipse cx={4} cy={4} rx={54} ry={12} fill="rgba(33,27,19,0.26)" />
            <g transform="translate(-22 0) rotate(-13) scale(1.5)">
              <Plant x={0} y={0} scale={1} />
            </g>
            <g transform="translate(24 2) rotate(11) scale(1.35)">
              <Plant x={0} y={0} scale={1} />
            </g>
            <g transform="scale(1.85)">
              <Plant x={0} y={0} scale={1} />
            </g>
          </g>

          {/* ---------- עמדת עבודה ברקע ---------- */}
          <g opacity={0.66}>
            <Chair x={470} y={744} scale={0.9} />
            <Desk x={462} y={712} w={286} scale={0.9} />
            <Monitor x={452} y={712} scale={0.86} on={C.paperWarm} />
            <FlatSheet x={392} y={716} rot={-18} scale={0.7} opacity={0.9} lines={3} />
            <FlatSheet x={528} y={718} rot={26} scale={0.64} opacity={0.9} lines={3} />
          </g>

          {/* ---------- מגדלי קרטונים של ניירת ---------- */}
          {[
            { x: 1642, y: 726, n: 5, w: 106 },
            { x: 1792, y: 722, n: 3, w: 88 },
          ].map((tw, k) => (
            <g key={k}>
              <ellipse cx={tw.x + 6} cy={tw.y + 4} rx={tw.w * 0.62} ry={9} fill="rgba(33,27,19,0.24)" />
              {Array.from({ length: tw.n }).map((_, i) => {
                const sk = (rnd(i, 60 + k) - 0.5) * 16;
                return (
                  <g key={i} transform={`translate(${tw.x + sk} ${tw.y - i * 27})`}>
                    <rect
                      x={-tw.w / 2}
                      y={-26}
                      width={tw.w}
                      height={26}
                      rx={2}
                      fill={C.sand}
                      stroke={C.line}
                    />
                    <rect
                      x={-tw.w / 2 + 8}
                      y={-19}
                      width={tw.w - 16}
                      height={5}
                      rx={2}
                      fill={C.muted}
                      opacity={0.42}
                    />
                    {i === 1 && k === 0 ? (
                      <rect x={-14} y={-24} width={28} height={7} rx={2} fill={C.clay} opacity={0.75} />
                    ) : null}
                  </g>
                );
              })}
            </g>
          ))}

          {/* ---------- ניירות רחוקים, מרחפים ---------- */}
          <g filter="url(#ovl-b-sm)">
            {FAR.map((p) => {
              const a = p.ph + st * p.sp * TAU;
              const x = p.cx + Math.cos(a) * p.rx;
              const y = p.cy + Math.sin(a) * p.ry;
              return (
                <PaperSheet
                  key={p.i}
                  x={x}
                  y={y}
                  rot={st * p.rotSp}
                  scale={p.sc}
                  opacity={0.5 * clearText(x, y, guard)}
                  lines={2}
                />
              );
            })}
          </g>

          {/* ---------- דמויות חולפות ברקע ---------- */}
          {f > 32 && (
            <g filter="url(#ovl-mb2)" opacity={0.72 * edgeFade(walkB)}>
              <Person
                x={walkB}
                y={722}
                scale={1.02}
                look={LOOKS[2]}
                pose="walk"
                t={t}
                rate={2.3}
                phase={0.7}
              />
            </g>
          )}

          {/* ---------- ניירות מאחורי הדמות ---------- */}
          {midPapers
            .filter((m) => !m.front)
            .map((m) => (
              <PaperSheet
                key={`b${m.p.i}`}
                x={m.x}
                y={m.y}
                rot={m.rot}
                scale={m.sc}
                opacity={m.op}
                lines={m.p.lines}
              />
            ))}

          {/* ---------- דמות שחולפת בריצה ---------- */}
          {f < 66 && (
            <g filter="url(#ovl-mb)" opacity={0.88 * edgeFade(walkA)}>
              <Person
                x={walkA}
                y={764}
                scale={1.42}
                look={LOOKS[3]}
                pose="walk"
                t={t}
                rate={2.7}
                phase={0.3}
                flip
              />
            </g>
          )}

          {/* ---------- הדמות הראשית ---------- */}
          {/* צל על הקיר */}
          <ellipse
            cx={HERO_X - 104}
            cy={620}
            rx={200}
            ry={172}
            fill="rgba(33,27,19,0.15)"
            filter="url(#ovl-shadow)"
          />
          {/* גב הכיסא */}
          <g>
            <rect
              x={HERO_X - 152}
              y={672}
              width={304}
              height={168}
              rx={34}
              fill={C.inkSoft}
              opacity={0.9}
            />
            <rect
              x={HERO_X - 134}
              y={690}
              width={268}
              height={22}
              rx={11}
              fill={C.muted}
              opacity={0.42}
            />
          </g>
          <Person
            x={HERO_X}
            y={HERO_Y}
            scale={HERO_SCALE}
            look={LOOKS[0]}
            pose="type"
            t={t}
            rate={1.3}
          />
          {/* פנים — נצמדות לשרשרת הטרנספורם של הראש בריג */}
          <g transform={HEAD_TF}>
            <ellipse cx={41.6} cy={44} rx={2.5} ry={3.2 * eyeOpen} fill={C.ink} />
            <ellipse cx={53} cy={44} rx={2.5} ry={3.2 * eyeOpen} fill={C.ink} />
            <path
              d="M37.6 39 L45 36.9"
              stroke={C.ink}
              strokeWidth={1.9}
              strokeLinecap="round"
              opacity={0.72}
              fill="none"
            />
            <path
              d="M49.4 36.9 L56.8 39"
              stroke={C.ink}
              strokeWidth={1.9}
              strokeLinecap="round"
              opacity={0.72}
              fill="none"
            />
            <path
              d="M43.4 53.6 Q47.6 51.7 51.8 53.2"
              stroke={C.ink}
              strokeWidth={1.7}
              strokeLinecap="round"
              opacity={0.62}
              fill="none"
            />
          </g>

          {/* ---------- משטח השולחן בקדמת הפריים ---------- */}
          <polygon
            points={`-60,${DESK_EDGE} 1990,${DESK_EDGE} 2400,1080 -460,1080`}
            fill="url(#ovl-deskg)"
          />
          <rect x={-200} y={DESK_EDGE} width={2320} height={30} fill={C.inkSoft} opacity={0.22} />
          <rect x={-200} y={DESK_EDGE} width={2320} height={4} fill={C.inkSoft} opacity={0.5} />

          {/* מקלדת שיושבת על השולחן */}
          <g>
            <ellipse cx={1042} cy={KEY_TOP + 58} rx={200} ry={16} fill="rgba(33,27,19,0.26)" filter="url(#ovl-b-sm)" />
            <rect x={856} y={KEY_TOP} width={372} height={54} rx={10} fill={C.paperWarm} stroke={C.line} />
            <rect x={856} y={KEY_TOP} width={372} height={8} rx={4} fill={C.white} opacity={0.7} />
            {Array.from({ length: 15 }).map((_, i) => (
              <rect
                key={i}
                x={868 + i * 23.2}
                y={KEY_TOP + 15}
                width={16}
                height={11}
                rx={2}
                fill={C.muted}
                opacity={0.42}
              />
            ))}
            <rect x={918} y={KEY_TOP + 34} width={248} height={10} rx={5} fill={C.muted} opacity={0.34} />
          </g>

          {/* ---------- אמות וידיים מצוירות: מחברות את הכתפיים למקשים ---------- */}
          <g>
            {/* צל הידיים על המקלדת */}
            <ellipse cx={1004} cy={KEY_TOP + 26} rx={44} ry={10} fill="rgba(33,27,19,0.22)" />
            <ellipse cx={1104} cy={KEY_TOP + 24} rx={46} ry={10} fill="rgba(33,27,19,0.22)" />

            {/* זרוע רחוקה */}
            <path
              d={`M1218 700 L1160 754 L1052 ${744 + kb2}`}
              stroke={SLEEVE_FAR}
              strokeWidth={37}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <g transform={`translate(1012 ${741 + kb2}) rotate(-13)`}>
              <rect x={-10} y={-19} width={26} height={38} rx={10} fill={SLEEVE_FAR} />
              <rect x={-40} y={-18} width={58} height={36} rx={16} fill={SKIN_FAR} />
              {[0, 1, 2].map((i) => (
                <rect
                  key={i}
                  x={-39}
                  y={-11 + i * 9}
                  width={30 - i * 3}
                  height={3.4}
                  rx={1.7}
                  fill={C.ink}
                  opacity={0.13}
                />
              ))}
            </g>

            {/* זרוע קרובה */}
            <path
              d={`M1316 698 L1256 760 L1148 ${738 + kb1}`}
              stroke={SLEEVE_NEAR}
              strokeWidth={43}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <g transform={`translate(1110 ${735 + kb1}) rotate(-11)`}>
              <rect x={-10} y={-21} width={28} height={42} rx={11} fill={SLEEVE_NEAR} />
              <rect x={-44} y={-20} width={62} height={40} rx={17} fill={SKIN_NEAR} />
              {[0, 1, 2].map((i) => (
                <rect
                  key={i}
                  x={-43}
                  y={-12 + i * 10}
                  width={33 - i * 3}
                  height={3.6}
                  rx={1.8}
                  fill={C.ink}
                  opacity={0.13}
                />
              ))}
            </g>
          </g>

          {/* צג */}
          <g>
            <ellipse cx={646} cy={862} rx={162} ry={18} fill="rgba(33,27,19,0.28)" filter="url(#ovl-b-sm)" />
            <Monitor x={640} y={830} scale={3.6} on={C.paperWarm} />
            <g opacity={0.6}>
              <rect x={506} y={628} width={98} height={11} rx={5} fill={C.clay} opacity={0.9} />
              {Array.from({ length: 8 }).map((_, i) => (
                <rect
                  key={i}
                  x={506}
                  y={652 + i * 18}
                  width={i % 3 === 0 ? 262 : 192 + (i % 4) * 22}
                  height={7}
                  rx={3}
                  fill={C.muted}
                />
              ))}
            </g>
            <rect x={504} y={622} width={280} height={168} rx={2} fill="none" stroke={C.line} />
            {/* פתקים דביקים על הצג */}
            <g transform="translate(806 660) rotate(6)">
              <rect x={-2} y={0} width={42} height={40} rx={2} fill={C.clay} opacity={0.85} />
            </g>
            <g transform="translate(802 706) rotate(-8)">
              <rect x={0} y={0} width={40} height={38} rx={2} fill={C.sand} />
            </g>
            <g transform="translate(452 690) rotate(-5)">
              <rect x={0} y={0} width={38} height={36} rx={2} fill={C.sky} />
            </g>
          </g>

          <CoffeeCup x={806} y={1004} scale={3.8} />

          {/* דפים שטוחים מפוזרים */}
          <FlatSheet x={930} y={944} rot={-24} scale={2.2} opacity={0.96} lines={4} />
          <FlatSheet x={1724} y={984} rot={38} scale={2.7} opacity={0.96} lines={3} />
          <FlatSheet x={372} y={1020} rot={12} scale={2.9} opacity={0.94} lines={4} />
          <FlatSheet x={306} y={920} rot={-40} scale={2.1} opacity={0.92} lines={3} />
          <FlatSheet x={1352} y={1054} rot={22} scale={3.0} opacity={0.94} lines={3} />
          <Folder x={1462} y={912} rot={-16} scale={2.1} color={C.clay} opacity={0.9} />
          <Folder x={676} y={1000} rot={24} scale={2.3} color={C.green} opacity={0.88} />

          {/* ערימות שגדלות */}
          <Stack f={f} fps={fps} x={1548} y={946} n={13} seed={2} sheet={2.05} delay={-18} step={7.6} />
          <Stack f={f} fps={fps} x={640} y={978} n={9} seed={7} sheet={2.25} delay={-9} step={7} />
          <Stack f={f} fps={fps} x={1120} y={1062} n={7} seed={13} sheet={3.1} delay={12} step={7} />

          {/* ---------- ניירות מול הדמות ---------- */}
          {midPapers
            .filter((m) => m.front)
            .map((m) => (
              <PaperSheet
                key={`f${m.p.i}`}
                x={m.x}
                y={m.y}
                rot={m.rot}
                scale={m.sc}
                opacity={m.op}
                lines={m.p.lines}
              />
            ))}

          {/* ---------- מסה כהה מטושטשת בקדמת הפריים (מסגור) ---------- */}
          <g filter="url(#ovl-fg)">
            {/* פינה שמאלית תחתונה — ערימת קלסרים קרובה */}
            <g opacity={0.95}>
              <rect x={-200} y={862} width={366} height={280} rx={6} fill={C.inkSoft} />
              <rect x={150} y={826} width={82} height={318} rx={5} fill={C.muted} />
              <rect x={226} y={892} width={70} height={252} rx={5} fill={C.green} opacity={0.92} />
              <rect x={288} y={852} width={76} height={292} rx={5} fill={C.inkSoft} />
              <rect x={356} y={918} width={64} height={226} rx={5} fill={C.clay} opacity={0.88} />
              <rect x={412} y={880} width={70} height={264} rx={5} fill={C.muted} opacity={0.9} />
              <rect x={150} y={872} width={82} height={18} rx={3} fill={C.paperWarm} opacity={0.5} />
              <rect x={288} y={898} width={76} height={18} rx={3} fill={C.paperWarm} opacity={0.45} />
              <rect x={412} y={926} width={70} height={16} rx={3} fill={C.paperWarm} opacity={0.4} />
            </g>
            {/* קצה ימין — קלסרים קרובים */}
            <g opacity={0.95}>
              <rect x={1810} y={874} width={96} height={270} rx={6} fill={C.inkSoft} />
              <rect x={1738} y={912} width={80} height={232} rx={6} fill={C.clay} opacity={0.86} />
              <rect x={1672} y={946} width={72} height={198} rx={6} fill={C.muted} />
              <rect x={1606} y={982} width={74} height={162} rx={6} fill={C.inkSoft} opacity={0.95} />
              <rect x={1810} y={916} width={96} height={20} rx={3} fill={C.paperWarm} opacity={0.48} />
              <rect x={1738} y={954} width={80} height={18} rx={3} fill={C.paperWarm} opacity={0.44} />
              <rect x={1672} y={986} width={72} height={16} rx={3} fill={C.paperWarm} opacity={0.4} />
            </g>
          </g>

          {/* ---------- גרייד קריר + ויניה ---------- */}
          <rect x={-200} y={-200} width={2320} height={1480} fill={C.sky} opacity={0.1} />
          <rect x={-200} y={-190} width={2320} height={230} fill="url(#ovl-ceil)" />
          <rect x={-200} y={-200} width={2320} height={1480} fill="url(#ovl-vig)" />
        </svg>
      </div>

      {/* ======================= טקסט ======================= */}
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 132,
          width: 780,
          direction: 'rtl',
          textAlign: 'right',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
            opacity: kick,
            transform: `translateY(${ramp(f, [22, 36], [14, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: '0.36em',
              color: C.clay,
            }}
          >
            העומס
          </div>
          <div style={{ height: 3, width: 62, backgroundColor: C.clay, opacity: 0.55, borderRadius: 2 }} />
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 94,
            lineHeight: 1.1,
            color: C.ink,
            textShadow: '0 0 30px rgba(243,237,224,0.95), 0 1px 3px rgba(243,237,224,0.9)',
          }}
        >
          <div
            style={{
              clipPath: `inset(-16% 0% -16% ${(1 - l1) * 100}%)`,
              opacity: l1,
              transform: `translate(${tJit(0)}px, ${ramp(f, [30, 46], [20, 0]) + tJit(1.7) * 0.5}px)`,
            }}
          >
            אבל הניהול נשאר
          </div>
          <div
            style={{
              clipPath: `inset(-16% 0% -16% ${(1 - l2) * 100}%)`,
              opacity: l2,
              transform: `translate(${tJit(2.4)}px, ${ramp(f, [39, 55], [22, 0]) + tJit(4.1) * 0.5}px)`,
            }}
          >
            תקוע <span style={{ color: C.clay }}>בניירת</span>.
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            marginRight: 4,
            height: 6,
            width: `${ruleW * 232}px`,
            backgroundColor: C.clay,
            opacity: 0.92,
            borderRadius: 3,
            transform: `translate(${tJit(3.3) * 0.6}px, 0)`,
          }}
        />
      </div>

      {/* ======================= ניירות שחולפים מול המצלמה ======================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: camFore,
          transformOrigin: '58% 55%',
        }}
      >
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <defs>
            <filter id="ovl-fb" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.1" />
            </filter>
          </defs>
          <g filter="url(#ovl-fb)">
            {NEAR.map((p) => {
              const u = (((st / p.per + p.ph) % 1) + 1) % 1;
              const x = 2320 - u * 2760;
              const y = p.y0 - Math.sin(u * Math.PI) * p.arc + u * 140;
              return (
                <PaperSheet
                  key={p.i}
                  x={x}
                  y={y}
                  rot={p.rot0 + u * 640 * p.dir}
                  scale={p.sc}
                  opacity={p.op * clearText(x, y - 40, guard) * clearHead(x, y + 30)}
                  lines={3}
                />
              );
            })}
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
