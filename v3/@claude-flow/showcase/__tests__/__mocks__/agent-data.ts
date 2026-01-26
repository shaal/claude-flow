/**
 * Mock data for agent visualization tests
 */

import type { Agent, AgentCategory, AgentStatus, AgentConnection } from '../../src/types';

export const mockAgentCategories: AgentCategory[] = [
  { id: 'core', name: 'Core Development', count: 5 },
  { id: 'swarm', name: 'Swarm Coordination', count: 5 },
  { id: 'consensus', name: 'Consensus & Distributed', count: 7 },
  { id: 'performance', name: 'Performance & Optimization', count: 5 },
  { id: 'github', name: 'GitHub & Repository', count: 9 },
  { id: 'sparc', name: 'SPARC Methodology', count: 6 },
  { id: 'testing', name: 'Testing & Validation', count: 2 },
];

const createAgent = (
  id: string,
  type: string,
  role: string,
  category: string,
  status: AgentStatus = 'idle',
  capabilities: string[] = [],
  connections: AgentConnection[] = []
): Agent => ({
  id,
  type: type as Agent['type'],
  role,
  category,
  status,
  capabilities,
  connections,
});

export const mockAgentData = {
  total: 60,
  agents: [
    // Core Development
    createAgent('coder', 'coder', 'Code Implementation', 'core', 'active',
      ['write-code', 'debug', 'refactor'],
      [{ targetId: 'reviewer', type: 'coordination' }, { targetId: 'memory', type: 'data' }]),
    createAgent('reviewer', 'reviewer', 'Code Review', 'core', 'idle',
      ['review-code', 'suggest-improvements', 'security-check']),
    createAgent('tester', 'tester', 'Testing', 'core', 'idle',
      ['write-tests', 'run-tests', 'coverage-report']),
    createAgent('planner', 'planner', 'Planning', 'core', 'idle',
      ['create-tasks', 'prioritize', 'estimate']),
    createAgent('researcher', 'researcher', 'Research', 'core', 'idle',
      ['analyze-requirements', 'research-patterns', 'document-findings']),

    // Swarm Coordination
    createAgent('hierarchical-coordinator', 'hierarchical-coordinator', 'Hierarchical Coordination', 'swarm', 'active',
      ['coordinate-agents', 'manage-hierarchy', 'task-distribution'],
      [{ targetId: 'coder', type: 'coordination' }, { targetId: 'tester', type: 'coordination' }]),
    createAgent('mesh-coordinator', 'mesh-coordinator', 'Mesh Coordination', 'swarm', 'idle',
      ['peer-coordination', 'consensus-building']),
    createAgent('adaptive-coordinator', 'adaptive-coordinator', 'Adaptive Coordination', 'swarm', 'idle',
      ['dynamic-topology', 'load-balancing']),
    createAgent('collective-intelligence-coordinator', 'collective-intelligence-coordinator', 'Collective Intelligence', 'swarm', 'idle',
      ['aggregate-insights', 'pattern-synthesis']),
    createAgent('swarm-memory-manager', 'swarm-memory-manager', 'Swarm Memory', 'swarm', 'idle',
      ['shared-memory', 'state-sync']),

    // Consensus & Distributed
    createAgent('byzantine-coordinator', 'byzantine-coordinator', 'Byzantine Consensus', 'consensus', 'idle',
      ['bft-consensus', 'fault-tolerance']),
    createAgent('raft-manager', 'raft-manager', 'Raft Consensus', 'consensus', 'idle',
      ['leader-election', 'log-replication']),
    createAgent('gossip-coordinator', 'gossip-coordinator', 'Gossip Protocol', 'consensus', 'idle',
      ['epidemic-broadcast', 'membership']),
    createAgent('consensus-builder', 'consensus-builder', 'Consensus Building', 'consensus', 'idle',
      ['vote-collection', 'decision-making']),
    createAgent('crdt-synchronizer', 'crdt-synchronizer', 'CRDT Sync', 'consensus', 'idle',
      ['conflict-free-merge', 'eventual-consistency']),
    createAgent('quorum-manager', 'quorum-manager', 'Quorum Management', 'consensus', 'idle',
      ['quorum-calculation', 'vote-counting']),
    createAgent('security-manager', 'security-manager', 'Security Management', 'consensus', 'idle',
      ['access-control', 'audit-logging']),

    // Performance & Optimization
    createAgent('perf-analyzer', 'perf-analyzer', 'Performance Analysis', 'performance', 'idle',
      ['profiling', 'bottleneck-detection']),
    createAgent('performance-benchmarker', 'performance-benchmarker', 'Benchmarking', 'performance', 'idle',
      ['benchmark-execution', 'metrics-collection']),
    createAgent('task-orchestrator', 'task-orchestrator', 'Task Orchestration', 'performance', 'idle',
      ['scheduling', 'resource-allocation']),
    createAgent('memory-coordinator', 'memory-coordinator', 'Memory Coordination', 'performance', 'idle',
      ['memory-optimization', 'cache-management']),
    createAgent('smart-agent', 'smart-agent', 'Smart Agent', 'performance', 'idle',
      ['adaptive-behavior', 'learning']),

    // GitHub & Repository
    createAgent('github-modes', 'github-modes', 'GitHub Modes', 'github', 'idle',
      ['mode-switching', 'context-management']),
    createAgent('pr-manager', 'pr-manager', 'PR Management', 'github', 'idle',
      ['create-pr', 'review-pr', 'merge-pr']),
    createAgent('code-review-swarm', 'code-review-swarm', 'Code Review Swarm', 'github', 'idle',
      ['distributed-review', 'consensus-approval']),
    createAgent('issue-tracker', 'issue-tracker', 'Issue Tracking', 'github', 'idle',
      ['create-issue', 'triage', 'assign']),
    createAgent('release-manager', 'release-manager', 'Release Management', 'github', 'idle',
      ['versioning', 'changelog', 'publish']),
    createAgent('workflow-automation', 'workflow-automation', 'Workflow Automation', 'github', 'idle',
      ['github-actions', 'ci-cd']),
    createAgent('project-board-sync', 'project-board-sync', 'Project Board Sync', 'github', 'idle',
      ['board-management', 'status-updates']),
    createAgent('repo-architect', 'repo-architect', 'Repository Architecture', 'github', 'idle',
      ['structure-design', 'monorepo-management']),
    createAgent('multi-repo-swarm', 'multi-repo-swarm', 'Multi-Repo Swarm', 'github', 'idle',
      ['cross-repo-coordination', 'dependency-sync']),

    // SPARC Methodology
    createAgent('sparc-coord', 'sparc-coord', 'SPARC Coordination', 'sparc', 'idle',
      ['methodology-orchestration', 'phase-management']),
    createAgent('sparc-coder', 'sparc-coder', 'SPARC Coder', 'sparc', 'idle',
      ['specification-driven-coding', 'architecture-aware']),
    createAgent('specification', 'specification', 'Specification', 'sparc', 'idle',
      ['requirements-analysis', 'spec-writing']),
    createAgent('pseudocode', 'pseudocode', 'Pseudocode', 'sparc', 'idle',
      ['algorithm-design', 'logic-planning']),
    createAgent('architecture', 'architecture', 'Architecture', 'sparc', 'idle',
      ['system-design', 'component-layout']),
    createAgent('refinement', 'refinement', 'Refinement', 'sparc', 'idle',
      ['iteration', 'optimization']),

    // Specialized Development
    createAgent('backend-dev', 'backend-dev', 'Backend Development', 'specialized', 'idle',
      ['api-development', 'database-design']),
    createAgent('mobile-dev', 'mobile-dev', 'Mobile Development', 'specialized', 'idle',
      ['ios', 'android', 'react-native']),
    createAgent('ml-developer', 'ml-developer', 'ML Development', 'specialized', 'idle',
      ['model-training', 'inference']),
    createAgent('cicd-engineer', 'cicd-engineer', 'CI/CD Engineering', 'specialized', 'idle',
      ['pipeline-design', 'deployment-automation']),
    createAgent('api-docs', 'api-docs', 'API Documentation', 'specialized', 'idle',
      ['openapi', 'swagger', 'documentation']),
    createAgent('system-architect', 'system-architect', 'System Architecture', 'specialized', 'idle',
      ['design-patterns', 'scalability']),
    createAgent('code-analyzer', 'code-analyzer', 'Code Analysis', 'specialized', 'idle',
      ['static-analysis', 'complexity-metrics']),
    createAgent('base-template-generator', 'base-template-generator', 'Template Generation', 'specialized', 'idle',
      ['scaffolding', 'boilerplate']),

    // Testing & Validation
    createAgent('tdd-london-swarm', 'tdd-london-swarm', 'TDD London Style', 'testing', 'idle',
      ['outside-in-tdd', 'mock-first']),
    createAgent('production-validator', 'production-validator', 'Production Validation', 'testing', 'idle',
      ['smoke-tests', 'health-checks']),

    // V3 Specialized
    createAgent('security-architect', 'security-architect', 'Security Architecture', 'v3-specialized', 'idle',
      ['threat-modeling', 'security-design']),
    createAgent('security-auditor', 'security-auditor', 'Security Auditing', 'v3-specialized', 'idle',
      ['vulnerability-assessment', 'compliance-check']),
    createAgent('memory-specialist', 'memory-specialist', 'Memory Specialist', 'v3-specialized', 'idle',
      ['memory-patterns', 'cache-optimization']),
    createAgent('performance-engineer', 'performance-engineer', 'Performance Engineering', 'v3-specialized', 'idle',
      ['optimization', 'profiling']),

    // Deployment
    createAgent('deployment', 'deployment', 'Deployment', 'deployment', 'idle',
      ['deploy', 'rollback', 'environments']),

    // Fill remaining to reach 60+
    ...Array.from({ length: 10 }, (_, i) =>
      createAgent(
        `agent-${i + 50}`,
        'coder',
        `Agent ${i + 50}`,
        'core',
        'idle',
        ['generic-task']
      )
    ),
  ],
};
