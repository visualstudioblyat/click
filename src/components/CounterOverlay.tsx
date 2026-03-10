import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';
import { formatDuration } from '../lib/format';

export function CounterOverlay() {
  const { status, telemetry } = useClickStore(
    useShallow((s) => ({
      status: s.status,
      telemetry: s.telemetry,
    })),
  );

  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const isRunning = status === 'running';

  return (
    <Card label="[COUNTER]" delay={0.3} span="counter">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '8px 0',
        }}
      >
        {/* Total clicks - big number */}
        <motion.div
          className="mono"
          animate={{
            textShadow: isRunning
              ? ['0 0 8px rgba(74,222,128,0.6)', '0 0 20px rgba(74,222,128,0.3)', '0 0 8px rgba(74,222,128,0.6)']
              : '0 0 0px transparent',
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -1,
            color: isRunning ? 'var(--green)' : 'var(--text)',
            lineHeight: 1,
          }}
        >
          {telemetry.total_clicks.toLocaleString()}
        </motion.div>

        {/* CPS */}
        <div
          className="mono text-secondary"
          style={{
            fontSize: 13,
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <span style={{ color: isRunning ? 'var(--green)' : 'var(--text-secondary)' }}>
            {telemetry.cps.toFixed(1)}
          </span>
          <span className="text-tertiary" style={{ fontSize: 9 }}>CPS</span>
        </div>

        {/* Session time */}
        <div className="mono text-tertiary" style={{ fontSize: 10 }}>
          {formatDuration(telemetry.session_duration_ms)}
        </div>

        {/* Always on top toggle */}
        <motion.button
          className={`btn ${alwaysOnTop ? 'btn-green' : ''}`}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAlwaysOnTop(!alwaysOnTop)}
          style={{
            fontSize: 9,
            padding: '4px 12px',
            marginTop: 4,
          }}
        >
          {alwaysOnTop ? 'PINNED' : 'ALWAYS ON TOP'}
        </motion.button>
      </div>
    </Card>
  );
}
