import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { useClickStore } from '../store/clickStore';

export function BrierPanel() {
  const brierScore = useClickStore((s) => s.telemetry.brier_score);
  const neuralLoss = useClickStore((s) => s.telemetry.neural_loss);

  // Brier score: 0 = perfect, 1 = worst. Invert for display quality.
  const quality = 1 - brierScore;
  const grade =
    brierScore < 0.1 ? 'EXCELLENT' :
    brierScore < 0.25 ? 'GOOD' :
    brierScore < 0.4 ? 'FAIR' :
    'POOR';
  const gradeColor =
    brierScore < 0.1 ? 'var(--green)' :
    brierScore < 0.25 ? 'var(--green)' :
    brierScore < 0.4 ? 'var(--amber)' :
    'var(--red)';

  return (
    <Card label="[CALIBRATION]" delay={0.4} span="brier">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {/* Ring + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRing value={quality} size={52} stroke={3} color={gradeColor} />
          <div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
              {brierScore.toFixed(3)}
            </div>
            <div className="mono" style={{ fontSize: 9, color: gradeColor }}>{grade}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-dashed)', paddingTop: 8 }}>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>BRIER SCORE</div>
            <div className="mono" style={{ fontSize: 11 }}>{brierScore.toFixed(4)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>NEURAL LOSS</div>
            <div className="mono" style={{ fontSize: 11 }}>{neuralLoss.toFixed(4)}</div>
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          BRIER SCORE PROPER SCORING RULE
        </div>
      </div>
    </Card>
  );
}
