import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticLine } from '../type';
import { C, SANS, SERIF, pop, ramp } from '../theme';
import { Person } from '../rig';
import type { Look } from '../rig';

/**
 * סצנה 5 — "נעילת מותג".
 *
 * שדה נייר רחב ומואר. שלושה עיגולים עפים פנימה ונוחתים לסימן "אנשים":
 * שלוש דמויות — שתי טבעות ירוקות מאחור ואחת טרקוטה מלאה מלפנים — שגופן
 * נמשך אחרי הנחיתה. מתחת: הלוגוטייפ, קו טרקוטה, סלוגן ודומיין.
 * לאורך הרצפה, בשני מישורי עומק, ממשיכות ללכת דמויות — החיים לא עוצרים
 * בשביל הלוגו.
 */

const DUR = 105;
const TAU = Math.PI * 2;

/* ============================================================
   1. גאומטריית הסימן  (מרחב מקומי, ראשית = מרכז אופטי)
   ============================================================ */
const MARK_X = 960;
const MARK_Y = 345;
const MARK_S = 1.15;

/** קו החיתוך התחתון של הסימן — כמו קרופ של תצלום קבוצתי */
const BASE = 90;
const RING_W = 9;
/** חפיפת ראש-גוף: בצורה מלאה צריך חפיפה אמיתית, בקו מתאר הגוף יוצא משפת הטבעת */
const LAP_SOLID = 6;
const LAP_RING = 0;
/** רווח הנייר שהדמות הקדמית מגלפת בדמויות שמאחוריה */
const KNOCK = 9;

type Figure = {
  /** מרכז הראש */
  hx: number;
  hy: number;
  r: number;
  /** חצי־רוחב הכתפיים */
  w: number;
  solid: boolean;
  /** נקודת מוצא יחסית ליעד */
  dx: number;
  dy: number;
  /** סטייה ניצבת — קשת במקום קו ישר */
  arc: number;
  delay: number;
  /** תזמון משיכת הגוף */
  bodyAt: number;
  /** תדר נשימה משנית */
  wob: number;
  wobPhase: number;
};

const FIGS: Figure[] = [
  // מאחור־שמאל — נכנסת בקשת משולי הפריים
  { hx: -84, hy: -50, r: 34, w: 56, solid: false, dx: -930, dy: 168, arc: -78, delay: 0, bodyAt: 13, wob: 0.17, wobPhase: 0.0 },
  // מאחור־ימין
  { hx: 84, hy: -50, r: 34, w: 56, solid: false, dx: 930, dy: 168, arc: 78, delay: 2, bodyAt: 15, wob: 0.13, wobPhase: 2.1 },
  // קדמית — צונחת מלמעלה לתוך המרווח שבין השתיים, ונוחתת אחרונה
  { hx: 0, hy: 2, r: 45, w: 68, solid: true, dx: 0, dy: -430, arc: 14, delay: 5, bodyAt: 11, wob: 0.21, wobPhase: 4.0 },
];

/** רדיוס עיגול הכתף */
const shoulderR = (w: number, top: number, bottom: number) =>
  Math.min(w * 0.92, (bottom - top) * 0.92);

/**
 * חצי גוף — מתחיל במרכז, מתחת לראש, ויורד החוצה ולמטה.
 * שני החצאים נמשכים במקביל, ולכן הגוף "צומח" סימטרית מהראש כלפי מטה.
 */
const halfTorso = (cx: number, w: number, top: number, bottom: number, side: 1 | -1) => {
  const r = shoulderR(w, top, bottom);
  const e = w * side;
  return (
    `M ${cx} ${top}` +
    ` C ${cx + e * 0.5} ${top} ${cx + e} ${top + r * 0.16} ${cx + e} ${top + r}` +
    ` L ${cx + e} ${bottom}`
  );
};

