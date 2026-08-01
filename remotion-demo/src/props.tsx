import React from 'react';
import { C } from './theme';

/** אביזרי סביבה וקטוריים — נבנים בתוך אותו מרחב SVG של הסצנה. */

export const Desk: React.FC<{ x: number; y: number; w?: number; scale?: number }> = ({
  x,
  y,
  w = 260,
  scale = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-w / 2} y={0} width={w} height={12} rx={4} fill={C.sand} />
    <rect x={-w / 2 + 14} y={12} width={10} height={64} rx={3} fill={C.muted} opacity={0.75} />
    <rect x={w / 2 - 24} y={12} width={10} height={64} rx={3} fill={C.muted} opacity={0.75} />
  </g>
);

export const Monitor: React.FC<{ x: number; y: number; scale?: number; on?: string }> = ({
  x,
  y,
  scale = 1,
  on = C.sky,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-46} y={-64} width={92} height={58} rx={6} fill={C.ink} />
    <rect x={-41} y={-59} width={82} height={48} rx={3} fill={on} />
    <rect x={-6} y={-6} width={12} height={12} fill={C.ink} />
    <rect x={-22} y={4} width={44} height={6} rx={3} fill={C.ink} />
  </g>
);

export const Plant: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-16 0 L-12 -34 L12 -34 L16 0 Z" fill={C.clay} opacity={0.9} />
    <path d="M0 -34 Q-4 -66 -22 -78 Q-6 -80 0 -56 Q6 -80 22 -78 Q4 -66 0 -34 Z" fill={C.green} />
    <path d="M0 -40 Q-2 -62 -14 -72 Q-2 -70 0 -50 Z" fill={C.greenLight} />
  </g>
);

export const Chair: React.FC<{ x: number; y: number; scale?: number; flip?: boolean }> = ({
  x,
  y,
  scale = 1,
  flip = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale * (flip ? -1 : 1)} ${scale})`}>
    <rect x={-24} y={-52} width={12} height={54} rx={5} fill={C.inkSoft} opacity={0.85} />
    <rect x={-26} y={0} width={52} height={10} rx={4} fill={C.inkSoft} opacity={0.85} />
    <rect x={-4} y={10} width={8} height={26} fill={C.muted} />
    <rect x={-20} y={36} width={40} height={7} rx={3} fill={C.muted} />
  </g>
);

export const CoffeeCup: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-9 -16 L-7 0 L7 0 L9 -16 Z" fill={C.white} stroke={C.line} />
    <rect x={-10} y={-19} width={20} height={4} rx={2} fill={C.clay} />
  </g>
);

/** דף נייר מרחף — משמש לסצנת העומס. */
export const PaperSheet: React.FC<{
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  opacity?: number;
  lines?: number;
}> = ({ x, y, rot = 0, scale = 1, opacity = 1, lines = 4 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
    <rect x={-26} y={-34} width={52} height={68} rx={3} fill={C.white} stroke={C.line} />
    {Array.from({ length: lines }).map((_, i) => (
      <rect
        key={i}
        x={-18}
        y={-22 + i * 12}
        width={i % 2 === 0 ? 36 : 26}
        height={4}
        rx={2}
        fill={C.muted}
        opacity={0.5}
      />
    ))}
  </g>
);

/** בניין לרקע עירוני. */
export const Building: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  windows?: boolean;
  lit?: string;
}> = ({ x, y, w, h, fill = C.sand, windows = true, lit = C.paperWarm }) => {
  const cols = Math.max(1, Math.floor(w / 26));
  const rows = Math.max(1, Math.floor(h / 34));
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-h} width={w} height={h} rx={3} fill={fill} />
      {windows &&
        Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const on = (r * 7 + c * 3) % 4 !== 0;
            return (
              <rect
                key={`${r}-${c}`}
                x={10 + c * 26}
                y={-h + 16 + r * 34}
                width={12}
                height={16}
                rx={1.5}
                fill={on ? lit : C.inkSoft}
                opacity={on ? 0.9 : 0.25}
              />
            );
          }),
        )}
    </g>
  );
};

/** כרטיס ממשק מרחף — לסצנת הפלטפורמה. */
export const UICard: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  accent?: string;
  scale?: number;
  opacity?: number;
  rows?: number;
  children?: React.ReactNode;
}> = ({ x, y, w = 150, h = 96, accent = C.green, scale = 1, opacity = 1, rows = 3, children }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={C.white} stroke={C.line} />
    <rect x={-w / 2 + 14} y={-h / 2 + 14} width={30} height={7} rx={3.5} fill={accent} />
    {Array.from({ length: rows }).map((_, i) => (
      <rect
        key={i}
        x={-w / 2 + 14}
        y={-h / 2 + 32 + i * 15}
        width={w - 28 - (i % 2) * 30}
        height={7}
        rx={3.5}
        fill={C.muted}
        opacity={0.35}
      />
    ))}
    {children}
  </g>
);

/** וי-סימון במעגל. */
export const CheckBadge: React.FC<{ x: number; y: number; scale?: number; color?: string; progress?: number }> = ({
  x,
  y,
  scale = 1,
  color = C.green,
  progress = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cx={0} cy={0} r={17} fill={color} />
    <path
      d="M-8 0 L-2 6 L9 -6"
      stroke={C.white}
      strokeWidth={3.4}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={26}
      strokeDashoffset={26 * (1 - progress)}
    />
  </g>
);
