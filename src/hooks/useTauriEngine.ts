import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useClickStore } from '../store/clickStore';
import type { TelemetrySnapshot, CandleData } from '../types';

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

      // Update title bar with click count
      getCurrentWindow().setTitle(
        `click — ${t.total_clicks.toLocaleString()} clicks | ${t.cps.toFixed(1)} CPS`
      ).catch(() => {});

      if (t.click_positions && t.click_positions.length > 0) {
        const [x, y] = t.click_positions[t.click_positions.length - 1];
        store.addClick({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          x,
          y,
          interval_ms: t.recent_intervals.length > 0
            ? t.recent_intervals[t.recent_intervals.length - 1]
            : 0,
          hash: '',
        });
      }
    });

    const unlistenCandle = listen<CandleData>('candle', (event) => {
      useClickStore.getState().pushCandle(event.payload);
    });

    // Listen for hotkey toggle from Rust
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

  // Reset title when idle
  useEffect(() => {
    if (!IS_TAURI) return;
    if (status === 'idle') {
      getCurrentWindow().setTitle('click').catch(() => {});
    }
  }, [status]);

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
  }, [
    config.target_cps,
    config.button,
    config.click_type,
    config.repeat_mode,
    config.repeat_count,
    config.location_mode,
    config.fixed_x,
    config.fixed_y,
    config.humanizer_enabled,
    config.start_delay_ms,
    config.stop_after_ms,
    config.jitter_distribution,
    config.position_jitter_radius,
    config.mode,
    config.keyboard_key,
    config.hold_duration_ms,
    config.hover_delay_ms,
    config.drag_to_x,
    config.drag_to_y,
    config.sequence,
  ]);

  // Keyboard shortcuts: Ctrl+1-4 for mode switch
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const store = useClickStore.getState();
      switch (e.key) {
        case '1': e.preventDefault(); store.setConfig({ mode: 'click' }); break;
        case '2': e.preventDefault(); store.setConfig({ mode: 'keyboard' }); break;
        case '3': e.preventDefault(); store.setConfig({ mode: 'hold' }); break;
        case '4': e.preventDefault(); store.setConfig({ mode: 'drag' }); break;
        case '5': e.preventDefault(); store.setConfig({ mode: 'hover' }); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return IS_TAURI;
}
