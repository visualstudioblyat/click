import { useState } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

const IS_TAURI = '__TAURI_INTERNALS__' in window;
const MODES = ['click', 'hold', 'drag'] as const;

const inputStyle = {
  background: 'var(--bg)',
  border: '1px dashed var(--border-dashed)',
  color: 'var(--text)',
  padding: '4px 8px',
  fontSize: 11,
  outline: 'none',
} as const;

export function HoldDragPanel() {
  const { config, setConfig } = useClickStore(
    useShallow((s) => ({
      config: s.config,
      setConfig: s.setConfig,
    })),
  );

  const [pickingFrom, setPickingFrom] = useState(false);
  const [pickingTo, setPickingTo] = useState(false);

  const pickPos = async (target: 'from' | 'to') => {
    if (!IS_TAURI) return;
    if (target === 'from') setPickingFrom(true);
    else setPickingTo(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const [x, y] = await invoke<[number, number]>('get_cursor_pos');
      if (target === 'from') {
        setConfig({ fixed_x: x, fixed_y: y });
      } else {
        setConfig({ drag_to_x: x, drag_to_y: y });
      }
    } catch (e) {
      console.error(e);
    }
    if (target === 'from') setPickingFrom(false);
    else setPickingTo(false);
  };

  const fromX = config.fixed_x;
  const fromY = config.fixed_y;
  const toX = config.drag_to_x;
  const toY = config.drag_to_y;

  return (
    <Card label="[HOLD/DRAG]" delay={0.15} span="holddrag">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Mode buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {MODES.map((m) => (
            <motion.button
              key={m}
              className={`btn ${config.mode === m ? 'btn-green' : ''}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => setConfig({ mode: m })}
              style={{ flex: 1, fontSize: 10, textTransform: 'uppercase' }}
            >
              {m}
            </motion.button>
          ))}
        </div>

        {/* Hold duration */}
        {config.mode === 'hold' && (
          <div>
            <div className="mono text-secondary" style={{ fontSize: 10, marginBottom: 6 }}>
              HOLD DURATION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={10}
                max={10000}
                value={config.hold_duration_ms}
                onChange={(e) => setConfig({ hold_duration_ms: Math.max(10, Number(e.target.value)) })}
                className="mono"
                style={{ ...inputStyle, flex: 1 }}
              />
              <span className="mono text-tertiary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                = {(config.hold_duration_ms / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        )}

        {/* Drag coordinates */}
        {config.mode === 'drag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* From */}
            <div>
              <div className="mono text-secondary" style={{ fontSize: 10, marginBottom: 4 }}>FROM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <span className="mono text-tertiary" style={{ fontSize: 8 }}>X</span>
                  <input
                    type="number"
                    value={fromX}
                    onChange={(e) => setConfig({ fixed_x: Number(e.target.value) })}
                    className="mono"
                    style={{ ...inputStyle, width: '100%', padding: '3px 6px', fontSize: 10 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="mono text-tertiary" style={{ fontSize: 8 }}>Y</span>
                  <input
                    type="number"
                    value={fromY}
                    onChange={(e) => setConfig({ fixed_y: Number(e.target.value) })}
                    className="mono"
                    style={{ ...inputStyle, width: '100%', padding: '3px 6px', fontSize: 10 }}
                  />
                </div>
                <motion.button
                  className="btn"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => pickPos('from')}
                  style={{
                    fontSize: 9,
                    padding: '4px 8px',
                    color: pickingFrom ? 'var(--green)' : undefined,
                    border: pickingFrom ? '1px dashed var(--green)' : undefined,
                    marginTop: 10,
                  }}
                >
                  {pickingFrom ? 'WAIT...' : 'PICK'}
                </motion.button>
              </div>
            </div>

            {/* To */}
            <div>
              <div className="mono text-secondary" style={{ fontSize: 10, marginBottom: 4 }}>TO</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <span className="mono text-tertiary" style={{ fontSize: 8 }}>X</span>
                  <input
                    type="number"
                    value={toX}
                    onChange={(e) => setConfig({ drag_to_x: Number(e.target.value) })}
                    className="mono"
                    style={{ ...inputStyle, width: '100%', padding: '3px 6px', fontSize: 10 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="mono text-tertiary" style={{ fontSize: 8 }}>Y</span>
                  <input
                    type="number"
                    value={toY}
                    onChange={(e) => setConfig({ drag_to_y: Number(e.target.value) })}
                    className="mono"
                    style={{ ...inputStyle, width: '100%', padding: '3px 6px', fontSize: 10 }}
                  />
                </div>
                <motion.button
                  className="btn"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => pickPos('to')}
                  style={{
                    fontSize: 9,
                    padding: '4px 8px',
                    color: pickingTo ? 'var(--green)' : undefined,
                    border: pickingTo ? '1px dashed var(--green)' : undefined,
                    marginTop: 10,
                  }}
                >
                  {pickingTo ? 'WAIT...' : 'PICK'}
                </motion.button>
              </div>
            </div>

            {/* Drag path SVG */}
            <svg
              width="100%"
              height={48}
              viewBox="0 0 200 48"
              style={{ opacity: 0.6 }}
            >
              {/* A dot */}
              <circle cx={30} cy={24} r={5} fill="var(--green)" opacity={0.8} />
              <text x={30} y={14} textAnchor="middle" fill="var(--green)" fontSize={9} fontFamily="monospace">
                A
              </text>
              {/* Arrow line */}
              <line
                x1={38} y1={24} x2={155} y2={24}
                stroke="var(--green)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              {/* Arrowhead */}
              <polygon
                points="155,20 165,24 155,28"
                fill="var(--green)"
              />
              {/* B dot */}
              <circle cx={170} cy={24} r={5} fill="#f97316" opacity={0.8} />
              <text x={170} y={14} textAnchor="middle" fill="#f97316" fontSize={9} fontFamily="monospace">
                B
              </text>
              {/* Coords */}
              <text x={30} y={40} textAnchor="middle" fill="var(--text-tertiary)" fontSize={7} fontFamily="monospace">
                {fromX},{fromY}
              </text>
              <text x={170} y={40} textAnchor="middle" fill="var(--text-tertiary)" fontSize={7} fontFamily="monospace">
                {toX},{toY}
              </text>
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}
