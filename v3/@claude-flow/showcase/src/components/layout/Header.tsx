import { motion } from 'framer-motion';
import { useVisualizationStore } from '../../store/visualizationStore';
import { fadeVariants, transitions } from '../../utils/animation-presets';

export function Header() {
  const { toggleSidebar, isSidebarOpen } = useVisualizationStore();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 h-16 bg-bg-dark/90 backdrop-blur-lg border-b border-white/10 z-50"
      initial="hidden"
      animate="visible"
      variants={fadeVariants}
      transition={transitions.smooth}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors lg:hidden"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3L4 14h7v7l9-11h-7V3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Claude Flow</h1>
              <span className="text-xs text-primary-400">V3 Showcase</span>
            </div>
          </div>
        </div>

        {/* Version badge */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
            v3.0.0-alpha
          </span>
          <a
            href="https://github.com/ruvnet/claude-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </motion.header>
  );
}
