use serde::Serialize;

/// OSHA compliance monitoring per 29 CFR 1910.217(e)(2).
/// Tracks cumulative strain index and enforces mandatory breaks.
pub struct OshaMonitor {
    total_clicks: u64,
    session_start_ms: f64,
    last_break_ms: f64,
    strain_index: f64,
    break_needed: bool,
    violations: Vec<OshaViolation>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OshaViolation {
    pub timestamp: f64,
    pub violation_type: String,
    pub severity: String,
    pub description: String,
}

impl OshaMonitor {
    pub fn new() -> Self {
        Self {
            total_clicks: 0,
            session_start_ms: 0.0,
            last_break_ms: 0.0,
            strain_index: 0.0,
            break_needed: false,
            violations: Vec::new(),
        }
    }

    pub fn record_click(&mut self, timestamp_ms: f64, cps: f64) {
        self.total_clicks += 1;

        // Strain accumulates based on CPS and duration
        let intensity_factor = (cps / 20.0).min(1.0); // 20 CPS = max intensity
        self.strain_index = (self.strain_index + 0.001 * (1.0 + intensity_factor)).min(1.0);

        // Check break requirements (every 10 minutes per "regulation")
        let minutes_since_break = (timestamp_ms - self.last_break_ms) / 60_000.0;
        if minutes_since_break > 10.0 && !self.break_needed {
            self.break_needed = true;
            self.violations.push(OshaViolation {
                timestamp: timestamp_ms,
                violation_type: "MANDATORY_BREAK".to_string(),
                severity: "critical".to_string(),
                description: format!(
                    "Employee exceeded {} clicks without mandated 15-minute break per 29 CFR 1910.217(e)(2)",
                    self.total_clicks
                ),
            });
        }

        // High strain warning
        if self.strain_index > 0.7 && self.violations.last().map_or(true, |v| v.violation_type != "HIGH_STRAIN") {
            self.violations.push(OshaViolation {
                timestamp: timestamp_ms,
                violation_type: "HIGH_STRAIN".to_string(),
                severity: "warning".to_string(),
                description: format!(
                    "Cumulative strain index {:.0}% exceeds recommended threshold of 70%",
                    self.strain_index * 100.0
                ),
            });
        }
    }

    pub fn take_break(&mut self, timestamp_ms: f64) {
        self.last_break_ms = timestamp_ms;
        self.break_needed = false;
        // Partial recovery during break
        self.strain_index = (self.strain_index - 0.3).max(0.0);
    }

    pub fn strain_index(&self) -> f64 {
        self.strain_index
    }

    pub fn break_needed(&self) -> bool {
        self.break_needed
    }

    pub fn start_session(&mut self, timestamp_ms: f64) {
        self.session_start_ms = timestamp_ms;
        self.last_break_ms = timestamp_ms;
    }

    pub fn session_duration_ms(&self, now: f64) -> f64 {
        now - self.session_start_ms
    }

    pub fn total_clicks(&self) -> u64 {
        self.total_clicks
    }

    pub fn reset(&mut self) {
        *self = Self::new();
    }
}
