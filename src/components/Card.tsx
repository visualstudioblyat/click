import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  label?: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  delay?: number;
  span?: string; // grid area
}

export function Card({ label, children, style, className = '', delay = 0, span }: CardProps) {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{
        gridArea: span,
        ...style,
      }}
    >
      {label && <div className="card-label">{label}</div>}
      {children}
    </motion.div>
  );
}
