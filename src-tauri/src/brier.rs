/// Brier score — proper scoring rule for click prediction calibration.
/// Tracks how well the system predicts its own click success rate.
pub struct BrierTracker {
    sum_squared_error: f64,
    count: f64,
}

impl BrierTracker {
    pub fn new() -> Self {
        Self {
            sum_squared_error: 0.0,
            count: 0.0,
        }
    }

    /// Record a prediction and outcome.
    /// `predicted`: probability of a successful click (0-1)
    /// `actual`: 1.0 if click was on time, 0.0 if it wasn't
    pub fn observe(&mut self, predicted: f64, actual: f64) {
        let error = predicted - actual;
        self.sum_squared_error += error * error;
        self.count += 1.0;
    }

    pub fn score(&self) -> f64 {
        if self.count > 0.0 {
            self.sum_squared_error / self.count
        } else {
            0.5 // Prior: no information
        }
    }

    pub fn reset(&mut self) {
        *self = Self::new();
    }
}
