import { motion } from 'framer-motion';
import type { EngineStatus } from '../types';

const STATUS_MAP: Record<EngineStatus, { label: string; color: string; class: string }> = {
  idle: { label: 'IDLE', color: 'var(--text-secondary)', class: '' },
  running: { label: 'ACTIVE', color: 'var(--green)', class: 'badge-green' },
  paused: { label: 'PAUSED', color: 'var(--amber)', class: 'badge-amber' },
  calibrating: { label: 'CALIBRATING', color: 'var(--amber)', class: 'badge-amber' },
};

export function StatusBadge({ status }: { status: EngineStatus }) {
  const s = STATUS_MAP[status];

  return (
    <motion.div
      className={`badge ${s.class}`}
      animate={
        status === 'running'
          ? { boxShadow: ['0 0 0 0 rgba(74,222,128,0)', '0 0 12px 4px rgba(74,222,128,0.15)', '0 0 0 0 rgba(74,222,128,0)'] }
          : {}
      }
      transition={status === 'running' ? { duration: 2, repeat: Infinity } : {}}
    >
      <motion.div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.color,
        }}
        animate={status === 'running' ? { scale: [1, 1.3, 1] } : {}}
        transition={status === 'running' ? { duration: 2, repeat: Infinity } : {}}
      />
      {s.label}
    </motion.div>
  );
}
