use serde::Serialize;

/// Holt-Winters triple exponential smoothing for CPS "weather" forecasting.
pub struct HoltWinters {
    level: f64,
    trend: f64,
    seasonal: Vec<f64>,
    season_len: usize,
    idx: usize,
    alpha: f64, // level smoothing
    beta: f64,  // trend smoothing
    gamma: f64, // seasonal smoothing
    pub forecast: f64,
    initialized: bool,
    buffer: Vec<f64>,
}

#[derive(Serialize)]
pub struct WeatherState {
    pub forecast_cps: f64,
    pub trend: &'static str,
    pub condition: &'static str,
}

impl HoltWinters {
    pub fn new() -> Self {
        let season_len = 10; // 10-sample seasonality
        Self {
            level: 0.0,
            trend: 0.0,
            seasonal: vec![0.0; season_len],
            season_len,
            idx: 0,
            alpha: 0.3,
            beta: 0.1,
            gamma: 0.1,
            forecast: 0.0,
            initialized: false,
            buffer: Vec::new(),
        }
    }

    pub fn observe(&mut self, value: f64) {
        if !self.initialized {
            self.buffer.push(value);
            if self.buffer.len() >= self.season_len * 2 {
                self.initialize();
            } else {
                self.forecast = value;
                return;
            }
        }

        let s_idx = self.idx % self.season_len;

        // Update level
        let new_level =
            self.alpha * (value - self.seasonal[s_idx]) + (1.0 - self.alpha) * (self.level + self.trend);

        // Update trend
        let new_trend = self.beta * (new_level - self.level) + (1.0 - self.beta) * self.trend;

        // Update seasonal
        self.seasonal[s_idx] =
            self.gamma * (value - new_level) + (1.0 - self.gamma) * self.seasonal[s_idx];

        self.level = new_level;
        self.trend = new_trend;
        self.idx += 1;

        // Forecast 5 steps ahead
        let future_s_idx = (self.idx + 5) % self.season_len;
        self.forecast = self.level + 5.0 * self.trend + self.seasonal[future_s_idx];
    }

    fn initialize(&mut self) {
        let n = self.season_len;
        // Initial level = mean of first season
        self.level = self.buffer[..n].iter().sum::<f64>() / n as f64;

        // Initial trend = average difference between seasons
        let season2_mean: f64 = self.buffer[n..2 * n].iter().sum::<f64>() / n as f64;
        self.trend = (season2_mean - self.level) / n as f64;

        // Initial seasonal = deviation from level
        for i in 0..n {
            self.seasonal[i] = self.buffer[i] - self.level;
        }

        self.initialized = true;
        self.forecast = self.level;

        // Replay buffer
        let buf = std::mem::take(&mut self.buffer);
        for v in buf {
            self.observe(v);
        }
    }

    pub fn reset(&mut self) {
        *self = Self::new();
    }
}
