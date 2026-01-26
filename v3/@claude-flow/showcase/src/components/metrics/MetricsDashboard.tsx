import { motion } from 'framer-motion';
import { PerformanceGauge } from './PerformanceGauge';
import { AnimatedCounter } from './AnimatedCounter';
import metricsData from '../../data/metrics.json';
import { staggerContainerVariants, staggerItemVariants } from '../../utils/animation-presets';

export function MetricsDashboard() {
  return (
    <motion.div
      className="p-4 h-full overflow-y-auto"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Performance Metrics</h2>
        <p className="text-sm text-gray-400">Real-time performance data for Claude Flow V3</p>
      </div>

      {/* Summary cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        variants={staggerContainerVariants}
      >
        {[
          { label: 'Total Agents', value: metricsData.summary.totalAgents, color: '#3b82f6' },
          { label: 'CLI Commands', value: metricsData.summary.totalCommands, color: '#22c55e' },
          { label: 'Subcommands', value: metricsData.summary.totalSubcommands, color: '#8b5cf6' },
          { label: 'Hooks', value: metricsData.summary.totalHooks, color: '#f59e0b' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItemVariants}
            className="p-4 rounded-xl bg-bg-card border border-white/10"
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              <AnimatedCounter to={stat.value} />
            </div>
            <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Performance metrics grid */}
      <h3 className="text-md font-semibold text-white mb-4">Performance Improvements</h3>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={staggerContainerVariants}
      >
        {metricsData.performance.map((metric, index) => (
          <motion.div
            key={metric.id}
            variants={staggerItemVariants}
            className="p-6 rounded-xl bg-bg-card border border-white/10"
          >
            {/* Metric visualization */}
            {metric.visualType === 'gauge' && (
              <PerformanceGauge
                value={metric.value}
                max={10}
                label={metric.name}
                unit={metric.unit}
                color={getMetricColor(index)}
              />
            )}

            {metric.visualType === 'counter' && (
              <div className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: getMetricColor(index) }}>
                  <AnimatedCounter
                    to={metric.value}
                    suffix={metric.value >= 100 ? 'x' : ''}
                    decimals={metric.value < 1 ? 2 : 0}
                  />
                </div>
                <div className="text-lg text-white">{metric.name}</div>
                <div className="text-sm text-gray-400">{metric.unit}</div>
              </div>
            )}

            {metric.visualType === 'progress' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{metric.name}</span>
                  <span className="text-primary-400 font-bold">{metric.displayValue}</span>
                </div>
                <div className="h-3 bg-bg-dark rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getMetricColor(index) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">{metric.description}</div>
              </div>
            )}

            {metric.visualType === 'chart' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">{metric.name}</span>
                  <span className="text-primary-400 font-bold">{metric.displayValue}</span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {/* Simple bar chart visualization */}
                  {[...Array(8)].map((_, i) => {
                    const height = Math.max(20, 100 - i * 12);
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ backgroundColor: getMetricColor(index) }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Baseline</span>
                  <span>Current</span>
                </div>
              </div>
            )}

            {/* Improvement badge */}
            {metric.improvement && (
              <div className="mt-4 p-2 rounded-lg bg-accent-500/10 border border-accent-500/20">
                <div className="flex items-center gap-2 text-xs text-accent-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {metric.improvement}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function getMetricColor(index: number): string {
  const colors = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
  return colors[index % colors.length];
}
