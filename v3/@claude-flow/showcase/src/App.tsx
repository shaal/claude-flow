import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Navigation, Footer } from './components/layout';
import { ArchitectureGraph } from './components/architecture';
import { AgentVisualization } from './components/agents';
import { TechStackLayers } from './components/stack';
import { MetricsDashboard } from './components/metrics';
import { FeatureMatrix } from './components/features';
import { useVisualizationStore } from './store/visualizationStore';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { fadeVariants } from './utils/animation-presets';
import type { ViewType } from './types';

// Overview component showing summary of all sections
function Overview() {
  const { setCurrentView } = useVisualizationStore();

  const sections: { id: ViewType; title: string; description: string; icon: string; color: string }[] = [
    {
      id: 'topology',
      title: 'Architecture',
      description: 'Interactive D3 force-directed graph showing 11 core modules and their connections',
      icon: '\u{1F517}',
      color: '#3b82f6',
    },
    {
      id: 'agents',
      title: 'Agent Ecosystem',
      description: '60+ agent types organized by category with real-time status indicators',
      icon: '\u{1F916}',
      color: '#22c55e',
    },
    {
      id: 'stack',
      title: 'Technology Stack',
      description: '6 technology layers from runtime to intelligence with 20+ technologies',
      icon: '\u{1F4DA}',
      color: '#8b5cf6',
    },
    {
      id: 'metrics',
      title: 'Performance Metrics',
      description: 'Real-time performance data including HNSW search at 12,500x faster',
      icon: '\u{1F4CA}',
      color: '#f59e0b',
    },
    {
      id: 'features',
      title: 'Feature Matrix',
      description: 'Explore all features across 6 categories with search and filtering',
      icon: '\u{2728}',
      color: '#ec4899',
    },
  ];

  return (
    <motion.div
      className="p-6 h-full overflow-y-auto"
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero section */}
      <div className="text-center mb-12">
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3L4 14h7v7l9-11h-7V3z" />
          </svg>
        </motion.div>
        <motion.h1
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Claude Flow V3
        </motion.h1>
        <motion.p
          className="text-xl text-gray-400 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Interactive visual showcase of the multi-agent orchestration platform
        </motion.p>
      </div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {[
          { label: 'Agents', value: '60+', color: '#3b82f6' },
          { label: 'Commands', value: '26', color: '#22c55e' },
          { label: 'Subcommands', value: '140+', color: '#8b5cf6' },
          { label: 'Hooks', value: '17', color: '#f59e0b' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-bg-card border border-white/10 text-center"
          >
            <div className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            className="p-6 rounded-xl bg-bg-card border border-white/10 text-left hover:border-white/20 transition-all group"
            onClick={() => setCurrentView(section.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${section.color}20` }}
            >
              {section.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
              {section.title}
            </h3>
            <p className="text-sm text-gray-400">{section.description}</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Explore</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Version info */}
      <motion.div
        className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm text-gray-400">Current Version</span>
            <div className="text-lg font-semibold text-white">v3.0.0-alpha</div>
          </div>
          <div className="flex gap-3">
            <a
              href="https://github.com/ruvnet/claude-flow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-bg-card border border-white/10 text-white hover:border-white/20 transition-colors"
            >
              View on GitHub
            </a>
            <a
              href="https://github.com/ruvnet/claude-flow/blob/main/docs/prd/claude-flow-visual-showcase.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Read PRD
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// View wrapper to handle routing
function ViewContent() {
  const { currentView } = useVisualizationStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        className="h-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {currentView === 'overview' && <Overview />}
        {currentView === 'topology' && <ArchitectureGraph />}
        {currentView === 'stack' && <TechStackLayers />}
        {currentView === 'agents' && <AgentVisualization />}
        {currentView === 'metrics' && <MetricsDashboard />}
        {currentView === 'features' && <FeatureMatrix />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { isSidebarOpen } = useVisualizationStore();
  const { isMobileOrTablet } = useResponsiveLayout();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark text-white">
      <Header />
      <Navigation />

      {/* Main content area */}
      <main
        className="pt-16 pb-12 transition-all duration-300"
        style={{
          marginLeft: isMobileOrTablet ? 0 : isSidebarOpen ? 256 : 0,
        }}
      >
        <div className="h-[calc(100vh-7rem)]">
          <Routes>
            <Route path="/" element={<ViewContent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}
