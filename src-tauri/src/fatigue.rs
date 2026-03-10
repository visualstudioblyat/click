use serde::Serialize;

/// Spring-damper biomechanical model of finger tendon stress.
/// Models the index finger as a mass-spring-damper system.
#[derive(Debug)]
pub struct FatigueModel {
    // Spring-damper parameters
    spring_k: f64,       // Spring constant (N/m)
    damper_c: f64,       // Damping coefficient (Ns/m)
    mass: f64,           // Effective finger mass (kg)

    // State
    displacement: f64,   // Current spring displacement
    velocity: f64,       // Current velocity
    stress: f64,         // Cumulative stress (0-1)
    recovery_rate: f64,  // Recovery per second when idle
    total_clicks: u64,
    session_start: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FatigueState {
    pub tendon_stress: f64,
    pub recovery_pct: f64,
    pub spring_displacement: f64,
    pub damper_velocity: f64,
    pub rupture_risk: f64,
}

impl FatigueModel {
    pub fn new() -> Self {
        Self {
            spring_k: 25.0,     // N/m (finger tendon stiffness)
            damper_c: 2.0,      // Ns/m
            mass: 0.02,         // 20g effective mass
            displacement: 0.0,
            velocity: 0.0,
            stress: 0.0,
            recovery_rate: 0.005, // Recover 0.5% per second when idle
            total_clicks: 0,
            session_start: 0.0,
        }
    }

    /// Simulate a click impulse + dt of recovery
    pub fn tick(&mut self, clicked: bool, dt: f64) {
        if clicked {
            // Apply click impulse (force = spring_k * click_distance)
            let click_distance = 0.004; // 4mm key travel
            self.velocity += (self.spring_k * click_distance) / self.mass;
            self.total_clicks += 1;

            // Accumulate micro-damage
            self.stress += 0.0002; // Each click adds tiny stress
        }

        // Simulate spring-damper dynamics
        let spring_force = -self.spring_k * self.displacement;
        let damper_force = -self.damper_c * self.velocity;
        let acceleration = (spring_force + damper_force) / self.mass;

        self.velocity += acceleration * dt;
        self.displacement += self.velocity * dt;

        // Natural recovery
        self.stress = (self.stress - self.recovery_rate * dt).max(0.0);

        // Clamp stress to 0-1
        self.stress = self.stress.min(1.0);
    }

    pub fn state(&self) -> FatigueState {
        let rupture_risk = if self.stress > 0.7 {
            (self.stress - 0.7) / 0.3 // Linear ramp from 70% stress
        } else {
            0.0
        };

        FatigueState {
            tendon_stress: self.stress,
            recovery_pct: 1.0 - self.stress,
            spring_displacement: self.displacement.abs(),
            damper_velocity: self.velocity.abs(),
            rupture_risk: rupture_risk.min(1.0),
        }
    }

    pub fn set_session_start(&mut self, t: f64) {
        self.session_start = t;
    }

    pub fn reset(&mut self) {
        *self = Self::new();
    }
}
