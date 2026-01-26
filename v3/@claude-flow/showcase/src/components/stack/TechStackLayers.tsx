import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TechnologyCard } from './TechnologyCard';
import { DependencyFlow } from './DependencyFlow';
import techStackData from '../../data/techstack.json';
import { staggerContainerVariants, staggerItemVariants } from '../../utils/animation-presets';

export function TechStackLayers() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);

  const layerColors: Record<string, string> = {
    runtime: '#ef4444',
    framework: '#f59e0b',
    memory: '#22c55e',
    security: '#3b82f6',
    communication: '#8b5cf6',
    intelligence: '#ec4899',
  };

  return (
    <motion.div
      className="p-4 h-full overflow-y-auto"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Technology Stack</h2>
          <p className="text-sm text-gray-400">6 layers powering Claude Flow V3</p>
        </div>
        <button
          onClick={() => setShowDependencies(!showDependencies)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showDependencies
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'bg-bg-card text-gray-400 border border-white/10'
          }`}
        >
          {showDependencies ? 'Hide' : 'Show'} Dependencies
        </button>
      </div>

      {/* Layers */}
      <div className="relative space-y-4">
        {/* Dependency lines */}
        {showDependencies && (
          <DependencyFlow
            dependencies={techStackData.dependencies}
            layerOrder={techStackData.layers.map(l => l.id)}
          />
        )}

        {techStackData.layers.map((layer, index) => (
          <motion.div
            key={layer.id}
            variants={staggerItemVariants}
            className="relative"
          >
            {/* Layer header */}
            <motion.button
              className={`w-full p-4 rounded-xl border transition-all ${
                expandedLayer === layer.id
                  ? 'bg-bg-card border-white/20'
                  : 'bg-bg-card/50 border-white/10 hover:border-white/20'
              }`}
              onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                {/* Layer indicator */}
                <div
                  className="w-2 h-12 rounded-full"
                  style={{ backgroundColor: layerColors[layer.id] }}
                />

                {/* Layer info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{layer.name}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400">
                      {layer.technologies.length} technologies
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{layer.description}</p>
                </div>

                {/* Expand icon */}
                <motion.svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: expandedLayer === layer.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>

              {/* Technology preview */}
              {expandedLayer !== layer.id && (
                <div className="flex flex-wrap gap-2 mt-3 ml-6">
                  {layer.technologies.map((tech) => (
                    <span
                      key={tech.name}
                      className="px-2 py-1 text-xs rounded-md bg-bg-dark text-gray-300"
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>

            {/* Expanded content */}
            <AnimatePresence>
              {expandedLayer === layer.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 px-4">
                    {layer.technologies.map((tech, techIndex) => (
                      <TechnologyCard
                        key={tech.name}
                        technology={tech}
                        color={layerColors[layer.id]}
                        delay={techIndex * 0.1}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
