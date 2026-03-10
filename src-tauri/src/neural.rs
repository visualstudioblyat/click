use rand::Rng;
use serde::Serialize;

/// Hand-rolled 4→8→8→1 feedforward neural network.
/// Learns to predict "humanized" click jitter from timing features.
/// No dependencies. Just math.
pub struct NeuralNet {
    // Weights
    w1: [[f64; 4]; 8],   // input → hidden1
    b1: [f64; 8],
    w2: [[f64; 8]; 8],   // hidden1 → hidden2
    b2: [f64; 8],
    w3: [f64; 8],         // hidden2 → output
    b3: f64,

    // Training state
    learning_rate: f64,
    pub loss: f64,
}

#[derive(Serialize)]
pub struct NeuralState {
    pub loss: f64,
    pub architecture: &'static str,
}

impl NeuralNet {
    pub fn new() -> Self {
        let mut rng = rand::thread_rng();
        let mut net = Self {
            w1: [[0.0; 4]; 8],
            b1: [0.0; 8],
            w2: [[0.0; 8]; 8],
            b2: [0.0; 8],
            w3: [0.0; 8],
            b3: 0.0,
            learning_rate: 0.01,
            loss: 1.0,
        };

        // Xavier initialization
        let scale1 = (2.0 / 4.0_f64).sqrt();
        let scale2 = (2.0 / 8.0_f64).sqrt();
        let scale3 = (2.0 / 8.0_f64).sqrt();

        for row in &mut net.w1 {
            for w in row.iter_mut() {
                *w = (rng.gen::<f64>() - 0.5) * 2.0 * scale1;
            }
        }
        for row in &mut net.w2 {
            for w in row.iter_mut() {
                *w = (rng.gen::<f64>() - 0.5) * 2.0 * scale2;
            }
        }
        for w in &mut net.w3 {
            *w = (rng.gen::<f64>() - 0.5) * 2.0 * scale3;
        }

        net
    }

    /// Forward pass: [interval_ratio, entropy, pid_error, cps_ratio] → jitter_factor
    pub fn forward(&self, input: &[f64; 4]) -> f64 {
        // Hidden layer 1
        let mut h1 = [0.0; 8];
        for i in 0..8 {
            let mut sum = self.b1[i];
            for j in 0..4 {
                sum += self.w1[i][j] * input[j];
            }
            h1[i] = relu(sum);
        }

        // Hidden layer 2
        let mut h2 = [0.0; 8];
        for i in 0..8 {
            let mut sum = self.b2[i];
            for j in 0..8 {
                sum += self.w2[i][j] * h1[j];
            }
            h2[i] = relu(sum);
        }

        // Output (sigmoid to bound 0-1)
        let mut out = self.b3;
        for i in 0..8 {
            out += self.w3[i] * h2[i];
        }
        sigmoid(out)
    }

    /// Train on a single example with backpropagation.
    /// target = what the jitter "should" have been (based on observed human patterns)
    pub fn train(&mut self, input: &[f64; 4], target: f64) {
        // Forward pass (saving activations)
        let mut h1 = [0.0; 8];
        let mut h1_pre = [0.0; 8];
        for i in 0..8 {
            let mut sum = self.b1[i];
            for j in 0..4 {
                sum += self.w1[i][j] * input[j];
            }
            h1_pre[i] = sum;
            h1[i] = relu(sum);
        }

        let mut h2 = [0.0; 8];
        let mut h2_pre = [0.0; 8];
        for i in 0..8 {
            let mut sum = self.b2[i];
            for j in 0..8 {
                sum += self.w2[i][j] * h1[j];
            }
            h2_pre[i] = sum;
            h2[i] = relu(sum);
        }

        let mut out_pre = self.b3;
        for i in 0..8 {
            out_pre += self.w3[i] * h2[i];
        }
        let output = sigmoid(out_pre);

        // MSE loss
        let error = output - target;
        self.loss = self.loss * 0.99 + error * error * 0.01; // EMA

        // Backprop: output layer
        let d_out = error * sigmoid_deriv(out_pre);
        let lr = self.learning_rate;

        for i in 0..8 {
            self.w3[i] -= lr * d_out * h2[i];
        }
        self.b3 -= lr * d_out;

        // Backprop: hidden2
        let mut d_h2 = [0.0; 8];
        for i in 0..8 {
            d_h2[i] = d_out * self.w3[i] * relu_deriv(h2_pre[i]);
        }
        for i in 0..8 {
            for j in 0..8 {
                self.w2[i][j] -= lr * d_h2[i] * h1[j];
            }
            self.b2[i] -= lr * d_h2[i];
        }

        // Backprop: hidden1
        let mut d_h1 = [0.0; 8];
        for i in 0..8 {
            let mut sum = 0.0;
            for j in 0..8 {
                sum += d_h2[j] * self.w2[j][i];
            }
            d_h1[i] = sum * relu_deriv(h1_pre[i]);
        }
        for i in 0..8 {
            for j in 0..4 {
                self.w1[i][j] -= lr * d_h1[i] * input[j];
            }
            self.b1[i] -= lr * d_h1[i];
        }
    }

    pub fn state(&self) -> NeuralState {
        NeuralState {
            loss: self.loss,
            architecture: "4->8->8->1",
        }
    }
}

#[inline]
fn relu(x: f64) -> f64 {
    x.max(0.0)
}

#[inline]
fn relu_deriv(x: f64) -> f64 {
    if x > 0.0 { 1.0 } else { 0.0 }
}

#[inline]
fn sigmoid(x: f64) -> f64 {
    1.0 / (1.0 + (-x).exp())
}

#[inline]
fn sigmoid_deriv(x: f64) -> f64 {
    let s = sigmoid(x);
    s * (1.0 - s)
}
