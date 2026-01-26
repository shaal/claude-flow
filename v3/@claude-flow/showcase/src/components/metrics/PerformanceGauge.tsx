import { motion } from 'framer-motion';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface PerformanceGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}

export function PerformanceGauge({
  value,
  max,
  label,
  unit = '',
  color = '#3b82f6',
  size = 140,
}: PerformanceGaugeProps) {
  const animatedValue = useAnimatedValue({
    from: 0,
    to: value,
    duration: 1500,
    delay: 300,
  });

  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const offset = arcLength * (1 - percentage / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-135"
        >
          {/* Background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />

          {/* Value arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {animatedValue.toFixed(value < 10 ? 2 : 0)}
          </span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-white">{label}</div>
      </div>
    </div>
  );
}
