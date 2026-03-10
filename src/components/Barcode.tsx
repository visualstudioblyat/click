import { motion } from 'framer-motion';

interface BarcodeProps {
  values: number[]; // 0-1 normalized heights
  color?: string;
  height?: number;
  count?: number;
}

export function Barcode({
  values,
  color = 'var(--green)',
  height = 20,
  count = 40,
}: BarcodeProps) {
  // Pad or slice to desired count
  const data = values.length >= count
    ? values.slice(-count)
    : [...Array(count - values.length).fill(0), ...values];

  return (
    <div className="barcode" style={{ height }}>
      {data.map((v, i) => (
        <motion.div
          key={i}
          className="barcode-tick"
          initial={{ height: 0 }}
          animate={{ height: Math.max(v * height, 1) }}
          transition={{
            delay: i * 0.008,
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1],
          }}
          style={{
            background: v > 0.8
              ? 'var(--red)'
              : v > 0.5
                ? 'var(--amber)'
                : color,
          }}
        />
      ))}
    </div>
  );
}
