use rand::Rng;

/// Monte Carlo simulation of click futures.
/// Runs 10,000 simulated click sequences to produce confidence intervals.
pub struct MonteCarlo {
    pub p5: f64,
    pub p50: f64,
    pub p95: f64,
}

impl MonteCarlo {
    pub fn simulate(current_cps: f64, trend: f64, volatility: f64, horizon_steps: usize) -> Self {
        let n_sims = 10_000;
        let mut rng = rand::thread_rng();
        let mut endpoints = Vec::with_capacity(n_sims);

        for _ in 0..n_sims {
            let mut cps = current_cps;
            for _ in 0..horizon_steps {
                // Geometric Brownian motion-like model
                let drift = trend * 0.01;
                let shock = rng.gen::<f64>() * 2.0 - 1.0; // uniform [-1, 1]
                cps = (cps + drift + shock * volatility).max(0.0);
            }
            endpoints.push(cps);
        }

        endpoints.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let p5_idx = (n_sims as f64 * 0.05) as usize;
        let p50_idx = n_sims / 2;
        let p95_idx = (n_sims as f64 * 0.95) as usize;

        Self {
            p5: endpoints[p5_idx],
            p50: endpoints[p50_idx],
            p95: endpoints[p95_idx],
        }
    }
}
