import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

/** Studio: pinned Florida standard over a stack of quiz sheets. */
const Pin: React.FC = () => {
  const { enter, x: px, y: py, reduceMotion } = useDiagramMotion();
  const back = useParallax(0.35, 8);
  const mid = useParallax(0.7, 11);
  const front = useParallax(1.15, 15);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 7).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);
  const rise = useTransform(enter, [0, 1], [16, 0]);

  return (
    <motion.svg
      viewBox="0 0 280 224"
      width="100%"
      height="100%"
      style={{ transform: rotate, opacity, y: rise, transformOrigin: '50% 55%' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="pin-desk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="pin-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="pin-sheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
        <filter id="pin-lift" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#4c1d95" floodOpacity="0.2" />
        </filter>
      </defs>

      <motion.g style={{ x: back.x, y: back.y }}>
        <ellipse cx="140" cy="204" rx="100" ry="14" fill="#6d28d9" opacity="0.12" />
        <path d="M32 170 L140 140 L248 170 L140 200 Z" fill="url(#pin-desk)" stroke="#c4b5fd" strokeWidth="1.4" />
      </motion.g>

      <motion.g style={{ x: mid.x, y: mid.y }}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={48 + i * 10}
              y={108 + i * 7}
              width={132}
              height={68}
              rx="11"
              fill={i === 2 ? 'url(#pin-sheet)' : i === 1 ? '#dbeafe' : '#fce7f3'}
              stroke={i === 2 ? '#059669' : i === 1 ? '#38bdf8' : '#f472b6'}
              strokeWidth="1.6"
              transform={`rotate(${-7 + i * 4} ${114 + i * 10} ${142 + i * 7})`}
            />
          </g>
        ))}
        <text x="62" y="188" fill="#047857" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
          Quiz sheets
        </text>
      </motion.g>

      <motion.g style={{ x: front.x, y: front.y }} filter="url(#pin-lift)">
        <rect x="86" y="36" width="128" height="100" rx="14" fill="#fff" stroke="#7c3aed" strokeWidth="2.4" />
        <text x="100" y="58" fill="#5b21b6" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">
          MA.5.NSO.1.2
        </text>
        <rect x="100" y="68" width="96" height="8" rx="4" fill="#ddd6fe" />
        <rect x="100" y="84" width="72" height="7" rx="3.5" fill="#ede9fe" />
        <rect x="100" y="100" width="84" height="7" rx="3.5" fill="#ede9fe" />
        <rect x="100" y="114" width="58" height="14" rx="7" fill="url(#pin-head)" />
        <text x="110" y="124" fill="#fff" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">
          Pinned
        </text>
        <motion.g
          animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
          transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="150" cy="32" r="13" fill="url(#pin-head)" />
          <circle cx="150" cy="32" r="5" fill="#fff" />
          <path d="M150 45 L150 52" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
};

export default Pin;
