import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface ProgressRingProps {
  value: number; // 0-1
  size?: number;
  stroke?: number;
  color?: string;
}

export function ProgressRing({
  value,
  size = 40,
  stroke = 2.5,
  color = 'var(--green)',
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const animated = useAnimatedNumber(value, 600);
  const offset = circumference * (1 - Math.min(Math.max(animated, 0), 1));

  return (
    <svg width={size} height={size} className="ring">
      <circle
        className="ring-track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
      />
      <circle
        className="ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
