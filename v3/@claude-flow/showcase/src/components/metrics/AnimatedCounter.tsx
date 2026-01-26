import { useAnimatedValue, easings } from '../../hooks/useAnimatedValue';

interface AnimatedCounterProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
}

export function AnimatedCounter({
  to,
  from = 0,
  duration = 2000,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
}: AnimatedCounterProps) {
  const value = useAnimatedValue({
    from,
    to,
    duration,
    delay,
    easing: easings.easeOut,
  });

  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    if (separator) {
      const [intPart, decPart] = fixed.split('.');
      const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return decPart ? `${formatted}.${decPart}` : formatted;
    }
    return fixed;
  };

  return (
    <span className="tabular-nums">
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
