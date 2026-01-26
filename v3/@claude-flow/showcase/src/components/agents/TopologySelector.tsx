import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { TopologyType } from '../../types';

interface TopologySelectorProps {
  value: TopologyType;
  onChange: (topology: TopologyType) => void;
}

const topologies: { id: TopologyType; label: string; icon: string; description: string }[] = [
  {
    id: 'hierarchical',
    label: 'Hierarchical',
    icon: '\u{1F332}',
    description: 'Tree structure with clear hierarchy',
  },
  {
    id: 'mesh',
    label: 'Mesh',
    icon: '\u{1F578}',
    description: 'Fully connected network',
  },
  {
    id: 'hierarchical-mesh',
    label: 'Hybrid',
    icon: '\u{1F310}',
    description: 'Combined hierarchical and mesh',
  },
  {
    id: 'adaptive',
    label: 'Adaptive',
    icon: '\u{1F504}',
    description: 'Dynamic topology based on load',
  },
];

export function TopologySelector({ value, onChange }: TopologySelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-card border border-white/10">
      {topologies.map((topology) => (
        <motion.button
          key={topology.id}
          className={clsx(
            'relative px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            value === topology.id
              ? 'text-white'
              : 'text-gray-400 hover:text-white hover:bg-bg-hover'
          )}
          onClick={() => onChange(topology.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Active background */}
          {value === topology.id && (
            <motion.div
              className="absolute inset-0 rounded-md bg-primary-500/20 border border-primary-500/30"
              layoutId="topology-bg"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          {/* Content */}
          <span className="relative flex items-center gap-2">
            <span className="text-base">{topology.icon}</span>
            <span className="hidden sm:inline">{topology.label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
