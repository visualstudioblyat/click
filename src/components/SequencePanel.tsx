import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';
import type { SequenceStep } from '../types';

const ACTIONS: SequenceStep['action'][] = ['click_left', 'click_right', 'double_click', 'key', 'wait'];

const inputStyle = {
  background: 'var(--bg)',
  border: '1px dashed var(--border-dashed)',
  color: 'var(--text)',
  padding: '4px 8px',
  fontSize: 11,
  outline: 'none',
} as const;

const ACTION_COLORS: Record<string, string> = {
  click_left: 'var(--green)',
  click_right: '#f97316',
  double_click: '#facc15',
  key: '#818cf8',
  wait: 'var(--text-tertiary)',
};

// Each step gets a stable id for reorder
interface StepWithId extends SequenceStep {
  _id: number;
}

export function SequencePanel() {
  const { sequence, setConfig } = useClickStore(
    useShallow((s) => ({
      sequence: s.config.sequence,
      setConfig: s.setConfig,
    })),
  );

  // Wrap steps with stable ids for reorder
  const steps: StepWithId[] = sequence.map((s, i) => ({ ...s, _id: i }));

  const setSequence = (newSteps: SequenceStep[]) => {
    setConfig({ sequence: newSteps });
  };

  const addStep = () => {
    const step: SequenceStep = { action: 'click_left', delay_ms: 100 };
    setSequence([...sequence, step]);
  };

  const removeStep = (idx: number) => {
    setSequence(sequence.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, partial: Partial<SequenceStep>) => {
    const next = sequence.map((s, i) => (i === idx ? { ...s, ...partial } : s));
    setSequence(next);
  };

  const handleReorder = (newOrder: StepWithId[]) => {
    setSequence(newOrder.map(({ _id, ...rest }) => rest));
  };

  return (
    <Card label="[SEQUENCE]" delay={0.25} span="sequence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Timeline bar */}
        {sequence.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px dashed var(--border-dashed)',
            }}
          >
            {sequence.map((step, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: ACTION_COLORS[step.action] || 'var(--text-tertiary)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Steps list — drag to reorder */}
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {sequence.length === 0 && (
            <div className="mono text-tertiary" style={{ fontSize: 10, textAlign: 'center', padding: 16 }}>
              NO SEQUENCE — CTRL+1 CLICK MODE
            </div>
          )}
          <Reorder.Group axis="y" values={steps} onReorder={handleReorder} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <AnimatePresence mode="popLayout">
              {steps.map((step, i) => (
                <Reorder.Item
                  key={step._id}
                  value={step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 0',
                    borderBottom: '1px dashed var(--border-dashed)',
                    cursor: 'grab',
                  }}
                  whileDrag={{ scale: 1.02, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                >
                  {/* Drag handle */}
                  <span className="mono text-tertiary" style={{ fontSize: 10, cursor: 'grab', userSelect: 'none' }}>
                    ⠿
                  </span>

                  {/* Step number */}
                  <span className="mono text-tertiary" style={{ fontSize: 8, width: 14, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Action select */}
                  <select
                    value={step.action}
                    onChange={(e) => updateStep(i, { action: e.target.value as SequenceStep['action'] })}
                    className="mono"
                    style={{ ...inputStyle, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>{a.toUpperCase()}</option>
                    ))}
                  </select>

                  {/* Delay input */}
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={step.delay_ms}
                    onChange={(e) => updateStep(i, { delay_ms: Math.max(0, Number(e.target.value)) })}
                    className="mono"
                    style={{ ...inputStyle, width: 56 }}
                    title="delay (ms)"
                  />

                  {/* Key input */}
                  {step.action === 'key' && (
                    <input
                      type="text"
                      value={step.key || ''}
                      onChange={(e) => updateStep(i, { key: e.target.value })}
                      placeholder="key"
                      className="mono"
                      style={{ ...inputStyle, width: 40 }}
                    />
                  )}

                  {/* Delete */}
                  <motion.button
                    className="btn btn-red"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeStep(i)}
                    style={{ fontSize: 9, padding: '3px 6px', flexShrink: 0 }}
                  >
                    X
                  </motion.button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>

        {/* Add step */}
        <motion.button
          className="btn btn-green"
          whileTap={{ scale: 0.95 }}
          onClick={addStep}
          style={{ fontSize: 10, padding: '6px 0', width: '100%', justifyContent: 'center' }}
        >
          + ADD STEP
        </motion.button>
      </div>
    </Card>
  );
}
