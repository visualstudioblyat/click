import { motion } from 'framer-motion';
import { Card } from './Card';
import { BigNumber } from './BigNumber';
import { useClickStore } from '../store/clickStore';

export function EntropyGauge() {
  const entropy = useClickStore((s) => s.telemetry.entropy);

  // Entropy 0-1 mapped to gauge angle (-135 to 135 degrees)
  const angle = -135 + entropy * 270;
  const quality =
    entropy < 0.3 ? 'PREDICTABLE' :
    entropy < 0.5 ? 'STRUCTURED' :
    entropy < 0.7 ? 'BALANCED' :
    entropy < 0.85 ? 'CHAOTIC' :
    'MAXIMUM ENTROPY';
  const color =
    entropy < 0.3 ? 'var(--red)' :
    entropy < 0.7 ? 'var(--green)' :
    'var(--amber)';

  return (
    <Card label="[SHANNON ENTROPY]" delay={0.2} span="entropy">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        {/* Gauge */}
        <svg width="120" height="70" viewBox="0 0 120 70">
          {/* Track */}
          <path
            d="M 15 65 A 50 50 0 0 1 105 65"
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <motion.path
            d="M 15 65 A 50 50 0 0 1 105 65"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: entropy }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
          {/* Needle */}
          <motion.line
            x1="60"
            y1="65"
            x2="60"
            y2="22"
            stroke="var(--text-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transformOrigin: '60px 65px' }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
          />
          {/* Center dot */}
          <circle cx="60" cy="65" r="3" fill="var(--text-primary)" />

          {/* Scale labels */}
          <text x="10" y="68" fill="var(--text-tertiary)" fontSize="7" fontFamily="var(--font-mono)">0</text>
          <text x="56" y="10" fill="var(--text-tertiary)" fontSize="7" fontFamily="var(--font-mono)">0.5</text>
          <text x="103" y="68" fill="var(--text-tertiary)" fontSize="7" fontFamily="var(--font-mono)">1</text>
        </svg>

        <BigNumber value={entropy} decimals={3} suffix=" bits" />

        <motion.div
          className="badge"
          style={{
            background: color === 'var(--green)' ? 'var(--green-dim)' :
                        color === 'var(--red)' ? 'var(--red-dim)' : 'var(--amber-dim)',
            color,
            fontSize: 9,
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {quality}
        </motion.div>
      </div>
    </Card>
  );
}
