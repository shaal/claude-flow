import { motion } from 'framer-motion';

interface DependencyFlowProps {
  dependencies: { from: string; to: string }[];
  layerOrder: string[];
}

export function DependencyFlow({ dependencies, layerOrder }: DependencyFlowProps) {
  // Calculate positions based on layer order
  const getLayerPosition = (layerId: string): number => {
    const index = layerOrder.indexOf(layerId);
    return index >= 0 ? (index + 1) * 88 + 32 : 0; // 88px per layer + offset
  };

  return (
    <svg
      className="absolute left-0 top-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id="dep-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {dependencies.map((dep, index) => {
        const fromY = getLayerPosition(dep.from);
        const toY = getLayerPosition(dep.to);

        if (!fromY || !toY) return null;

        // Draw curved line from layer to layer
        const x1 = 20;
        const x2 = 30;
        const controlX = 0;

        return (
          <motion.path
            key={`${dep.from}-${dep.to}`}
            d={`M ${x1} ${fromY} C ${controlX} ${fromY}, ${controlX} ${toY}, ${x2} ${toY}`}
            fill="none"
            stroke="url(#dep-gradient)"
            strokeWidth={2}
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: index * 0.2 }}
          />
        );
      })}
    </svg>
  );
}
