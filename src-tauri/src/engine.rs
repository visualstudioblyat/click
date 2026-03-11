use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use parking_lot::Mutex;
use rand::Rng;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::clicker::{self, MouseButton};
use crate::keyboard;
use crate::drag;

#[derive(Debug, Clone, Serialize)]
pub struct TelemetrySnapshot {
    pub cps: f64,
    pub target_cps: f64,
    pub total_clicks: u64,
    pub session_duration_ms: u64,
    pub min_cps: f64,
    pub max_cps: f64,
    pub avg_cps: f64,
    pub clicks_per_min: f64,
    pub recent_intervals: Vec<f64>,
    pub click_positions: Vec<(i32, i32)>,
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
pub struct SequenceStep {
    pub action: String, // "click_left", "click_right", "click_middle", "double_click", "key", "wait"
    pub delay_ms: u64,
    pub key: Option<String>,
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
    // Schedule
    #[serde(default)]
    pub start_delay_ms: u64,
    #[serde(default)]
    pub stop_after_ms: u64,
    // Anti-detection
    #[serde(default = "default_jitter_distribution")]
    pub jitter_distribution: String,
    #[serde(default)]
    pub position_jitter_radius: i32,
    // Mode
    #[serde(default = "default_mode")]
    pub mode: String,
    // Keyboard
    #[serde(default)]
    pub keyboard_key: String,
    // Hold/Drag
    #[serde(default)]
    pub hold_duration_ms: u64,
    #[serde(default)]
    pub drag_to_x: i32,
    #[serde(default)]
    pub drag_to_y: i32,
    // Hover-click
    #[serde(default = "default_hover_delay")]
    pub hover_delay_ms: u64,
    // Sequence
    #[serde(default)]
    pub sequence: Vec<SequenceStep>,
}

fn default_hover_delay() -> u64 { 500 }

fn default_jitter_distribution() -> String { "uniform".into() }
fn default_mode() -> String { "click".into() }

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
            start_delay_ms: 0,
            stop_after_ms: 0,
            jitter_distribution: "uniform".into(),
            position_jitter_radius: 0,
            mode: "click".into(),
            keyboard_key: String::new(),
            hold_duration_ms: 0,
            drag_to_x: 0,
            drag_to_y: 0,
            hover_delay_ms: 500,
            sequence: Vec::new(),
        }
    }
}

pub struct Engine {
    pub config: ClickConfig,
    pub running: bool,

    // Click tracking
    intervals: Vec<f64>,
    cps_history: Vec<f64>,
    last_click_time: Option<Instant>,
    pub tick_count: u64,
    pub session_start: Instant,

    // CPS measurement
    clicks_in_window: Vec<Instant>,

    // Statistics
    min_cps: f64,
    max_cps: f64,
    cps_sum: f64,
    cps_samples: u64,

    // Heatmap
    pub click_positions: Vec<(i32, i32)>,

    // Schedule tracking
    start_delay_done: bool,

    // Hold mode state machine
    hold_pressed_at: Option<Instant>,

    // Hover-click tracking
    last_cursor_pos: Option<(i32, i32)>,
    cursor_still_since: Option<Instant>,
    hover_clicked: bool,
}

impl Engine {
    pub fn new(config: ClickConfig) -> Self {
        Self {
            intervals: Vec::new(),
            cps_history: Vec::new(),
            last_click_time: None,
            tick_count: 0,
            session_start: Instant::now(),
            clicks_in_window: Vec::new(),
            min_cps: f64::MAX,
            max_cps: 0.0,
            cps_sum: 0.0,
            cps_samples: 0,
            click_positions: Vec::new(),
            start_delay_done: false,
            hold_pressed_at: None,
            last_cursor_pos: None,
            cursor_still_since: None,
            hover_clicked: false,
            config,
            running: false,
        }
    }

    fn measure_cps(&mut self) -> f64 {
        let now = Instant::now();
        self.clicks_in_window.retain(|t| now.duration_since(*t).as_secs_f64() < 1.0);
        self.clicks_in_window.len() as f64
    }

    fn record_cursor_pos(&mut self) {
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        use windows::Win32::Foundation::POINT;
        let mut pt = POINT::default();
        unsafe { let _ = GetCursorPos(&mut pt); }
        if self.click_positions.len() >= 500 {
            self.click_positions.remove(0);
        }
        self.click_positions.push((pt.x, pt.y));
    }

