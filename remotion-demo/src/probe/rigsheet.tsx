import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame, useVideoConfig } from 'remotion';
import { LOOKS, Person, Pose } from '../rig';
import { C } from '../theme';

const POSES: Pose[] = ['idle', 'walk', 'wave', 'type', 'handshake', 'cheer', 'think', 'sit'];

const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <line x1={0} y1={430} x2={1920} y2={430} stroke={C.line} />
        <line x1={0} y1={900} x2={1920} y2={900} stroke={C.line} />
        {POSES.map((p, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <g key={p}>
              <Person
                x={260 + col * 460}
                y={row === 0 ? 430 : 900}
                scale={1.5}
                look={LOOKS[i % LOOKS.length]}
                pose={p}
                t={t}
                phase={i * 0.13}
              />
              <text
                x={260 + col * 460}
                y={(row === 0 ? 430 : 900) + 44}
                textAnchor="middle"
                fontSize={26}
                fill={C.muted}
                fontFamily="monospace"
              >
                {p}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Probe" component={Sheet} durationInFrames={60} fps={30} width={1920} height={1080} />
);

registerRoot(Root);
