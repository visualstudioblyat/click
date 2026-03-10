import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';
import { formatDuration } from '../lib/format';

const IS_TAURI = '__TAURI_INTERNALS__' in window;

export function CounterOverlay() {
  const { status, telemetry } = useClickStore(
    useShallow((s) => ({
      status: s.status,
      telemetry: s.telemetry,
    })),
  );

  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const isRunning = status === 'running';

  const togglePin = async () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    if (IS_TAURI) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().setAlwaysOnTop(next).catch(() => {});
    }
  };

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
        <div
          className="mono"
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -1,
            color: isRunning ? 'var(--green)' : 'var(--text)',
            lineHeight: 1,
          }}
        >
          {telemetry.total_clicks.toLocaleString()}
        </div>

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
          onClick={togglePin}
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
