import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';
import { formatNumber, formatDuration } from '../lib/format';

function StatRow({ label, value, green }: { label: string; value: string; green: boolean }) {
  return (
    <div>
      <div className="mono text-tertiary" style={{ fontSize: 9, marginBottom: 2 }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, color: green ? 'var(--green)' : 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

export function StatisticsPanel() {
  const { telemetry, status } = useClickStore(
    useShallow((s) => ({
      telemetry: s.telemetry,
      status: s.status,
    })),
  );

  const isRunning = status === 'running';

  const stats = [
    { label: 'CURRENT CPS', value: formatNumber(telemetry.cps) },
    { label: 'AVG CPS', value: formatNumber(telemetry.avg_cps) },
    { label: 'MIN CPS', value: formatNumber(telemetry.min_cps) },
    { label: 'MAX CPS', value: formatNumber(telemetry.max_cps) },
    { label: 'CLICKS/MIN', value: formatNumber(telemetry.clicks_per_min, 0) },
    { label: 'TOTAL CLICKS', value: telemetry.total_clicks.toLocaleString() },
    { label: 'SESSION TIME', value: formatDuration(telemetry.session_duration_ms) },
  ];

  return (
    <Card label="[STATISTICS]" delay={0.1} span="stats">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {stats.map((s) => (
          <StatRow key={s.label} label={s.label} value={s.value} green={isRunning} />
        ))}
      </div>
    </Card>
  );
}
