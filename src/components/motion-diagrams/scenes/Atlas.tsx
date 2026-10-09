import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useDiagramMotion, useParallax } from '../Stage';

/**
 * Auth hero: readable product story — pin a standard → quiz → find the gap → open slides.
 * Solid fills + multi-hue (not monochrome outline lattice).
 */
const Atlas: React.FC = () => {
  const { enter, x: px, y: py, reduceMotion } = useDiagramMotion();
  const back = useParallax(0.3, 7);
  const mid = useParallax(0.65, 11);
  const fore = useParallax(1.1, 15);

  const rotate = useTransform([px, py], ([x, y]) => {
    const xv = typeof x === 'number' ? x : 0;
    const yv = typeof y === 'number' ? y : 0;
    return `perspective(780px) rotateX(${(-yv * 5).toFixed(2)}deg) rotateY(${(xv * 7).toFixed(2)}deg)`;
  });
  const opacity = useTransform(enter, [0, 1], [0, 1]);
  const rise = useTransform(enter, [0, 1], [22, 0]);

  return (
    <motion.svg
      viewBox="0 0 320 248"
      width="100%"
      height="100%"
      style={{ transform: rotate, opacity, y: rise, transformOrigin: '50% 55%' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="atlas-desk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="55%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="atlas-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2ff" />
        </linearGradient>
        <linearGradient id="atlas-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="atlas-quiz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="atlas-gap" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="atlas-slide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="atlas-lift" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#312e81" floodOpacity="0.18" />
        </filter>
        <filter id="atlas-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1e1b4b" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Desk / workspace */}
      <motion.g style={{ x: back.x, y: back.y }}>
        <ellipse cx="160" cy="214" rx="118" ry="16" fill="#4338ca" opacity="0.1" />
        <path
          d="M28 168 L160 128 L292 168 L160 208 Z"
          fill="url(#atlas-desk)"
          stroke="#a5b4fc"
          strokeWidth="1.5"
        />
        <path d="M28 168 L28 186 L160 226 L160 208 Z" fill="#a5b4fc" opacity="0.55" />
        <path d="M292 168 L292 186 L160 226 L160 208 Z" fill="#c4b5fd" opacity="0.45" />
      </motion.g>

      {/* Quiz sheet stack (left-back) */}
      <motion.g style={{ x: mid.x, y: mid.y }} filter="url(#atlas-soft)">
        <rect x="42" y="98" width="92" height="70" rx="10" fill="#dbeafe" stroke="#38bdf8" strokeWidth="1.4" transform="rotate(-8 88 133)" />
        <rect x="50" y="92" width="92" height="70" rx="10" fill="#fff" stroke="#7dd3fc" strokeWidth="1.4" transform="rotate(-4 96 127)" />
        <rect x="56" y="84" width="96" height="74" rx="11" fill="url(#atlas-quiz)" stroke="#059669" strokeWidth="2" />
        <rect x="68" y="98" width="52" height="6" rx="3" fill="#6ee7b7" />
        <rect x="68" y="110" width="40" height="6" rx="3" fill="#a7f3d0" />
        <circle cx="72" cy="128" r="5" fill="#34d399" />
        <circle cx="88" cy="128" r="5" fill="none" stroke="#34d399" strokeWidth="2" />
        <circle cx="104" cy="128" r="5" fill="none" stroke="#a7f3d0" strokeWidth="2" />
        <text x="68" y="148" fill="#047857" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
          Quiz
        </text>
      </motion.g>

      {/* Pinned standard card (center-front) */}
      <motion.g style={{ x: fore.x, y: fore.y }} filter="url(#atlas-lift)">
        <rect x="108" y="36" width="118" height="102" rx="14" fill="url(#atlas-card)" stroke="#4f46e5" strokeWidth="2.4" />
        <text x="122" y="56" fill="#4338ca" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif">
          MA.4.FR.1.1
        </text>
        <rect x="122" y="64" width="90" height="8" rx="4" fill="#c7d2fe" />
        <rect x="122" y="78" width="68" height="6" rx="3" fill="#e0e7ff" />
        <rect x="122" y="92" width="78" height="6" rx="3" fill="#e0e7ff" />
        <rect x="122" y="108" width="64" height="18" rx="9" fill="url(#atlas-pin)" />
        <text x="132" y="120" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
          Pin standard
        </text>
        {/* Pin head */}
        <motion.g
          animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
          transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="167" cy="34" r="14" fill="url(#atlas-pin)" />
          <circle cx="167" cy="34" r="5.5" fill="#fff" />
          <path d="M167 48 L167 56" stroke="#312e81" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </motion.g>

      {/* Gap bars (right) */}
      <motion.g style={{ x: mid.x, y: mid.y }} filter="url(#atlas-soft)">
        <rect x="214" y="88" width="78" height="72" rx="12" fill="#fff1f2" stroke="#fb7185" strokeWidth="1.6" />
        <rect x="226" y="128" width="12" height="22" rx="4" fill="#fda4af" />
        <rect x="242" y="112" width="12" height="38" rx="4" fill="url(#atlas-gap)" />
        <rect
          x="258"
          y="132"
          width="12"
          height="18"
          rx="4"
          fill="none"
          stroke="#e11d48"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <rect x="274" y="120" width="12" height="30" rx="4" fill="#fb7185" opacity="0.85" />
        <text x="228" y="84" fill="#be123c" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">
          Gaps
        </text>
      </motion.g>

      {/* Remedial slide peek */}
      <motion.g
        style={{ x: fore.x, y: fore.y }}
        animate={reduceMotion ? undefined : { rotate: [-2, 2, -2] }}
        transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        filter="url(#atlas-soft)"
      >
        <rect
          x="198"
          y="48"
          width="72"
          height="52"
          rx="10"
          fill="url(#atlas-slide)"
          stroke="#0369a1"
          strokeWidth="1.5"
          transform="rotate(12 234 74)"
        />
        <rect x="214" y="62" width="36" height="5" rx="2.5" fill="#e0f2fe" transform="rotate(12 232 64)" />
        <rect x="214" y="72" width="28" height="5" rx="2.5" fill="#bae6fd" transform="rotate(12 228 74)" />
        <text x="208" y="118" fill="#0369a1" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif" transform="rotate(12 220 118)">
          Slides
        </text>
      </motion.g>

      {/* Flow legend */}
      <motion.g style={{ x: back.x, y: back.y }}>
        <text x="70" y="200" fill="#475569" fontSize="9" fontWeight="600" fontFamily="system-ui,sans-serif">
          Pin → Quiz → Gaps → Slides
        </text>
      </motion.g>
    </motion.svg>
  );
};

export default Atlas;
