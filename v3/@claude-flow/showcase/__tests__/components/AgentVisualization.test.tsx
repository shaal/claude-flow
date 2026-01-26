/**
 * @claude-flow/showcase - AgentVisualization Component Tests
 *
 * TDD test specifications for agent ecosystem visualization.
 * Tests agent rendering, topology positioning, and interaction behaviors.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Component imports (will be implemented after tests)
import { AgentVisualization } from '../../src/components/agents/AgentVisualization';
import { mockAgentData, mockAgentCategories } from '../__mocks__/agent-data';
import type { Agent, Topology, AgentStatus } from '../../src/types';

describe('AgentVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Agent Rendering', () => {
    it('should render all 60+ agent types', () => {
      // Given: agent data with all types
      const data = mockAgentData;

      // When: visualization renders
      render(<AgentVisualization agents={data.agents} />);

      // Then: each agent type has a visual node
      const agentNodes = screen.getAllByTestId(/^agent-node-/);
      expect(agentNodes.length).toBeGreaterThanOrEqual(60);
    });

    it('should display agent type icons correctly', () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);

      // Check specific agent icons
      const coderAgent = screen.getByTestId('agent-node-coder');
      expect(coderAgent.querySelector('[data-icon="code"]')).toBeInTheDocument();

      const testerAgent = screen.getByTestId('agent-node-tester');
      expect(testerAgent.querySelector('[data-icon="test"]')).toBeInTheDocument();
    });

    it('should display agent role labels', () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);

      expect(screen.getByText('coder')).toBeInTheDocument();
      expect(screen.getByText('reviewer')).toBeInTheDocument();
      expect(screen.getByText('tester')).toBeInTheDocument();
    });

    it('should display agent status indicators', () => {
      // Given: agents with various statuses
      const agentsWithStatuses: Agent[] = [
        { ...mockAgentData.agents[0], id: 'agent-active', type: 'coder', status: 'active' },
        { ...mockAgentData.agents[1], id: 'agent-idle', type: 'reviewer', status: 'idle' },
        { ...mockAgentData.agents[2], id: 'agent-busy', type: 'tester', status: 'busy' },
      ];

      // When: rendered
      render(<AgentVisualization agents={agentsWithStatuses} />);

      // Then: active agents pulse, idle agents are static
      const activeAgent = screen.getByTestId('agent-node-agent-active');
      const idleAgent = screen.getByTestId('agent-node-agent-idle');
      const busyAgent = screen.getByTestId('agent-node-agent-busy');

      expect(activeAgent).toHaveClass('status-active');
      expect(activeAgent.querySelector('.pulse-indicator')).toBeInTheDocument();

      expect(idleAgent).toHaveClass('status-idle');
      expect(idleAgent.querySelector('.pulse-indicator')).not.toBeInTheDocument();

      expect(busyAgent).toHaveClass('status-busy');
      expect(busyAgent.querySelector('.spinning-indicator')).toBeInTheDocument();
    });

    it('should animate active agents with pulse effect', () => {
      const activeAgent: Agent = {
        id: 'active-agent',
        type: 'coder',
        role: 'Code Implementation',
        status: 'active',
        capabilities: ['write-code', 'debug'],
        connections: [],
      };

      render(<AgentVisualization agents={[activeAgent]} />);

      const agentNode = screen.getByTestId('agent-node-active-agent');
      const pulseElement = agentNode.querySelector('.pulse-indicator');

      expect(pulseElement).toBeInTheDocument();
      expect(pulseElement).toHaveClass('animate-pulse');
    });

    it('should position agents based on topology', () => {
      // Given: hierarchical topology selected
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          topology="hierarchical"
        />
      );

      // Then: queen/coordinator at top, workers below in tiers
      const coordinator = screen.getByTestId('agent-node-hierarchical-coordinator');
      const worker = screen.getByTestId('agent-node-coder');

      const coordPosition = coordinator.getAttribute('data-position');
      const workerPosition = worker.getAttribute('data-position');

      // Coordinator should be at a higher tier
      expect(parseInt(coordPosition?.split(',')[1] || '0')).toBeLessThan(
        parseInt(workerPosition?.split(',')[1] || '0')
      );
    });

    it('should support mesh topology positioning', () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          topology="mesh"
        />
      );

      const container = screen.getByTestId('agent-visualization');
      expect(container).toHaveAttribute('data-topology', 'mesh');

      // In mesh, agents should be arranged in a circular or grid pattern
      const agents = screen.getAllByTestId(/^agent-node-/);
      const positions = agents.map(a => a.getAttribute('data-position'));

      // Verify agents have distributed positions (no clustering at top)
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBeGreaterThan(agents.length / 2);
    });

    it('should support hierarchical-mesh hybrid topology', () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          topology="hierarchical-mesh"
        />
      );

      const container = screen.getByTestId('agent-visualization');
      expect(container).toHaveAttribute('data-topology', 'hierarchical-mesh');
    });
  });

  describe('Agent Categories', () => {
    it('should group agents by category', () => {
      // Given: agents with categories
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showCategories={true}
        />
      );

      // Categories should be visible
      expect(screen.getByText('Core Development')).toBeInTheDocument();
      expect(screen.getByText('Swarm Coordination')).toBeInTheDocument();
      expect(screen.getByText('Consensus & Distributed')).toBeInTheDocument();
    });

    it('should filter agents by category when filter active', async () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showCategories={true}
        />
      );
      const user = userEvent.setup();

      // Click on category filter
      const coreFilter = screen.getByRole('button', { name: /core development/i });
      await user.click(coreFilter);

      // Only core agents should be visible
      expect(screen.getByTestId('agent-node-coder')).toBeVisible();
      expect(screen.getByTestId('agent-node-tester')).toBeVisible();

      // Swarm agents should be hidden or dimmed
      const swarmAgent = screen.getByTestId('agent-node-hierarchical-coordinator');
      expect(swarmAgent).toHaveClass('agent-filtered-out');
    });

    it('should show category count badges', () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showCategories={true}
        />
      );

      const coreBadge = screen.getByTestId('category-badge-core');
      expect(coreBadge).toHaveTextContent(/\d+/); // Should show count
    });

    it('should allow multiple category filters', async () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showCategories={true}
        />
      );
      const user = userEvent.setup();

      // Select multiple categories
      await user.click(screen.getByRole('button', { name: /core development/i }));
      await user.click(screen.getByRole('button', { name: /testing/i }));

      // Both core and testing agents should be visible
      expect(screen.getByTestId('agent-node-coder')).toBeVisible();
      expect(screen.getByTestId('agent-node-tdd-london-swarm')).toBeVisible();
    });

    it('should clear category filters', async () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showCategories={true}
        />
      );
      const user = userEvent.setup();

      // Apply filter
      await user.click(screen.getByRole('button', { name: /core development/i }));

      // Clear filter
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // All agents should be visible
      const allAgents = screen.getAllByTestId(/^agent-node-/);
      allAgents.forEach(agent => {
        expect(agent).not.toHaveClass('agent-filtered-out');
      });
    });
  });

  describe('Agent Hover Interactions', () => {
    it('should show agent connections on hover', async () => {
      // Given: agent with dependencies
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');

      // When: user hovers
      await user.hover(coderAgent);

      // Then: connection lines appear
      const connectionLines = screen.getAllByTestId(/^connection-line-/);
      expect(connectionLines.length).toBeGreaterThan(0);
    });

    it('should highlight connected agents on hover', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');
      await user.hover(coderAgent);

      // Connected agents should be highlighted
      const reviewer = screen.getByTestId('agent-node-reviewer');
      expect(reviewer).toHaveClass('agent-connected');
    });

    it('should dim unrelated agents on hover', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');
      await user.hover(coderAgent);

      // Unrelated agents should be dimmed
      const unrelatedAgent = screen.getByTestId('agent-node-deployment');
      expect(unrelatedAgent).toHaveClass('agent-dimmed');
    });

    it('should show tooltip with agent capabilities', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');
      await user.hover(coderAgent);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('write-code');
      expect(tooltip).toHaveTextContent('debug');
    });

    it('should restore state on mouse leave', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');

      await user.hover(coderAgent);
      await user.unhover(coderAgent);

      // Connection lines should be hidden
      expect(screen.queryByTestId(/^connection-line-/)).not.toBeInTheDocument();

      // Agents should not be dimmed
      const agents = screen.getAllByTestId(/^agent-node-/);
      agents.forEach(agent => {
        expect(agent).not.toHaveClass('agent-dimmed');
      });
    });
  });

  describe('Agent Click Interactions', () => {
    it('should show agent detail panel on click', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');
      await user.click(coderAgent);

      const detailPanel = await screen.findByTestId('agent-detail-panel');
      expect(detailPanel).toBeInTheDocument();
      expect(detailPanel).toHaveTextContent('coder');
      expect(detailPanel).toHaveTextContent('Code Implementation');
    });

    it('should display full capabilities list in detail panel', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('agent-node-coder'));

      const capabilities = await screen.findByTestId('agent-capabilities');
      expect(capabilities).toHaveTextContent('write-code');
      expect(capabilities).toHaveTextContent('debug');
      expect(capabilities).toHaveTextContent('refactor');
    });

    it('should show agent connections in detail panel', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('agent-node-coder'));

      const connections = await screen.findByTestId('agent-connections-list');
      expect(connections).toBeInTheDocument();
    });

    it('should select agent on click', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const coderAgent = screen.getByTestId('agent-node-coder');
      await user.click(coderAgent);

      expect(coderAgent).toHaveClass('agent-selected');
    });
  });

  describe('Topology Switching', () => {
    it('should animate agents when topology changes', async () => {
      const { rerender } = render(
        <AgentVisualization agents={mockAgentData.agents} topology="hierarchical" />
      );

      rerender(
        <AgentVisualization agents={mockAgentData.agents} topology="mesh" />
      );

      await waitFor(() => {
        const agents = screen.getAllByTestId(/^agent-node-/);
        agents.forEach(agent => {
          expect(agent).toHaveClass('agent-transitioning');
        });
      });
    });

    it('should render topology selector when enabled', () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showTopologySelector={true}
        />
      );

      expect(screen.getByRole('radiogroup', { name: /topology/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /hierarchical/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /mesh/i })).toBeInTheDocument();
    });

    it('should change topology when selector clicked', async () => {
      const onTopologyChange = vi.fn();

      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          topology="hierarchical"
          showTopologySelector={true}
          onTopologyChange={onTopologyChange}
        />
      );
      const user = userEvent.setup();

      await user.click(screen.getByRole('radio', { name: /mesh/i }));

      expect(onTopologyChange).toHaveBeenCalledWith('mesh');
    });
  });

  describe('Connection Visualization', () => {
    it('should render connection lines between connected agents', () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showConnections={true}
        />
      );

      // Connection lines should be rendered
      const connections = screen.getAllByTestId(/^connection-/);
      expect(connections.length).toBeGreaterThan(0);
    });

    it('should style connections based on type', () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showConnections={true}
        />
      );

      const coordinationConnection = screen.getByTestId('connection-coordinator-coder');
      const dataConnection = screen.getByTestId('connection-coder-memory');

      expect(coordinationConnection).toHaveClass('connection-coordination');
      expect(dataConnection).toHaveClass('connection-data');
    });

    it('should animate active connections', () => {
      const agentsWithActiveConnection = mockAgentData.agents.map(agent => ({
        ...agent,
        connections: agent.connections.map(conn => ({
          ...conn,
          active: true,
        })),
      }));

      render(
        <AgentVisualization
          agents={agentsWithActiveConnection}
          showConnections={true}
        />
      );

      const connections = screen.getAllByTestId(/^connection-/);
      connections.forEach(conn => {
        expect(conn).toHaveClass('connection-animated');
      });
    });
  });

  describe('Search and Filter', () => {
    it('should filter agents by search term', async () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showSearch={true}
        />
      );
      const user = userEvent.setup();

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'coder');

      // Only matching agents should be visible
      expect(screen.getByTestId('agent-node-coder')).toBeVisible();

      const nonMatchingAgents = screen.getAllByTestId(/^agent-node-(?!coder)/);
      nonMatchingAgents.forEach(agent => {
        expect(agent).toHaveClass('agent-filtered-out');
      });
    });

    it('should highlight matching agents', async () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showSearch={true}
        />
      );
      const user = userEvent.setup();

      await user.type(screen.getByRole('searchbox'), 'security');

      const securityArchitect = screen.getByTestId('agent-node-security-architect');
      const securityAuditor = screen.getByTestId('agent-node-security-auditor');

      expect(securityArchitect).toHaveClass('agent-search-match');
      expect(securityAuditor).toHaveClass('agent-search-match');
    });

    it('should show no results message when no matches', async () => {
      render(
        <AgentVisualization
          agents={mockAgentData.agents}
          showSearch={true}
        />
      );
      const user = userEvent.setup();

      await user.type(screen.getByRole('searchbox'), 'nonexistentagent');

      expect(screen.getByText(/no agents found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for agents', () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);

      const coderAgent = screen.getByTestId('agent-node-coder');
      expect(coderAgent).toHaveAttribute('aria-label', expect.stringContaining('coder'));
      expect(coderAgent).toHaveAttribute('role', 'button');
    });

    it('should support keyboard navigation', async () => {
      render(<AgentVisualization agents={mockAgentData.agents} />);
      const user = userEvent.setup();

      const firstAgent = screen.getAllByTestId(/^agent-node-/)[0];
      firstAgent.focus();

      await user.keyboard('{Tab}');

      expect(document.activeElement).not.toBe(firstAgent);
      expect(document.activeElement?.getAttribute('data-testid')).toMatch(/^agent-node-/);
    });

    it('should announce status changes', async () => {
      const { rerender } = render(
        <AgentVisualization agents={mockAgentData.agents} />
      );

      const updatedAgents = mockAgentData.agents.map(a =>
        a.id === 'coder' ? { ...a, status: 'busy' as AgentStatus } : a
      );

      rerender(<AgentVisualization agents={updatedAgents} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/coder.*busy/i);
    });
  });

  describe('Performance', () => {
    it('should render 100 agents efficiently', async () => {
      const manyAgents = Array.from({ length: 100 }, (_, i) => ({
        id: `agent-${i}`,
        type: 'coder' as const,
        role: `Agent ${i}`,
        status: 'idle' as AgentStatus,
        capabilities: [],
        connections: [],
      }));

      const startTime = performance.now();
      render(<AgentVisualization agents={manyAgents} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should render within 500ms
    });

    it('should virtualize rendering for large agent counts', () => {
      const manyAgents = Array.from({ length: 200 }, (_, i) => ({
        id: `agent-${i}`,
        type: 'coder' as const,
        role: `Agent ${i}`,
        status: 'idle' as AgentStatus,
        capabilities: [],
        connections: [],
      }));

      render(<AgentVisualization agents={manyAgents} />);

      // Should not render all 200 DOM nodes at once
      const renderedAgents = screen.getAllByTestId(/^agent-node-/);
      expect(renderedAgents.length).toBeLessThan(200);
    });
  });

  describe('Responsive Layout', () => {
    it('should stack agents on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<AgentVisualization agents={mockAgentData.agents} />);

      const container = screen.getByTestId('agent-visualization');
      expect(container).toHaveClass('layout-mobile');
    });

    it('should use grid layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<AgentVisualization agents={mockAgentData.agents} />);

      const container = screen.getByTestId('agent-visualization');
      expect(container).toHaveClass('layout-desktop');
    });
  });
});