    fn update_stats(&mut self, cps: f64) {
        if cps > 0.0 {
            if cps < self.min_cps { self.min_cps = cps; }
            if cps > self.max_cps { self.max_cps = cps; }
            self.cps_sum += cps;
            self.cps_samples += 1;
        }
    }

    fn get_position(&self) -> Option<(i32, i32)> {
        match self.config.location_mode {
            LocationMode::Fixed => Some((self.config.fixed_x, self.config.fixed_y)),
            LocationMode::Cursor => None,
        }
    }

    fn apply_position_jitter(&self, pos: Option<(i32, i32)>) -> Option<(i32, i32)> {
        let r = self.config.position_jitter_radius;
        if r == 0 { return pos; }

        let mut rng = rand::thread_rng();
        let dx = rng.gen_range(-r..=r);
        let dy = rng.gen_range(-r..=r);

        match pos {
            Some((x, y)) => Some((x + dx, y + dy)),
            None => {
                // get current cursor pos and jitter it
                use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
                use windows::Win32::Foundation::POINT;
                let mut pt = POINT::default();
                unsafe { let _ = GetCursorPos(&mut pt); }
                Some((pt.x + dx, pt.y + dy))
            }
        }
    }

    fn do_click(&mut self) {
        let now = Instant::now();

        // Measure interval
        if let Some(last) = self.last_click_time {
            let interval = now.duration_since(last).as_secs_f64() * 1000.0;
            self.intervals.push(interval);
            if self.intervals.len() > 256 {
                self.intervals.remove(0);
            }
        }
        self.last_click_time = Some(now);
        self.clicks_in_window.push(now);

        let position = self.apply_position_jitter(self.get_position());

        match self.config.click_type {
            ClickType::Single => clicker::send_click_at(self.config.button, position),
            ClickType::Double => clicker::send_double_click_at(self.config.button, position),
        }

        self.record_cursor_pos();

        let cps = self.measure_cps();
        self.update_stats(cps);

        self.tick_count += 1;
    }

    fn do_keyboard(&mut self) {
        let now = Instant::now();
        if let Some(last) = self.last_click_time {
            let interval = now.duration_since(last).as_secs_f64() * 1000.0;
            self.intervals.push(interval);
            if self.intervals.len() > 256 { self.intervals.remove(0); }
        }
        self.last_click_time = Some(now);
        self.clicks_in_window.push(now);

        keyboard::send_key(&self.config.keyboard_key);

        let cps = self.measure_cps();
        self.update_stats(cps);
        self.tick_count += 1;
    }

    /// Returns true if a hover-click was fired this tick
    fn do_hover_check(&mut self) -> bool {
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        use windows::Win32::Foundation::POINT;
        let mut pt = POINT::default();
        unsafe { let _ = GetCursorPos(&mut pt); }
        let pos = (pt.x, pt.y);
        let now = Instant::now();

        let moved = match self.last_cursor_pos {
            Some(last) => last != pos,
            None => true,
        };
        self.last_cursor_pos = Some(pos);

        if moved {
            // Cursor moved — reset timer and allow clicking again
            self.cursor_still_since = Some(now);
            self.hover_clicked = false;
            return false;
        }

        // Cursor is still
        if self.hover_clicked {
            return false; // already clicked for this stop
        }

        let still_since = self.cursor_still_since.get_or_insert(now);
        let elapsed = now.duration_since(*still_since).as_millis() as u64;

        if elapsed >= self.config.hover_delay_ms {
            // Fire click
            self.hover_clicked = true;

            if let Some(last) = self.last_click_time {
                let interval = now.duration_since(last).as_secs_f64() * 1000.0;
                self.intervals.push(interval);
                if self.intervals.len() > 256 { self.intervals.remove(0); }
            }
            self.last_click_time = Some(now);
            self.clicks_in_window.push(now);

            match self.config.click_type {
                ClickType::Single => clicker::send_click_at(self.config.button, None),
                ClickType::Double => clicker::send_double_click_at(self.config.button, None),
            }

            self.record_cursor_pos();
            let cps = self.measure_cps();
            self.update_stats(cps);
            self.tick_count += 1;
            return true;
        }

        false
    }

