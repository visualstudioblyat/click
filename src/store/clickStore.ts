import { create } from 'zustand';
import type {
  ClickConfig,
  EngineStatus,
  TelemetrySnapshot,
  ClickEvent,
  CandleData,
  PidState,
  BayesianState,
  FatigueState,
} from '../types';

interface ClickStore {
  // Engine state
  status: EngineStatus;
  config: ClickConfig;

  // Telemetry
  telemetry: TelemetrySnapshot;
  clickHistory: ClickEvent[];
  cpsHistory: number[];
  candles: CandleData[];

  // Actions
  setStatus: (status: EngineStatus) => void;
  setConfig: (config: Partial<ClickConfig>) => void;
  updateTelemetry: (t: Partial<TelemetrySnapshot>) => void;
  addClick: (click: ClickEvent) => void;
  pushCps: (cps: number) => void;
  pushCandle: (candle: CandleData) => void;
  reset: () => void;
}

const defaultPid: PidState = { p: 0, i: 0, d: 0, output: 0, error: 0 };
const defaultBayesian: BayesianState = { alpha: 1, beta: 1, optimal_interval_ms: 100, confidence: 0 };
const defaultFatigue: FatigueState = {
  tendon_stress: 0,
  recovery_pct: 1,
  spring_displacement: 0,
  damper_velocity: 0,
  rupture_risk: 0,
};

const defaultTelemetry: TelemetrySnapshot = {
  cps: 0,
  target_cps: 10,
  total_clicks: 0,
  session_duration_ms: 0,
  entropy: 0,
  pid_output: defaultPid,
  bayesian: defaultBayesian,
  fatigue: defaultFatigue,
  brier_score: 0.5,
  seismograph: 0,
  regime: 'STABLE',
  forecast_cps: 0,
  provenance_valid: true,
  chain_length: 0,
  neural_loss: 1,
  monte_carlo_p50: 0,
  monte_carlo_p5: 0,
  monte_carlo_p95: 0,
  fft_dominant_freq: 0,
  fft_spectrum: [],
  osha_strain_index: 0,
  osha_break_needed: false,
  recent_intervals: [],
  recent_clicks: [],
};

const defaultConfig: ClickConfig = {
  target_cps: 10,
  button: 'left',
  click_type: 'single',
  repeat_mode: 'infinite',
  repeat_count: 100,
  location_mode: 'cursor',
  fixed_x: 0,
  fixed_y: 0,
  hotkey: 'F6',
  humanizer_enabled: true,
  sound_enabled: true,
  sound_preset: 'mechanical',
};

export const useClickStore = create<ClickStore>((set) => ({
  status: 'idle',
  config: defaultConfig,
  telemetry: defaultTelemetry,
  clickHistory: [],
  cpsHistory: [],
  candles: [],

  setStatus: (status) => set({ status }),

  setConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),

  updateTelemetry: (t) =>
    set((s) => ({ telemetry: { ...s.telemetry, ...t } })),

  addClick: (click) =>
    set((s) => ({
      clickHistory: [...s.clickHistory.slice(-500), click],
    })),

  pushCps: (cps) =>
    set((s) => ({
      cpsHistory: [...s.cpsHistory.slice(-300), cps],
    })),

  pushCandle: (candle) =>
    set((s) => ({
      candles: [...s.candles.slice(-200), candle],
    })),

  reset: () =>
    set({
      status: 'idle',
      telemetry: defaultTelemetry,
      clickHistory: [],
      cpsHistory: [],
      candles: [],
    }),
}));
