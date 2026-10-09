import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

/** Remedial: lesson board with fraction bar + slide. */
const Lesson: React.FC = () => {
  const { enter, x: px, y: py, reduceMotion } = useDiagramMotion();
  const board = useParallax(0.35, 8);
  const slide = useParallax(0.7, 11);
  const bar = useParallax(1.05, 14);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 6).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);

  const parts = [
    '#4f46e5',
    '#6366f1',
    '#818cf8',
    '#a5b4fc',
    '#e0e7ff',
    '#e0e7ff',
  ];

  return (
    <motion.svg viewBox="0 0 280 224" width="100%" height="100%" style={{ transform: rotate, opacity }} aria-hidden>
      <defs>
        <linearGradient id="les-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="les-slide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="les-lift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#065f46" floodOpacity="0.18" />
        </filter>
      </defs>

      <motion.g style={{ x: board.x, y: board.y }}>
        <ellipse cx="140" cy="206" rx="100" ry="12" fill="#047857" opacity="0.12" />
        <rect x="28" y="36" width="224" height="156" rx="18" fill="url(#les-board)" stroke="#6ee7b7" strokeWidth="1.6" />
        <text x="44" y="58" fill="#065f46" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
          Remedial lesson
        </text>
      </motion.g>

      <motion.g
        style={{ x: slide.x, y: slide.y }}
        filter="url(#les-lift)"
        animate={reduceMotion ? undefined : { rotate: [-3, 2, -3] }}
        transition={reduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect
          x="150"
          y="48"
          width="88"
          height="64"
          rx="12"
          fill="url(#les-slide)"
          stroke="#047857"
          strokeWidth="1.6"
          transform="rotate(-8 194 80)"
        />
        <text x="168" y="78" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif" transform="rotate(-8 180 78)">
          Slide
        </text>
      </motion.g>

      <motion.g style={{ x: bar.x, y: bar.y }} filter="url(#les-lift)">
        <rect x="44" y="128" width="192" height="52" rx="14" fill="#fff" stroke="#059669" strokeWidth="2" />
        <text x="56" y="148" fill="#047857" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif">
          4 / 6 shaded
        </text>
        {parts.map((color, i) => (
          <rect
            key={i}
            x={56 + i * 28}
            y={156}
            width={24}
            height={16}
            rx="4"
            fill={color}
            stroke="#047857"
            strokeWidth="1"
          />
        ))}
      </motion.g>
    </motion.svg>
  );
};

export default Lesson;
