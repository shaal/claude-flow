import { motion } from 'framer-motion';
import { connectionVariants } from '../../utils/animation-presets';

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isHighlighted?: boolean;
  type?: 'uses' | 'extends' | 'implements' | 'depends';
  animated?: boolean;
}

export function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  isHighlighted = false,
  type = 'uses',
  animated = true,
}: ConnectionLineProps) {
  // Calculate control point for curved line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const curvature = 0.2;
  const controlX = midX - dy * curvature;
  const controlY = midY + dx * curvature;

  const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

  const strokeColors: Record<string, string> = {
    uses: '#3b82f6',
    extends: '#22c55e',
    implements: '#8b5cf6',
    depends: '#f59e0b',
  };

  return (
    <g>
      {/* Glow effect for highlighted lines */}
      {isHighlighted && (
        <motion.path
          d={pathD}
          fill="none"
          stroke={strokeColors[type]}
          strokeWidth={6}
          strokeOpacity={0.3}
          filter="blur(4px)"
        />
      )}

      {/* Main line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={isHighlighted ? '#22c55e' : strokeColors[type]}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeOpacity={isHighlighted ? 1 : 0.5}
        strokeLinecap="round"
        variants={connectionVariants}
        initial="hidden"
        animate={isHighlighted ? 'highlighted' : 'visible'}
        className={animated ? 'connection-line' : ''}
      />

      {/* Arrow marker at the end */}
      <motion.polygon
        points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
        fill={isHighlighted ? '#22c55e' : strokeColors[type]}
        fillOpacity={isHighlighted ? 1 : 0.6}
        transform={`rotate(${Math.atan2(y2 - controlY, x2 - controlX) * (180 / Math.PI)}, ${x2}, ${y2})`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
    </g>
  );
}
