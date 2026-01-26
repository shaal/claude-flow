import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationStore } from '../../store/visualizationStore';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { AgentNode } from './AgentNode';
import { TopologySelector } from './TopologySelector';
import agentsData from '../../data/agents.json';
import { getLayout } from '../../utils/layout-algorithms';
import { staggerContainerVariants } from '../../utils/animation-presets';
import type { Agent, TopologyType } from '../../types';

export function AgentVisualization() {
  const { topology, setTopology, selectedAgent, setSelectedAgent, isSidebarOpen } = useVisualizationStore();
  const { getContainerSize } = useResponsiveLayout();
  const { width, height } = getContainerSize(isSidebarOpen);

  // Flatten agents from categories
  const agents: Agent[] = useMemo(() => {
    return agentsData.categories.flatMap((category) =>
      category.agents.map((agent) => ({
        ...agent,
        category: category.id,
        status: agent.status as Agent['status'],
        connections: agent.connections.map((c) => ({
          targetId: c.targetId,
          type: c.type as 'coordinates' | 'delegates' | 'reports',
        })),
      }))
    );
  }, []);

  // Calculate positions based on topology
  const positions = useMemo(() => {
    return getLayout(topology, agents, { width: width - 40, height: height - 120, padding: 80 });
  }, [topology, agents, width, height]);

  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
  }, [setSelectedAgent]);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      core: '#3b82f6',
      specialized: '#8b5cf6',
      coordination: '#22c55e',
      consensus: '#f59e0b',
      github: '#6b7280',
      sparc: '#ec4899',
    };
    return colors[category] || '#3b82f6';
  };

  return (
    <motion.div
      className="relative w-full h-full"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with topology selector */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">Agent Ecosystem</h2>
          <p className="text-sm text-gray-400">60+ agent types organized by category</p>
        </div>
        <TopologySelector
          value={topology}
          onChange={(t) => setTopology(t as TopologyType)}
        />
      </div>

      {/* Visualization canvas */}
      <div className="relative" style={{ height: height - 120 }}>
        <svg
          width={width}
          height={height - 120}
          className="absolute inset-0"
        >
          {/* Draw connections between agents */}
          {agents.map((agent) =>
            agent.connections.map((conn) => {
              const fromPos = positions.get(agent.id);
              const toPos = positions.get(conn.targetId);
              if (!fromPos || !toPos) return null;

              return (
                <motion.line
                  key={`${agent.id}-${conn.targetId}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={getCategoryColor(agent.category)}
                  strokeOpacity={0.3}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />
              );
            })
          )}
        </svg>

        {/* Agent nodes */}
        {agents.map((agent) => {
          const pos = positions.get(agent.id);
          if (!pos) return null;

          return (
            <AgentNode
              key={agent.id}
              agent={agent}
              x={pos.x}
              y={pos.y}
              isSelected={selectedAgent?.id === agent.id}
              onClick={() => handleAgentClick(agent)}
              color={getCategoryColor(agent.category)}
            />
          );
        })}
      </div>

      {/* Category legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-bg-card/80 backdrop-blur border border-white/10">
        <div className="text-xs font-medium text-gray-400 mb-2">Categories</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {agentsData.categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getCategoryColor(cat.id) }}
              />
              <span className="text-gray-300">{cat.name}</span>
              <span className="text-gray-500">({cat.agents.length})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected agent detail */}
      {selectedAgent && (
        <motion.div
          className="absolute top-20 right-4 w-72 p-4 rounded-xl bg-bg-card/95 backdrop-blur-lg border border-white/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-white">{selectedAgent.type}</h3>
              <span className="text-xs text-primary-400">{selectedAgent.role}</span>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="p-1 rounded hover:bg-bg-hover"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                selectedAgent.status === 'active' ? 'bg-status-active/20 text-status-active' :
                selectedAgent.status === 'busy' ? 'bg-status-busy/20 text-status-busy' :
                'bg-status-idle/20 text-status-idle'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedAgent.status === 'active' ? 'bg-status-active' :
                  selectedAgent.status === 'busy' ? 'bg-status-busy' :
                  'bg-status-idle'
                }`} />
                {selectedAgent.status}
              </span>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Capabilities</div>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.capabilities.map((cap) => (
                  <span key={cap} className="px-2 py-0.5 text-xs rounded bg-bg-dark text-gray-300">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
