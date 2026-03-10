use serde::Serialize;

/// Bayesian Online Change-Point Detection.
/// Detects when the click "regime" shifts (e.g. system load change, alt-tab, etc.)
pub struct Bocpd {
    /// Run-length probabilities
    run_lengths: Vec<f64>,
    /// Observation model: online mean/variance
    mean: f64,
    var: f64,
    count: f64,
    /// Hazard rate (1/expected_run_length)
    hazard: f64,
    /// Current detected regime
    pub regime: Regime,
    /// Most probable run length
    pub run_length: usize,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
pub enum Regime {
    #[serde(rename = "STABLE")]
    Stable,
    #[serde(rename = "TRANSITIONING")]
    Transitioning,
    #[serde(rename = "VOLATILE")]
    Volatile,
}

impl std::fmt::Display for Regime {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Regime::Stable => write!(f, "STABLE"),
            Regime::Transitioning => write!(f, "TRANSITIONING"),
            Regime::Volatile => write!(f, "VOLATILE"),
        }
    }
}

impl Bocpd {
    pub fn new() -> Self {
        Self {
            run_lengths: vec![1.0],
            mean: 0.0,
            var: 1.0,
            count: 0.0,
            hazard: 1.0 / 100.0, // expect change every ~100 observations
            regime: Regime::Stable,
            run_length: 0,
        }
    }

    pub fn observe(&mut self, value: f64) {
        let n = self.run_lengths.len();

        // Predictive probability under current model (Gaussian)
        let pred_probs: Vec<f64> = (0..n)
            .map(|_| gaussian_pdf(value, self.mean, self.var.max(0.01)))
            .collect();

        // Growth probabilities
        let mut new_rl = vec![0.0; n + 1];
        for i in 0..n {
            new_rl[i + 1] = self.run_lengths[i] * pred_probs[i] * (1.0 - self.hazard);
        }

        // Change-point probability
        let cp_prob: f64 = (0..n)
            .map(|i| self.run_lengths[i] * pred_probs[i] * self.hazard)
            .sum();
        new_rl[0] = cp_prob;

        // Normalize
        let total: f64 = new_rl.iter().sum();
        if total > 0.0 {
            for v in &mut new_rl {
                *v /= total;
            }
        }

        // Keep only top 200 run lengths to bound memory
        if new_rl.len() > 200 {
            new_rl.truncate(200);
            let total: f64 = new_rl.iter().sum();
            if total > 0.0 {
                for v in &mut new_rl {
                    *v /= total;
                }
            }
        }

        self.run_lengths = new_rl;

        // Update online statistics
        self.count += 1.0;
        let delta = value - self.mean;
        self.mean += delta / self.count;
        let delta2 = value - self.mean;
        self.var = ((self.count - 1.0) * self.var + delta * delta2) / self.count;

        // Find most probable run length
        self.run_length = self
            .run_lengths
            .iter()
            .enumerate()
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
            .map(|(i, _)| i)
            .unwrap_or(0);

        // Determine regime
        self.regime = if self.run_lengths[0] > 0.3 {
            Regime::Transitioning
        } else if self.run_length < 5 {
            Regime::Volatile
        } else {
            Regime::Stable
        };
    }

    pub fn reset(&mut self) {
        *self = Self::new();
    }
}

fn gaussian_pdf(x: f64, mean: f64, var: f64) -> f64 {
    let diff = x - mean;
    let exponent = -0.5 * diff * diff / var;
    (1.0 / (2.0 * std::f64::consts::PI * var).sqrt()) * exponent.exp()
}
