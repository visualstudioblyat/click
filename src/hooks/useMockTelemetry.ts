import { useEffect, useRef } from 'react';
import { useClickStore } from '../store/clickStore';

// Simulates telemetry data for visual development.
// Will be replaced by real Tauri IPC when Rust backend is wired.
export function useMockTelemetry() {
  const status = useClickStore((s) => s.status);
  const targetCps = useClickStore((s) => s.config.target_cps);
  const tickRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const { updateTelemetry, addClick, pushCps, pushCandle } = useClickStore.getState();

    startRef.current = Date.now();
    tickRef.current = 0;

    const iv = setInterval(() => {
      tickRef.current++;
      const t = tickRef.current;
      const elapsed = Date.now() - startRef.current;

      // Simulated CPS with jitter
      const noise = (Math.random() - 0.5) * 2;
      const drift = Math.sin(t * 0.05) * 1.5;
      const cps = Math.max(0, targetCps + noise + drift);

      // Bayesian posterior updates
      const alpha = 1 + t * 0.3;
      const beta = 1 + t * 0.05;

      // PID simulation
      const error = cps - targetCps;
      const p = error * 0.4;
      const i_val = Math.sin(t * 0.02) * 0.2;
      const d = (noise - (Math.random() - 0.5) * 2) * 0.3;

      // Entropy oscillation
      const entropy = 0.3 + Math.sin(t * 0.03) * 0.2 + Math.random() * 0.15;

      // FFT spectrum
      const fftSpectrum = Array.from({ length: 32 }, (_, i) => {
        const base = Math.exp(-((i - 10) ** 2) / 20) * 0.8;
        return base + Math.random() * 0.15;
      });

      // Monte Carlo
      const mc_p50 = cps + Math.sin(t * 0.04) * 0.5;
      const mc_spread = 1.5 + Math.random();

      // Neural loss (slowly decreasing)
      const neuralLoss = Math.max(0.01, 1 / (1 + t * 0.02) + Math.random() * 0.05);

      // Seismograph
      const seismograph = Math.abs(noise) / targetCps;

      // Fatigue
      const fatigueProgress = Math.min(elapsed / 600000, 1); // ramps over 10 min

      // Recent intervals
      const intervals = Array.from({ length: 80 }, () =>
        (1000 / targetCps) + (Math.random() - 0.5) * 20,
      );

      // Regime detection
      const regime = Math.abs(drift) > 1.2 ? 'TRANSITIONING' :
                     Math.abs(noise) > 1.5 ? 'VOLATILE' : 'STABLE';

      // Forecast
      const forecast = cps + drift * 0.5;

      updateTelemetry({
        cps,
        target_cps: targetCps,
        total_clicks: t * Math.round(targetCps),
        session_duration_ms: elapsed,
        entropy: Math.max(0, Math.min(1, entropy)),
        pid_output: { p, i: i_val, d, output: p + i_val + d, error },
        bayesian: {
          alpha,
          beta,
          optimal_interval_ms: 1000 / targetCps + Math.sin(t * 0.1) * 5,
          confidence: Math.min(0.99, 1 - 1 / (1 + t * 0.1)),
        },
        fatigue: {
          tendon_stress: fatigueProgress * 0.6 + Math.random() * 0.05,
          recovery_pct: 1 - fatigueProgress * 0.4,
          spring_displacement: fatigueProgress * 0.3,
          damper_velocity: Math.abs(noise) * 0.1,
          rupture_risk: fatigueProgress * 0.15,
        },
        brier_score: Math.max(0.02, 0.5 / (1 + t * 0.05) + Math.random() * 0.03),
        seismograph,
        regime,
        forecast_cps: Math.max(0, forecast),
        provenance_valid: true,
        chain_length: t * Math.round(targetCps),
        neural_loss: neuralLoss,
        monte_carlo_p50: mc_p50,
        monte_carlo_p5: mc_p50 - mc_spread,
        monte_carlo_p95: mc_p50 + mc_spread,
        fft_dominant_freq: 10 + Math.sin(t * 0.06) * 2,
        fft_spectrum: fftSpectrum,
        osha_strain_index: Math.min(1, fatigueProgress * 0.7 + Math.random() * 0.02),
        osha_break_needed: fatigueProgress > 0.8,
        recent_intervals: intervals,
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
