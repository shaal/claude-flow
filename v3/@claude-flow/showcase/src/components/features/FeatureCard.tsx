import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { Feature } from '../../types';
import { cardVariants } from '../../utils/animation-presets';

interface FeatureCardProps {
  feature: Feature;
  categoryName?: string;
}

export function FeatureCard({ feature, categoryName }: FeatureCardProps) {
  const statusConfig = {
    implemented: {
      bg: 'bg-accent-500/20',
      text: 'text-accent-400',
      border: 'border-accent-500/30',
      label: 'Implemented',
    },
    'in-progress': {
      bg: 'bg-status-busy/20',
      text: 'text-status-busy',
      border: 'border-status-busy/30',
      label: 'In Progress',
    },
    planned: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/30',
      label: 'Planned',
    },
  };

  const status = statusConfig[feature.status];

  return (
    <motion.div
      className="p-4 rounded-xl bg-bg-card border border-white/10 hover:border-white/20 transition-colors h-full"
      variants={cardVariants}
      whileHover="hover"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getFeatureIcon(feature.icon)}</span>
          <div>
            <h3 className="font-medium text-white">{feature.name}</h3>
            {categoryName && (
              <span className="text-xs text-gray-500">{categoryName}</span>
            )}
          </div>
        </div>
        <span
          className={clsx(
            'px-2 py-0.5 text-xs rounded-full border',
            status.bg,
            status.text,
            status.border
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4">{feature.description}</p>

      {/* Related modules */}
      {feature.relatedModules.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1">Related Modules</div>
          <div className="flex flex-wrap gap-1">
            {feature.relatedModules.map((module) => (
              <span
                key={module}
                className="px-2 py-0.5 text-xs rounded bg-bg-dark text-gray-400"
              >
                {module}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function getFeatureIcon(icon: string): string {
  const icons: Record<string, string> = {
    users: '\u{1F465}',
    crown: '\u{1F451}',
    'git-branch': '\u{1F500}',
    database: '\u{1F4BE}',
    search: '\u{1F50D}',
    brain: '\u{1F9E0}',
    lightbulb: '\u{1F4A1}',
    terminal: '\u{1F4BB}',
    zap: '\u{26A1}',
    activity: '\u{1F4CA}',
    plug: '\u{1F50C}',
    github: '\u{1F4BB}',
    package: '\u{1F4E6}',
    shield: '\u{1F6E1}',
    'check-circle': '\u{2705}',
    lock: '\u{1F512}',
    'trending-down': '\u{1F4C9}',
    'minimize-2': '\u{1F5DC}',
  };
  return icons[icon] || '\u{2699}';
}
