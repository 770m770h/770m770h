import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SERIF, camera, ramp, rise } from '../theme';
import { LOOKS, Person } from '../rig';
import { Building, Plant } from '../props';

/**
 * סצנה 1 — "הבוקר".
 * שוט פתיחה רחב: שחר על העיר. דמות בודדת חוצה את הכיכר מימין לשמאל
 * לעבר כניסת המשרד. שש שכבות עומק בקצבי פרלקסה שונים, ערפילון בוקר
 * בגובה הרחוב, פאות מוארות בפרספקטיבה, ופוש-אין איטי עם טילט קל מטה.
 */

const DUR = 105;
const TAU = Math.PI * 2;

/* ---------- קווי קרקע של שכבות העומק ---------- */
const HORIZON = 690;
const Y_FAR = 706;
const Y_MID = 760;
const Y_NEAR = 806;
const Y_PLANT = 822; // רצועת נטיעות — בסיס עצים, גדר שיחים
const Y_WALK = 868; // מסלול ההליכה של הדמות
const Y_CURB = 900;
const Y_FG = 906;

/* נקודת מגוז אחת לכל הסצנה — ליד השמש */
const VPX = 1470;

/* ---------- גוונים ---------- */
const HAZE_FAR = 'rgba(96,110,101,0.15)';
const MID_TONES = ['#C1BCAB', '#B4AF9E', '#CBC6B5'];
const NEAR_TONES = ['#9E9281', '#8A7E6D', '#B0A593', '#786D5D'];
const NEAR_SHADE = 'rgba(58,50,38,0.24)';
const OFFICE_MAIN = '#6E6252';
const OFFICE_CROWN = '#7B6F5D';
const OFFICE_DARK = '#544A3C';
const OFFICE_SHADE = 'rgba(48,40,30,0.3)';
const WIN_DIM = '#D5C29C';
const FG_INK = 'rgba(30,23,16,0.94)';
const MID_INK = 'rgba(58,50,38,0.6)';
const LEAF = '#2C4B3B';
const LEAF_HI = '#3F6D56';
const FG_LEAF = '#1A2A21';
const WOOD = '#8C7455';
const SUN = '#E79A56';

type B = [x: number, w: number, h: number, tone: number];

/** פאה צדדית שנסוגה לנקודת המגוז — נותנת נפח אמיתי במקום מלבן שטוח. */
const sideFace = (x: number, w: number, base: number, h: number, k: number) => {
  const facesLeft = x + w * 0.5 > VPX; // בניין מימין לשמש חושף את פאתו השמאלית
  const ex = facesLeft ? x : x + w;
  const top = base - h;
  const px = ex + (VPX - ex) * k;
  return `M${ex} ${top} L${px} ${top + (HORIZON - top) * k} L${px} ${base + (HORIZON - base) * k} L${ex} ${base} Z`;
};

/* קו רקיע רחוק — פתח סביב x≈1330-1620 שבו זורחת השמש */
const FAR: B[] = [
  [-220, 190, 270, 0],
  [-10, 150, 350, 1],
  [160, 200, 220, 2],
  [380, 140, 420, 0],
  [545, 190, 300, 1],
  [755, 160, 465, 2],
  [935, 180, 255, 0],
  [1135, 195, 370, 1],
  [1620, 180, 400, 0],
  [1830, 160, 285, 2],
  [2010, 195, 345, 1],
];

const MID: B[] = [
  [-210, 190, 340, 0],
  [-5, 160, 455, 2],
  [175, 220, 270, 1],
  [415, 170, 385, 0],
  [605, 140, 300, 2],
  [760, 230, 500, 1],
  [1010, 160, 330, 0],
  [1190, 190, 240, 2],
  [1400, 170, 80, 1],
  [1590, 150, 60, 0],
  [1730, 170, 360, 2],
  [1920, 190, 290, 1],
  [2120, 180, 380, 0],
];

/* שכבה קרובה — בניינים גבוהים באמת, כך שקנה המידה של הדמות נכון.
   x 230..630 שמור לבניין המשרדים. */
const NEAR: B[] = [
  [-230, 250, 470, 2],
  [-15, 205, 385, 1],
  [630, 180, 520, 0],
  [820, 165, 355, 2],
  [995, 200, 600, 2],
  [1210, 130, 130, 0],
  [1360, 150, 100, 2],
  [1530, 120, 145, 1],
  [1670, 190, 560, 0],
  [1885, 170, 430, 2],
  [2075, 180, 500, 3],
];

/* עצי שדרה: [x, scale, phase] — גזע חשוף גבוה, והשדרה נפתחת בכוונה
   לאורך כל מסלול ההליכה (x≈860..1470), כך ששום גזע לא חוצה את הדמות. */
const TREES: Array<[number, number, number]> = [
  [150, 1.02, 0.2],
  [640, 0.9, 1.4],
  [1540, 0.95, 0.7],
  [1812, 0.88, 1.9],
  [2090, 1.0, 2.8],
];

