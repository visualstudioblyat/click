import { motion } from 'framer-motion';
import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { useClickStore } from '../store/clickStore';

export function BayesianPanel() {
  const bayesian = useClickStore((s) => s.telemetry.bayesian);

  // Beta distribution visualization (simplified as a shape)
  const { alpha, beta } = bayesian;
  const mean = alpha / (alpha + beta);

  // Generate beta PDF approximation for visualization
  const points = Array.from({ length: 50 }, (_, i) => {
    const x = i / 49;
    // Simplified beta PDF shape
    const y = Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1);
    return { x, y };
  });
  const maxY = Math.max(...points.map((p) => p.y), 0.01);
  const normalized = points.map((p) => ({ x: p.x, y: p.y / maxY }));

  const pathD = normalized
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 160} ${60 - p.y * 50}`)
    .join(' ');

  const fillD = pathD + ` L 160 60 L 0 60 Z`;

  return (
    <Card label="[BAYESIAN OPTIMIZER]" delay={0.15} span="bayes">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Beta distribution curve */}
        <svg width="100%" height="65" viewBox="0 0 160 65" preserveAspectRatio="none">
          {/* Fill */}
          <motion.path
            d={fillD}
            fill="var(--green-dim)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          {/* Line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--green)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          />
          {/* Mean line */}
          <line
            x1={mean * 160}
            y1="0"
            x2={mean * 160}
            y2="60"
            stroke="var(--text-tertiary)"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>ALPHA</div>
            <div className="mono" style={{ fontSize: 12 }}>{alpha.toFixed(1)}</div>
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>BETA</div>
            <div className="mono" style={{ fontSize: 12 }}>{beta.toFixed(1)}</div>
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>OPTIMAL INTERVAL</div>
            <div className="mono text-green" style={{ fontSize: 12 }}>
              {bayesian.optimal_interval_ms.toFixed(1)}ms
            </div>
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>CONFIDENCE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ProgressRing value={bayesian.confidence} size={20} stroke={2} />
              <span className="mono" style={{ fontSize: 12 }}>
                {(bayesian.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          THOMPSON SAMPLING / BETA-BERNOULLI CONJUGATE
        </div>
      </div>
    </Card>
  );
}
