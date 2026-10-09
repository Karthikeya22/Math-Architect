import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

/** Loading slides: three colorful lesson cards fanning. */
const Deck: React.FC = () => {
  const { enter, x: px, y: py, play, reduceMotion } = useDiagramMotion();
  const tray = useParallax(0.35, 8);
  const slides = useParallax(0.95, 13);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 7).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);

  const cards = [
    { fill: '#e0f2fe', stroke: '#0284c7', title: 'Warm-up', rot: -14 },
    { fill: '#fff', stroke: '#2563eb', title: 'Model', rot: 0 },
    { fill: '#dbeafe', stroke: '#1d4ed8', title: 'Practice', rot: 14 },
  ];

  return (
    <motion.svg viewBox="0 0 280 224" width="100%" height="100%" style={{ transform: rotate, opacity }} aria-hidden>
      <defs>
        <linearGradient id="deck-tray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="deck-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="deck-lift" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#075985" floodOpacity="0.2" />
        </filter>
      </defs>

      <motion.g style={{ x: tray.x, y: tray.y }}>
        <ellipse cx="140" cy="206" rx="100" ry="12" fill="#0369a1" opacity="0.12" />
        <rect x="32" y="44" width="216" height="144" rx="18" fill="url(#deck-tray)" stroke="#7dd3fc" strokeWidth="1.6" />
        <text x="48" y="68" fill="#075985" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">
          Building slides…
        </text>
      </motion.g>

      <motion.g style={{ x: slides.x, y: slides.y }} filter="url(#deck-lift)">
        {cards.map((c, i) => (
          <motion.g
            key={c.title}
            animate={
              play && !reduceMotion
                ? { rotate: [c.rot - 2, c.rot + 2, c.rot - 2], y: [0, -4, 0] }
                : undefined
            }
            transition={
              play && !reduceMotion
                ? { duration: 2.6, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
            style={{ transformOrigin: '140px 120px' }}
          >
            <rect
              x={78 + i * 8}
              y={78 + i * 4}
              width={118}
              height={86}
              rx="14"
              fill={i === 1 ? '#fff' : c.fill}
              stroke={i === 1 ? '#0284c7' : c.stroke}
              strokeWidth={i === 1 ? 2.6 : 1.6}
              transform={`rotate(${c.rot} ${137 + i * 8} ${121 + i * 4})`}
            />
            {i === 1 && (
              <>
                <rect
                  x="94"
                  y="92"
                  width="70"
                  height="14"
                  rx="7"
                  fill="url(#deck-active)"
                  transform="rotate(0 129 99)"
                />
                <text x="104" y="102" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
                  {c.title}
                </text>
                <rect x="94" y="116" width="78" height="7" rx="3.5" fill="#bae6fd" />
                <rect x="94" y="130" width="58" height="7" rx="3.5" fill="#e0f2fe" />
              </>
            )}
            {i !== 1 && (
              <text
                x={96 + i * 8}
                y={120 + i * 4}
                fill={c.stroke}
                fontSize="9"
                fontWeight="700"
                fontFamily="system-ui,sans-serif"
                transform={`rotate(${c.rot} ${120 + i * 8} ${120 + i * 4})`}
              >
                {c.title}
              </text>
            )}
          </motion.g>
        ))}
      </motion.g>
    </motion.svg>
  );
};

export default Deck;