/* ---------- עמוד תאורה ---------- */
const Lamppost: React.FC<{ x: number; y: number; scale?: number; tone?: string; glass?: number }> = ({
  x,
  y,
  scale = 1,
  tone = FG_INK,
  glass = 0.9,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={0} cy={2} rx={34} ry={7} fill="rgba(33,27,19,0.14)" />
    <rect x={-25} y={-28} width={50} height={30} rx={5} fill={tone} />
    <rect x={-17} y={-50} width={34} height={24} rx={4} fill={tone} />
    <rect x={-9} y={-706} width={18} height={660} fill={tone} />
    <rect x={-13} y={-722} width={26} height={20} rx={4} fill={tone} />
    <path d="M0 -716 C0 -776 -36 -810 -84 -816" stroke={tone} strokeWidth={13} fill="none" strokeLinecap="round" />
    <path d="M-116 -822 L-56 -822 L-66 -790 L-106 -790 Z" fill={tone} />
    <rect x={-104} y={-794} width={36} height={7} rx={3} fill={C.paperWarm} opacity={glass} />
  </g>
);

/* ---------- עץ שדרה: גזע חשוף גבוה + כיפה גבוהה ---------- */
const Tree: React.FC<{ x: number; y: number; s?: number; t: number; ph?: number }> = ({
  x,
  y,
  s = 1,
  t,
  ph = 0,
}) => {
  const sway = Math.sin((t + ph) * 1.05) * 1.15;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={-8} cy={3} rx={30} ry={7} fill="rgba(33,27,19,0.16)" />
      <g transform={`rotate(${sway} 0 0)`}>
        <path d="M-9 0 L-5 -262 L5 -262 L9 0 Z" fill={C.inkSoft} />
        <path d="M-4 -238 L-38 -278" stroke={C.inkSoft} strokeWidth={7} strokeLinecap="round" />
        <path d="M4 -226 L36 -268" stroke={C.inkSoft} strokeWidth={7} strokeLinecap="round" />
        <path d="M0 -262 L0 -300" stroke={C.inkSoft} strokeWidth={7} strokeLinecap="round" />
        {/* כיפה — בסיסה גבוה מראש הדמות */}
        <ellipse cx={-42} cy={-306} rx={44} ry={35} fill={LEAF} />
        <ellipse cx={40} cy={-318} rx={47} ry={38} fill={LEAF} />
        <ellipse cx={-4} cy={-356} rx={45} ry={37} fill={LEAF} />
        <ellipse cx={-2} cy={-292} rx={54} ry={34} fill={LEAF} />
        <ellipse cx={26} cy={-368} rx={33} ry={26} fill={LEAF} />
        {/* אור בוקר על הצד הפונה לשמש */}
        <path d="M58 -338 Q76 -320 66 -298 Q48 -316 58 -338 Z" fill={LEAF_HI} opacity={0.42} />
        <path d="M30 -386 Q48 -378 45 -360 Q26 -368 30 -386 Z" fill={LEAF_HI} opacity={0.32} />
        <path d="M-52 -330 Q-40 -316 -48 -302 Q-60 -314 -52 -330 Z" fill={LEAF_HI} opacity={0.16} />
      </g>
    </g>
  );
};

/** צל בוקר ארוך של עץ — השמש נמוכה מימין, הצל נמתח שמאלה. */
const TreeShadow: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g opacity={0.11} fill="#211B13">
    <path d={`M${x - 9 * s} ${y} L${x + 9 * s} ${y} L${x - 240 * s} ${y + 40 * s} L${x - 268 * s} ${y + 32 * s} Z`} />
    <ellipse cx={x - 318 * s} cy={y + 40 * s} rx={72 * s} ry={15 * s} />
    <ellipse cx={x - 240 * s} cy={y + 33 * s} rx={36 * s} ry={10 * s} />
  </g>
);

/* ---------- ציפור ---------- */
const Bird: React.FC<{ x: number; y: number; s: number; t: number; ph: number }> = ({ x, y, s, t, ph }) => {
  const lift = 4.5 + Math.sin((t + ph) * TAU * 1.5) * 3.4;
  return (
    <path
      d={`M-11 0 Q-5.5 ${-lift} 0 -1 Q5.5 ${-lift} 11 0`}
      transform={`translate(${x} ${y + Math.sin((t + ph) * 1.6) * 5}) scale(${s})`}
      stroke={C.inkSoft}
      strokeWidth={2.4 / s}
      fill="none"
      strokeLinecap="round"
      opacity={0.36}
    />
  );
};

