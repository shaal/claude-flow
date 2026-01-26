import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useVisualizationStore } from '../../store/visualizationStore';
import type { ViewType } from '../../types';
import { slideVariants, staggerContainerVariants, staggerItemVariants, transitions } from '../../utils/animation-presets';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'System architecture overview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'topology',
    label: 'Topology',
    description: 'Module connections graph',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'stack',
    label: 'Tech Stack',
    description: 'Technology layers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'agents',
    label: 'Agents',
    description: '60+ agent types',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'metrics',
    label: 'Metrics',
    description: 'Performance data',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'features',
    label: 'Features',
    description: 'Feature explorer',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

export function Navigation() {
  const { currentView, setCurrentView, isSidebarOpen, toggleSidebar } = useVisualizationStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        className={clsx(
          'fixed top-16 left-0 bottom-0 w-64 bg-bg-dark border-r border-white/10 z-40',
          'transform transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        initial="hiddenLeft"
        animate="visible"
        variants={slideVariants}
        transition={transitions.smooth}
      >
        <motion.div
          className="p-4 space-y-1"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              variants={staggerItemVariants}
              onClick={() => {
                setCurrentView(item.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                currentView === item.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-300 hover:text-white'
              )}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <span
                className={clsx(
                  'p-1.5 rounded-md',
                  currentView === item.id ? 'bg-primary-500/30' : 'bg-bg-card'
                )}
              >
                {item.icon}
              </span>
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Stats summary */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 rounded-lg bg-bg-card border border-white/5">
            <div className="text-xs text-gray-500 mb-2">Quick Stats</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-primary-400 font-semibold">60+</div>
                <div className="text-gray-500 text-xs">Agents</div>
              </div>
              <div>
                <div className="text-accent-400 font-semibold">26</div>
                <div className="text-gray-500 text-xs">Commands</div>
              </div>
              <div>
                <div className="text-primary-400 font-semibold">17</div>
                <div className="text-gray-500 text-xs">Hooks</div>
              </div>
              <div>
                <div className="text-accent-400 font-semibold">12</div>
                <div className="text-gray-500 text-xs">Workers</div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
