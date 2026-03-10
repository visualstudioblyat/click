use rand::Rng;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct BayesianState {
    pub alpha: f64,
    pub beta: f64,
    pub optimal_interval_ms: f64,
    pub confidence: f64,
}

/// Beta-Bernoulli conjugate model with Thompson sampling
/// for "optimizing" click intervals.
pub struct BayesianOptimizer {
    alpha: f64,
    beta: f64,
    // Track what we consider a "successful" click interval
    target_interval_ms: f64,
    tolerance_ms: f64,
    best_interval: f64,
}

impl BayesianOptimizer {
    pub fn new(target_cps: f64) -> Self {
        let interval = 1000.0 / target_cps;
        Self {
            alpha: 1.0,
            beta: 1.0,
            target_interval_ms: interval,
            tolerance_ms: interval * 0.1, // 10% tolerance
            best_interval: interval,
        }
    }

    pub fn observe(&mut self, actual_interval_ms: f64) {
        // "Success" = click landed within tolerance of target
        let within = (actual_interval_ms - self.target_interval_ms).abs() < self.tolerance_ms;
        if within {
            self.alpha += 1.0;
        } else {
            self.beta += 1.0;
        }

        // Thompson sampling: draw from posterior to pick next interval
        let mut rng = rand::thread_rng();
        let sample = beta_sample(&mut rng, self.alpha, self.beta);
        // Map sample to interval adjustment
        self.best_interval = self.target_interval_ms * (0.9 + sample * 0.2);
    }

    pub fn set_target(&mut self, target_cps: f64) {
        self.target_interval_ms = 1000.0 / target_cps;
        self.tolerance_ms = self.target_interval_ms * 0.1;
    }

    pub fn suggested_interval(&self) -> f64 {
        self.best_interval
    }

    pub fn state(&self) -> BayesianState {
        let total = self.alpha + self.beta;
        BayesianState {
            alpha: self.alpha,
            beta: self.beta,
            optimal_interval_ms: self.best_interval,
            confidence: if total > 2.0 {
                1.0 - 2.0 / total
            } else {
                0.0
            },
        }
    }

    pub fn reset(&mut self) {
        self.alpha = 1.0;
        self.beta = 1.0;
    }
}

/// Approximate Beta distribution sample using Jöhnk's algorithm
fn beta_sample(rng: &mut impl Rng, alpha: f64, beta: f64) -> f64 {
    // Use gamma ratio method
    let x = gamma_sample(rng, alpha);
    let y = gamma_sample(rng, beta);
    if x + y > 0.0 {
        x / (x + y)
    } else {
        0.5
    }
}

/// Simple gamma sample using Marsaglia and Tsang's method
fn gamma_sample(rng: &mut impl Rng, shape: f64) -> f64 {
    if shape < 1.0 {
        let u: f64 = rng.gen();
        return gamma_sample(rng, shape + 1.0) * u.powf(1.0 / shape);
    }
    let d = shape - 1.0 / 3.0;
    let c = 1.0 / (9.0 * d).sqrt();
    loop {
        let x: f64 = standard_normal(rng);
        let v = (1.0 + c * x).powi(3);
        if v > 0.0 {
            let u: f64 = rng.gen();
            if u < 1.0 - 0.0331 * x.powi(4)
                || u.ln() < 0.5 * x * x + d * (1.0 - v + v.ln())
            {
                return d * v;
            }
        }
    }
}

fn standard_normal(rng: &mut impl Rng) -> f64 {
    // Box-Muller
    let u1: f64 = rng.gen();
    let u2: f64 = rng.gen();
    (-2.0 * u1.ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos()
}
