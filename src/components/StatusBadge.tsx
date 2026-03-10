import type { EngineStatus } from '../types';

const STATUS_MAP: Record<EngineStatus, { label: string; color: string }> = {
  idle: { label: 'IDLE', color: 'var(--text-secondary)' },
  running: { label: 'ACTIVE', color: 'var(--green)' },
  paused: { label: 'PAUSED', color: 'var(--amber)' },
  calibrating: { label: 'CALIBRATING', color: 'var(--amber)' },
};

export function StatusBadge({ status }: { status: EngineStatus }) {
  const s = STATUS_MAP[status];

  return (
    <div className="badge" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.color,
        }}
      />
      {s.label}
    </div>
  );
}
