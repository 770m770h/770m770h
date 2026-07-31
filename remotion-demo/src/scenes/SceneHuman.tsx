import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, SERIF, camera, ramp, rise } from '../theme';
import { LOOKS, Person } from '../rig';
import type { Look, Pose } from '../rig';

/**
 * סצנה 4 — "אנשים" (הפאנץ').
 *
 * שוט אחד רצוף. פותחים בקלוז-אפ חם על לחיצת יד (חתוך במותניים) ונסוגים
 * בתנועה אחת אל אולם מוצף אור עם צוות שלם. אין קאט — רק עדשה שנפתחת.
 *
 * העולם משורטט בקואורדינטות של הפריים הסופי (1:1). מצלמת הפתיחה היא זום
 * לתוך אותו עולם, כך שכל השכבות רשומות זו לזו ללא הסטה.
 */

const DUR = 150;
const TAU = Math.PI * 2;

/* ---------- גאומטריית העולם (הפריים הרחב = 1:1) ---------- */
const WALL_BASE = 780;
const WIN_TOP = -80;
const WIN_BOT = 762;
const TRANSOM_HI = 300;
const TRANSOM_LO = 520;

const CX = 960;

/* זוג הגיבורים — קדמי, גדול, מרכזי */
const Y_HERO = 1004;
const S_HERO = 3.25;
/** מרחק העוגן מהמרכז כך שכפות הידיים נפגשות בדיוק (נגזר מגאומטריית הריג). */
const HAND_REACH = 70.4 * S_HERO;
const HERO_L = CX - HAND_REACH;
const HERO_R = CX + HAND_REACH;

/** חלונות ברוחב לא-אחיד; הרחב מכולם נופל בדיוק בפער שבין הגיבורים. */
const WINS: Array<[number, number]> = [
  [60, 270],
  [300, 530],
  [560, 790],
  [820, 1100],
  [1130, 1330],
  [1360, 1640],
  [1670, 1900],
];

/* ---------- גוונים פנימיים ---------- */
const FRAME_TONE = '#5B5344';
const FACE_INK = '#2A2118';
const LEAF = '#2B4B3B';
const LEAF_HI = '#3E6B55';
const SKYLINE_TONE = '#A6B4AC';

/* ============================================================
   פנים — נמשכות מעל הריג באותה שרשרת טרנספורמים.
   ============================================================ */
function headXform(pose: Pose, t: number, phase: number) {
  const p = t + phase;
  switch (pose) {
    case 'walk': {
      const s = Math.sin(p * TAU);
      return {
        bodyY: -Math.abs(Math.sin(p * TAU * 2)) * 3.5,
        bodyRot: s * 2,
        headRot: -s * 2.5,
      };
    }
    case 'wave': {
      const b = Math.sin(p * TAU * 0.5);
      return { bodyY: b * 1.4, bodyRot: 0, headRot: 4 + b };
    }
    case 'cheer': {
      const j = Math.abs(Math.sin(p * TAU * 1.3));
      return { bodyY: -j * 9, bodyRot: 0, headRot: -3 };
    }
    case 'handshake': {
      const sh = Math.sin(p * TAU * 2.4);
      return { bodyY: sh * 0.8, bodyRot: 3, headRot: 5 };
    }
    default: {
      const b = Math.sin(p * TAU * 0.55);
      return { bodyY: b * 1.6, bodyRot: 0, headRot: b * 1.6 };
    }
  }
}

