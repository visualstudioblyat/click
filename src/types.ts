export interface ClickEvent {
  id: string;
  timestamp: number;
  x: number;
  y: number;
  interval_ms: number;
  hash: string;
}

export interface TelemetrySnapshot {
  cps: number;
  target_cps: number;
  total_clicks: number;
  session_duration_ms: number;
  entropy: number;
  pid_output: PidState;
  bayesian: BayesianState;
  fatigue: FatigueState;
  brier_score: number;
  seismograph: number;
  regime: string;
  forecast_cps: number;
  provenance_valid: boolean;
  chain_length: number;
  neural_loss: number;
  monte_carlo_p50: number;
  monte_carlo_p5: number;
  monte_carlo_p95: number;
  fft_dominant_freq: number;
  fft_spectrum: number[];
  osha_strain_index: number;
  osha_break_needed: boolean;
  recent_intervals: number[];
  recent_clicks: { id: string; timestamp: number; interval_ms: number; hash: string }[];
}

export interface PidState {
  p: number;
  i: number;
  d: number;
  output: number;
  error: number;
}

export interface BayesianState {
  alpha: number;
  beta: number;
  optimal_interval_ms: number;
  confidence: number;
}

export interface FatigueState {
  tendon_stress: number;
  recovery_pct: number;
  spring_displacement: number;
  damper_velocity: number;
  rupture_risk: number;
}

export interface ClickConfig {
  target_cps: number;
  button: 'left' | 'right' | 'middle';
  click_type: 'single' | 'double';
  repeat_mode: 'infinite' | 'count';
  repeat_count: number;
  location_mode: 'cursor' | 'fixed';
  fixed_x: number;
  fixed_y: number;
  hotkey: string;
  humanizer_enabled: boolean;
  sound_enabled: boolean;
  sound_preset: SoundPreset;
}

export type SoundPreset = 'mechanical' | 'typewriter' | 'bubble' | 'laser' | 'asmr';

export type EngineStatus = 'idle' | 'running' | 'paused' | 'calibrating';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OshaReport {
  cumulative_clicks: number;
  session_minutes: number;
  strain_index: number;
  break_recommended_at: number;
  violations: OshaViolation[];
}

export interface OshaViolation {
  timestamp: number;
  type: string;
  severity: 'warning' | 'critical';
  description: string;
}
