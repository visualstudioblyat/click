import { motion } from 'framer-motion';
import { Card } from './Card';
import { Barcode } from './Barcode';
import { useClickStore } from '../store/clickStore';

export function PidPanel() {
  const pid = useClickStore((s) => s.telemetry.pid_output);
  const cpsHistory = useClickStore((s) => s.cpsHistory);
  const targetCps = useClickStore((s) => s.config.target_cps);

  const maxAbs = Math.max(Math.abs(pid.p), Math.abs(pid.i), Math.abs(pid.d), 0.01);

  const contributions = [
    { label: 'P', value: pid.p, color: 'var(--green)' },
    { label: 'I', value: pid.i, color: 'var(--amber)' },
    { label: 'D', value: pid.d, color: 'var(--red)' },
  ];

  // Error history from cps
  const errors = cpsHistory.slice(-40).map((cps) =>
    Math.min(Math.abs(cps - targetCps) / targetCps, 1),
  );

  return (
    <Card label="[PID CONTROLLER]" delay={0.25} span="pid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Error bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="mono text-tertiary" style={{ fontSize: 9 }}>ERROR SIGNAL</span>
            <span className="mono" style={{ fontSize: 11, color: Math.abs(pid.error) < 0.5 ? 'var(--green)' : 'var(--red)' }}>
              {pid.error >= 0 ? '+' : ''}{pid.error.toFixed(2)}
            </span>
          </div>
          <Barcode values={errors} color="var(--green)" height={16} count={40} />
        </div>

        {/* P/I/D contributions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contributions.map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span className="mono text-tertiary" style={{ fontSize: 9 }}>{label}</span>
                <span className="mono" style={{ fontSize: 10, color }}>
                  {value >= 0 ? '+' : ''}{value.toFixed(3)}
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(Math.abs(value) / maxAbs) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    height: '100%',
                    background: color,
                    borderRadius: 2,
                    marginLeft: value < 0 ? 'auto' : 0,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Output */}
        <div style={{ borderTop: '1px dashed var(--border-dashed)', paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="mono text-secondary" style={{ fontSize: 10 }}>OUTPUT</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
              {pid.output.toFixed(3)}
            </span>
          </div>
          <div className="mono text-tertiary" style={{ fontSize: 9, marginTop: 2 }}>
            ZIEGLER-NICHOLS AUTO-TUNE
          </div>
        </div>
      </div>
    </Card>
  );
}
