import React from 'react';

/** Minimal line icons — drawn, not emoji, so nothing reads as generic. */

type IconProps = { size?: number; color: string; strokeWidth?: number };

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconPeople: React.FC<IconProps> = ({ size = 30, color, strokeWidth = 1.8 }) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17 14.2c2.3.5 4 2.4 4 4.8" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 30, color, strokeWidth = 1.8 }) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3.5v3M16 3.5v3" />
    <path d="M12 13.2v3.3M10.3 14.9h3.4" />
  </svg>
);

export const IconHeart: React.FC<IconProps> = ({ size = 30, color, strokeWidth = 1.8 }) => (
  <svg {...base(size)} stroke={color} strokeWidth={strokeWidth}>
    <path d="M12 20.5S3.8 15.4 3.8 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.2 2.4c0 6-8.2 11.1-8.2 11.1Z" />
    <path d="M7.5 11.5h2l1-2 1.6 3.3 1-1.3h2.9" />
  </svg>
);

export const ICONS = {
  people: IconPeople,
  calendar: IconCalendar,
  heart: IconHeart,
} as const;

export type IconKey = keyof typeof ICONS;

/** Three overlapping circles — a small "people" logo mark. */
export const BrandMark: React.FC<{ size?: number; primary: string; spark: string }> = ({
  size = 34,
  primary,
  spark,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="14" cy="16" r="7.5" stroke={primary} strokeWidth="2.4" />
    <circle cx="26" cy="16" r="7.5" stroke={primary} strokeWidth="2.4" />
    <circle cx="20" cy="25" r="7.5" fill={spark} />
  </svg>
);
