use std::sync::Arc;
use std::time::Instant;
use parking_lot::Mutex;
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};

use crate::bayesian::BayesianOptimizer;
use crate::brier::BrierTracker;
use crate::bocpd::Bocpd;
use crate::clicker::{self, MouseButton};
use crate::entropy;
use crate::fatigue::FatigueModel;
use crate::fourier;
use crate::montecarlo::MonteCarlo;
use crate::neural::NeuralNet;
use crate::osha::OshaMonitor;
use crate::pid::PidController;
use crate::provenance::ProvenanceChain;
use crate::weather::HoltWinters;

#[derive(Debug, Clone, Serialize)]
pub struct TelemetrySnapshot {
    pub cps: f64,
    pub target_cps: f64,
    pub total_clicks: u64,
    pub session_duration_ms: f64,
    pub entropy: f64,
    pub pid_output: crate::pid::PidState,
    pub bayesian: crate::bayesian::BayesianState,
    pub fatigue: crate::fatigue::FatigueState,
    pub brier_score: f64,
    pub seismograph: f64,
    pub regime: String,
    pub forecast_cps: f64,
    pub provenance_valid: bool,
    pub chain_length: usize,
    pub neural_loss: f64,
    pub monte_carlo_p50: f64,
    pub monte_carlo_p5: f64,
    pub monte_carlo_p95: f64,
    pub fft_dominant_freq: f64,
    pub fft_spectrum: Vec<f64>,
    pub osha_strain_index: f64,
    pub osha_break_needed: bool,
    pub recent_intervals: Vec<f64>,
    pub recent_clicks: Vec<crate::provenance::ClickRecord>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CandleData {
    pub time: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct ClickConfig {
    pub target_cps: f64,
    pub button: MouseButton,
    pub click_type: ClickType,
    pub repeat_mode: RepeatMode,
    pub repeat_count: u64,
    pub location_mode: LocationMode,
    pub fixed_x: i32,
    pub fixed_y: i32,
    pub hotkey: String,
    pub humanizer_enabled: bool,
    pub sound_enabled: bool,
    pub sound_preset: String,
}

#[derive(Debug, Clone, Copy, PartialEq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ClickType {
    Single,
    Double,
}

#[derive(Debug, Clone, Copy, PartialEq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RepeatMode {
    Infinite,
    Count,
}

#[derive(Debug, Clone, Copy, PartialEq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LocationMode {
    Cursor,
    Fixed,
}

impl Default for ClickConfig {
    fn default() -> Self {
        Self {
            target_cps: 10.0,
            button: MouseButton::Left,
            click_type: ClickType::Single,
            repeat_mode: RepeatMode::Infinite,
            repeat_count: 100,
            location_mode: LocationMode::Cursor,
            fixed_x: 0,
            fixed_y: 0,
            hotkey: "F6".into(),
            humanizer_enabled: true,
            sound_enabled: true,
            sound_preset: "mechanical".into(),
        }
    }
}

pub struct Engine {
    config: ClickConfig,
    running: bool,

    // Analysis engines
    pid: PidController,
    bayesian: BayesianOptimizer,
    neural: NeuralNet,
    bocpd: Bocpd,
    brier: BrierTracker,
    provenance: ProvenanceChain,
    weather: HoltWinters,
    fatigue: FatigueModel,
    osha: OshaMonitor,

    // Click tracking
    intervals: Vec<f64>,
    cps_history: Vec<f64>,
    last_click_time: Option<Instant>,
    tick_count: u64,
    session_start: Instant,

    // CPS measurement
    clicks_in_window: Vec<Instant>,
}

impl Engine {
    pub fn new(config: ClickConfig) -> Self {
        Self {
            pid: PidController::new(),
            bayesian: BayesianOptimizer::new(config.target_cps),
            neural: NeuralNet::new(),
            bocpd: Bocpd::new(),
            brier: BrierTracker::new(),
            provenance: ProvenanceChain::new(),
            weather: HoltWinters::new(),
            fatigue: FatigueModel::new(),
            osha: OshaMonitor::new(),
            intervals: Vec::new(),
            cps_history: Vec::new(),
            last_click_time: None,
            tick_count: 0,
            session_start: Instant::now(),
            clicks_in_window: Vec::new(),
            config,
            running: false,
        }
    }

    fn measure_cps(&mut self) -> f64 {
        let now = Instant::now();
        // Keep clicks from last 1 second
        self.clicks_in_window.retain(|t| now.duration_since(*t).as_secs_f64() < 1.0);
        self.clicks_in_window.len() as f64
    }