/* ---------- יונת רחוב על המדרכה הקדמית ---------- */
const Pigeon: React.FC<{ x: number; y: number; s?: number; t: number; ph: number }> = ({
  x,
  y,
  s = 1,
  t,
  ph,
}) => {
  const peck = Math.max(0, Math.sin((t + ph) * 1.7)) * 20;
  const step = Math.sin((t + ph) * 0.8) * 3;
  return (
    <g transform={`translate(${x + step} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={18} ry={4} fill="rgba(33,27,19,0.16)" />
      <path d="M13 -15 L28 -5 L11 -5 Z" fill="#4B4437" />
      <ellipse cx={0} cy={-11} rx={16} ry={10} fill="#4B4437" />
      <ellipse cx={2} cy={-12} rx={10} ry={6} fill="#5F5748" />
      <rect x={-3} y={-3} width={2.6} height={5} fill="#3A3226" />
      <rect x={3} y={-3} width={2.6} height={5} fill="#3A3226" />
      <g transform={`translate(-12 -19) rotate(${peck})`}>
        <circle cx={0} cy={0} r={6.6} fill="#4B4437" />
        <path d="M-5 0 L-12 2 L-5 4 Z" fill={C.clayLight} />
      </g>
    </g>
  );
};

/** קו ריצוף בפרספקטיבה — מתכנס לנקודת המגוז. */
const joint = (targetX: number, y0: number, y1: number, vy = 1160) => {
  const at = (y: number) => VPX + ((targetX - VPX) * (y - HORIZON)) / (vy - HORIZON);
  return `M${at(y0)} ${y0} L${at(y1)} ${y1}`;
};

export const SceneArrival: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  /* דולי מרוכך: פריים-דמה עם smoothstep חלקי, כדי שהפוש-אין יאיץ וייעצר
     כמו מנוף אמיתי ולא בקצב לינארי מכני. */
  const p = Math.min(1, frame / DUR);
  const eF = DUR * (p + (p * p * (3 - 2 * p) - p) * 0.7);

  /* מצלמה: פוש-אין איטי + טילט קל מטה */
  const cam = camera(eF, {
    from: { x: 22, y: 14, scale: 1.06 },
    to: { x: -22, y: -22, scale: 1.18 },
    over: [0, DUR],
  });

  /* פרלקסה — בדולי-אין הקדמה נדחפת החוצה מהמרכז, הרקע כמעט עומד */
  const dSky = ramp(eF, [0, DUR], [0, -7]);
  const dFar = ramp(eF, [0, DUR], [0, -17]);
  const dMid = ramp(eF, [0, DUR], [0, -30]);
  const dNear = ramp(eF, [0, DUR], [0, -46]);
  const dFgL = ramp(eF, [0, DUR], [0, -104]);
  const dFgR = ramp(eF, [0, DUR], [0, 128]);

  /* השמש עולה מעט */
  const sunY = ramp(frame, [0, DUR], [640, 618]);
  const dayLift = ramp(frame, [0, DUR], [0, 0.07]);

  /* הדמות חוצה מימין לשמאל. הליכה רגועה: rate 1.2 מחזורים לשנייה,
     ואורך המסלול מכויל אליה (540px ל-3.5 שניות) כך שכפות הרגליים לא מחליקות. */
  const FIG = 0.95;
  const RATE = 1.2;
  const walkX = ramp(frame, [0, DUR], [1420, 880]);
  const bodyY = -Math.abs(Math.sin((t * RATE + 0.2) * TAU * 2)) * 3.5;
  /* מרחב מקומי של הריג הוא 100x200, העוגן במרכז כפות הרגליים */
  const px = (lx: number) => walkX + (lx - 50) * FIG;
  const py = (ly: number) => Y_WALK + (ly - 200 + bodyY) * FIG;
  const bagSwing = Math.sin((t * RATE + 0.2) * TAU) * 3.5;

  /* לואר-ת'רד */
  // הכתובית עולה מוקדם יותר כדי שתישאר קריאה במלואה כשנייה וחצי
  // לפני שהדיזולב לסצנה הבאה מתחיל (פריים 87).
  const capIn = rise(frame, fps, 30, 140);
  const capOp = ramp(frame, [30, 50], [0, 1]);
  const scrimOp = ramp(frame, [24, 46], [0, 1]);
  const barIn = rise(frame, fps, 36, 120);

  /* חלונות שנדלקים — רשת Building של הבניין הראשי: x=250, base=868, h=568 */
  const win = (r: number, c: number) => ({ x: 260 + c * 26, y: 316 + r * 34 });
  const LIGHTS: Array<{ r: number; c: number; at: number }> = [
    { r: 3, c: 2, at: 14 },
    { r: 7, c: 11, at: 40 },
    { r: 11, c: 1, at: 70 },
    { r: 6, c: 6, at: 88 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.paperWarm, overflow: 'hidden' }}>
      {/* ====== עולם הסצנה ====== */}
      <AbsoluteFill style={{ transform: cam, transformOrigin: '50% 50%' }}>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <defs>
            <linearGradient id="arr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BCCCC5" />
              <stop offset="24%" stopColor="#D8DACD" />
              <stop offset="50%" stopColor={C.paperWarm} />
              <stop offset="76%" stopColor="#EFDCBA" />
              <stop offset="100%" stopColor="#E2AE86" />
            </linearGradient>
            <radialGradient id="arr-sunwash" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={C.clayLight} stopOpacity={0.34} />
              <stop offset="46%" stopColor={C.clayLight} stopOpacity={0.14} />
              <stop offset="100%" stopColor={C.clayLight} stopOpacity={0} />
            </radialGradient>
            <linearGradient id="arr-haze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.paperWarm} stopOpacity={0} />
              <stop offset="100%" stopColor={C.paperWarm} stopOpacity={0.94} />
            </linearGradient>
            {/* ערפילון בוקר בגובה הרחוב — מפריד את הדמות מהבניינים */}
            <linearGradient id="arr-street" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F7F0E1" stopOpacity={0} />
              <stop offset="46%" stopColor="#F7F0E1" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#F7EEDC" stopOpacity={0.86} />
            </linearGradient>
            <linearGradient id="arr-plaza" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0E4CD" />
              <stop offset="45%" stopColor="#E7DAC0" />
              <stop offset="100%" stopColor="#DCCDAF" />
            </linearGradient>
            <linearGradient id="arr-road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDBC9C" />
              <stop offset="100%" stopColor="#B8A585" />
            </linearGradient>
            <linearGradient id="arr-pool" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.paperWarm} stopOpacity={0.72} />
              <stop offset="100%" stopColor={C.paperWarm} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="arr-lobby" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FCF5E5" />
              <stop offset="100%" stopColor="#E8D6B0" />
            </linearGradient>
            <linearGradient id="arr-fgshadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#211B13" stopOpacity={0} />
              <stop offset="100%" stopColor="#211B13" stopOpacity={0.3} />
            </linearGradient>
            <clipPath id="arr-roadclip">
              <rect x={-200} y={Y_FG} width={2320} height={220} />
            </clipPath>
            <clipPath id="arr-plazaclip">
              <rect x={-200} y={Y_PLANT + 16} width={2320} height={Y_CURB - Y_PLANT - 16} />
            </clipPath>
          </defs>

          {/* ---------- שמיים ---------- */}
          <rect x={-160} y={-160} width={2240} height={1400} fill="url(#arr-sky)" />
          <rect x={-160} y={-160} width={2240} height={1400} fill={C.paperWarm} opacity={dayLift} />

          <g transform={`translate(${dSky} 0)`}>
            <rect x={1410 - 660} y={sunY - 660} width={1320} height={1320} fill="url(#arr-sunwash)" />
            <circle cx={1410} cy={sunY} r={100} fill={SUN} />

            {/* עננים דקים */}
            <g opacity={0.62}>
              <rect x={170} y={214} width={460} height={20} rx={10} fill={C.paperWarm} />
              <rect x={258} y={250} width={262} height={13} rx={6.5} fill={C.paperWarm} opacity={0.74} />
              <rect x={820} y={150} width={356} height={16} rx={8} fill={C.paperWarm} opacity={0.7} />
              <rect x={1216} y={294} width={548} height={22} rx={11} fill={C.paperWarm} />
              <rect x={1344} y={334} width={292} height={12} rx={6} fill={C.paperWarm} opacity={0.66} />
              <rect x={500} y={418} width={392} height={13} rx={6.5} fill={C.paperWarm} opacity={0.48} />
              <rect x={1000} y={470} width={258} height={11} rx={5.5} fill={C.paperWarm} opacity={0.4} />
            </g>

            {/* ציפורים */}
            <g transform={`translate(${-t * 24} 0)`}>
              <Bird x={1146} y={272} s={1.1} t={t} ph={0} />
              <Bird x={1222} y={238} s={0.88} t={t} ph={0.35} />
              <Bird x={1286} y={296} s={0.72} t={t} ph={0.7} />
              <Bird x={1082} y={330} s={0.6} t={t} ph={1.1} />
            </g>
          </g>

          {/* ---------- קו רקיע רחוק ---------- */}
          <g transform={`translate(${dFar} 0)`}>
            {FAR.map(([x, w, h], i) => (
              <Building key={i} x={x} y={Y_FAR} w={w} h={h} fill={HAZE_FAR} windows={false} />
            ))}
          </g>
          <rect x={-160} y={Y_FAR - 210} width={2240} height={220} fill="url(#arr-haze)" opacity={0.9} />

          {/* ---------- קו רקיע אמצעי ---------- */}
          <g transform={`translate(${dMid} 0)`}>
            {MID.map(([x, w, h, tn], i) => (
              <g key={i}>
                <Building x={x} y={Y_MID} w={w} h={h} fill={MID_TONES[tn]} lit={C.sand} />
                {h > 150 ? (
                  <rect x={x + w * 0.3} y={Y_MID - h - 16} width={w * 0.4} height={16} fill={MID_TONES[tn]} />
                ) : null}
                <path d={sideFace(x, w, Y_MID, h, 0.03)} fill={MID_TONES[tn]} />
                <path d={sideFace(x, w, Y_MID, h, 0.03)} fill={C.sand} opacity={0.5} />
              </g>
            ))}
          </g>
          <rect x={-160} y={Y_MID - 190} width={2240} height={200} fill="url(#arr-haze)" opacity={0.5} />

          {/* ---------- שכבה קרובה ---------- */}
          <g transform={`translate(${dNear} 0)`}>
            {NEAR.map(([x, w, h, tn], i) => (
              <g key={i}>
                <Building x={x} y={Y_NEAR} w={w} h={h} fill={NEAR_TONES[tn]} lit={WIN_DIM} />
                <rect x={x} y={Y_NEAR - h} width={w} height={h} fill={NEAR_SHADE} />
                {/* קומות אפלות — שוברות את אחידות רשת החלונות */}
                {h > 260 ? (
                  <>
                    <rect x={x} y={Y_NEAR - h + 68} width={w} height={34} fill="rgba(46,38,28,0.16)" />
                    <rect x={x} y={Y_NEAR - h * 0.55} width={w} height={34} fill="rgba(46,38,28,0.12)" />
                  </>
                ) : null}
                {/* גגות: חדר מכונות / מיכל / תורן */}
                <rect x={x + w * 0.54} y={Y_NEAR - h - 22} width={34} height={22} rx={3} fill={NEAR_TONES[tn]} />
                {h > 300 ? (
                  <>
                    <rect x={x + w * 0.16} y={Y_NEAR - h - 34} width={26} height={34} rx={3} fill={NEAR_TONES[tn]} />
                    <path
                      d={`M${x + w * 0.78 - 6} ${Y_NEAR - h} L${x + w * 0.78 - 2} ${Y_NEAR - h - 52} L${
                        x + w * 0.78 + 2
                      } ${Y_NEAR - h - 52} L${x + w * 0.78 + 6} ${Y_NEAR - h} Z`}
                      fill={NEAR_TONES[tn]}
                    />
                    <circle cx={x + w * 0.78} cy={Y_NEAR - h - 56} r={4} fill={NEAR_TONES[tn]} />
                  </>
                ) : null}
                {/* פאה שנסוגה למגוז, מוארת בשמש הנמוכה */}
                <path d={sideFace(x, w, Y_NEAR, h, 0.055)} fill={NEAR_TONES[tn]} />
                <path d={sideFace(x, w, Y_NEAR, h, 0.055)} fill={C.sand} opacity={0.55} />
              </g>
            ))}
          </g>

          {/* ---------- ערפילון בוקר בגובה הרחוב ---------- */}
          <rect x={-200} y={608} width={2320} height={Y_NEAR - 608} fill="url(#arr-street)" />
          <rect x={-200} y={Y_NEAR} width={2320} height={20} fill="rgba(33,27,19,0.07)" />

          {/* ---------- הכיכר ---------- */}
          <rect x={-200} y={Y_NEAR} width={2320} height={Y_FG - Y_NEAR + 4} fill="url(#arr-plaza)" />
          {/* אור הזריחה נשפך דרך הפתח בקו הרקיע */}
          <ellipse cx={1408} cy={Y_WALK - 4} rx={470} ry={86} fill="#F7E7C4" opacity={0.55} />
          <ellipse cx={1408} cy={Y_WALK + 26} rx={300} ry={44} fill="#FAEED3" opacity={0.4} />
          <rect x={-200} y={Y_PLANT - 4} width={2320} height={10} fill="rgba(33,27,19,0.08)" />

          {/* מישקי ריצוף בפרספקטיבה על הכיכר */}
          <g clipPath="url(#arr-plazaclip)" opacity={0.16}>
            {[-500, -160, 180, 520, 860, 1200, 1540, 1880, 2220, 2560].map((tx, i) => (
              <path key={i} d={joint(tx, Y_PLANT, Y_CURB + 6)} stroke="#211B13" strokeWidth={2} fill="none" />
            ))}
            <path d={`M-200 ${Y_WALK + 12} L2120 ${Y_WALK + 12}`} stroke="#211B13" strokeWidth={2} fill="none" />
          </g>

          {/* ===== בניין המשרדים — נפח מדורג ===== */}
          <g transform={`translate(${dNear} 0)`}>
            {/* תורן */}
            <path d="M452 150 L456 62 L461 62 L465 150 Z" fill={OFFICE_CROWN} />
            <circle cx={458.5} cy={58} r={5} fill={OFFICE_CROWN} />
            <rect x={392} y={112} width={38} height={40} rx={4} fill={OFFICE_CROWN} />
            {/* כתר נסוג */}
            <Building x={300} y={300} w={260} h={150} fill={OFFICE_CROWN} lit={WIN_DIM} />
            <rect x={300} y={150} width={260} height={150} fill={OFFICE_SHADE} />
            <path d={sideFace(300, 260, 300, 150, 0.05)} fill={OFFICE_CROWN} />
            <path d={sideFace(300, 260, 300, 150, 0.05)} fill={C.sand} opacity={0.5} />
            {/* כרכוב */}
            <rect x={286} y={288} width={296} height={16} rx={3} fill={OFFICE_DARK} />
            {/* נפח ראשי */}
            <Building x={250} y={Y_WALK} w={360} h={568} fill={OFFICE_MAIN} lit={WIN_DIM} />
            <rect x={250} y={300} width={360} height={568} fill={OFFICE_SHADE} />
            {/* מולאיונים אנכיים — שוברים את רשת החלונות */}
            <g fill="rgba(30,24,16,0.2)">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={`ml-${i}`} x={276 + i * 60} y={300} width={5} height={568} />
              ))}
            </g>
            {/* חגורות קומה */}
            {[0, 1, 2, 3].map((i) => (
              <rect key={`band-${i}`} x={250} y={372 + i * 126} width={360} height={9} fill="rgba(30,24,16,0.3)" />
            ))}
            {LIGHTS.map((l, i) => {
              const p = win(l.r, l.c);
              return (
                <rect
                  key={`lit-${i}`}
                  x={p.x}
                  y={p.y}
                  width={12}
                  height={16}
                  rx={1.5}
                  fill={C.paperWarm}
                  opacity={ramp(frame, [l.at, l.at + 10], [0, 0.95])}
                />
              );
            })}
            {/* פאה מוארת בשמש (מימין) + כתם אור שחר אלכסוני על הזכוכית */}
            <rect x={556} y={300} width={54} height={568} fill={C.sand} opacity={0.2} />
            <path d="M610 318 L610 566 L392 700 L392 452 Z" fill="#F0DBB4" opacity={0.16} />
            <path d="M610 318 L610 404 L500 472 L500 386 Z" fill="#F7E8C9" opacity={0.14} />
            <path d={sideFace(250, 360, Y_WALK, 568, 0.05)} fill={OFFICE_MAIN} />
            <path d={sideFace(250, 360, Y_WALK, 568, 0.05)} fill={C.sand} opacity={0.55} />

            {/* שלט אנכי — לוח ירוק גבוה מעל הסוכך, עם רגל טרקוטה */}
            <rect x={258} y={360} width={54} height={13} rx={3} fill={OFFICE_DARK} />
            <rect x={265} y={373} width={40} height={158} fill={C.green} />
            <rect x={265} y={508} width={40} height={23} fill={C.clay} />
            <rect x={265} y={373} width={7} height={158} fill={C.greenLight} opacity={0.4} />

            {/* ===== כניסה מוארת — הפתח מכויל לגובה הדמות ===== */}
            <ellipse cx={430} cy={Y_WALK - 2} rx={218} ry={48} fill="url(#arr-pool)" />
            {/* סוכך צר, צמוד לפתח */}
            <rect x={316} y={606} width={228} height={20} rx={4} fill={C.green} />
            <rect x={324} y={626} width={212} height={6} fill="rgba(18,53,38,0.4)" />
            <rect x={340} y={594} width={5} height={13} fill={OFFICE_DARK} />
            <rect x={515} y={594} width={5} height={13} fill={OFFICE_DARK} />
            {/* פתח שקוע */}
            <rect x={324} y={634} width={212} height={234} fill={C.greenDeep} />
            <rect x={336} y={646} width={188} height={222} fill="url(#arr-lobby)" />
            <rect x={427} y={646} width={6} height={222} fill={C.greenDeep} />
            <rect x={336} y={700} width={188} height={5} fill={C.greenDeep} opacity={0.3} />
            {/* דמות בלובי — סימן חיים */}
            <g opacity={0.3} fill={C.greenDeep}>
              <circle cx={368} cy={730} r={12} />
              <rect x={356} y={745} width={24} height={123} rx={11} />
            </g>
            <rect x={318} y={Y_WALK - 4} width={224} height={11} rx={3} fill={C.paperDeep} />
            {/* בסיס אבן */}
            <rect x={242} y={824} width={82} height={44} fill={OFFICE_DARK} />
            <rect x={536} y={824} width={82} height={44} fill={OFFICE_DARK} />
            <rect x={242} y={824} width={82} height={7} fill={C.sand} opacity={0.3} />
            <rect x={536} y={824} width={82} height={7} fill={C.sand} opacity={0.35} />
            {/* עציצים בכניסה */}
            <Plant x={286} y={Y_WALK} scale={1.45} />
            <Plant x={578} y={Y_WALK} scale={1.3} />

            {/* צל ארוך של הבניין על הכיכר */}
            <path
              d={`M242 ${Y_WALK} L618 ${Y_WALK} L286 ${Y_WALK + 74} L-260 ${Y_WALK + 74} Z`}
              fill="rgba(33,27,19,0.085)"
            />
          </g>

          {/* ===== רצועת נטיעות: צללים, גדר שיחים, עצים, ריהוט ===== */}
          <g transform={`translate(${dNear} 0)`}>
            {TREES.map(([x, s], i) => (
              <TreeShadow key={`ts-${i}`} x={x} y={Y_PLANT} s={s} />
            ))}

            {/* גדר שיחים */}
            <g>
              <path
                d={`M960 ${Y_PLANT + 6} L960 ${Y_PLANT - 44} Q994 ${Y_PLANT - 72} 1034 ${Y_PLANT - 48} Q1074 ${
                  Y_PLANT - 76
                } 1116 ${Y_PLANT - 50} Q1160 ${Y_PLANT - 76} 1200 ${Y_PLANT - 48} Q1246 ${Y_PLANT - 74} 1290 ${
                  Y_PLANT - 50
                } Q1336 ${Y_PLANT - 76} 1380 ${Y_PLANT - 48} Q1426 ${Y_PLANT - 74} 1470 ${Y_PLANT - 50} Q1516 ${
                  Y_PLANT - 74
                } 1558 ${Y_PLANT - 44} L1558 ${Y_PLANT + 6} Z`}
                fill="#375847"
              />
              <path
                d={`M966 ${Y_PLANT - 44} Q994 ${Y_PLANT - 70} 1032 ${Y_PLANT - 48} Q1074 ${Y_PLANT - 74} 1114 ${
                  Y_PLANT - 50
                } Q1160 ${Y_PLANT - 74} 1198 ${Y_PLANT - 48} Q1246 ${Y_PLANT - 72} 1288 ${Y_PLANT - 50} Q1336 ${
                  Y_PLANT - 74
                } 1378 ${Y_PLANT - 48} Q1426 ${Y_PLANT - 72} 1468 ${Y_PLANT - 50} Q1516 ${Y_PLANT - 72} 1556 ${
                  Y_PLANT - 44
                } L1556 ${Y_PLANT - 34} Q1514 ${Y_PLANT - 60} 1468 ${Y_PLANT - 40} Q1426 ${Y_PLANT - 60} 1378 ${
                  Y_PLANT - 38
                } Q1336 ${Y_PLANT - 62} 1288 ${Y_PLANT - 40} Q1246 ${Y_PLANT - 60} 1198 ${Y_PLANT - 38} Q1160 ${
                  Y_PLANT - 62
                } 1114 ${Y_PLANT - 40} Q1074 ${Y_PLANT - 62} 1032 ${Y_PLANT - 38} Q994 ${Y_PLANT - 58} 966 ${
                  Y_PLANT - 34
                } Z`}
                fill={C.greenLight}
                opacity={0.32}
              />
              <ellipse cx={1260} cy={Y_PLANT + 14} rx={310} ry={12} fill="rgba(33,27,19,0.1)" />
            </g>

            {TREES.map(([x, s, ph], i) => (
              <Tree key={`tr-${i}`} x={x} y={Y_PLANT} s={s} t={t} ph={ph} />
            ))}

            {/* עמוד תאורה — מחוץ למסלול ההליכה, פרספקטיבה אווירית */}
            <Lamppost x={1666} y={Y_PLANT} scale={0.4} tone={MID_INK} glass={0.75} />

            {/* ספסל רחוב — בקנה מידה נכון מול הדמות */}
            <g transform={`translate(690 ${Y_PLANT + 26})`}>
              <ellipse cx={-6} cy={4} rx={92} ry={9} fill="rgba(33,27,19,0.12)" />
              <rect x={-80} y={-84} width={9} height={84} rx={3} fill={C.inkSoft} />
              <rect x={72} y={-84} width={9} height={84} rx={3} fill={C.inkSoft} />
              <rect x={-84} y={-84} width={169} height={11} rx={5} fill={WOOD} />
              <rect x={-84} y={-66} width={169} height={11} rx={5} fill={WOOD} />
              <rect x={-88} y={-46} width={177} height={13} rx={6} fill={WOOD} />
              <rect x={-88} y={-46} width={177} height={4} rx={2} fill={C.sand} opacity={0.5} />
              <rect x={-75} y={-33} width={11} height={33} fill={C.inkSoft} />
              <rect x={65} y={-33} width={11} height={33} fill={C.inkSoft} />
            </g>

            {/* צל ארוך של הדמות — השמש נמוכה מימין */}
            <path
              d={`M${walkX - 20} ${Y_WALK + 2} L${walkX + 20} ${Y_WALK + 2} L${walkX - 250} ${Y_WALK + 60} L${
                walkX - 308
              } ${Y_WALK + 48} Z`}
              fill="rgba(33,27,19,0.17)"
            />

            {/* ===== הדמות ===== */}
            <Person x={walkX} y={Y_WALK} scale={FIG} look={LOOKS[1]} pose="walk" t={t} phase={0.2} rate={RATE} />

            {/* תיק צד — נותן נפח לסילואטה ומספר לאן היא הולכת */}
            <g transform={`translate(${px(78)} ${py(140)}) rotate(${bagSwing})`}>
              <path
                d={`M${-10 * FIG} ${-44 * FIG} L${-2 * FIG} ${-2 * FIG}`}
                stroke="#4A3626"
                strokeWidth={6 * FIG}
                strokeLinecap="round"
              />
              <rect x={-17 * FIG} y={-2 * FIG} width={34 * FIG} height={29 * FIG} rx={4 * FIG} fill="#5E4530" />
              <rect x={-17 * FIG} y={-2 * FIG} width={34 * FIG} height={8 * FIG} rx={3 * FIG} fill="#4A3626" />
              <rect x={-5 * FIG} y={2 * FIG} width={10 * FIG} height={7 * FIG} rx={2} fill={C.sand} opacity={0.6} />
            </g>
          </g>

          {/* ---------- מדרכה ואבן שפה קדמית ---------- */}
          <rect x={-200} y={Y_CURB} width={2320} height={8} fill="rgba(42,33,23,0.24)" />
          <rect x={-200} y={Y_FG} width={2320} height={220} fill="url(#arr-road)" />
          {/* אור שנשפך מהפתח בקו הרקיע גם על הריצוף הקדמי */}
          <ellipse cx={1560} cy={Y_FG + 40} rx={620} ry={120} fill="#F2E2C2" opacity={0.3} />

          {/* מישקי ריצוף בפרספקטיבה */}
          <g clipPath="url(#arr-roadclip)" opacity={0.13}>
            {[-900, -540, -180, 180, 540, 900, 1260, 1620, 1980, 2340, 2700].map((tx, i) => (
              <path key={i} d={joint(tx, Y_FG, 1160)} stroke="#211B13" strokeWidth={2.5} fill="none" />
            ))}
            <path d="M-200 986 L2120 986" stroke="#211B13" strokeWidth={2.5} fill="none" />
            <path d="M-200 1076 L2120 1076" stroke="#211B13" strokeWidth={2.5} fill="none" />
          </g>

          {/* צללים ארוכים על הריצוף הקדמי */}
          <g opacity={0.6}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path
                key={i}
                d={`M${260 + i * 470} ${Y_FG} L${452 + i * 470} ${Y_FG} L${120 + i * 470} 1120 L${
                  -178 + i * 470
                } 1120 Z`}
                fill="rgba(33,27,19,0.075)"
              />
            ))}
          </g>

          {/* יוני בוקר על המדרכה הקדמית — חיים בשכבה הקרובה */}
          <Pigeon x={676} y={964} s={1.02} t={t} ph={0} />
          <Pigeon x={772} y={986} s={1.12} t={t} ph={1.6} />
          <Pigeon x={880} y={958} s={0.94} t={t} ph={3.1} />

          {/* צל של מבנה שמחוץ לפריים — מושיב את הכתוביות */}
          <path d="M-200 1010 L2120 928 L2120 1160 L-200 1160 Z" fill="url(#arr-fgshadow)" />

          {/* ---------- קדמת פריים שמאל: אדנית שיחים ---------- */}
          <g transform={`translate(${dFgL} 0)`}>
            <g fill={FG_LEAF} transform={`rotate(${Math.sin(t * 0.85) * 0.5} 300 1000)`}>
              <ellipse cx={168} cy={976} rx={86} ry={54} />
              <ellipse cx={288} cy={940} rx={100} ry={66} />
              <ellipse cx={410} cy={968} rx={82} ry={56} />
              <ellipse cx={232} cy={922} rx={64} ry={48} />
              <ellipse cx={358} cy={914} rx={48} ry={40} />
              <ellipse cx={300} cy={992} rx={142} ry={50} />
              <path d="M262 918 Q246 846 206 816 Q250 828 266 890 Q286 828 330 814 Q290 850 280 920 Z" />
              <path d="M382 926 Q376 870 348 844 Q382 856 394 900 Q406 860 438 846 Q410 872 400 928 Z" />
              <path d="M150 950 Q134 904 106 886 Q140 892 156 930 Q164 896 192 884 Q168 906 166 952 Z" />
            </g>
            <rect x={108} y={1006} width={392} height={130} rx={9} fill={FG_INK} />
            <rect x={92} y={990} width={424} height={28} rx={9} fill={FG_INK} />
            <rect x={92} y={990} width={424} height={5} rx={3} fill={C.sand} opacity={0.16} />
          </g>

          {/* ---------- קדמת פריים ימין: עמוד תאורה בקצה ---------- */}
          <g transform={`translate(${dFgR} 0)`}>
            <Lamppost x={1786} y={1200} scale={1} />
          </g>
        </svg>
      </AbsoluteFill>

      {/* ====== ויניאטה ====== */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(122% 92% at 50% 42%, rgba(33,27,19,0) 46%, rgba(33,27,19,0.26) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ====== לואר-ת'רד ====== */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 246,
            opacity: scrimOp,
            background:
              'linear-gradient(to top, rgba(24,18,12,0.66) 0%, rgba(24,18,12,0.42) 46%, rgba(24,18,12,0) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 122,
            bottom: 68,
            display: 'flex',
            direction: 'rtl',
            alignItems: 'center',
            gap: 24,
            opacity: capOp,
            transform: `translateY(${(1 - capIn) * 20}px)`,
          }}
        >
          <div
            style={{
              width: 5,
              height: 50 * barIn,
              backgroundColor: C.clayLight,
              borderRadius: 3,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              direction: 'rtl',
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 52,
              lineHeight: 1.2,
              color: C.paperWarm,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.005em',
            }}
          >
            כל בוקר, מיליוני אנשים מתחילים יום חדש.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