    fn hold_press(&mut self) {
        let now = Instant::now();
        if let Some(last) = self.last_click_time {
            let interval = now.duration_since(last).as_secs_f64() * 1000.0;
            self.intervals.push(interval);
            if self.intervals.len() > 256 { self.intervals.remove(0); }
        }
        self.last_click_time = Some(now);
        self.clicks_in_window.push(now);

        let position = self.apply_position_jitter(self.get_position());
        if let Some((x, y)) = position {
            clicker::move_to(x, y);
        }

        drag::hold_button(self.config.button);
        self.hold_pressed_at = Some(now);
        self.record_cursor_pos();
    }

    fn hold_check_release(&mut self) -> bool {
        if let Some(pressed_at) = self.hold_pressed_at {
            let elapsed = Instant::now().duration_since(pressed_at).as_millis() as u64;
            if elapsed >= self.config.hold_duration_ms.max(1) {
                drag::release_button(self.config.button);
                self.hold_pressed_at = None;
                let cps = self.measure_cps();
                self.update_stats(cps);
                self.tick_count += 1;
                return true; // released, ready for next
            }
        }
        false
    }

    fn do_drag(&mut self) {
        let now = Instant::now();
        if let Some(last) = self.last_click_time {
            let interval = now.duration_since(last).as_secs_f64() * 1000.0;
            self.intervals.push(interval);
            if self.intervals.len() > 256 { self.intervals.remove(0); }
        }
        self.last_click_time = Some(now);
        self.clicks_in_window.push(now);

        let from = match self.config.location_mode {
            LocationMode::Fixed => (self.config.fixed_x, self.config.fixed_y),
            LocationMode::Cursor => {
                use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
                use windows::Win32::Foundation::POINT;
                let mut pt = POINT::default();
                unsafe { let _ = GetCursorPos(&mut pt); }
                (pt.x, pt.y)
            }
        };
        let to = (self.config.drag_to_x, self.config.drag_to_y);

        drag::drag_to(self.config.button, from, to, 20);

        self.record_cursor_pos();

        let cps = self.measure_cps();
        self.update_stats(cps);
        self.tick_count += 1;
    }

    fn compute_telemetry(&mut self) -> TelemetrySnapshot {
        let cps = self.measure_cps();
        let now = Instant::now();
        let session_ms = now.duration_since(self.session_start).as_millis() as u64;

        self.cps_history.push(cps);
        if self.cps_history.len() > 300 {
            self.cps_history.remove(0);
        }

        let avg_cps = if self.cps_samples > 0 { self.cps_sum / self.cps_samples as f64 } else { 0.0 };
        let clicks_per_min = if session_ms > 0 { self.tick_count as f64 / (session_ms as f64 / 60_000.0) } else { 0.0 };

        TelemetrySnapshot {
            cps,
            target_cps: self.config.target_cps,
            total_clicks: self.tick_count,
            session_duration_ms: session_ms,
            min_cps: if self.min_cps == f64::MAX { 0.0 } else { self.min_cps },
            max_cps: self.max_cps,
            avg_cps,
            clicks_per_min,
            recent_intervals: self.intervals.clone(),
            click_positions: self.click_positions.clone(),
        }
    }
}

pub type SharedEngine = Arc<Mutex<Engine>>;

pub fn create_engine(config: ClickConfig) -> SharedEngine {
    Arc::new(Mutex::new(Engine::new(config)))
}

