import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * A self-contained, programmatic feature-announcement video.
 *
 * Everything is data-driven via props — edit the text/colors below (or the
 * Composition defaultProps in Root.tsx) and the whole video re-renders. No
 * timeline, no editor, no video team: it's just React + math over `frame`.
 */

export type FeatureDemoProps = {
  kicker: string;
  title: string;
  subtitle: string;
  features: { icon: string; label: string }[];
  accent: string;
  background: string;
};

export const featureDemoDefaultProps: FeatureDemoProps = {
  kicker: 'NEW',
  title: 'Ship videos from code',
  subtitle: 'Programmatic video with React — parametric, versioned, automated.',
  features: [
    { icon: '⚛️', label: 'React components' },
    { icon: '🎛️', label: 'Data-driven props' },
    { icon: '🚀', label: 'Render in CI' },
  ],
  accent: '#7c5cff',
  background: '#0b0d17',
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const FeatureDemo: React.FC<FeatureDemoProps> = ({
  kicker,
  title,
  subtitle,
  features,
  accent,
  background,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Two slow-moving glow blobs give the background subtle motion.
  const drift = (phase: number, amp: number) =>
    Math.sin((frame / fps) * 0.9 + phase) * amp;

  const kickerIn = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const titleIn = spring({ frame: frame - 16, fps, config: { damping: 200 } });
  const subtitleIn = spring({ frame: frame - 30, fps, config: { damping: 200 } });

  // Underline sweep beneath the title.
  const underline = interpolate(frame, [36, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gentle fade-out on the last 15 frames so loops/exports end cleanly.
  const outro = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: background, fontFamily: FONT, opacity: outro }}>
      {/* Ambient gradient glows */}
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            width: 900,
            height: 900,
            left: width * 0.62 + drift(0, 40),
            top: height * 0.1 + drift(1.5, 30),
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55, transparent 60%)`,
            filter: 'blur(20px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 780,
            height: 780,
            left: -240 + drift(3, 36),
            top: height * 0.45 + drift(2, 28),
            borderRadius: '50%',
            background: 'radial-gradient(circle, #12b8a955, transparent 60%)',
            filter: 'blur(20px)',
          }}
        />
      </AbsoluteFill>

      {/* Content */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          paddingLeft: 110,
          paddingRight: 110,
        }}
      >
        {/* Kicker pill */}
        <div
          style={{
            transform: `translateY(${(1 - kickerIn) * 20}px)`,
            opacity: kickerIn,
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px',
            borderRadius: 999,
            border: `1px solid ${accent}`,
            background: `${accent}22`,
            color: accent,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 16px ${accent}`,
            }}
          />
          {kicker}
        </div>

        {/* Title */}
        <h1
          style={{
            margin: '26px 0 0',
            fontSize: 92,
            lineHeight: 1.02,
            fontWeight: 800,
            color: '#ffffff',
            maxWidth: 980,
            transform: `translateY(${(1 - titleIn) * 40}px)`,
            opacity: titleIn,
          }}
        >
          {title}
        </h1>

        {/* Animated underline */}
        <div
          style={{
            marginTop: 18,
            height: 8,
            width: 420 * underline,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${accent}, #12b8a9)`,
          }}
        />

        {/* Subtitle */}
        <p
          style={{
            margin: '28px 0 0',
            fontSize: 34,
            lineHeight: 1.35,
            color: '#c7cbe0',
            maxWidth: 820,
            transform: `translateY(${(1 - subtitleIn) * 24}px)`,
            opacity: subtitleIn,
          }}
        >
          {subtitle}
        </p>

        {/* Feature cards, staggered in */}
        <div style={{ display: 'flex', gap: 22, marginTop: 52 }}>
          {features.map((f, i) => {
            const cardIn = spring({
              frame: frame - (66 + i * 12),
              fps,
              config: { damping: 200 },
            });
            return (
              <div
                key={f.label}
                style={{
                  transform: `translateY(${(1 - cardIn) * 40}px)`,
                  opacity: cardIn,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '20px 26px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span style={{ fontSize: 34 }}>{f.icon}</span>
                <span style={{ fontSize: 26, fontWeight: 600, color: '#eef0fb' }}>
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
