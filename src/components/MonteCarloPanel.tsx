import { motion } from 'framer-motion';
import { Card } from './Card';
import { BigNumber } from './BigNumber';
import { useClickStore } from '../store/clickStore';

export function MonteCarloPanel() {
  const monte_carlo_p5 = useClickStore((s) => s.telemetry.monte_carlo_p5);
  const monte_carlo_p50 = useClickStore((s) => s.telemetry.monte_carlo_p50);
  const monte_carlo_p95 = useClickStore((s) => s.telemetry.monte_carlo_p95);

  // Fan chart visualization — confidence bands
  const bands = [
    { label: 'P95', value: monte_carlo_p95, opacity: 0.08 },
    { label: 'P75', value: (monte_carlo_p50 + monte_carlo_p95) / 2, opacity: 0.12 },
    { label: 'P50', value: monte_carlo_p50, opacity: 0.2 },
    { label: 'P25', value: (monte_carlo_p5 + monte_carlo_p50) / 2, opacity: 0.12 },
    { label: 'P5', value: monte_carlo_p5, opacity: 0.08 },
  ];

  const maxVal = Math.max(monte_carlo_p95, 1);

  return (
    <Card label="[MONTE CARLO]" delay={0.4} span="monte">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Fan chart (simplified as horizontal bars) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {bands.map((band, i) => (
            <div key={band.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono text-tertiary" style={{ fontSize: 8, width: 24 }}>
                {band.label}
              </span>
              <div style={{ flex: 1, height: i === 2 ? 8 : 6, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(band.value / maxVal) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    height: '100%',
                    background: i === 2 ? 'var(--green)' : `rgba(74, 222, 128, ${band.opacity + 0.15})`,
                    borderRadius: 2,
                  }}
                />
              </div>
              <span className="mono" style={{ fontSize: 9, width: 36, textAlign: 'right', color: i === 2 ? 'var(--green)' : 'var(--text-secondary)' }}>
                {band.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Median forecast */}
        <div style={{ borderTop: '1px dashed var(--border-dashed)', paddingTop: 8 }}>
          <div className="mono text-tertiary" style={{ fontSize: 8 }}>MEDIAN FORECAST</div>
          <BigNumber value={monte_carlo_p50} suffix=" CPS" />
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          10,000 SIMULATED FUTURES / 30s HORIZON
        </div>
      </div>
    </Card>
  );
}