/** גוף מלא וסגור — לדמות הקדמית ולמסכה */
const torsoPath = (cx: number, w: number, top: number, bottom: number) => {
  const r = shoulderR(w, top, bottom);
  return (
    `M ${cx - w} ${bottom} L ${cx - w} ${top + r}` +
    ` C ${cx - w} ${top + r * 0.16} ${cx - w * 0.5} ${top} ${cx} ${top}` +
    ` C ${cx + w * 0.5} ${top} ${cx + w} ${top + r * 0.16} ${cx + w} ${top + r}` +
    ` L ${cx + w} ${bottom} Z`
  );
};

/* ============================================================
   2. שכבת החיים — הולכים בשני מישורי עומק
   ============================================================ */
/** קו האופק: ראשי ההולכים יושבים סביבו, לכן הרגליים נוחתות לפי הגודל. */
const HORIZON = 890;

const FAR_LOOK: Look = {
  skin: '#6A6152',
  hair: '#615948',
  outfit: '#6A6152',
  outfitDark: '#615948',
};
const NEAR_LOOK: Look = {
  skin: '#3A3226',
  hair: '#332C21',
  outfit: '#3A3226',
  outfitDark: '#332C21',
};

type Walker = {
  start: number;
  /** גודל — קובע גם עומק, מהירות ואטימות */
  s: number;
  /** שינוי גובה אישי סביב האופק */
  dy: number;
  /** שינוי קצב הליכה אישי */
  gait: number;
  phase: number;
  near: boolean;
  op: number;
};

const WALKERS: Walker[] = [
  // --- מישור רחוק: קטן, איטי, מעורפל ---
  { start: 2010, s: 0.34, dy: -8, gait: 1.06, phase: 0.15, near: false, op: 0.1 },
  { start: 1610, s: 0.4, dy: 6, gait: 0.93, phase: 0.62, near: false, op: 0.115 },
  { start: 1180, s: 0.36, dy: -12, gait: 1.11, phase: 0.31, near: false, op: 0.105 },
  { start: 760, s: 0.43, dy: 4, gait: 0.97, phase: 0.88, near: false, op: 0.125 },
  { start: 330, s: 0.38, dy: -6, gait: 1.02, phase: 0.44, near: false, op: 0.11 },
  { start: -60, s: 0.45, dy: 10, gait: 0.9, phase: 0.05, near: false, op: 0.13 },
  // --- מישור קרוב: גדול, מהיר, נוכח יותר ---
  { start: 1930, s: 0.66, dy: 8, gait: 0.95, phase: 0.72, near: true, op: 0.19 },
  { start: 1330, s: 0.83, dy: -10, gait: 1.08, phase: 0.24, near: true, op: 0.23 },
  { start: 690, s: 0.72, dy: 12, gait: 0.99, phase: 0.55, near: true, op: 0.2 },
  { start: 130, s: 0.88, dy: -4, gait: 0.91, phase: 0.37, near: true, op: 0.25 },
];

/** מחזור ההליכה — הדמויות נכנסות ויוצאות הרחק מחוץ לפריים. */
const SPAN = 2560;
const wrapX = (v: number) => (((v + 320) % SPAN) + SPAN) % SPAN - 320;

/** דעיכה מוקדמת ליד קצוות הפריים — אף דמות לא מגיעה לגבול ולכן לא נחתכת. */
const edgeFade = (x: number) =>
  Math.max(0, Math.min(1, Math.min((x - 46) / 250, (1874 - x) / 250)));

const WORD = 'אנשים';

/* ---------- עזרי תזמון ---------- */
const easeOut = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

