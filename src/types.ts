export interface ClickEvent {
  id: string;
  timestamp: number;
  x: number;
  y: number;
  interval_ms: number;
  hash: string;
}

export interface SequenceStep {
  action: 'click_left' | 'click_right' | 'click_middle' | 'double_click' | 'key' | 'wait';
  delay_ms: number;
  key?: string;
}

export interface TelemetrySnapshot {
  cps: number;
  target_cps: number;
  total_clicks: number;
  session_duration_ms: number;
  min_cps: number;
  max_cps: number;
  avg_cps: number;
  clicks_per_min: number;
  recent_intervals: number[];
  click_positions: [number, number][];
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
  start_delay_ms: number;
  stop_after_ms: number;
  jitter_distribution: 'uniform' | 'gaussian' | 'poisson';
  position_jitter_radius: number;
  mode: 'click' | 'keyboard' | 'hold' | 'drag';
  keyboard_key: string;
  hold_duration_ms: number;
  drag_to_x: number;
  drag_to_y: number;
  sequence: SequenceStep[];
}

export type EngineStatus = 'idle' | 'running' | 'paused' | 'calibrating';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Profile {
  name: string;
  config: ClickConfig;
  createdAt: number;
}
