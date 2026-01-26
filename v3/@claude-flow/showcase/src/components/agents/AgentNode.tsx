import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { Agent } from '../../types';
import { nodeVariants, pulseVariants } from '../../utils/animation-presets';

interface AgentNodeProps {
  agent: Agent;
  x: number;
  y: number;
  isSelected?: boolean;
  onClick?: () => void;
  color?: string;
}

export function AgentNode({
  agent,
  x,
  y,
  isSelected = false,
  onClick,
  color = '#3b82f6',
}: AgentNodeProps) {
  const getStatusColor = (status: Agent['status']): string => {
    const colors = {
      active: '#22c55e',
      idle: '#94a3b8',
      busy: '#f59e0b',
      error: '#ef4444',
    };
    return colors[status];
  };

  return (
    <motion.div
      className={clsx(
        'absolute flex flex-col items-center cursor-pointer',
        'transform -translate-x-1/2 -translate-y-1/2'
      )}
      style={{ left: x, top: y }}
      variants={nodeVariants}
      initial="initial"
      animate={isSelected ? 'selected' : 'animate'}
      whileHover="hover"
      onClick={onClick}
    >
      {/* Node circle */}
      <div className="relative">
        {/* Pulse ring for active agents */}
        {agent.status === 'active' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: getStatusColor(agent.status) }}
            variants={pulseVariants}
            animate="pulse"
          />
        )}

        {/* Main circle */}
        <motion.div
          className={clsx(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            'border-2 transition-all',
            isSelected && 'ring-2 ring-offset-2 ring-offset-bg-dark'
          )}
          style={{
            backgroundColor: `${color}20`,
            borderColor: color,
            ringColor: color,
          }}
        >
          {/* Agent type icon */}
          <span className="text-lg">
            {getAgentIcon(agent.type)}
          </span>

          {/* Status indicator */}
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-dark"
            style={{ backgroundColor: getStatusColor(agent.status) }}
          />
        </motion.div>
      </div>

      {/* Agent label */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xs font-medium text-gray-300 truncate max-w-[80px]">
          {agent.type}
        </div>
      </motion.div>
    </motion.div>
  );
}

function getAgentIcon(type: string): string {
  const icons: Record<string, string> = {
    coder: '\u{1F4BB}',
    reviewer: '\u{1F50D}',
    tester: '\u{1F9EA}',
    planner: '\u{1F4CB}',
    researcher: '\u{1F4DA}',
    'security-architect': '\u{1F6E1}',
    'security-auditor': '\u{1F50F}',
    'memory-specialist': '\u{1F9E0}',
    'performance-engineer': '\u{26A1}',
    'hierarchical-coordinator': '\u{1F451}',
    'mesh-coordinator': '\u{1F578}',
    'adaptive-coordinator': '\u{1F504}',
    'swarm-memory-manager': '\u{1F4BE}',
    'byzantine-coordinator': '\u{1F3DB}',
    'raft-manager': '\u{2693}',
    'gossip-coordinator': '\u{1F4AC}',
    'crdt-synchronizer': '\u{1F500}',
    'pr-manager': '\u{1F4E5}',
    'code-review-swarm': '\u{1F440}',
    'issue-tracker': '\u{1F41B}',
    'release-manager': '\u{1F680}',
    'sparc-coord': '\u{2728}',
    specification: '\u{1F4DD}',
    pseudocode: '\u{1F4DC}',
    architecture: '\u{1F3D7}',
  };
  return icons[type] || '\u{1F916}';
}