const easeInOut = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const SceneLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  /* מצלמה: שתי שכבות שזזות מעט שונה — פרלקסה עדינה במקום זום שטוח */
  const holdAt = DUR - 20;
  const worldPush = ramp(frame, [0, holdAt], [1.0, 1.036]);
  const worldY = ramp(frame, [0, holdAt], [10, 0]);
  const lockPush = ramp(frame, [0, holdAt], [1.004, 1.018]);
  const lockY = ramp(frame, [0, holdAt], [16, 0]);

  /* הסט כבר דולק כשנכנסים אליו — האור רק מתעצם קלות. העולם לעולם לא ריק. */
  const lift = 0.82 + 0.18 * easeOut(frame, 0, 26);

  /* נשימה על הסימן בלבד */
  const breathe = 1 + Math.sin((t + 0.7) * TAU * 0.19) * 0.009;

  /* ---------- מיקום שלוש הדמויות ---------- */
  const placed = FIGS.map((f) => {
    const p = pop(frame, fps, f.delay);
    const pc = clamp01(p);
    const bow = Math.sin(pc * Math.PI) * f.arc;
    const settled = clamp01((p - 0.6) / 0.4);
    const wob = Math.sin((t + f.wobPhase) * TAU * f.wob) * 1.6 * settled;
    // הגוף צומח כלפי מטה מיד אחרי שהראש נוחת — קודם מהר, ואז מתיישב
    const body = easeOut(frame, f.bodyAt, f.bodyAt + 14);
    return {
      f,
      p,
      cx: f.hx + (1 - p) * f.dx + bow + wob,
      cy: f.hy + (1 - p) * f.dy - bow * 0.3 + wob * 0.6,
      scl: 0.5 + p * 0.5,
      opac: ramp(frame, [f.delay, f.delay + 1], [0, 1]),
      body,
    };
  });
  const front = placed[placed.length - 1];

  const frontR = front.f.r * front.scl;
  const frontTop = front.cy + frontR - LAP_SOLID;
  const frontTorso = torsoPath(front.cx, front.f.w, frontTop, BASE);
  // הגוף נפתח מנקודה שמתחת לראש כלפי חוץ ולמטה — תמיד מחובר, לעולם לא "תקליט"
  // הרוחב נפתח מהר מהגובה — הגוף אף פעם לא צר מהראש ולא נראה כמו רגל של גביע
  const bY = Math.max(0.001, front.body);
  const bX = 0.72 + 0.28 * front.body;
  const frontBodyTf =
    `translate(${front.cx} ${frontTop}) scale(${bX} ${bY}) translate(${-front.cx} ${-frontTop})`;

  /* הצורה הסופית של הדמות הקדמית — המסכה משתמשת בה ברגע שהראש נחת,
     כך שהמרווח "שמור" מראש והדמויות שמאחור לא מבצבצות מתחתיה. */
  const settledTorso = torsoPath(FIGS[2].hx, FIGS[2].w, FIGS[2].hy + FIGS[2].r - LAP_SOLID, BASE);
  const maskTorsoOn = front.p >= 0.7;

  /* ---------- טיפוגרפיה ---------- */
  const rule = easeInOut(frame, 40, 60);
  const tagline = easeOut(frame, 48, 68);
  const domain = easeOut(frame, 58, 78);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {/* ---------- אור סט: מפתח רך מלמעלה־שמאל + מילוי חם במרכז ---------- */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 62% 52% at 38% 24%, rgba(251,248,241,0.72) 0%, rgba(251,248,241,0) 62%),' +
            'radial-gradient(ellipse 52% 40% at 50% 33%, rgba(251,248,241,0.5) 0%, rgba(251,248,241,0) 70%)',
          opacity: 0.5 + lift * 0.5,
        }}
      />
      {/* ויניטה חמה — פינות כהות, לא שחורות */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 88% 82% at 50% 44%, rgba(33,27,19,0) 54%, rgba(33,27,19,0.11) 100%),' +
            'linear-gradient(to bottom, rgba(58,50,38,0.075) 0%, rgba(58,50,38,0) 22%)',
        }}
      />

      {/* ============ העולם: רצפה + הולכים בשני עומקים ============ */}
      <AbsoluteFill
        style={{
          transform: `translateY(${worldY}px) scale(${worldPush})`,
          transformOrigin: '960px 980px',
        }}
      >
        <svg
          viewBox="0 0 1920 1080"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <linearGradient id="lk-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.paperDeep} stopOpacity={0} />
              <stop offset="34%" stopColor={C.paperDeep} stopOpacity={0.34} />
              <stop offset="100%" stopColor={C.paperDeep} stopOpacity={0.72} />
            </linearGradient>
            {/* ערפל אווירי: מתעבה סביב האופק ונמוג לשני הכיוונים — בלי קצה קשיח */}
            <linearGradient id="lk-haze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.paperWarm} stopOpacity={0} />
              <stop offset="30%" stopColor={C.paperWarm} stopOpacity={0.5} />
              <stop offset="58%" stopColor={C.paperWarm} stopOpacity={0.34} />
              <stop offset="100%" stopColor={C.paperWarm} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lk-fore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B9AD91" stopOpacity={0} />
              <stop offset="100%" stopColor="#B9AD91" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <rect x={0} y={848} width={1920} height={232} fill="url(#lk-floor)" />

          {/* --- מישור רחוק --- */}
          <g>
            {WALKERS.filter((w) => !w.near).map((w, i) => {
              const speed = 128 * w.s * w.gait;
              const x = wrapX(w.start - t * speed);
              const y = HORIZON + w.dy + 200 * w.s;
              const o = w.op * edgeFade(x);
              if (o <= 0.002) return null;
              return (
                <g key={`f${i}`}>
                  <ellipse cx={x} cy={y + 1} rx={30 * w.s} ry={5 * w.s} fill="rgba(33,27,19,0.07)" />
                  <Person
                    x={x}
                    y={y}
                    scale={w.s}
                    flip
                    look={FAR_LOOK}
                    pose="walk"
                    t={t}
                    phase={w.phase}
                    rate={0.71 * w.gait}
                    opacity={o}
                  />
                </g>
              );
            })}
          </g>

          {/* ערפל בין המישורים — דוחף את הרחוקים לאחור */}
          <rect x={0} y={806} width={1920} height={274} fill="url(#lk-haze)" />

          {/* --- מישור קרוב --- */}
          <g>
            {WALKERS.filter((w) => w.near).map((w, i) => {
              const speed = 128 * w.s * w.gait;
              const x = wrapX(w.start - t * speed);
              const y = HORIZON + w.dy + 200 * w.s;
              const o = w.op * edgeFade(x);
              if (o <= 0.002) return null;
              return (
                <g key={`n${i}`}>
                  <ellipse cx={x} cy={y + 1} rx={34 * w.s} ry={6 * w.s} fill="rgba(33,27,19,0.1)" />
                  <Person
                    x={x}
                    y={y}
                    scale={w.s}
                    flip
                    look={NEAR_LOOK}
                    pose="walk"
                    t={t}
                    phase={w.phase}
                    rate={0.71 * w.gait}
                    opacity={o}
                  />
                </g>
              );
            })}
          </g>

          {/* משקל קדמי בשוליים התחתונים */}
          <rect x={0} y={990} width={1920} height={90} fill="url(#lk-fore)" />
        </svg>
      </AbsoluteFill>

      {/* ============ הלוקאפ ============ */}
      <AbsoluteFill
        style={{
          transform: `translateY(${lockY}px) scale(${lockPush})`,
          transformOrigin: '960px 500px',
        }}
      >
        {/* --- הסימן --- */}
        <svg
          viewBox="0 0 1920 1080"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
        >
          <g transform={`translate(${MARK_X} ${MARK_Y}) scale(${MARK_S * breathe})`}>
            <defs>
              {/* חור בצורת הדמות הקדמית — רווח נייר נקי בין השכבות */}
              <mask id="lk-knock" maskUnits="userSpaceOnUse" x={-600} y={-600} width={1200} height={1200}>
                <rect x={-600} y={-600} width={1200} height={1200} fill="#fff" />
                <g
                  fill="#000"
                  stroke="#000"
                  strokeWidth={KNOCK * 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                >
                  <circle cx={front.cx} cy={front.cy} r={frontR} />
                  {maskTorsoOn ? <path d={settledTorso} /> : null}
                </g>
              </mask>
            </defs>

            {/* דמויות הרקע — ירוק, קו מתאר */}
            <g mask="url(#lk-knock)">
              {placed.map((c, i) => {
                if (c.f.solid) return null;
                const r = c.f.r * c.scl;
                // הגוף יוצא בדיוק משפת הטבעת — נקודת ההתחלה של הקו מוסתרת בעובי הטבעת
                const top = c.cy + r - LAP_RING;
                return (
                  <g key={i} opacity={c.opac}>
                    {c.body > 0.004
                      ? ([-1, 1] as const).map((side) => (
                          <path
                            key={side}
                            d={halfTorso(c.cx, c.f.w, top, BASE, side)}
                            fill="none"
                            stroke={C.green}
                            strokeWidth={RING_W}
                            strokeLinecap="round"
                            pathLength={1}
                            strokeDasharray="1 1"
                            strokeDashoffset={1 - c.body}
                          />
                        ))
                      : null}
                    <circle
                      cx={c.cx}
                      cy={c.cy}
                      r={r}
                      fill="none"
                      stroke={C.green}
                      strokeWidth={RING_W}
                    />
                  </g>
                );
              })}
            </g>

            {/* הדמות הקדמית — טרקוטה מלאה */}
            <g fill={C.clay} opacity={front.opac}>
              {front.body > 0.01 ? <path d={frontTorso} transform={frontBodyTf} /> : null}
              <circle cx={front.cx} cy={front.cy} r={frontR} />
            </g>
          </g>
        </svg>

        {/* --- לוגוטייפ --- */}
        <div
          style={{
            position: 'absolute',
            top: 490,
            left: 0,
            width: 1920,
            height: 200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            direction: 'rtl',
            overflow: 'hidden',
          }}
        >
          {WORD.split('').map((ch, i) => {
            const d = 18 + i * 2.6;
            const e = easeOut(frame, d, d + 16);
            const o = ramp(frame, [d, d + 4], [0, 1]);
            return (
              <span
                key={i}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 152,
                  lineHeight: 1,
                  color: C.ink,
                  display: 'inline-block',
                  transform: `translateY(${(1 - e) * 205}px)`,
                  opacity: o,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* --- קו טרקוטה --- */}
        <div
          style={{
            position: 'absolute',
            top: 694,
            left: 960 - 170,
            width: 340,
            height: 3,
            backgroundColor: C.clay,
            transform: `scaleX(${rule})`,
            transformOrigin: 'right center',
          }}
        />

        {/* --- סלוגן --- */}
        <div
          style={{
            position: 'absolute',
            top: 726,
            left: 0,
            width: 1920,
            textAlign: 'center',
            direction: 'rtl',
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 42,
            letterSpacing: '0.005em',
            color: C.inkSoft,
            opacity: tagline,
            transform: `translateY(${(1 - tagline) * 16}px)`,
          }}
        >
          יחסי אנוש, אנושיים יותר.
        </div>

        {/* --- דומיין --- */}
        <div
          style={{
            position: 'absolute',
            top: 816,
            left: 0,
            width: 1920,
            direction: 'ltr',
            display: 'flex',
            justifyContent: 'center',
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 24,
            color: C.muted,
            opacity: domain * 0.88,
          }}
        >
          {/* המרווח הנגרר מנוטרל כדי שהמילה תהיה ממורכזת אופטית */}
          <span style={{ letterSpacing: '0.32em', marginRight: '-0.32em' }}>people.co.il</span>
        </div>
      </AbsoluteFill>

      {/* ---------- גרעין נייר עדין ---------- */}
      <svg
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.05 }}
      >
        <filter id="lk-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1920" height="1080" filter="url(#lk-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
