import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

const inputStyle = {
  background: 'var(--bg)',
  border: '1px dashed var(--border-dashed)',
  color: 'var(--text)',
  padding: '4px 8px',
  fontSize: 11,
  outline: 'none',
} as const;

export function ProfilesPanel() {
  const { profiles, addProfile, removeProfile, loadProfile } = useClickStore(
    useShallow((s) => ({
      profiles: s.profiles,
      addProfile: s.addProfile,
      removeProfile: s.removeProfile,
      loadProfile: s.loadProfile,
    })),
  );

  const [name, setName] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addProfile(trimmed);
    setName('');
  };

  return (
    <Card label="[PROFILES]" delay={0.15} span="profiles">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Save input */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="profile name"
            className="mono"
            style={{ ...inputStyle, flex: 1 }}
          />
          <motion.button
            className="btn btn-green"
            whileTap={{ scale: 0.95 }}
            onClick={save}
            style={{ fontSize: 10, padding: '4px 12px' }}
          >
            SAVE
          </motion.button>
        </div>

        {/* Profile list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {profiles.length === 0 && (
            <div className="mono text-tertiary" style={{ fontSize: 10, textAlign: 'center', padding: 12 }}>
              NO SAVED PROFILES
            </div>
          )}
          {profiles.map((p) => (
            <div
              key={p.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px dashed var(--border-dashed)',
              }}
            >
              <span className="mono" style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <motion.button
                  className="btn btn-green"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => loadProfile(p.name)}
                  style={{ fontSize: 9, padding: '3px 8px' }}
                >
                  LOAD
                </motion.button>
                <motion.button
                  className="btn btn-red"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeProfile(p.name)}
                  style={{ fontSize: 9, padding: '3px 6px' }}
                >
                  X
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
