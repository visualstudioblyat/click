import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

export function ProvenancePanel() {
  const provenance_valid = useClickStore((s) => s.telemetry.provenance_valid);
  const chain_length = useClickStore((s) => s.telemetry.chain_length);
  const total_clicks = useClickStore((s) => s.telemetry.total_clicks);
  const recentClicks = useClickStore(useShallow((s) => s.clickHistory.slice(-8)));

  return (
    <Card label="[PROVENANCE CHAIN]" delay={0.45} span="prov">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Chain status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={`badge ${provenance_valid ? 'badge-green' : 'badge-red'}`}>
            {provenance_valid ? 'CHAIN VALID' : 'CHAIN BROKEN'}
          </div>
          <span className="mono text-secondary" style={{ fontSize: 10 }}>
            {chain_length} blocks
          </span>
        </div>

        {/* Recent block hashes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {recentClicks.map((click, i) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 0',
              }}
            >
              {/* Block number */}
              <span className="mono text-tertiary" style={{ fontSize: 8, width: 28 }}>
                #{(total_clicks - recentClicks.length + i + 1).toString().padStart(4, '0')}
              </span>
              {/* Hash */}
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  color: 'var(--green)',
                  opacity: 0.5 + (i / recentClicks.length) * 0.5,
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {click.hash || '0'.repeat(16)}
              </span>
              {/* Timestamp */}
              <span className="mono text-tertiary" style={{ fontSize: 8, marginLeft: 'auto', flexShrink: 0 }}>
                {new Date(click.timestamp).toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </motion.div>
          ))}
          {recentClicks.length === 0 && (
            <div className="mono text-tertiary" style={{ fontSize: 9, padding: '8px 0' }}>
              NO BLOCKS MINED
            </div>
          )}
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          SHA-256 / APPEND-ONLY HASH CHAIN
        </div>
      </div>
    </Card>
  );
}
