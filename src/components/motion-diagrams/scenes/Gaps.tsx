import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

const HEIGHTS = [46, 68, 16, 56, 38];
const GAP = 2;
const LABELS = ['Place', 'Fractions', 'Gap', 'Geometry', 'Data'];
const COLORS = ['#38bdf8', '#4f46e5', '#e11d48', '#059669', '#ea580c'];

/** Gap analysis: skill bars with one recessed notch. */
const Gaps: React.FC = () => {
  const { enter, x: px, y: py, reduceMotion } = useDiagramMotion();
  const base = useParallax(0.4, 8);
  const bars = useParallax(0.95, 12);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 7).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);

  return (
    <motion.svg viewBox="0 0 280 224" width="100%" height="100%" style={{ transform: rotate, opacity }} aria-hidden>
      <defs>
        <linearGradient id="gaps-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe4e6" />
          <stop offset="100%" stopColor="#fce7f3" />
        </linearGradient>
        <linearGradient id="gaps-hi" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <filter id="gaps-lift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#9f1239" floodOpacity="0.18" />
        </filter>
      </defs>

      <motion.g style={{ x: base.x, y: base.y }}>
        <ellipse cx="140" cy="206" rx="100" ry="12" fill="#be123c" opacity="0.12" />
        <rect x="28" y="40" width="224" height="148" rx="18" fill="url(#gaps-panel)" stroke="#fda4af" strokeWidth="1.6" />
        <text x="44" y="64" fill="#9f1239" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
          Diagnosed gaps
        </text>
        <line x1="44" y1="168" x2="236" y2="168" stroke="#fecdd3" strokeWidth="3" strokeLinecap="round" />
      </motion.g>

      <motion.g style={{ x: bars.x, y: bars.y }} filter="url(#gaps-lift)">
        {HEIGHTS.map((h, i) => {
          const x = 44 + i * 42;
          const isGap = i === GAP;
          return (
            <motion.g
              key={i}
              animate={
                !reduceMotion && isGap
                  ? { opacity: [1, 0.65, 1] }
                  : undefined
              }
              transition={
                !reduceMotion && isGap
                  ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              <rect
                x={x}
                y={168 - (isGap ? 20 : h)}
                width={30}
                height={isGap ? 20 : h}
                rx="9"
                fill={isGap ? '#fff' : COLORS[i]}
                stroke={isGap ? '#e11d48' : 'none'}
                strokeWidth={isGap ? 2.4 : 0}
                strokeDasharray={isGap ? '4 3' : undefined}
              />
              <text
                x={x + 15}
                y={186}
                textAnchor="middle"
                fill={isGap ? '#be123c' : '#881337'}
                fontSize="7"
                fontWeight="700"
                fontFamily="system-ui,sans-serif"
              >
                {LABELS[i]}
              </text>
            </motion.g>
          );
        })}
      </motion.g>
    </motion.svg>
  );
};

export default Gaps;
