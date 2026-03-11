import { create } from 'zustand';
import type {
  ClickConfig,
  EngineStatus,
  TelemetrySnapshot,
  ClickEvent,
  CandleData,
  Profile,
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

  // Profiles
  profiles: Profile[];

  // Actions
  setStatus: (status: EngineStatus) => void;
  setConfig: (config: Partial<ClickConfig>) => void;
  updateTelemetry: (t: Partial<TelemetrySnapshot>) => void;
  addClick: (click: ClickEvent) => void;
  pushCps: (cps: number) => void;
  pushCandle: (candle: CandleData) => void;
  reset: () => void;

  // Profile actions
  addProfile: (name: string) => void;
  removeProfile: (name: string) => void;
  renameProfile: (oldName: string, newName: string) => void;
  loadProfile: (name: string) => void;
  importProfiles: (profiles: Profile[]) => void;
}

const defaultTelemetry: TelemetrySnapshot = {
  cps: 0,
  target_cps: 10,
  total_clicks: 0,
  session_duration_ms: 0,
  min_cps: 0,
  max_cps: 0,
  avg_cps: 0,
  clicks_per_min: 0,
  recent_intervals: [],
  click_positions: [],
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
  start_delay_ms: 0,
  stop_after_ms: 0,
  jitter_distribution: 'gaussian',
  position_jitter_radius: 0,
  mode: 'click',
  keyboard_key: '',
  hold_duration_ms: 100,
  hover_delay_ms: 500,
  drag_to_x: 0,
  drag_to_y: 0,
  sequence: [],
};

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem('click_profiles');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: Profile[]) {
  try {
    localStorage.setItem('click_profiles', JSON.stringify(profiles));
  } catch { /* noop */ }
}

export const useClickStore = create<ClickStore>((set, get) => ({
  status: 'idle',
  config: defaultConfig,
  telemetry: defaultTelemetry,
  clickHistory: [],
  cpsHistory: [],
  candles: [],
  profiles: loadProfiles(),

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

  addProfile: (name) => {
    const config = { ...get().config };
    const profile: Profile = { name, config, createdAt: Date.now() };
    const profiles = [...get().profiles.filter((p) => p.name !== name), profile];
    saveProfiles(profiles);
    set({ profiles });
  },

  removeProfile: (name) => {
    const profiles = get().profiles.filter((p) => p.name !== name);
    saveProfiles(profiles);
    set({ profiles });
  },

  renameProfile: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const profiles = get().profiles.map((p) =>
      p.name === oldName ? { ...p, name: trimmed } : p
    );
    saveProfiles(profiles);
    set({ profiles });
  },

  loadProfile: (name) => {
    const profile = get().profiles.find((p) => p.name === name);
    if (profile) set({ config: { ...profile.config } });
  },

  importProfiles: (imported) => {
    const existing = get().profiles;
    const merged = [...existing];
    for (const p of imported) {
      const idx = merged.findIndex((e) => e.name === p.name);
      if (idx >= 0) merged[idx] = p;
      else merged.push(p);
    }
    saveProfiles(merged);
    set({ profiles: merged });
  },
}));
