use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct PidState {
    pub p: f64,
    pub i: f64,
    pub d: f64,
    pub output: f64,
    pub error: f64,
}

pub struct PidController {
    kp: f64,
    ki: f64,
    kd: f64,
    integral: f64,
    prev_error: f64,
    output_min: f64,
    output_max: f64,
}

impl PidController {
    pub fn new() -> Self {
        // Ziegler-Nichols aggressive tuning
        Self {
            kp: 0.6,
            ki: 0.15,
            kd: 0.08,
            integral: 0.0,
            prev_error: 0.0,
            output_min: -50.0,
            output_max: 50.0,
        }
    }

    pub fn update(&mut self, setpoint: f64, measured: f64, dt: f64) -> PidState {
        let error = setpoint - measured;

        self.integral += error * dt;
        // Anti-windup clamp
        self.integral = self.integral.clamp(-10.0, 10.0);

        let derivative = if dt > 0.0 {
            (error - self.prev_error) / dt
        } else {
            0.0
        };
        self.prev_error = error;

        let p = self.kp * error;
        let i = self.ki * self.integral;
        let d = self.kd * derivative;
        let output = (p + i + d).clamp(self.output_min, self.output_max);

        PidState {
            p,
            i,
            d,
            output,
            error,
        }
    }

    pub fn reset(&mut self) {
        self.integral = 0.0;
        self.prev_error = 0.0;
    }
}
