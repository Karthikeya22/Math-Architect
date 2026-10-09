import React from 'react';

type Props = {
  /** Compact lockup for the sign-in card. The header and story panel use the default size. */
  size?: 'default' | 'compact';
};

const INK = '#312e81';
const FRONT = '#eef0ff';
const SIDE = '#e0e3fb';
const TOP = '#c7d2fe';
const LIT = '#4f46e5';

export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    stroke={INK}
    strokeWidth={1.5}
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <g className="brand-lift">
      <path d="M31.65 26.72 L26.29 29.82 L26.29 11.27 L31.65 8.17 Z" fill={SIDE} />
      <path d="M19.06 25.64 L26.29 29.82 L26.29 11.27 L19.06 7.09 Z" fill={FRONT} />
      <path className="brand-lit" d="M24.42 4.00 L31.65 8.17 L26.29 11.27 L19.06 7.09 Z" fill={LIT} />
    </g>
    <path d="M26.29 29.82 L20.94 32.91 L20.94 20.54 L26.29 17.45 Z" fill={SIDE} />
    <path d="M13.71 28.73 L20.94 32.91 L20.94 20.54 L13.71 16.37 Z" fill={FRONT} />
    <path d="M19.06 13.28 L26.29 17.45 L20.94 20.54 L13.71 16.37 Z" fill={TOP} />
    <path d="M20.94 32.91 L15.58 36.00 L15.58 29.82 L20.94 26.72 Z" fill={SIDE} />
    <path d="M8.35 31.83 L15.58 36.00 L15.58 29.82 L8.35 25.64 Z" fill={FRONT} />
    <path d="M13.71 22.55 L20.94 26.72 L15.58 29.82 L8.35 25.64 Z" fill={TOP} />
  </svg>
);

const BrandMark: React.FC<Props> = ({ size = 'default' }) => (
  <span className={`brand-lockup ${size === 'compact' ? 'brand-lockup--compact' : ''}`}>
    <span className="brand-mark">
      <LogoMark />
    </span>
    <span className="brand-word">
      <span className="brand-word-strong">Math</span> <span className="brand-word-soft">Architect</span>
    </span>
  </span>
);

export default BrandMark;