    fn do_click(&mut self) {
        let now = Instant::now();
        let now_ms = now.duration_since(self.session_start).as_secs_f64() * 1000.0;

        // Measure interval
        if let Some(last) = self.last_click_time {
            let interval = now.duration_since(last).as_secs_f64() * 1000.0;
            self.intervals.push(interval);
            if self.intervals.len() > 256 {
                self.intervals.remove(0);
            }

            // Feed all engines
            self.bayesian.observe(interval);
            self.bocpd.observe(interval);
        }
        self.last_click_time = Some(now);
        self.clicks_in_window.push(now);

        // Determine click position
        let position = match self.config.location_mode {
            LocationMode::Fixed => Some((self.config.fixed_x, self.config.fixed_y)),
            LocationMode::Cursor => None,
        };

        // Actual click (single or double)
        match self.config.click_type {
            ClickType::Single => clicker::send_click_at(self.config.button, position),
            ClickType::Double => clicker::send_double_click_at(self.config.button, position),
        }

        // Record in provenance chain
        let interval = self.intervals.last().copied().unwrap_or(0.0);
        self.provenance.record_click(now_ms, interval);

        // OSHA tracking
        let cps = self.measure_cps();
        self.osha.record_click(now_ms, cps);

        // Fatigue
        self.fatigue.tick(true, interval / 1000.0);

        // Weather
        self.weather.observe(cps);

        // Brier scoring
        let target_interval = 1000.0 / self.config.target_cps;
        let predicted_success = self.bayesian.state().confidence;
        let actual_success = if interval > 0.0 && (interval - target_interval).abs() < target_interval * 0.15 {
            1.0
        } else {
            0.0
        };
        self.brier.observe(predicted_success, actual_success);

        self.tick_count += 1;
    }

    fn compute_telemetry(&mut self) -> TelemetrySnapshot {
        let cps = self.measure_cps();
        let now = Instant::now();
        let session_ms = now.duration_since(self.session_start).as_secs_f64() * 1000.0;

        // PID
        let dt = if cps > 0.0 { 1.0 / cps } else { 0.1 };
        let pid_state = self.pid.update(self.config.target_cps, cps, dt);

        // Entropy
        let ent = entropy::shannon_entropy(&self.intervals);

        // FFT
        let spectrum = if self.intervals.len() >= 8 {
            fourier::fft_magnitudes(&self.intervals)
        } else {
            vec![]
        };
        let sample_rate = if cps > 0.0 { cps } else { 10.0 };
        let dominant_freq = fourier::dominant_frequency(&spectrum, sample_rate);

        // Trim spectrum to 32 bins for frontend
        let fft_display: Vec<f64> = if spectrum.len() > 32 {
            spectrum[..32].to_vec()
        } else {
            spectrum
        };

        // Neural net
        let nn_input = [
            cps / self.config.target_cps.max(1.0),
            ent,
            pid_state.error / self.config.target_cps.max(1.0),
            self.bayesian.state().confidence,
        ];
        let _jitter = self.neural.forward(&nn_input);
        // Train: target jitter should correlate with entropy
        self.neural.train(&nn_input, ent * 0.5);

        // Monte Carlo
        let trend = pid_state.error;
        let vol = if self.intervals.len() > 2 {
            let mean = self.intervals.iter().sum::<f64>() / self.intervals.len() as f64;
            (self.intervals.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / self.intervals.len() as f64).sqrt() * 0.01
        } else {
            0.5
        };
        let mc = MonteCarlo::simulate(cps, trend, vol, 30);

        // Seismograph: standard deviation of recent intervals
        let seismograph = if self.intervals.len() > 2 {
            let mean = self.intervals.iter().sum::<f64>() / self.intervals.len() as f64;
            let variance = self.intervals.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / self.intervals.len() as f64;
            variance.sqrt() / mean.max(1.0)
        } else {
            0.0
        };

        self.cps_history.push(cps);
        if self.cps_history.len() > 300 {
            self.cps_history.remove(0);
        }

        // Fatigue recovery tick (no click)
        self.fatigue.tick(false, dt);

        TelemetrySnapshot {
            cps,
            target_cps: self.config.target_cps,
            total_clicks: self.osha.total_clicks(),
            session_duration_ms: session_ms,
            entropy: ent,
            pid_output: pid_state,
            bayesian: self.bayesian.state(),
            fatigue: self.fatigue.state(),
            brier_score: self.brier.score(),
            seismograph,
            regime: self.bocpd.regime.to_string(),
            forecast_cps: self.weather.forecast.max(0.0),
            provenance_valid: self.provenance.verify(),
            chain_length: self.provenance.len(),
            neural_loss: self.neural.loss,
            monte_carlo_p50: mc.p50,
            monte_carlo_p5: mc.p5,
            monte_carlo_p95: mc.p95,
            fft_dominant_freq: dominant_freq,
            fft_spectrum: fft_display,
            osha_strain_index: self.osha.strain_index(),
            osha_break_needed: self.osha.break_needed(),
            recent_intervals: self.intervals.clone(),
            recent_clicks: self.provenance.recent(8).to_vec(),
        }
    }
}

