import { useEffect, useRef } from 'react';
import { useClickStore } from '../store/clickStore';

// Simulates telemetry data for visual development.
// Will be replaced by real Tauri IPC when Rust backend is wired.
export function useMockTelemetry() {
  const status = useClickStore((s) => s.status);
  const targetCps = useClickStore((s) => s.config.target_cps);
  const tickRef = useRef(0);
  const startRef = useRef(Date.now());
  const minRef = useRef(Infinity);
  const maxRef = useRef(0);
  const sumRef = useRef(0);

  useEffect(() => {
    if (status !== 'running') return;
    const { updateTelemetry, addClick, pushCps, pushCandle } = useClickStore.getState();

    startRef.current = Date.now();
    tickRef.current = 0;
    minRef.current = Infinity;
    maxRef.current = 0;
    sumRef.current = 0;

    const iv = setInterval(() => {
      tickRef.current++;
      const t = tickRef.current;
      const elapsed = Date.now() - startRef.current;

      // Simulated CPS with jitter
      const noise = (Math.random() - 0.5) * 2;
      const drift = Math.sin(t * 0.05) * 1.5;
      const cps = Math.max(0, targetCps + noise + drift);

      // Track min/max/avg
      if (cps < minRef.current) minRef.current = cps;
      if (cps > maxRef.current) maxRef.current = cps;
      sumRef.current += cps;
      const avgCps = sumRef.current / t;

      // Clicks per minute
      const totalClicks = t * Math.round(targetCps);
      const elapsedMin = elapsed / 60000;
      const clicksPerMin = elapsedMin > 0 ? totalClicks / elapsedMin : 0;

      // Recent intervals
      const intervals = Array.from({ length: 80 }, () =>
        (1000 / targetCps) + (Math.random() - 0.5) * 20,
      );

      // Mock click positions (scattered around a center point)
      const positions: [number, number][] = Array.from({ length: 10 }, () => [
        Math.round(500 + (Math.random() - 0.5) * 100),
        Math.round(400 + (Math.random() - 0.5) * 100),
      ]);

      updateTelemetry({
        cps,
        target_cps: targetCps,
        total_clicks: totalClicks,
        session_duration_ms: elapsed,
        min_cps: minRef.current,
        max_cps: maxRef.current,
        avg_cps: avgCps,
        clicks_per_min: clicksPerMin,
        recent_intervals: intervals,
        click_positions: positions,
      });

      pushCps(cps);

      // Add mock click
      addClick({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        x: 500 + Math.random() * 200,
        y: 400 + Math.random() * 200,
        interval_ms: 1000 / cps,
        hash: Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      });

      // Candle every 5 ticks
      if (t % 5 === 0) {
        const recentCps = useClickStore.getState().cpsHistory.slice(-5);
        if (recentCps.length > 0) {
          pushCandle({
            time: Math.floor(Date.now() / 1000),
            open: recentCps[0],
            high: Math.max(...recentCps),
            low: Math.min(...recentCps),
            close: recentCps[recentCps.length - 1],
          });
        }
      }
    }, 200); // 5 Hz update rate

    return () => clearInterval(iv);
  }, [status, targetCps]);
}
