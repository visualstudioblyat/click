import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

const inputStyle = {
  background: 'var(--bg)',
  border: '1px dashed var(--border-dashed)',
  color: 'var(--text)',
  padding: '4px 8px',
  fontSize: 11,
  outline: 'none',
} as const;

function msToHuman(ms: number): string {
  if (ms <= 0) return '= 0s';
  if (ms < 1000) return `= ${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `= ${s.toFixed(1)}s`;
  const m = s / 60;
  return `= ${m.toFixed(1)}m`;
}

export function SchedulePanel() {
  const { config, status, setConfig } = useClickStore(
    useShallow((s) => ({
      config: s.config,
      status: s.status,
      setConfig: s.setConfig,
    })),
  );

  const isRunning = status === 'running';
  const [countdown, setCountdown] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const startRef = useRef(0);

  // start delay countdown
  useEffect(() => {
    if (!isRunning || config.start_delay_ms <= 0) {
      setCountdown(0);
      return;
    }
    startRef.current = Date.now();
    setCountdown(config.start_delay_ms);
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, config.start_delay_ms - elapsed);
      setCountdown(left);
      if (left <= 0) clearInterval(iv);
    }, 50);
    return () => clearInterval(iv);
  }, [isRunning, config.start_delay_ms]);

  // stop_after remaining
  useEffect(() => {
    if (!isRunning || config.stop_after_ms <= 0) {
      setRemaining(0);
      return;
    }
    const iv = setInterval(() => {
      const t = useClickStore.getState().telemetry;
      const left = Math.max(0, config.stop_after_ms - t.session_duration_ms);
      setRemaining(left);
    }, 100);
    return () => clearInterval(iv);
  }, [isRunning, config.stop_after_ms]);

  return (
    <Card label="[SCHEDULE]" delay={0.2} span="schedule">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Start delay */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="mono text-tertiary" style={{ fontSize: 9 }}>START DELAY</span>
            <span className="mono text-secondary" style={{ fontSize: 9 }}>{msToHuman(config.start_delay_ms)}</span>
          </div>
          <input
            type="number"
            min={0}
            step={100}
            value={config.start_delay_ms}
            onChange={(e) => setConfig({ start_delay_ms: Math.max(0, Number(e.target.value)) })}
            className="mono"
            style={{ ...inputStyle, width: '100%' }}
          />
          <AnimatePresence>
            {isRunning && countdown > 0 && (
              <motion.div
                className="badge"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: 'var(--green)',
                  border: '1px dashed var(--green)',
                  display: 'inline-block',
                }}
              >
                STARTING IN {(countdown / 1000).toFixed(1)}s
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stop after */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="mono text-tertiary" style={{ fontSize: 9 }}>STOP AFTER</span>
            <span className="mono text-secondary" style={{ fontSize: 9 }}>
              {config.stop_after_ms === 0 ? 'DISABLED' : msToHuman(config.stop_after_ms)}
            </span>
          </div>
          <input
            type="number"
            min={0}
            step={100}
            value={config.stop_after_ms}
            onChange={(e) => setConfig({ stop_after_ms: Math.max(0, Number(e.target.value)) })}
            className="mono"
            style={{ ...inputStyle, width: '100%' }}
          />
          <AnimatePresence>
            {isRunning && config.stop_after_ms > 0 && remaining > 0 && (
              <motion.div
                className="badge"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: '#f97316',
                  border: '1px dashed #f97316',
                  display: 'inline-block',
                }}
              >
                STOPPING IN {(remaining / 1000).toFixed(1)}s
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
