import { motion } from 'framer-motion';
import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { Barcode } from './Barcode';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

export function OshaPanel() {
  const { osha_strain_index, osha_break_needed, fatigue, session_duration_ms, total_clicks } =
    useClickStore(useShallow((s) => ({
      osha_strain_index: s.telemetry.osha_strain_index,
      osha_break_needed: s.telemetry.osha_break_needed,
      fatigue: s.telemetry.fatigue,
      session_duration_ms: s.telemetry.session_duration_ms,
      total_clicks: s.telemetry.total_clicks,
    })));

  const sessionMinutes = session_duration_ms / 60000;
  const cpm = sessionMinutes > 0 ? total_clicks / sessionMinutes : 0;

  // Generate fake strain history from current value
  const strainHistory = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    return Math.min(osha_strain_index * t + Math.sin(i * 0.5) * 0.05, 1);
  });

  return (
    <Card label="[OSHA COMPLIANCE]" delay={0.5} span="osha">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Status banner */}
        {osha_break_needed && (
          <motion.div
            className="badge badge-red"
            animate={{
              opacity: [1, 0.6, 1],
              boxShadow: ['0 0 0 0 rgba(249,115,22,0)', '0 0 8px 2px rgba(249,115,22,0.2)', '0 0 0 0 rgba(249,115,22,0)'],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ justifyContent: 'center', padding: '6px 10px' }}
          >
            MANDATORY BREAK REQUIRED
          </motion.div>
        )}

        {/* Strain index */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProgressRing
            value={osha_strain_index}
            size={48}
            stroke={3}
            color={osha_strain_index > 0.7 ? 'var(--red)' : osha_strain_index > 0.4 ? 'var(--amber)' : 'var(--green)'}
          />
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>CUMULATIVE STRAIN INDEX</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
              {(osha_strain_index * 100).toFixed(0)}
              <span className="text-secondary" style={{ fontSize: 11, fontWeight: 400 }}>/100</span>
            </div>
          </div>
        </div>

        {/* Strain history */}
        <Barcode values={strainHistory} height={14} count={30} />

        {/* Fatigue model */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>TENDON STRESS</div>
            <div className="mono" style={{ fontSize: 11 }}>{(fatigue.tendon_stress * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>RECOVERY</div>
            <div className="mono text-green" style={{ fontSize: 11 }}>{(fatigue.recovery_pct * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>CLICKS/MIN</div>
            <div className="mono" style={{ fontSize: 11 }}>{cpm.toFixed(0)}</div>
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>RUPTURE RISK</div>
            <div className="mono" style={{ fontSize: 11, color: fatigue.rupture_risk > 0.5 ? 'var(--red)' : 'var(--text-primary)' }}>
              {(fatigue.rupture_risk * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          SPRING-DAMPER BIOMECHANICAL MODEL / 29 CFR 1910.217
        </div>
      </div>
    </Card>
  );
}
