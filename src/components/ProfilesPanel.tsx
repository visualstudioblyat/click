import { useState, useRef } from 'react';
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
  const { profiles, addProfile, removeProfile, renameProfile, loadProfile, importProfiles } = useClickStore(
    useShallow((s) => ({
      profiles: s.profiles,
      addProfile: s.addProfile,
      removeProfile: s.removeProfile,
      renameProfile: s.renameProfile,
      loadProfile: s.loadProfile,
      importProfiles: s.importProfiles,
    })),
  );

  const [name, setName] = useState('');
  const [exported, setExported] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addProfile(trimmed);
    setName('');
  };

  const startRename = (n: string) => {
    setEditing(n);
    setEditName(n);
  };

  const confirmRename = () => {
    if (editing && editName.trim()) {
      renameProfile(editing, editName.trim());
    }
    setEditing(null);
  };

  const exportProfiles = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'click-profiles.json';
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data)) importProfiles(data);
      } catch { /* invalid json */ }
    };
    reader.readAsText(file);
    e.target.value = '';
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

        {/* Import/Export */}
        <div style={{ display: 'flex', gap: 6 }}>
          <motion.button
            className="btn"
            whileTap={{ scale: 0.95 }}
            onClick={exportProfiles}
            title="Save profiles to Downloads as JSON"
            style={{ flex: 1, fontSize: 9, padding: '4px 0', justifyContent: 'center' }}
          >
            {exported ? 'SAVED TO DOWNLOADS' : 'EXPORT TO FILE'}
          </motion.button>
          <motion.button
            className="btn"
            whileTap={{ scale: 0.95 }}
            onClick={() => fileRef.current?.click()}
            title="Load profiles from a JSON file"
            style={{ flex: 1, fontSize: 9, padding: '4px 0', justifyContent: 'center' }}
          >
            IMPORT FROM FILE
          </motion.button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>

        {/* Profile list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 140,
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
              {editing === p.name ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditing(null); }}
                  onBlur={confirmRename}
                  autoFocus
                  className="mono"
                  style={{ ...inputStyle, flex: 1, marginRight: 6 }}
                />
              ) : (
                <span
                  className="mono"
                  style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  onDoubleClick={() => startRename(p.name)}
                  title="Double-click to rename"
                >
                  {p.name}
                </span>
              )}
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
