import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

/** Empty question: blank problem card + chalk question mark. */
const Blank: React.FC = () => {
  const { enter, x: px, y: py, reduceMotion } = useDiagramMotion();
  const card = useParallax(0.5, 10);
  const mark = useParallax(1.15, 16);
  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(700px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 7).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);
  const lean = useTransform(px, [-1, 1], [-14, 14]);

  return (
    <motion.svg viewBox="0 0 280 224" width="100%" height="100%" style={{ transform: rotate, opacity }} aria-hidden>
      <defs>
        <linearGradient id="blank-desk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#fce7f3" />
        </linearGradient>
        <linearGradient id="blank-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <filter id="blank-lift" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#312e81" floodOpacity="0.18" />
        </filter>
      </defs>

      <motion.g style={{ x: card.x, y: card.y }}>
        <ellipse cx="140" cy="206" rx="96" ry="12" fill="#4338ca" opacity="0.12" />
        <path d="M36 176 L140 150 L244 176 L140 202 Z" fill="url(#blank-desk)" stroke="#c7d2fe" strokeWidth="1.4" />
      </motion.g>

      <motion.g style={{ x: card.x, y: card.y }} filter="url(#blank-lift)">
        <rect x="48" y="36" width="184" height="140" rx="18" fill="#fff" stroke="#6366f1" strokeWidth="2.2" />
        <text x="64" y="58" fill="#4338ca" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">
          Question missing
        </text>
        <rect x="64" y="70" width="120" height="8" rx="4" fill="#e0e7ff" />
        <rect x="64" y="88" width="96" height="7" rx="3.5" fill="#e0e7ff" />
        <rect x="64" y="104" width="108" height="7" rx="3.5" fill="#eef2ff" />
        <rect
          x="64"
          y="128"
          width="152"
          height="34"
          rx="12"
          fill="#eef2ff"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <text x="88" y="150" fill="#6366f1" fontSize="9" fontWeight="600" fontFamily="system-ui,sans-serif">
          Answer box empty
        </text>
      </motion.g>

      <motion.g
        style={{ x: mark.x, y: mark.y, rotate: lean, transformOrigin: '208px 78px' }}
        animate={reduceMotion ? undefined : { rotate: [-8, 8, -8] }}
        transition={reduceMotion ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M196 42 C218 42 230 56 230 72 C230 92 210 98 204 112 L204 122"
          fill="none"
          stroke="url(#blank-mark)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="204" cy="140" r="7" fill="#4f46e5" />
      </motion.g>
    </motion.svg>
  );
};

export default Blank;
