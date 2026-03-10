import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';



export function KeyboardPanel() {
  const { config, setConfig } = useClickStore(
    useShallow((s) => ({
      config: s.config,
      setConfig: s.setConfig,
    })),
  );

  const [binding, setBinding] = useState(false);
  const isKeyboard = config.mode === 'keyboard';

  const handleKeyCapture = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
    setConfig({ keyboard_key: key });
    setBinding(false);
  }, [setConfig]);

  useEffect(() => {
    if (!binding) return;
    window.addEventListener('keydown', handleKeyCapture);
    return () => window.removeEventListener('keydown', handleKeyCapture);
  }, [binding, handleKeyCapture]);

  const interval = config.target_cps > 0 ? Math.round(1000 / config.target_cps) : 1000;

  return (
    <Card label="[KEYBOARD]" delay={0.3} span="keyboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Mode toggle */}
        <div>
          <div className="mono text-tertiary" style={{ fontSize: 9, marginBottom: 6 }}>MODE</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <motion.button
              className={`btn ${config.mode === 'click' ? 'btn-green' : ''}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => setConfig({ mode: 'click' })}
              style={{ flex: 1, fontSize: 10 }}
            >
              CLICK
            </motion.button>
            <motion.button
              className={`btn ${config.mode === 'keyboard' ? 'btn-green' : ''}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => setConfig({ mode: 'keyboard' })}
              style={{ flex: 1, fontSize: 10 }}
            >
              KEYBOARD
            </motion.button>
          </div>
        </div>

        {/* Keyboard-specific controls */}
        {isKeyboard && (
          <>
            {/* Key binding */}
            <div>
              <div className="mono text-tertiary" style={{ fontSize: 9, marginBottom: 6 }}>BOUND KEY</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <motion.button
                  className="badge"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBinding(true)}
                  style={{
                    background: binding ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg)',
                    border: `1px dashed ${binding ? 'var(--green)' : 'var(--border-dashed)'}`,
                    fontSize: 11,
                    cursor: 'pointer',
                    color: binding ? 'var(--green)' : 'inherit',
                    animation: binding ? 'pulse 1s infinite' : 'none',
                    minWidth: 60,
                    textAlign: 'center',
                  }}
                >
                  {binding ? 'PRESS KEY...' : config.keyboard_key || 'NONE'}
                </motion.button>
                {config.keyboard_key && !binding && (
                  <motion.div
                    className="badge"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      fontSize: 10,
                      color: 'var(--green)',
                      border: '1px dashed var(--green)',
                    }}
                  >
                    {config.keyboard_key}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Interval / rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="mono text-tertiary" style={{ fontSize: 9 }}>RATE (CPS)</span>
                <span className="mono text-secondary" style={{ fontSize: 9 }}>~{interval}ms interval</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={config.target_cps}
                onChange={(e) => setConfig({ target_cps: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--green)', height: 2 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span className="mono text-tertiary" style={{ fontSize: 8 }}>1</span>
                <span className="mono" style={{ fontSize: 11 }}>{config.target_cps}</span>
                <span className="mono text-tertiary" style={{ fontSize: 8 }}>100</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
