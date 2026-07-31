import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SANS, SERIF, useHebrewFonts } from './fonts';
import { BrandMark, ICONS, IconKey } from './icons';

/**
 * פרסומת פרימיום (RTL, עברית) למותג בתחום יחסי אנוש.
 * הכול data-driven: הטקסט/הצבעים כאן — ובמידה ומשנים אותם, כל הסרטון מתעדכן.
 */

export type FeatureDemoProps = {
  brand: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  features: { icon: IconKey; label: string; note: string }[];
  cta: string;
};

export const featureDemoDefaultProps: FeatureDemoProps = {
  brand: 'אנשים',
  eyebrow: 'פלטפורמת יחסי אנוש',
  titleLine1: 'לנהל אנשים,',
  titleLine2: 'אנושי יותר.',
  subtitle: 'גיוס, קליטה, שכר ורווחה — פלטפורמה אחת לכל מסע העובד.',
  features: [
    { icon: 'people', label: 'גיוס וקליטה', note: 'מהמועמד ליום הראשון' },
    { icon: 'calendar', label: 'שכר ונוכחות', note: 'מדויק, בזמן, אוטומטי' },
    { icon: 'heart', label: 'רווחת העובד', note: 'הקשבה לאורך הדרך' },
  ],
  cta: 'people.co.il',
};

// פלטה חמה ואנושית — נייר, דיו, ירוק-אורן, וניצוץ טרקוטה. בלי סגול, בלי זוהר.
const PALETTE = {
  paper: '#ECE4D3',
  paperDeep: '#E4DAC5',
  ink: '#211B13',
  muted: '#6A6152',
  green: '#1E5A44',
  clay: '#B9552F',
  line: 'rgba(33,27,19,0.14)',
  card: 'rgba(33,27,19,0.035)',
};

const enter = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });

export const FeatureDemo: React.FC<FeatureDemoProps> = ({
  brand,
  eyebrow,
  titleLine1,
  titleLine2,
  subtitle,
  features,
  cta,
}) => {
  useHebrewFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const eyebrowIn = enter(frame, fps, 6);
  const line1In = enter(frame, fps, 16);
  const line2In = enter(frame, fps, 26);
  const subIn = enter(frame, fps, 40);
  const brandIn = enter(frame, fps, 8);
  const footIn = enter(frame, fps, 96);

  const rule = interpolate(frame, [44, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outro = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const rise = (p: number, px: number) => `translateY(${(1 - p) * px}px)`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.paper,
        direction: 'rtl',
        opacity: outro,
        fontFamily: SANS,
      }}
    >
      {/* וינייטה חמה עדינה — עומק בלי זוהר ניאון */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 82% 12%, ${PALETTE.paperDeep} 0%, ${PALETTE.paper} 55%)`,
        }}
      />
      {/* קו-מסגרת דק, נשימה של פרינט */}
      <AbsoluteFill style={{ padding: 40 }}>
        <div style={{ width: '100%', height: '100%', border: `1px solid ${PALETTE.line}`, borderRadius: 6 }} />
      </AbsoluteFill>

      {/* מותג — פינה עליונה */}
      <div
        style={{
          position: 'absolute',
          top: 74,
          right: 96,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: brandIn,
          transform: rise(brandIn, 12),
        }}
      >
        <BrandMark size={38} primary={PALETTE.green} spark={PALETTE.clay} />
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: PALETTE.ink, letterSpacing: 1 }}>
          {brand}
        </span>
      </div>

      {/* גוף המודעה */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', padding: '0 96px' }}>
        {/* Eyebrow */}
        <div
          style={{
            opacity: eyebrowIn,
            transform: rise(eyebrowIn, 16),
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: PALETTE.green,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          <span style={{ width: 30, height: 2, background: PALETTE.clay, display: 'inline-block' }} />
          {eyebrow}
        </div>

        {/* כותרת ראשית — סריף תצוגה */}
        <h1
          style={{
            fontFamily: SERIF,
            margin: '26px 0 0',
            fontWeight: 900,
            fontSize: 132,
            lineHeight: 1.04,
            color: PALETTE.ink,
            textAlign: 'right',
          }}
        >
          <span style={{ display: 'block', opacity: line1In, transform: rise(line1In, 44) }}>
            {titleLine1}
          </span>
          <span style={{ display: 'block', color: PALETTE.green, opacity: line2In, transform: rise(line2In, 44) }}>
            {titleLine2}
          </span>
        </h1>

        {/* קו-הדגשה שנפרש מימין */}
        <div
          style={{
            marginTop: 24,
            height: 5,
            width: 360 * rule,
            background: PALETTE.clay,
            borderRadius: 999,
          }}
        />

        {/* תת-כותרת */}
        <p
          style={{
            margin: '30px 0 0',
            fontSize: 38,
            lineHeight: 1.45,
            color: PALETTE.muted,
            maxWidth: 1040,
            textAlign: 'right',
            fontWeight: 400,
            opacity: subIn,
            transform: rise(subIn, 22),
          }}
        >
          {subtitle}
        </p>

        {/* כרטיסי יכולת */}
        <div style={{ display: 'flex', gap: 22, marginTop: 58 }}>
          {features.map((f, i) => {
            const c = enter(frame, fps, 64 + i * 11);
            const Icon = ICONS[f.icon];
            return (
              <div
                key={f.label}
                style={{
                  opacity: c,
                  transform: rise(c, 34),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '22px 28px',
                  borderRadius: 16,
                  background: PALETTE.card,
                  border: `1px solid ${PALETTE.line}`,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(30,90,68,0.10)',
                  }}
                >
                  <Icon size={30} color={PALETTE.green} />
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 27, fontWeight: 700, color: PALETTE.ink }}>
                    {f.label}
                  </span>
                  <span style={{ display: 'block', fontSize: 20, color: PALETTE.muted, marginTop: 2 }}>
                    {f.note}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* פוטר — נעילת מותג */}
      <div
        style={{
          position: 'absolute',
          bottom: 74,
          left: 96,
          right: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: footIn,
          transform: rise(footIn, 10),
        }}
      >
        <span style={{ fontSize: 24, color: PALETTE.muted, letterSpacing: 1 }}>{cta}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 26, color: PALETTE.ink }}>{brand}</span>
          <span style={{ fontSize: 22, color: PALETTE.green, fontWeight: 700 }}>· יחסי אנוש, אנושיים יותר</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