/** דמות = צל מגע + ריג + פנים. */
const Figure: React.FC<{
  x: number;
  y: number;
  s: number;
  flip?: boolean;
  look: Look;
  pose: Pose;
  t: number;
  phase?: number;
  rate?: number;
  /** הסטת מבט לכיוון שאליו הדמות פונה */
  gaze?: number;
  opacity?: number;
}> = ({ x, y, s, flip = false, look, pose, t, phase = 0, rate = 1, gaze = 0, opacity = 1 }) => {
  const h = headXform(pose, t * rate, phase);
  const cheer = pose === 'cheer';

  return (
    <g opacity={opacity}>
      {/* צל מגע רך שנמתח לעבר המצלמה — האור מגיע מהחלונות שמאחור */}
      <ellipse cx={x + 3 * s} cy={y + 11 * s} rx={30 * s} ry={9.5 * s} fill="rgba(52,40,24,0.07)" />
      <ellipse cx={x} cy={y + 3.5 * s} rx={36 * s} ry={6 * s} fill="rgba(52,40,24,0.105)" />

      <Person x={x} y={y} scale={s} flip={flip} look={look} pose={pose} t={t} phase={phase} rate={rate} />

      {/* --- פנים, באותה שרשרת טרנספורמים של הריג --- */}
      <g transform={`translate(${x} ${y}) scale(${s * (flip ? -1 : 1)} ${s}) translate(-50 -200)`}>
        <g transform={`translate(0 ${h.bodyY})`}>
          <g transform={`rotate(${h.bodyRot} 50 130)`}>
            <g transform={`rotate(${h.headRot} 50 44)`}>
              <ellipse cx={40.2} cy={45.0} rx={3.9} ry={2.5} fill={C.clay} opacity={0.19} />
              <ellipse cx={59.8} cy={45.0} rx={3.9} ry={2.5} fill={C.clay} opacity={0.19} />
              <path
                d={`M${41.6 + gaze} 33.2 Q${44.6 + gaze} 31.6 ${47.6 + gaze} 33.0`}
                stroke={FACE_INK}
                strokeWidth={1.5}
                strokeLinecap="round"
                fill="none"
                opacity={0.62}
              />
              <path
                d={`M${52.4 + gaze} 33.0 Q${55.4 + gaze} 31.6 ${58.4 + gaze} 33.2`}
                stroke={FACE_INK}
                strokeWidth={1.5}
                strokeLinecap="round"
                fill="none"
                opacity={0.62}
              />
              <ellipse cx={44.6 + gaze} cy={38.6} rx={2.3} ry={2.9} fill={FACE_INK} />
              <ellipse cx={55.4 + gaze} cy={38.6} rx={2.3} ry={2.9} fill={FACE_INK} />
              {/* נצנוץ אישון — נותן חיים בקלוז-אפ */}
              <circle cx={45.5 + gaze} cy={37.5} r={0.78} fill={C.white} opacity={0.85} />
              <circle cx={56.3 + gaze} cy={37.5} r={0.78} fill={C.white} opacity={0.85} />
              {cheer ? (
                <path d="M44.8 45.6 Q50 52.9 55.2 45.6 Z" fill={FACE_INK} opacity={0.88} />
              ) : (
                <path
                  d="M45.2 46.0 Q50 50.7 54.8 46.0"
                  stroke={FACE_INK}
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.84}
                />
              )}
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

/** עציץ משרדי — ממלא חללים בין הדמויות ומכניס ירוק לפלטה. */
const PottedPlant: React.FC<{ x: number; y: number; s?: number; t: number; ph?: number }> = ({
  x,
  y,
  s = 1,
  t,
  ph = 0,
}) => {
  const sway = Math.sin((t + ph) * 1.05) * 1.3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={4} cy={4} rx={48} ry={9} fill="rgba(52,40,24,0.12)" />
      <g transform={`rotate(${sway} 0 0)`}>
        <path d="M0 -38 Q-16 -72 -30 -94" stroke="#3A5C4B" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M0 -38 Q14 -74 28 -100" stroke="#3A5C4B" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M0 -38 L0 -108" stroke="#3A5C4B" strokeWidth={4.5} strokeLinecap="round" />
        <ellipse cx={-34} cy={-100} rx={17} ry={26} transform="rotate(-28 -34 -100)" fill={LEAF} />
        <ellipse cx={32} cy={-106} rx={16} ry={25} transform="rotate(26 32 -106)" fill={LEAF} />
        <ellipse cx={-16} cy={-128} rx={16} ry={28} transform="rotate(-12 -16 -128)" fill={LEAF} />
        <ellipse cx={16} cy={-134} rx={15} ry={27} transform="rotate(11 16 -134)" fill={LEAF} />
        <ellipse cx={0} cy={-152} rx={14} ry={24} fill={LEAF} />
        <ellipse cx={-46} cy={-74} rx={15} ry={21} transform="rotate(-52 -46 -74)" fill={LEAF} />
        <ellipse cx={44} cy={-78} rx={14} ry={20} transform="rotate(50 44 -78)" fill={LEAF} />
        <ellipse cx={12} cy={-136} rx={5} ry={12} transform="rotate(11 12 -136)" fill={LEAF_HI} opacity={0.4} />
        <ellipse cx={-38} cy={-104} rx={5} ry={10} transform="rotate(-28 -38 -104)" fill={LEAF_HI} opacity={0.34} />
      </g>
      <path d="M-27 -36 L-22 0 L22 0 L27 -36 Z" fill={C.clay} />
      <path d="M-27 -36 L-22 0 L-6 0 L-13 -36 Z" fill={C.clayLight} opacity={0.35} />
      <rect x={-31} y={-43} width={62} height={10} rx={3.5} fill={C.clayLight} />
    </g>
  );
};

