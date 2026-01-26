import { motion, AnimatePresence } from 'framer-motion';
import type { ArchitectureNode } from '../../types';
import { panelVariants, transitions } from '../../utils/animation-presets';

interface NodeDetailProps {
  node: ArchitectureNode;
  onClose: () => void;
}

export function NodeDetail({ node, onClose }: NodeDetailProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto rounded-xl bg-bg-card/95 backdrop-blur-lg border border-white/10 shadow-2xl"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={transitions.spring}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-bg-card/95 backdrop-blur">
          <div>
            <h3 className="font-semibold text-white">{node.name}</h3>
            <span className="text-xs text-primary-400 capitalize">{node.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4>
            <p className="text-sm text-gray-300">{node.description}</p>
          </div>

          {/* Lines of code */}
          {node.lines && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Size</h4>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-bg-dark rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((node.lines / 2500) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-sm text-gray-400">{node.lines.toLocaleString()} lines</span>
              </div>
            </div>
          )}

          {/* Technologies */}
          {node.technologies && node.technologies.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Technologies</h4>
              <div className="space-y-2">
                {node.technologies.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-bg-dark"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{tech.name}</div>
                      <div className="text-xs text-gray-500">{tech.purpose}</div>
                    </div>
                    <span className="text-xs text-primary-400 font-mono">{tech.version}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Connections */}
          {node.connections && node.connections.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Connected To</h4>
              <div className="flex flex-wrap gap-2">
                {node.connections.map((conn) => (
                  <span
                    key={conn}
                    className="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  >
                    {conn}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
