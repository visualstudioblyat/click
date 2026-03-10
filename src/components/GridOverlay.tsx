import { motion } from 'framer-motion';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = ['1', '2', '3', '4', '5'];

export function GridOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Column labels along top */}
      {COLS.map((label, i) => (
        <motion.span
          key={`col-${label}`}
          className="grid-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 * i, duration: 0.6 }}
          style={{
            position: 'absolute',
            top: 6,
            left: `${((i + 0.5) / COLS.length) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {label}
        </motion.span>
      ))}

      {/* Row labels along left */}
      {ROWS.map((label, i) => (
        <motion.span
          key={`row-${label}`}
          className="grid-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 * i + 0.3, duration: 0.6 }}
          style={{
            position: 'absolute',
            left: 8,
            top: `${((i + 0.5) / ROWS.length) * 100}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {label}
        </motion.span>
      ))}

      {/* Crosshair markers at intersections */}
      {COLS.map((_, ci) =>
        ROWS.map((_, ri) => (
          <motion.div
            key={`cross-${ci}-${ri}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * (ci + ri) + 0.5, duration: 0.3 }}
            style={{
              position: 'absolute',
              left: `${((ci + 0.5) / COLS.length) * 100}%`,
              top: `${((ri + 0.5) / ROWS.length) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <line x1="0" y1="4" x2="8" y2="4" stroke="var(--crosshair)" strokeWidth="0.5" />
              <line x1="4" y1="0" x2="4" y2="8" stroke="var(--crosshair)" strokeWidth="0.5" />
            </svg>
          </motion.div>
        )),
      )}
    </div>
  );
}
