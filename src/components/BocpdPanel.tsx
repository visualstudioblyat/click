import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';

export function BocpdPanel() {
  const regime = useClickStore((s) => s.telemetry.regime);
  const cpsHistory = useClickStore((s) => s.cpsHistory);

  const regimeColor =
    regime === 'STABLE' ? 'var(--green)' :
    regime === 'TRANSITIONING' ? 'var(--amber)' :
    regime === 'VOLATILE' ? 'var(--red)' :
    'var(--text-secondary)';

  // Simplified run-length visualization
  // Show last 60 data points with regime coloring
  const data = cpsHistory.slice(-60);
  const maxCps = Math.max(...data, 1);

  return (
    <Card label="[BOCPD]" delay={0.35} span="bocpd">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Regime status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono text-tertiary" style={{ fontSize: 9 }}>CURRENT REGIME</span>
          <div
            className="badge"
            style={{
              background: regimeColor === 'var(--green)' ? 'var(--green-dim)' :
                          regimeColor === 'var(--amber)' ? 'var(--amber-dim)' : 'var(--red-dim)',
              color: regimeColor,
              fontSize: 9,
            }}
          >
            {regime}
          </div>
        </div>

        {/* Timeline visualization */}
        <svg width="100%" height="45" viewBox="0 0 200 45" preserveAspectRatio="none">
          {/* Change point markers */}
          {data.length > 2 && data.map((v, i) => {
            if (i === 0) return null;
            const prev = data[i - 1];
            const change = Math.abs(v - prev) / Math.max(prev, 0.1);
            if (change < 0.3) return null;
            const x = (i / (data.length - 1)) * 200;
            return (
              <motion.line
                key={`cp-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={45}
                stroke="var(--red)"
                strokeWidth="1"
                strokeDasharray="2 2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: i * 0.01 }}
              />
            );
          })}

          {/* CPS line */}
          {data.length > 1 && (
            <motion.path
              d={data
                .map((v, i) => {
                  const x = (i / (data.length - 1)) * 200;
                  const y = 42 - (v / maxCps) * 38;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={regimeColor}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            />
          )}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 2, background: regimeColor, borderRadius: 1 }} />
            <span className="mono text-tertiary" style={{ fontSize: 8 }}>CPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 0, borderTop: '1px dashed var(--red)' }} />
            <span className="mono text-tertiary" style={{ fontSize: 8 }}>CHANGE POINT</span>
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          BAYESIAN ONLINE CHANGE-POINT DETECTION
        </div>
      </div>
    </Card>
  );
}
