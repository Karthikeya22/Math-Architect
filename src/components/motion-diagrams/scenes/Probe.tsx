import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

const HEIGHTS = [40, 62, 18, 54, 34];
const GAP = 2;
const LABELS = ['NSO', 'FR', '?', 'GEO', 'DP'];
const COLORS = ['#38bdf8', '#4f46e5', '#e11d48', '#059669', '#ea580c'];

/** Loading analysis: skill strip with a missing gap + loupe. */
const Probe: React.FC = () => {
  const { enter, x: px, y: py, play, reduceMotion } = useDiagramMotion();
  const base = useParallax(0.35, 8);
  const bars = useParallax(0.75, 11);
  const loupe = useParallax(1.2, 16);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 4).toFixed(2)}deg) rotateY(${(xv * 6).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);
  const loupeX = useTransform(px, [-1, 1], [110, 190]);

  return (
    <motion.svg viewBox="0 0 280 224" width="100%" height="100%" style={{ transform: rotate, opacity }} aria-hidden>
      <defs>
        <linearGradient id="probe-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
        <filter id="probe-lift" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#92400e" floodOpacity="0.18" />
        </filter>
      </defs>

      <motion.g style={{ x: base.x, y: base.y }}>
        <ellipse cx="140" cy="206" rx="100" ry="12" fill="#b45309" opacity="0.12" />
        <rect x="28" y="44" width="224" height="140" rx="18" fill="url(#probe-panel)" stroke="#fbbf24" strokeWidth="1.6" />
        <text x="44" y="68" fill="#92400e" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">
          Finding gaps…
        </text>
        <line x1="44" y1="168" x2="236" y2="168" stroke="#fdba74" strokeWidth="3" strokeLinecap="round" />
      </motion.g>

      <motion.g style={{ x: bars.x, y: bars.y }} filter="url(#probe-lift)">
        {HEIGHTS.map((h, i) => {
          const x = 48 + i * 40;
          const isGap = i === GAP;
          return (
            <g key={i}>
              {isGap ? (
                <rect
                  x={x}
                  y={168 - 28}
                  width={28}
                  height={28}
                  rx="8"
                  fill="#fff1f2"
                  stroke="#e11d48"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              ) : (
                <rect x={x} y={168 - h} width={28} height={h} rx="8" fill={COLORS[i]} />
              )}
              <text
                x={x + 14}
                y={184}
                textAnchor="middle"
                fill={isGap ? '#be123c' : '#78350f'}
                fontSize="8"
                fontWeight="700"
                fontFamily="system-ui,sans-serif"
              >
                {LABELS[i]}
              </text>
            </g>
          );
        })}
      </motion.g>

      <motion.g
        style={{ x: play && !reduceMotion ? loupeX : loupe.x, y: loupe.y }}
        filter="url(#probe-lift)"
      >
        <circle cx="0" cy="118" r="24" fill="rgba(255,255,255,0.7)" stroke="#b45309" strokeWidth="3" />
        <circle cx="0" cy="118" r="14" fill="none" stroke="#d97706" strokeWidth="2" />
        <line x1="16" y1="134" x2="32" y2="152" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
};

export default Probe;
