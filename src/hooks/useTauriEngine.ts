import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useClickStore } from '../store/clickStore';
import type { TelemetrySnapshot, CandleData } from '../types';

// Check if we're running inside Tauri
const IS_TAURI = '__TAURI_INTERNALS__' in window;

export function useTauriEngine() {
  const status = useClickStore((s) => s.status);
  const config = useClickStore((s) => s.config);

  // Listen for telemetry events from Rust
  useEffect(() => {
    if (!IS_TAURI) return;

    const unlisten = listen<TelemetrySnapshot>('telemetry', (event) => {
      const t = event.payload;
      const store = useClickStore.getState();

      store.updateTelemetry(t);
      store.pushCps(t.cps);

      // Add recent clicks from backend
      if (t.recent_clicks && t.recent_clicks.length > 0) {
        const last = t.recent_clicks[t.recent_clicks.length - 1];
        store.addClick({
          id: last.id,
          timestamp: last.timestamp,
          x: 0,
          y: 0,
          interval_ms: last.interval_ms,
          hash: last.hash,
        });
      }
    });

    const unlistenCandle = listen<CandleData>('candle', (event) => {
      useClickStore.getState().pushCandle(event.payload);
    });

    // Listen for F6 hotkey toggle from Rust
    const unlistenHotkey = listen('hotkey-toggle', () => {
      const store = useClickStore.getState();
      if (store.status === 'running') {
        store.setStatus('idle');
      } else {
        store.setStatus('running');
      }
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenCandle.then((fn) => fn());
      unlistenHotkey.then((fn) => fn());
    };
  }, []);

  // Listen for engine auto-stop (repeat count reached)
  useEffect(() => {
    if (!IS_TAURI) return;
    const unlistenStatus = listen<string>('engine-status', (event) => {
      if (event.payload === 'idle') {
        useClickStore.getState().setStatus('idle');
      }
    });
    return () => { unlistenStatus.then((fn) => fn()); };
  }, []);

  // Start/stop engine based on status changes
  useEffect(() => {
    if (!IS_TAURI) return;

    if (status === 'running') {
      invoke('start_engine', { config }).catch(console.error);
    } else if (status === 'idle') {
      invoke('stop_engine').catch(console.error);
    }
  }, [status]);

  // Push config updates to Rust
  useEffect(() => {
    if (!IS_TAURI || status !== 'running') return;
    invoke('update_config', { config }).catch(console.error);
  }, [config.target_cps, config.button, config.humanizer_enabled, config.click_type, config.repeat_mode, config.repeat_count, config.location_mode, config.fixed_x, config.fixed_y]);

  return IS_TAURI;
}
