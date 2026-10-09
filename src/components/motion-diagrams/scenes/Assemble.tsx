import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

/** Loading quiz: clipboard + question cards seating into place. */
const Assemble: React.FC = () => {
  const { enter, x: px, y: py, play, reduceMotion } = useDiagramMotion();
  const board = useParallax(0.35, 8);
  const cards = useParallax(0.95, 12);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 6).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);

  const cardColors = [
    { fill: '#ecfdf5', stroke: '#059669', label: 'Q1' },
    { fill: '#eff6ff', stroke: '#2563eb', label: 'Q2' },
    { fill: '#fff7ed', stroke: '#ea580c', label: 'Q3' },
    { fill: '#fdf4ff', stroke: '#a855f7', label: 'Q4' },
  ];

  return (
    <motion.svg viewBox="0 0 280 224" width="100%" height="100%" style={{ transform: rotate, opacity }} aria-hidden>
      <defs>
        <linearGradient id="asm-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#ccfbf1" />
        </linearGradient>
        <filter id="asm-lift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#115e59" floodOpacity="0.18" />
        </filter>
      </defs>

      <motion.g style={{ x: board.x, y: board.y }}>
        <ellipse cx="140" cy="206" rx="96" ry="12" fill="#0f766e" opacity="0.12" />
        <rect x="36" y="40" width="208" height="152" rx="18" fill="url(#asm-board)" stroke="#2dd4bf" strokeWidth="1.6" />
        <rect x="52" y="28" width="72" height="22" rx="8" fill="#0d9488" />
        <text x="62" y="43" fill="#fff" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif">
          Building quiz
        </text>
        <rect x="52" y="58" width="176" height="118" rx="12" fill="#fff" stroke="#5eead4" strokeWidth="1.4" />
      </motion.g>

      <motion.g style={{ x: cards.x, y: cards.y }} filter="url(#asm-lift)">
        {cardColors.map((c, i) => (
          <motion.g
            key={c.label}
            animate={
              play && !reduceMotion
                ? { y: [0, -5, 0] }
                : undefined
            }
            transition={
              play && !reduceMotion
                ? { duration: 2.2, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          >
            <rect
              x={66}
              y={68 + i * 22}
              width={148}
              height={40}
              rx="10"
              fill={c.fill}
              stroke={c.stroke}
              strokeWidth={i === 3 ? 2.2 : 1.5}
            />
            <circle cx="82" cy={88 + i * 22} r="8" fill={c.stroke} />
            <text
              x="82"
              y={91 + i * 22}
              textAnchor="middle"
              fill="#fff"
              fontSize="7"
              fontWeight="700"
              fontFamily="system-ui,sans-serif"
            >
              {c.label}
            </text>
            <rect x="98" y={80 + i * 22} width="90" height="6" rx="3" fill="#fff" opacity={0.85} />
            <rect x="98" y={92 + i * 22} width="64" height="5" rx="2.5" fill="#fff" opacity={0.65} />
          </motion.g>
        ))}
      </motion.g>
    </motion.svg>
  );
};

export default Assemble;
