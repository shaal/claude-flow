import { motion } from 'framer-motion';
import { fadeVariants } from '../../utils/animation-presets';

export function Footer() {
  return (
    <motion.footer
      className="fixed bottom-0 left-0 right-0 h-12 bg-bg-dark/90 backdrop-blur-lg border-t border-white/10 z-30"
      initial="hidden"
      animate="visible"
      variants={fadeVariants}
    >
      <div className="flex items-center justify-between h-full px-4 lg:pl-68">
        <div className="text-sm text-gray-500">
          Built with React, D3.js, and Framer Motion
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/ruvnet/claude-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-primary-400 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://github.com/ruvnet/claude-flow/blob/main/docs/prd/claude-flow-visual-showcase.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-primary-400 transition-colors"
          >
            PRD
          </a>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">
            2026 Claude Flow
          </span>
        </div>
      </div>
    </motion.footer>
  );
}
