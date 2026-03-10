import { motion } from 'framer-motion';

export function Mascot({ size = 120, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
    >
      {/* Grid background detail */}
      <line x1="20" y1="0" x2="20" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="60" y1="0" x2="60" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="100" y1="0" x2="100" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="0" y1="40" x2="120" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="0" y1="80" x2="120" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

      {/* Cursor body — angular pointer arrow */}
      <motion.path
        d="M 30 16 L 30 90 L 46 72 L 68 98 L 78 90 L 56 64 L 80 64 Z"
        stroke="#4ade80"
        strokeWidth="2.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
        fill="rgba(74,222,128,0.08)"
        animate={animate ? {
          filter: ['drop-shadow(0 0 4px rgba(74,222,128,0.3))', 'drop-shadow(0 0 8px rgba(74,222,128,0.6))', 'drop-shadow(0 0 4px rgba(74,222,128,0.3))'],
        } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Left eye */}
      <motion.circle
        cx="38"
        cy="52"
        r="2.5"
        fill="#4ade80"
        animate={animate ? {
          r: [2.5, 1, 2.5],
          opacity: [1, 0.6, 1],
        } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Right eye */}
      <motion.circle
        cx="48"
        cy="52"
        r="2.5"
        fill="#4ade80"
        animate={animate ? {
          r: [2.5, 1, 2.5],
          opacity: [1, 0.6, 1],
        } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      {/* Click spark lines — radiating from tip */}
      <motion.g
        animate={animate ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
      >
        <line x1="26" y1="12" x2="22" y2="4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="square" />
        <line x1="30" y1="12" x2="30" y2="2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="square" />
        <line x1="34" y1="14" x2="40" y2="6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="square" />
      </motion.g>

      {/* Crosshair target around click point */}
      <motion.g
        animate={animate ? { opacity: [0.2, 0.5, 0.2], rotate: [0, 90, 0] } : { opacity: 0.2 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '30px 16px' }}
      >
        <circle cx="30" cy="16" r="8" stroke="rgba(74,222,128,0.3)" strokeWidth="0.75" strokeDasharray="2 2" fill="none" />
      </motion.g>

      {/* Small coordinate label */}
      <text x="86" y="110" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="'JetBrains Mono', monospace">
        x:30 y:16
      </text>
    </motion.svg>
  );
}
