import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

const DISTRIBUTIONS = ['uniform', 'gaussian', 'poisson'] as const;

function DistributionCurve({ type }: { type: string }) {
  return (
    <svg width="100%" height={40} viewBox="0 0 120 40" style={{ opacity: 0.7 }}>
      {/* Axis */}
      <line x1={10} y1={35} x2={110} y2={35} stroke="var(--text-tertiary)" strokeWidth={0.5} />
      <line x1={10} y1={5} x2={10} y2={35} stroke="var(--text-tertiary)" strokeWidth={0.5} />

      {type === 'uniform' && (
        <rect x={20} y={10} width={80} height={25} fill="none" stroke="var(--green)" strokeWidth={1.5} />
      )}

      {type === 'gaussian' && (
        <path
          d="M 15,35 Q 30,34 40,28 Q 50,18 60,8 Q 70,18 80,28 Q 90,34 105,35"
          fill="none"
          stroke="var(--green)"
          strokeWidth={1.5}
        />
      )}

      {type === 'poisson' && (
        <path
          d="M 15,35 Q 25,34 30,30 Q 35,20 42,8 Q 50,14 60,22 Q 75,30 90,33 Q 100,35 105,35"
          fill="none"
          stroke="var(--green)"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

export function AntiDetectionPanel() {
  const { config, setConfig } = useClickStore(
    useShallow((s) => ({
      config: s.config,
      setConfig: s.setConfig,
    })),
  );

  return (
    <Card label="[ANTI-DETECTION]" delay={0.25} span="antidet">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Jitter distribution */}
        <div>
          <div className="mono text-secondary" style={{ fontSize: 10, marginBottom: 6 }}>
            JITTER DISTRIBUTION
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {DISTRIBUTIONS.map((d) => (
              <motion.button
                key={d}
                className={`btn ${config.jitter_distribution === d ? 'btn-green' : ''}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig({ jitter_distribution: d })}
                style={{ flex: 1, fontSize: 9, padding: '4px 8px', textTransform: 'uppercase' }}
              >
                {d}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Distribution curve preview */}
        <DistributionCurve type={config.jitter_distribution} />

        {/* Position jitter radius */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="mono text-secondary" style={{ fontSize: 10 }}>POSITION JITTER</span>
            <span className="mono" style={{ fontSize: 11 }}>{config.position_jitter_radius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={config.position_jitter_radius}
            onChange={(e) => setConfig({ position_jitter_radius: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--green)', height: 2 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span className="mono text-tertiary" style={{ fontSize: 8 }}>0</span>
            <span className="mono text-tertiary" style={{ fontSize: 8 }}>50px</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
