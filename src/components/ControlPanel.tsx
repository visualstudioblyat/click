import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { BigNumber } from './BigNumber';
import { ProgressRing } from './ProgressRing';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';
import { formatDuration } from '../lib/format';
import type { SoundPreset } from '../types';

const SOUND_PRESETS: SoundPreset[] = ['mechanical', 'typewriter', 'bubble', 'laser', 'asmr'];
const IS_TAURI = '__TAURI_INTERNALS__' in window;

export function ControlPanel() {
  const { status, config, telemetry, setStatus, setConfig } = useClickStore(
    useShallow((s) => ({
      status: s.status,
      config: s.config,
      telemetry: s.telemetry,
      setStatus: s.setStatus,
      setConfig: s.setConfig,
    })),
  );
  const isRunning = status === 'running';
  const [bindingHotkey, setBindingHotkey] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);

  // Hotkey binding
  const bindKey = useCallback((key: string) => {
    setConfig({ hotkey: key });
    setBindingHotkey(false);
    if (IS_TAURI) {
      invoke('rebind_hotkey', { key }).catch(console.error);
    }
  }, [setConfig]);

  const handleKeyBind = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
    bindKey(key);
  }, [bindKey]);

  const handleMouseBind = useCallback((e: MouseEvent) => {
    if (e.button === 3) { e.preventDefault(); bindKey('Mouse4'); }
    else if (e.button === 4) { e.preventDefault(); bindKey('Mouse5'); }
  }, [bindKey]);

  useEffect(() => {
    if (!bindingHotkey) return;
    window.addEventListener('keydown', handleKeyBind);
    window.addEventListener('mousedown', handleMouseBind);
    return () => {
      window.removeEventListener('keydown', handleKeyBind);
      window.removeEventListener('mousedown', handleMouseBind);
    };
  }, [bindingHotkey, handleKeyBind, handleMouseBind]);

  // Pick cursor position for fixed location
  const pickLocation = async () => {
    if (!IS_TAURI) return;
    setPickingLocation(true);
    // Give user 2 seconds to position cursor
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const [x, y] = await invoke<[number, number]>('get_cursor_pos');
      setConfig({ fixed_x: x, fixed_y: y, location_mode: 'fixed' });
    } catch (e) {
      console.error(e);
    }
    setPickingLocation(false);
  };

  const toggleEngine = () => {
    setStatus(isRunning ? 'idle' : 'running');
  };

  const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as const;
  const labelStyle = { fontSize: 10 } as const;
  const sectionBorder = { borderTop: '1px dashed var(--border-dashed)', paddingTop: 10 } as const;

  return (
    <Card label="[CONTROL]" delay={0.05} span="control">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Status + Ring */}
        <div style={rowStyle}>
          <StatusBadge status={status} />
          <ProgressRing
            value={isRunning ? telemetry.cps / config.target_cps : 0}
            size={44}
            color={isRunning ? 'var(--green)' : 'var(--text-tertiary)'}
          />
        </div>

        {/* CPS Display */}
        <div>
          <BigNumber
            value={telemetry.cps}
            denominator={config.target_cps}
            color={isRunning ? 'var(--green)' : undefined}
          />
          <div className="text-secondary mono" style={{ fontSize: 10, marginTop: 4 }}>
            CLICKS PER SECOND
          </div>
        </div>

        {/* Target CPS slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="mono text-secondary" style={labelStyle}>TARGET CPS</span>
            <span className="mono" style={{ fontSize: 11 }}>{config.target_cps}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={config.target_cps}
            onChange={(e) => setConfig({ target_cps: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--green)', height: 2 }}
          />
        </div>

        {/* Mouse Button */}
        <div>
          <div className="mono text-secondary" style={{ ...labelStyle, marginBottom: 6 }}>MOUSE BUTTON</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'right', 'middle'] as const).map((btn) => (
              <motion.button
                key={btn}
                className={`btn ${config.button === btn ? 'btn-green' : ''}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig({ button: btn })}
                style={{ flex: 1, fontSize: 10, textTransform: 'uppercase' }}
              >
                {btn}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Click Type */}
        <div style={rowStyle}>
          <span className="mono text-secondary" style={labelStyle}>CLICK TYPE</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['single', 'double'] as const).map((t) => (
              <motion.button
                key={t}
                className={`btn ${config.click_type === t ? 'btn-green' : ''}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig({ click_type: t })}
                style={{ fontSize: 9, padding: '4px 10px', textTransform: 'uppercase' }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Repeat Mode */}
        <div style={sectionBorder}>
          <div style={{ ...rowStyle, marginBottom: 8 }}>
            <span className="mono text-secondary" style={labelStyle}>REPEAT</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['infinite', 'count'] as const).map((m) => (
                <motion.button
                  key={m}
                  className={`btn ${config.repeat_mode === m ? 'btn-green' : ''}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfig({ repeat_mode: m })}
                  style={{ fontSize: 9, padding: '4px 10px', textTransform: 'uppercase' }}
                >
                  {m === 'infinite' ? 'UNTIL STOPPED' : 'COUNT'}
                </motion.button>
              ))}
            </div>
          </div>
          {config.repeat_mode === 'count' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono text-secondary" style={{ fontSize: 9 }}>CLICKS:</span>
              <input
                type="number"
                min={1}
                max={999999}
                value={config.repeat_count}
                onChange={(e) => setConfig({ repeat_count: Math.max(1, Number(e.target.value)) })}
                className="mono"
                style={{
                  flex: 1,
                  background: 'var(--bg)',
                  border: '1px dashed var(--border-dashed)',
                  color: 'var(--text)',
                  padding: '4px 8px',
                  fontSize: 11,
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Cursor Position */}
        <div style={sectionBorder}>
          <div style={{ ...rowStyle, marginBottom: 8 }}>
            <span className="mono text-secondary" style={labelStyle}>LOCATION</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <motion.button
                className={`btn ${config.location_mode === 'cursor' ? 'btn-green' : ''}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig({ location_mode: 'cursor' })}
                style={{ fontSize: 9, padding: '4px 10px' }}
              >
                CURSOR
              </motion.button>
              <motion.button
                className={`btn ${config.location_mode === 'fixed' ? 'btn-green' : ''}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig({ location_mode: 'fixed' })}
                style={{ fontSize: 9, padding: '4px 10px' }}
              >
                FIXED
              </motion.button>
            </div>
          </div>
          {config.location_mode === 'fixed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <span className="mono text-tertiary" style={{ fontSize: 8 }}>X</span>
                  <input
                    type="number"
                    value={config.fixed_x}
                    onChange={(e) => setConfig({ fixed_x: Number(e.target.value) })}
                    className="mono"
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px dashed var(--border-dashed)',
                      color: 'var(--text)',
                      padding: '3px 6px',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="mono text-tertiary" style={{ fontSize: 8 }}>Y</span>
                  <input
                    type="number"
                    value={config.fixed_y}
                    onChange={(e) => setConfig({ fixed_y: Number(e.target.value) })}
                    className="mono"
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px dashed var(--border-dashed)',
                      color: 'var(--text)',
                      padding: '3px 6px',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <motion.button
                className="btn"
                whileTap={{ scale: 0.95 }}
                onClick={pickLocation}
                style={{
                  fontSize: 9,
                  padding: '4px 8px',
                  color: pickingLocation ? 'var(--green)' : undefined,
                  border: pickingLocation ? '1px dashed var(--green)' : undefined,
                }}
              >
                {pickingLocation ? 'MOVE CURSOR...' : 'PICK'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Hotkey */}
        <div style={{ ...rowStyle, ...sectionBorder }}>
          <span className="mono text-secondary" style={labelStyle}>HOTKEY</span>
          <motion.button
            className="badge"
            whileTap={{ scale: 0.95 }}
            onClick={() => setBindingHotkey(true)}
            style={{
              background: bindingHotkey ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg)',
              border: `1px dashed ${bindingHotkey ? 'var(--green)' : 'var(--border-dashed)'}`,
              fontSize: 11,
              cursor: 'pointer',
              color: bindingHotkey ? 'var(--green)' : 'inherit',
              animation: bindingHotkey ? 'pulse 1s infinite' : 'none',
            }}
          >
            {bindingHotkey ? 'PRESS A KEY...' : config.hotkey}
          </motion.button>
        </div>

        {/* Sound preset */}
        <div>
          <div className="mono text-secondary" style={{ ...labelStyle, marginBottom: 6 }}>SOUND</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {SOUND_PRESETS.map((preset) => (
              <motion.button
                key={preset}
                className={`btn ${config.sound_preset === preset ? 'btn-green' : ''}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig({ sound_preset: preset })}
                style={{ fontSize: 9, padding: '4px 8px', textTransform: 'uppercase' }}
              >
                {preset}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Humanizer toggle */}
        <div style={rowStyle}>
          <span className="mono text-secondary" style={labelStyle}>HUMANIZER</span>
          <motion.button
            className={`btn ${config.humanizer_enabled ? 'btn-green' : ''}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setConfig({ humanizer_enabled: !config.humanizer_enabled })}
            style={{ fontSize: 10 }}
          >
            {config.humanizer_enabled ? 'ON' : 'OFF'}
          </motion.button>
        </div>

        {/* Session stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            ...sectionBorder,
          }}
        >
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 9 }}>TOTAL CLICKS</div>
            <div className="mono" style={{ fontSize: 13 }}>
              {telemetry.total_clicks.toLocaleString()}
              {config.repeat_mode === 'count' && (
                <span className="text-tertiary"> / {config.repeat_count.toLocaleString()}</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono text-tertiary" style={{ fontSize: 9 }}>SESSION</div>
            <div className="mono" style={{ fontSize: 13 }}>
              {formatDuration(telemetry.session_duration_ms)}
            </div>
          </div>
        </div>

        {/* Start/Stop button */}
        <motion.button
          className={`btn ${isRunning ? 'btn-red' : 'btn-green'}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={toggleEngine}
          style={{
            width: '100%',
            padding: '12px 0',
            fontSize: 12,
            fontWeight: 600,
            justifyContent: 'center',
          }}
        >
          {isRunning ? 'STOP ENGINE' : 'START ENGINE'}
        </motion.button>
      </div>
    </Card>
  );
}