/// Generate jitter based on distribution type
fn compute_jitter(distribution: &str, base_interval_ms: f64, humanizer_enabled: bool) -> f64 {
    if !humanizer_enabled { return 0.0; }

    let mut rng = rand::thread_rng();
    let scale = base_interval_ms * 0.15; // +/- 15%

    match distribution {
        "gaussian" => {
            // Box-Muller transform
            let u1: f64 = rng.gen::<f64>().max(1e-10);
            let u2: f64 = rng.gen::<f64>();
            let z = (-2.0 * u1.ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos();
            z * scale * 0.33 // ~99% within +/- scale
        }
        "poisson" => {
            // Inverse transform sampling for exponential-like jitter
            let u: f64 = rng.gen::<f64>().max(1e-10);
            let lambda = 1.0 / scale.max(1.0);
            (-u.ln() / lambda) - scale // center around 0
        }
        _ => {
            // uniform
            rng.gen_range(-scale..scale)
        }
    }
}

/// Execute a sequence step, returns true if a "click" action was performed
fn execute_sequence_step(step: &SequenceStep, engine: &SharedEngine) {
    match step.action.as_str() {
        "click_left" => {
            let mut eng = engine.lock();
            let pos = eng.apply_position_jitter(eng.get_position());
            clicker::send_click_at(MouseButton::Left, pos);
            eng.record_cursor_pos();
            eng.clicks_in_window.push(Instant::now());
            eng.tick_count += 1;
            let cps = eng.measure_cps();
            eng.update_stats(cps);
        }
        "click_right" => {
            let mut eng = engine.lock();
            let pos = eng.apply_position_jitter(eng.get_position());
            clicker::send_click_at(MouseButton::Right, pos);
            eng.record_cursor_pos();
            eng.clicks_in_window.push(Instant::now());
            eng.tick_count += 1;
            let cps = eng.measure_cps();
            eng.update_stats(cps);
        }
        "click_middle" => {
            let mut eng = engine.lock();
            let pos = eng.apply_position_jitter(eng.get_position());
            clicker::send_click_at(MouseButton::Middle, pos);
            eng.record_cursor_pos();
            eng.clicks_in_window.push(Instant::now());
            eng.tick_count += 1;
            let cps = eng.measure_cps();
            eng.update_stats(cps);
        }
        "double_click" => {
            let mut eng = engine.lock();
            let pos = eng.apply_position_jitter(eng.get_position());
            clicker::send_double_click_at(MouseButton::Left, pos);
            eng.record_cursor_pos();
            eng.clicks_in_window.push(Instant::now());
            eng.tick_count += 1;
            let cps = eng.measure_cps();
            eng.update_stats(cps);
        }
        "key" => {
            if let Some(ref k) = step.key {
                keyboard::send_key(k);
                let mut eng = engine.lock();
                eng.tick_count += 1;
            }
        }
        "wait" => {
            // delay_ms handles the wait
        }
        _ => {}
    }
}

/// Main click loop — runs on a dedicated OS thread with spin_sleep for precision.
/// Windows default timer resolution is ~15.6ms which makes tokio::sleep useless
/// for high CPS. We use timeBeginPeriod(1) + spin_sleep for sub-ms accuracy.
pub fn spawn_click_loop(engine: SharedEngine, app: AppHandle, stop_flag: Arc<AtomicBool>) {
    std::thread::Builder::new()
        .name("click-engine".into())
        .spawn(move || {
            // Set Windows timer resolution to 1ms
            #[cfg(windows)]
            unsafe {
                windows::Win32::Media::timeBeginPeriod(1);
            }

            let mut candle_open = 0.0_f64;
            let mut candle_high = 0.0_f64;
            let mut candle_low = f64::MAX;
            let mut candle_ticks = 0u32;
            let candle_period = 25;
            let mut telemetry_counter = 0u32;
            let mut session_started = false;

            loop {
                if stop_flag.load(Ordering::Relaxed) {
                    break;
                }

                let (should_run, interval_ms, config_snapshot) = {
                    let eng = engine.lock();
                    (
                        eng.running,
                        1000.0 / eng.config.target_cps.max(0.1),
                        eng.config.clone(),
                    )
                };

                if !should_run {
                    session_started = false;
                    std::thread::sleep(Duration::from_millis(50));
                    continue;
                }

                // Handle start delay
                if !session_started {
                    session_started = true;
                    if config_snapshot.start_delay_ms > 0 {
                        spin_sleep::sleep(Duration::from_millis(config_snapshot.start_delay_ms));
                        if !engine.lock().running { continue; }
                    }
                }

                // Check stop_after_ms
                if config_snapshot.stop_after_ms > 0 {
                    let elapsed = {
                        let eng = engine.lock();
                        Instant::now().duration_since(eng.session_start).as_millis() as u64
                    };
                    if elapsed >= config_snapshot.stop_after_ms {
                        let mut eng = engine.lock();
                        eng.running = false;
                        let _ = app.emit("engine-status", "idle");
                        continue;
                    }
                }

                // Check repeat count
                {
                    let eng = engine.lock();
                    if config_snapshot.repeat_mode == RepeatMode::Count && eng.tick_count >= config_snapshot.repeat_count {
                        drop(eng);
                        let mut eng = engine.lock();
                        eng.running = false;
                        let _ = app.emit("engine-status", "idle");
                        continue;
                    }
                }

                // Sequence mode
                if !config_snapshot.sequence.is_empty() && config_snapshot.mode == "click" {
                    for step in &config_snapshot.sequence {
                        if !engine.lock().running { break; }
                        execute_sequence_step(step, &engine);
                        if step.delay_ms > 0 {
                            spin_sleep::sleep(Duration::from_millis(step.delay_ms));
                        }
                    }
                } else {
                    // Normal mode dispatch
                    match config_snapshot.mode.as_str() {
                        "keyboard" => { engine.lock().do_keyboard(); }
                        "hold" => {
                    let mut eng = engine.lock();
                    if eng.hold_pressed_at.is_some() {
                        // Check if hold duration elapsed
                        if !eng.hold_check_release() {
                            drop(eng);
                            // Still holding — short sleep, keep telemetry flowing
                            spin_sleep::sleep(Duration::from_millis(5));
                            // skip the normal sleep at bottom
                            telemetry_counter += 1;
                            if telemetry_counter >= 5 {
                                telemetry_counter = 0;
                                let telemetry = { engine.lock().compute_telemetry() };
                                let cps = telemetry.cps;
                                if candle_ticks == 0 { candle_open = cps; candle_high = cps; candle_low = cps; }
                                candle_high = candle_high.max(cps);
                                candle_low = candle_low.min(cps);
                                candle_ticks += 1;
                                if candle_ticks >= candle_period {
                                    let candle = CandleData { time: chrono::Utc::now().timestamp(), open: candle_open, high: candle_high, low: candle_low, close: cps };
                                    let _ = app.emit("candle", &candle);
                                    candle_ticks = 0; candle_high = 0.0; candle_low = f64::MAX;
                                }
                                let _ = app.emit("telemetry", &telemetry);
                            }
                            continue;
                        }
                    } else {
                        eng.hold_press();
                    }
                }
                        "drag" => { engine.lock().do_drag(); }
                        "hover" => {
                            engine.lock().do_hover_check();
                        }
                        _ => { engine.lock().do_click(); }
                    }
                }

                // Emit telemetry every 5 ticks
                telemetry_counter += 1;
                if telemetry_counter >= 5 {
                    telemetry_counter = 0;
                    let telemetry = {
                        let mut eng = engine.lock();
                        eng.compute_telemetry()
                    };

                    let cps = telemetry.cps;

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

                // Precise sleep with jitter — spin_sleep handles sub-ms accuracy
                let jitter = compute_jitter(
                    &config_snapshot.jitter_distribution,
                    interval_ms,
                    config_snapshot.humanizer_enabled,
                );
                let sleep_ns = ((interval_ms + jitter).max(0.5) * 1_000_000.0) as u64;
                spin_sleep::sleep(Duration::from_nanos(sleep_ns));
            }

            #[cfg(windows)]
            unsafe {
                windows::Win32::Media::timeEndPeriod(1);
            }
        })
        .expect("failed to spawn click engine thread");
}

pub fn start_engine(engine: &SharedEngine, config: ClickConfig) {
    let mut eng = engine.lock();
    eng.config = config;
    eng.running = true;
    eng.tick_count = 0;
    eng.session_start = Instant::now();
    eng.last_click_time = None;
    eng.intervals.clear();
    eng.clicks_in_window.clear();
    eng.cps_history.clear();
    eng.click_positions.clear();
    eng.min_cps = f64::MAX;
    eng.max_cps = 0.0;
    eng.cps_sum = 0.0;
    eng.cps_samples = 0;
    eng.start_delay_done = false;
}

pub fn stop_engine(engine: &SharedEngine) {
    let mut eng = engine.lock();
    eng.running = false;
}

pub fn update_config(engine: &SharedEngine, config: ClickConfig) {
    let mut eng = engine.lock();
    eng.config = config;
}
