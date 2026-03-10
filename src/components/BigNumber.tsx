import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface BigNumberProps {
  value: number;
  denominator?: number;
  decimals?: number;
  suffix?: string;
  color?: string;
}

export function BigNumber({
  value,
  denominator,
  decimals = 1,
  suffix,
  color,
}: BigNumberProps) {
  const animated = useAnimatedNumber(value);

  return (
    <span className="big-number" style={color ? { color } : undefined}>
      {animated.toFixed(decimals)}
      {suffix && <span className="denominator">{suffix}</span>}
      {denominator !== undefined && (
        <span className="denominator">/{denominator.toFixed(decimals)}</span>
      )}
    </span>
  );
}