export const SceneHuman: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  /* ============ תנועת מצלמה אחת רצופה ============ */
  const glide = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.62, 0.02, 0.2, 1),
  });

  const camMove = camera(glide * 100, {
    from: { x: 6, y: -119.5, scale: 2.78 },
    to: { x: 0, y: 0, scale: 1 },
    over: [0, 100],
  });
  /* אחרי ההתייצבות — דחיפה איטית מאוד פנימה, שהפריים ימשיך לנשום */
  const breathe = 1 + ramp(frame, [116, DUR], [0, 0.021]);
  /* נשימת מפעיל מצלמה — סטייה זעירה שמונעת תחושת סטילס */
  const swayX = Math.sin(t * 0.62) * 4.5;
  const swayY = Math.cos(t * 0.47) * 3.2;
  const roll = (1 - glide) * 0.5;
  const camTransform = `translate(${swayX}px, ${swayY}px) rotate(${roll}deg) ${camMove} scale(${breathe})`;

  /* ============ פרלקסה — מישור רחוק "מתכווץ" פחות, כמו דולי אמיתי ============ */
  const camS = 2.78 - 1.78 * glide;
  const planeFar = (1 + (camS - 1) * 0.62) / camS;
  const planeMid = (1 + (camS - 1) * 0.88) / camS;

  /* ============ עומק שדה — רדוד בקלוז-אפ, נפתח בנסיגה ============ */
  const blurFar = ramp(frame, [0, 116], [5.2, 0]);
  const blurMid = ramp(frame, [0, 104], [3.2, 0]);

  /* הצוות נכנס לתוך הפריים כשהעדשה נפתחת */
  const crowdOp = ramp(frame, [14, 54], [0, 1]);

  /* ============ הליכה ברקע העמוק ============ */
  const walkA = ramp(frame, [0, DUR], [572, 152]);
  const walkB = ramp(frame, [0, DUR], [1614, 1846]);

  /* ============ טיפוגרפיה ============ */
  const whisperIn = rise(frame, fps, 8, 190);
  const whisperOp = ramp(frame, [8, 26], [0, 1]) * (1 - ramp(frame, [58, 76], [0, 1]));
  const tickW = ramp(frame, [14, 38], [0, 64]);

  const wordRise = interpolate(frame, [88, 106], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 0.86, 0.22, 1),
  });
  const wordOp = ramp(frame, [88, 97], [0, 1]);
  const ruleW = ramp(frame, [104, 138], [0, 236]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#D5C39D', overflow: 'hidden' }}>
      {/* ================= העולם, מתחת למצלמה ================= */}
      <AbsoluteFill style={{ transform: camTransform, transformOrigin: '50% 50%' }}>
        {/* ---------- שכבה רחוקה: אדריכלות, אור, ותנועה עמוקה ---------- */}
        <AbsoluteFill
          style={{
            filter: blurFar > 0.02 ? `blur(${blurFar}px)` : undefined,
            transform: `scale(${planeFar})`,
            transformOrigin: '50% 50%',
          }}
        >
          <svg viewBox="0 0 1920 1080" width="100%" height="100%">
            <defs>
              <linearGradient id="hm-glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B4C8C0" />
                <stop offset="18%" stopColor="#DCD3BB" />
                <stop offset="52%" stopColor="#F2E4C4" />
                <stop offset="86%" stopColor="#EBD3A6" />
                <stop offset="100%" stopColor="#D9B47C" />
              </linearGradient>
              <linearGradient id="hm-wall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BCAA86" />
                <stop offset="34%" stopColor="#D7C8A6" />
                <stop offset="100%" stopColor="#C3B08A" />
              </linearGradient>
              <linearGradient id="hm-floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CFBC93" />
                <stop offset="24%" stopColor="#C5B189" />
                <stop offset="100%" stopColor="#A08A66" />
              </linearGradient>
              <linearGradient id="hm-pool" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FAF2DC" stopOpacity={0.82} />
                <stop offset="100%" stopColor="#FAF2DC" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hm-shaft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCF2D8" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#FCF2D8" stopOpacity={0.03} />
              </linearGradient>
              <clipPath id="hm-glassclip">
                {WINS.map(([a, b]) => (
                  <rect key={a} x={a} y={WIN_TOP} width={b - a} height={WIN_BOT - WIN_TOP} />
                ))}
              </clipPath>
            </defs>

            {/* קיר */}
            <rect x={-200} y={-200} width={2320} height={WALL_BASE + 200} fill="url(#hm-wall)" />

            {/* זכוכית */}
            {WINS.map(([a, b]) => (
              <rect
                key={`g-${a}`}
                x={a}
                y={WIN_TOP}
                width={b - a}
                height={WIN_BOT - WIN_TOP}
                fill="url(#hm-glass)"
              />
            ))}

            {/* עולם מעבר לזכוכית — קו אופק וצלליות בניינים חיוורות */}
            <g clipPath="url(#hm-glassclip)">
              <rect x={-200} y={664} width={2320} height={3} fill={SKYLINE_TONE} opacity={0.3} />
              <g fill={SKYLINE_TONE} opacity={0.26}>
                {[
                  [30, 118, 96],
                  [166, 74, 142],
                  [258, 150, 78],
                  [430, 96, 118],
                  [548, 132, 64],
                  [706, 84, 132],
                  [812, 168, 88],
                  [1006, 92, 126],
                  [1122, 140, 70],
                  [1290, 78, 138],
                  [1392, 156, 84],
                  [1574, 104, 120],
                  [1700, 128, 66],
                  [1852, 92, 110],
                ].map(([x, w, h]) => (
                  <rect key={x} x={x} y={664 - h} width={w} height={h + 4} />
                ))}
              </g>
              {/* אלומות שמש רכות שנופלות על הזכוכית */}
              <g>
                <path d="M120 -80 L470 -80 L200 800 L-70 800 Z" fill="url(#hm-shaft)" />
                <path d="M690 -80 L830 -80 L610 800 L470 800 Z" fill="url(#hm-shaft)" opacity={0.7} />
                <path d="M1300 -80 L1560 -80 L1290 800 L1030 800 Z" fill="url(#hm-shaft)" opacity={0.6} />
              </g>
            </g>

            {/* מסגור החלונות: עמודים, קורות רוחב, אדן */}
            {WINS.map(([a, b]) => (
              <g key={`f-${a}`}>
                <rect x={a} y={TRANSOM_HI} width={b - a} height={5} fill={FRAME_TONE} opacity={0.72} />
                <rect x={a} y={TRANSOM_LO} width={b - a} height={4} fill={FRAME_TONE} opacity={0.5} />
                <rect
                  x={a - 8}
                  y={WIN_TOP}
                  width={b - a + 16}
                  height={WIN_BOT - WIN_TOP + 8}
                  fill="none"
                  stroke={FRAME_TONE}
                  strokeWidth={9}
                  opacity={0.9}
                />
              </g>
            ))}
            <rect x={-200} y={WIN_BOT} width={2320} height={13} rx={4} fill={FRAME_TONE} opacity={0.5} />

            {/* רצפה */}
            <rect x={-200} y={WALL_BASE} width={2320} height={1080 - WALL_BASE + 240} fill="url(#hm-floor)" />
            <rect x={-200} y={WALL_BASE - 12} width={2320} height={12} fill="#B09A72" />
            <rect x={-200} y={WALL_BASE} width={2320} height={5} fill="rgba(52,40,24,0.24)" />

            {/* שלוליות אור מהחלונות אל עבר המצלמה */}
            {WINS.map(([a, b]) => {
              const c = (a + b) / 2;
              const spread = (c - CX) * 0.26;
              return (
                <path
                  key={`pool-${a}`}
                  d={`M${a} ${WALL_BASE} L${b} ${WALL_BASE} L${b + 78 + spread} 1210 L${
                    a - 78 + spread
                  } 1210 Z`}
                  fill="url(#hm-pool)"
                />
              );
            })}

            {/* עוברים ושבים עמוק ברקע */}
            <Figure
              x={walkA}
              y={806}
              s={1.02}
              flip
              look={LOOKS[5]}
              pose="walk"
              t={t}
              phase={0.1}
              rate={1}
              opacity={0.9}
            />
            <Figure
              x={walkB}
              y={798}
              s={1.06}
              look={LOOKS[2]}
              pose="walk"
              t={t}
              phase={0.72}
              rate={1}
              opacity={0.9}
            />
          </svg>
        </AbsoluteFill>

        {/* ---------- שכבה אמצעית: הצוות ---------- */}
        <AbsoluteFill
          style={{
            filter: blurMid > 0.02 ? `blur(${blurMid}px)` : undefined,
            transform: `scale(${planeMid})`,
            transformOrigin: '50% 50%',
          }}
        >
          <svg viewBox="0 0 1920 1080" width="100%" height="100%">
            <g opacity={crowdOp}>
              {/* מסודר לפי עומק — הרחוק נצבע קודם, הקרוב מכסה אותו */}
              <Figure
                x={578}
                y={838}
                s={1.22}
                look={LOOKS[2]}
                pose="idle"
                t={t}
                phase={1.2}
                rate={0.6}
                gaze={-1.1}
              />
              <Figure
                x={1352}
                y={852}
                s={1.28}
                look={LOOKS[5]}
                pose="cheer"
                t={t}
                phase={0.62}
                rate={0.74}
              />
              <Figure
                x={214}
                y={876}
                s={1.46}
                look={LOOKS[4]}
                pose="idle"
                t={t}
                phase={1.95}
                rate={0.58}
                gaze={1.2}
              />
              <Figure
                x={1460}
                y={900}
                s={1.56}
                flip
                look={LOOKS[0]}
                pose="idle"
                t={t}
                phase={2.4}
                rate={0.64}
                gaze={1.3}
              />
              <PottedPlant x={1756} y={910} s={1.32} t={t} ph={2.3} />
              <Figure
                x={302}
                y={918}
                s={1.66}
                look={LOOKS[3]}
                pose="wave"
                t={t}
                phase={0.32}
                rate={1}
                gaze={0.9}
              />
              <PottedPlant x={462} y={934} s={1.52} t={t} ph={0.4} />
              <Figure
                x={1560}
                y={962}
                s={1.9}
                flip
                look={LOOKS[4]}
                pose="wave"
                t={t}
                phase={1.55}
                rate={0.95}
                gaze={1.2}
              />
            </g>
          </svg>
        </AbsoluteFill>

        {/* ---------- שכבה קדמית: זוג הגיבורים ---------- */}
        <AbsoluteFill>
          <svg viewBox="0 0 1920 1080" width="100%" height="100%">
            {/* אותה פאזה ואותו קצב — כך שכפות הידיים נעולות זו בזו */}
            <Figure
              x={HERO_L}
              y={Y_HERO}
              s={S_HERO}
              look={LOOKS[0]}
              pose="handshake"
              t={t}
              phase={0}
              rate={0.5}
              gaze={2.6}
            />
            <Figure
              x={HERO_R}
              y={Y_HERO}
              s={S_HERO}
              flip
              look={LOOKS[1]}
              pose="handshake"
              t={t}
              phase={0}
              rate={0.5}
              gaze={2.6}
            />
          </svg>
        </AbsoluteFill>

      </AbsoluteFill>

      {/* ================= דירוג צבע + ויניאטה ================= */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(112% 92% at 50% 44%, rgba(185,85,47,0.085) 0%, rgba(185,85,47,0) 60%)',
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(122% 92% at 50% 40%, rgba(33,27,19,0) 40%, rgba(33,27,19,0.34) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* נפילת אור אל ראש הפריים — מונעת "לוח לבן" מעל הקבוצה */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(58,44,26,0.20) 0%, rgba(58,44,26,0.07) 16%, rgba(58,44,26,0) 34%)',
          pointerEvents: 'none',
        }}
      />

      {/* ================= טקסט ================= */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {/* חלק א' — לחישה, בעמוד האור שבין השניים */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 258,
            textAlign: 'center',
            opacity: whisperOp,
            transform: `translateY(${(1 - whisperIn) * 16}px)`,
          }}
        >
          <div
            style={{
              width: tickW,
              height: 4,
              borderRadius: 2,
              backgroundColor: C.clay,
              margin: '0 auto 20px',
            }}
          />
          <div
            style={{
              direction: 'rtl',
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 46,
              letterSpacing: '0.13em',
              color: 'rgba(33,27,19,0.84)',
            }}
          >
            מאחורי כל תהליך —
          </div>
        </div>

        {/* חלק ב' — התשובה */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 78,
            textAlign: 'center',
            opacity: wordOp,
          }}
        >
          <div style={{ overflow: 'hidden', display: 'inline-block', padding: '0 22px' }}>
            <div
              style={{
                direction: 'rtl',
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 192,
                lineHeight: 1.24,
                color: C.ink,
                transform: `translateY(${wordRise * 92}%)`,
                letterSpacing: '-0.015em',
              }}
            >
              אנשים.
            </div>
          </div>
          <div
            style={{
              width: ruleW,
              height: 6,
              borderRadius: 3,
              backgroundColor: C.clay,
              margin: '2px auto 0',
            }}
          />
        </div>
      </AbsoluteFill>

      {/* ================= גרעין פילם ================= */}
      <AbsoluteFill style={{ opacity: 0.055, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
        <svg width="100%" height="100%">
          <defs>
            <filter id="hm-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82"
                numOctaves={1}
                seed={frame % 11}
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#hm-grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
