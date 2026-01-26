import { motion } from 'framer-motion';
import type { Technology } from '../../types';
import { cardVariants, transitions } from '../../utils/animation-presets';

interface TechnologyCardProps {
  technology: Technology;
  color?: string;
  delay?: number;
}

export function TechnologyCard({
  technology,
  color = '#3b82f6',
  delay = 0,
}: TechnologyCardProps) {
  return (
    <motion.a
      href={technology.docUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg bg-bg-dark border border-white/10 hover:border-white/20 transition-colors"
      variants={cardVariants}
      initial="initial"
      animate="initial"
      whileHover="hover"
      transition={{ ...transitions.spring, delay }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <TechIcon name={technology.icon} color={color} />
          </div>
          <div>
            <h4 className="font-medium text-white">{technology.name}</h4>
            <span className="text-xs text-primary-400 font-mono">{technology.version}</span>
          </div>
        </div>
        {technology.docUrl && (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>

      {/* Purpose */}
      <p className="text-sm text-gray-400">{technology.purpose}</p>
    </motion.a>
  );
}

function TechIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    nodejs: '\u{2B22}',
    typescript: 'TS',
    workflow: '\u{1F504}',
    brain: '\u{1F9E0}',
    database: '\u{1F4BE}',
    search: '\u{1F50D}',
    code: '\u{1F4BB}',
    shield: '\u{1F6E1}',
    lock: '\u{1F512}',
    plug: '\u{1F50C}',
    radio: '\u{1F4E1}',
    server: '\u{1F5A5}',
    cpu: '\u{1F5A5}',
    'git-branch': '\u{1F500}',
    layers: '\u{1F4DA}',
    circle: '\u{25CF}',
  };

  const icon = icons[name] || '\u{2699}';

  return (
    <span style={{ color }} className="text-sm font-bold">
      {icon}
    </span>
  );
}