pub type SharedEngine = Arc<Mutex<Engine>>;

pub fn create_engine(config: ClickConfig) -> SharedEngine {
    Arc::new(Mutex::new(Engine::new(config)))
}

/// Main click loop — runs on a tokio task
pub async fn run_click_loop(engine: SharedEngine, app: AppHandle) {
    let mut candle_open = 0.0_f64;
    let mut candle_high = 0.0_f64;
    let mut candle_low = f64::MAX;
    let mut candle_ticks = 0u32;
    let candle_period = 25; // candle every 25 ticks (~5 seconds)
    let mut telemetry_counter = 0u32;

    loop {
        let (should_run, interval_ms, target_cps, repeat_mode, repeat_count, total_clicks) = {
            let eng = engine.lock();
            (
                eng.running,
                1000.0 / eng.config.target_cps.max(0.1),
                eng.config.target_cps,
                eng.config.repeat_mode,
                eng.config.repeat_count,
                eng.tick_count,
            )
        };

        if !should_run {
            sleep(Duration::from_millis(50)).await;
            continue;
        }

        // Check if we've hit the repeat count
        if repeat_mode == RepeatMode::Count && total_clicks >= repeat_count {
            let mut eng = engine.lock();
            eng.running = false;
            let _ = app.emit("engine-status", "idle");
            continue;
        }

        // Click
        {
            let mut eng = engine.lock();
            eng.do_click();
        }

        // Humanizer jitter
        let jitter = {
            let mut eng = engine.lock();
            if eng.config.humanizer_enabled {
                let nn_input = [
                    eng.measure_cps() / target_cps.max(1.0),
                    entropy::shannon_entropy(&eng.intervals),
                    0.0,
                    eng.bayesian.state().confidence,
                ];
                let j = eng.neural.forward(&nn_input);
                (j - 0.5) * interval_ms * 0.2 // +/- 10% jitter
            } else {
                0.0
            }
        };

        // Emit telemetry every 5 clicks
        telemetry_counter += 1;
        if telemetry_counter >= 5 {
            telemetry_counter = 0;
            let telemetry = {
                let mut eng = engine.lock();
                eng.compute_telemetry()
            };

            let cps = telemetry.cps;

            // Candle tracking
            if candle_ticks == 0 {
                candle_open = cps;
                candle_high = cps;
                candle_low = cps;
            }
            candle_high = candle_high.max(cps);
            candle_low = candle_low.min(cps);
            candle_ticks += 1;

            if candle_ticks >= candle_period {
                let candle = CandleData {
                    time: chrono::Utc::now().timestamp(),
                    open: candle_open,
                    high: candle_high,
                    low: candle_low,
                    close: cps,
                };
                let _ = app.emit("candle", &candle);
                candle_ticks = 0;
                candle_high = 0.0;
                candle_low = f64::MAX;
            }

            let _ = app.emit("telemetry", &telemetry);
        }

        let sleep_ms = (interval_ms + jitter).max(1.0) as u64;
        sleep(Duration::from_millis(sleep_ms)).await;
    }
}

pub fn start_engine(engine: &SharedEngine, config: ClickConfig) {
    let mut eng = engine.lock();
    eng.config = config.clone();
    eng.bayesian.set_target(config.target_cps);
    eng.running = true;
    eng.tick_count = 0;
    eng.session_start = Instant::now();
    eng.osha.start_session(0.0);
    eng.fatigue.set_session_start(0.0);
    eng.pid.reset();
}

pub fn stop_engine(engine: &SharedEngine) {
    let mut eng = engine.lock();
    eng.running = false;
}

pub fn update_config(engine: &SharedEngine, config: ClickConfig) {
    let mut eng = engine.lock();
    eng.config = config.clone();
    eng.bayesian.set_target(config.target_cps);
}
