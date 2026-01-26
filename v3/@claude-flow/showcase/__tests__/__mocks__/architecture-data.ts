/**
 * Mock data for architecture visualization tests
 */

import type { ArchitectureNode, Connection } from '../../src/types';

export const mockNodes: ArchitectureNode[] = [
  {
    id: 'cli',
    name: '@claude-flow/cli',
    type: 'module',
    description: '26 commands, 140+ subcommands',
    technologies: [
      { name: 'TypeScript', version: '5.3+', purpose: 'Type-safe development', icon: 'typescript', docUrl: 'https://typescriptlang.org' },
      { name: 'Commander.js', version: '11+', purpose: 'CLI framework', icon: 'commander', docUrl: 'https://github.com/tj/commander.js' },
    ],
    metrics: { lines: 629, coverage: 85 },
    position: { x: 400, y: 50 },
    connections: ['memory', 'swarm', 'mcp'],
  },
  {
    id: 'memory',
    name: '@claude-flow/memory',
    type: 'module',
    description: 'AgentDB with HNSW indexing',
    technologies: [
      { name: 'SQLite', version: '3.40+', purpose: 'Persistent storage', icon: 'sqlite', docUrl: 'https://sqlite.org' },
      { name: 'HNSW', version: '1.0', purpose: '150x-12,500x faster search', icon: 'vector', docUrl: '#' },
    ],
    metrics: { lines: 1200, coverage: 90 },
    position: { x: 200, y: 200 },
    connections: ['cli', 'swarm'],
  },
  {
    id: 'swarm',
    name: '@claude-flow/swarm',
    type: 'module',
    description: 'Multi-agent coordination',
    technologies: [
      { name: 'TypeScript', version: '5.3+', purpose: 'Type-safe development', icon: 'typescript', docUrl: 'https://typescriptlang.org' },
    ],
    metrics: { lines: 800, coverage: 82 },
    position: { x: 400, y: 200 },
    connections: ['cli', 'memory', 'mcp'],
  },
  {
    id: 'mcp',
    name: '@claude-flow/mcp',
    type: 'module',
    description: 'MCP server integration',
    technologies: [
      { name: 'Express', version: '4.18+', purpose: 'HTTP server', icon: 'express', docUrl: 'https://expressjs.com' },
    ],
    metrics: { lines: 450, coverage: 78 },
    position: { x: 600, y: 200 },
    connections: ['cli', 'swarm'],
  },
  {
    id: 'neural',
    name: '@claude-flow/neural',
    type: 'module',
    description: 'Neural pattern learning',
    technologies: [
      { name: 'SONA', version: '1.0', purpose: 'Self-Optimizing Neural Architecture', icon: 'neural', docUrl: '#' },
    ],
    metrics: { lines: 950, coverage: 75 },
    position: { x: 200, y: 350 },
    connections: ['memory', 'swarm'],
  },
  {
    id: 'security',
    name: '@claude-flow/security',
    type: 'module',
    description: 'Security scanning & validation',
    technologies: [
      { name: 'Zod', version: '3.22+', purpose: 'Schema validation', icon: 'zod', docUrl: 'https://zod.dev' },
      { name: 'bcrypt', version: '5+', purpose: 'Password hashing', icon: 'security', docUrl: '#' },
    ],
    metrics: { lines: 600, coverage: 92 },
    position: { x: 400, y: 350 },
    connections: ['cli', 'mcp'],
  },
  {
    id: 'mcp-server',
    name: 'MCP Server',
    type: 'service',
    description: 'Stdio/HTTP transport',
    technologies: [],
    metrics: { lines: 300, coverage: 70 },
    position: { x: 600, y: 350 },
    connections: ['mcp'],
  },
  {
    id: 'deployment',
    name: '@claude-flow/deployment',
    type: 'module',
    description: 'Deployment management',
    technologies: [],
    metrics: { lines: 400, coverage: 65 },
    position: { x: 100, y: 350 },
    connections: [],
  },
];

export const mockConnections: Connection[] = [
  { from: 'cli', to: 'memory', type: 'uses' },
  { from: 'cli', to: 'swarm', type: 'uses' },
  { from: 'cli', to: 'mcp', type: 'uses' },
  { from: 'swarm', to: 'memory', type: 'uses' },
  { from: 'swarm', to: 'mcp', type: 'uses' },
  { from: 'neural', to: 'memory', type: 'uses' },
  { from: 'neural', to: 'swarm', type: 'uses' },
  { from: 'security', to: 'cli', type: 'uses' },
  { from: 'security', to: 'mcp', type: 'uses' },
  { from: 'mcp-server', to: 'mcp', type: 'implements' },
];

export const mockArchitectureData = {
  version: '3.0.0-alpha',
  modules: mockNodes,
  connections: mockConnections,
};
