/**
 * @claude-flow/showcase - ArchitectureGraph Component Tests
 *
 * TDD test specifications for the main architecture visualization component.
 * Tests D3 force simulation, node interactions, and view transitions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as d3 from 'd3';

// Component imports (will be implemented after tests)
import { ArchitectureGraph } from '../../src/components/architecture/ArchitectureGraph';
import { mockArchitectureData, mockNodes, mockConnections } from '../__mocks__/architecture-data';

// Mock D3 force simulation
vi.mock('d3', async () => {
  const actual = await vi.importActual<typeof d3>('d3');
  return {
    ...actual,
    forceSimulation: vi.fn(() => ({
      nodes: vi.fn().mockReturnThis(),
      force: vi.fn().mockReturnThis(),
      alpha: vi.fn().mockReturnThis(),
      alphaTarget: vi.fn().mockReturnThis(),
      restart: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      tick: vi.fn(),
    })),
    forceLink: vi.fn(() => ({
      id: vi.fn().mockReturnThis(),
      distance: vi.fn().mockReturnThis(),
      strength: vi.fn().mockReturnThis(),
      links: vi.fn().mockReturnValue([]),
    })),
    forceManyBody: vi.fn(() => ({
      strength: vi.fn().mockReturnThis(),
      distanceMin: vi.fn().mockReturnThis(),
      distanceMax: vi.fn().mockReturnThis(),
    })),
    forceCenter: vi.fn(() => ({})),
    forceCollide: vi.fn(() => ({
      radius: vi.fn().mockReturnThis(),
    })),
    forceX: vi.fn(() => ({
      strength: vi.fn().mockReturnThis(),
    })),
    forceY: vi.fn(() => ({
      strength: vi.fn().mockReturnThis(),
    })),
    drag: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
    })),
    select: actual.select,
    selectAll: actual.selectAll,
  };
});

describe('ArchitectureGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Render', () => {
    it('should render all architecture nodes', () => {
      // Given: architecture data with 18 modules
      const data = mockArchitectureData;

      // When: component mounts
      render(<ArchitectureGraph data={data} />);

      // Then: 18 node elements are visible
      const nodes = screen.getAllByRole('button', { name: /node-/i });
      expect(nodes).toHaveLength(data.modules.length);
    });

    it('should render the SVG container with correct dimensions', () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const svg = screen.getByTestId('architecture-graph-svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width');
      expect(svg).toHaveAttribute('height');
    });

    it('should display node labels correctly', () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      // Check for specific module labels
      expect(screen.getByText('@claude-flow/cli')).toBeInTheDocument();
      expect(screen.getByText('@claude-flow/memory')).toBeInTheDocument();
      expect(screen.getByText('@claude-flow/swarm')).toBeInTheDocument();
    });

    it('should apply correct node types styling', () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const moduleNode = screen.getByTestId('node-cli');
      const serviceNode = screen.getByTestId('node-mcp-server');

      expect(moduleNode).toHaveClass('node-module');
      expect(serviceNode).toHaveClass('node-service');
    });

    it('should initialize D3 force simulation', () => {
      // Given: component with node data
      render(<ArchitectureGraph data={mockArchitectureData} />);

      // Then: simulation is initialized with forces
      expect(d3.forceSimulation).toHaveBeenCalled();
      expect(d3.forceLink).toHaveBeenCalled();
      expect(d3.forceManyBody).toHaveBeenCalled();
      expect(d3.forceCenter).toHaveBeenCalled();
    });

    it('should render connections between related nodes', () => {
      // Given: nodes with dependency relationships
      render(<ArchitectureGraph data={mockArchitectureData} />);

      // Then: edge elements connect dependent nodes
      const edges = screen.getAllByTestId(/^edge-/);
      expect(edges.length).toBeGreaterThan(0);

      // Verify specific connections exist
      const cliToMemoryEdge = screen.getByTestId('edge-cli-memory');
      expect(cliToMemoryEdge).toBeInTheDocument();
    });

    it('should assign unique IDs to all nodes', () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const nodes = screen.getAllByTestId(/^node-/);
      const ids = nodes.map(node => node.getAttribute('data-testid'));
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should position nodes based on initial simulation', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      await waitFor(() => {
        const nodes = screen.getAllByTestId(/^node-/);
        nodes.forEach(node => {
          // Nodes should have transform attribute from simulation
          expect(node).toHaveAttribute('transform');
        });
      });
    });
  });

  describe('Interaction - Hover', () => {
    it('should highlight node on hover', async () => {
      // Given: rendered graph
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');

      // When: user hovers over node
      await user.hover(node);

      // Then: node scales up and glows
      expect(node).toHaveClass('node-highlighted');
      expect(node).toHaveStyle({ transform: expect.stringContaining('scale') });
    });

    it('should show tooltip on node hover', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.hover(node);

      // Tooltip should appear with node info
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('26 commands');
    });

    it('should dim unrelated nodes on hover', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const cliNode = screen.getByTestId('node-cli');
      await user.hover(cliNode);

      // Unconnected nodes should be dimmed
      const unrelatedNode = screen.getByTestId('node-deployment');
      expect(unrelatedNode).toHaveClass('node-dimmed');
    });

    it('should restore nodes on mouse leave', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.hover(node);
      await user.unhover(node);

      expect(node).not.toHaveClass('node-highlighted');

      const otherNode = screen.getByTestId('node-deployment');
      expect(otherNode).not.toHaveClass('node-dimmed');
    });
  });

  describe('Interaction - Click', () => {
    it('should show detail panel on node click', async () => {
      // Given: rendered graph
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      // When: user clicks node
      const node = screen.getByTestId('node-cli');
      await user.click(node);

      // Then: detail panel appears with node info
      const detailPanel = await screen.findByTestId('node-detail-panel');
      expect(detailPanel).toBeInTheDocument();
      expect(detailPanel).toHaveTextContent('@claude-flow/cli');
      expect(detailPanel).toHaveTextContent('26 commands, 140+ subcommands');
    });

    it('should highlight connected edges on node selection', async () => {
      // Given: node selected
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const cliNode = screen.getByTestId('node-cli');

      // When: selection occurs
      await user.click(cliNode);

      // Then: connected edges change color/thickness
      const connectedEdge = screen.getByTestId('edge-cli-memory');
      expect(connectedEdge).toHaveClass('edge-highlighted');
      expect(connectedEdge).toHaveAttribute('stroke-width', '3');
    });

    it('should display node technologies in detail panel', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      const detailPanel = await screen.findByTestId('node-detail-panel');
      expect(detailPanel).toHaveTextContent('TypeScript');
      expect(detailPanel).toHaveTextContent('Commander.js');
    });

    it('should display node metrics in detail panel', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      const detailPanel = await screen.findByTestId('node-detail-panel');
      expect(detailPanel).toHaveTextContent('629 lines');
    });

    it('should display connected components list in detail panel', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      const connections = await screen.findByTestId('detail-connections');
      expect(connections).toHaveTextContent('memory');
      expect(connections).toHaveTextContent('swarm');
      expect(connections).toHaveTextContent('mcp');
    });

    it('should close detail panel when clicking outside', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      const detailPanel = await screen.findByTestId('node-detail-panel');
      expect(detailPanel).toBeInTheDocument();

      // Click on background
      const background = screen.getByTestId('graph-background');
      await user.click(background);

      await waitFor(() => {
        expect(screen.queryByTestId('node-detail-panel')).not.toBeInTheDocument();
      });
    });

    it('should close detail panel when clicking close button', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      const closeButton = await screen.findByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('node-detail-panel')).not.toBeInTheDocument();
      });
    });

    it('should switch selected node when clicking another node', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const cliNode = screen.getByTestId('node-cli');
      await user.click(cliNode);

      expect(cliNode).toHaveClass('node-selected');

      const memoryNode = screen.getByTestId('node-memory');
      await user.click(memoryNode);

      expect(cliNode).not.toHaveClass('node-selected');
      expect(memoryNode).toHaveClass('node-selected');
    });
  });

  describe('View Transitions', () => {
    it('should animate between topology views', async () => {
      // Given: current view is 'hierarchical'
      const { rerender } = render(
        <ArchitectureGraph data={mockArchitectureData} viewMode="hierarchical" />
      );

      // When: user switches to 'mesh'
      rerender(
        <ArchitectureGraph data={mockArchitectureData} viewMode="mesh" />
      );

      // Then: nodes animate to new positions
      await waitFor(() => {
        const nodes = screen.getAllByTestId(/^node-/);
        nodes.forEach(node => {
          expect(node).toHaveClass('transitioning');
        });
      });
    });

    it('should support hierarchical view mode', () => {
      render(<ArchitectureGraph data={mockArchitectureData} viewMode="hierarchical" />);

      const container = screen.getByTestId('architecture-graph');
      expect(container).toHaveAttribute('data-view-mode', 'hierarchical');
    });

    it('should support mesh view mode', () => {
      render(<ArchitectureGraph data={mockArchitectureData} viewMode="mesh" />);

      const container = screen.getByTestId('architecture-graph');
      expect(container).toHaveAttribute('data-view-mode', 'mesh');
    });

    it('should support radial view mode', () => {
      render(<ArchitectureGraph data={mockArchitectureData} viewMode="radial" />);

      const container = screen.getByTestId('architecture-graph');
      expect(container).toHaveAttribute('data-view-mode', 'radial');
    });

    it('should maintain selection during view transition', async () => {
      const { rerender } = render(
        <ArchitectureGraph data={mockArchitectureData} viewMode="hierarchical" />
      );
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      expect(node).toHaveClass('node-selected');

      rerender(
        <ArchitectureGraph data={mockArchitectureData} viewMode="mesh" />
      );

      await waitFor(() => {
        const selectedNode = screen.getByTestId('node-cli');
        expect(selectedNode).toHaveClass('node-selected');
      });
    });

    it('should complete transition animation within 500ms', async () => {
      vi.useFakeTimers();

      const { rerender } = render(
        <ArchitectureGraph data={mockArchitectureData} viewMode="hierarchical" />
      );

      rerender(
        <ArchitectureGraph data={mockArchitectureData} viewMode="mesh" />
      );

      // Fast-forward 500ms
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        const nodes = screen.getAllByTestId(/^node-/);
        nodes.forEach(node => {
          expect(node).not.toHaveClass('transitioning');
        });
      });

      vi.useRealTimers();
    });
  });

  describe('Zoom and Pan', () => {
    it('should support zoom in', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInButton);

      const svg = screen.getByTestId('architecture-graph-svg');
      expect(svg).toHaveAttribute('data-zoom', expect.stringMatching(/1\.[0-9]+/));
    });

    it('should support zoom out', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      await user.click(zoomOutButton);

      const svg = screen.getByTestId('architecture-graph-svg');
      expect(svg).toHaveAttribute('data-zoom', expect.stringMatching(/0\.[0-9]+/));
    });

    it('should support reset zoom', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      // Zoom in first
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInButton);

      // Then reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      const svg = screen.getByTestId('architecture-graph-svg');
      expect(svg).toHaveAttribute('data-zoom', '1');
    });

    it('should support wheel zoom', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const svg = screen.getByTestId('architecture-graph-svg');

      fireEvent.wheel(svg, { deltaY: -100 });

      await waitFor(() => {
        expect(svg).toHaveAttribute('data-zoom', expect.stringMatching(/1\.[0-9]+/));
      });
    });

    it('should constrain zoom to min/max bounds', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} minZoom={0.5} maxZoom={2} />);
      const user = userEvent.setup();

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });

      // Click zoom out many times
      for (let i = 0; i < 10; i++) {
        await user.click(zoomOutButton);
      }

      const svg = screen.getByTestId('architecture-graph-svg');
      const zoom = parseFloat(svg.getAttribute('data-zoom') || '1');
      expect(zoom).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Dragging', () => {
    it('should support node dragging', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const node = screen.getByTestId('node-cli');

      fireEvent.mouseDown(node, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(node, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(node);

      // Node should have new position
      expect(node).toHaveAttribute('transform', expect.stringContaining('translate'));
    });

    it('should fix node position after dragging', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const node = screen.getByTestId('node-cli');

      fireEvent.mouseDown(node, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(node, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(node);

      expect(node).toHaveClass('node-fixed');
    });

    it('should reheat simulation on drag', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const node = screen.getByTestId('node-cli');

      fireEvent.mouseDown(node, { clientX: 100, clientY: 100 });

      // Verify simulation alpha was reset
      const simulationMock = vi.mocked(d3.forceSimulation).mock.results[0].value;
      expect(simulationMock.alphaTarget).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for nodes', () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const node = screen.getByTestId('node-cli');
      expect(node).toHaveAttribute('aria-label', expect.stringContaining('@claude-flow/cli'));
    });

    it('should support keyboard navigation between nodes', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const firstNode = screen.getByTestId('node-cli');
      firstNode.focus();

      await user.keyboard('{Tab}');

      // Focus should move to next node
      expect(document.activeElement).not.toBe(firstNode);
      expect(document.activeElement?.getAttribute('data-testid')).toMatch(/^node-/);
    });

    it('should select node on Enter key', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      node.focus();

      await user.keyboard('{Enter}');

      expect(node).toHaveClass('node-selected');
      const detailPanel = await screen.findByTestId('node-detail-panel');
      expect(detailPanel).toBeInTheDocument();
    });

    it('should close detail panel on Escape key', async () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);
      const user = userEvent.setup();

      const node = screen.getByTestId('node-cli');
      await user.click(node);

      await screen.findByTestId('node-detail-panel');

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('node-detail-panel')).not.toBeInTheDocument();
      });
    });

    it('should have role="img" with description for the graph', () => {
      render(<ArchitectureGraph data={mockArchitectureData} />);

      const container = screen.getByTestId('architecture-graph');
      expect(container).toHaveAttribute('role', 'img');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining('architecture'));
    });
  });

  describe('Performance', () => {
    it('should render large graphs efficiently', async () => {
      const largeData = {
        ...mockArchitectureData,
        modules: Array.from({ length: 100 }, (_, i) => ({
          id: `module-${i}`,
          name: `Module ${i}`,
          type: 'module',
          description: `Description for module ${i}`,
          technologies: [],
          dependencies: [],
        })),
      };

      const startTime = performance.now();
      render(<ArchitectureGraph data={largeData} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('should throttle simulation updates', async () => {
      vi.useFakeTimers();

      render(<ArchitectureGraph data={mockArchitectureData} />);

      const simulationMock = vi.mocked(d3.forceSimulation).mock.results[0].value;

      // Advance timers
      vi.advanceTimersByTime(1000);

      // On callback should be called with throttled frequency
      const onCallCount = simulationMock.on.mock.calls.filter(
        call => call[0] === 'tick'
      ).length;
      expect(onCallCount).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should render fallback UI when data is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ArchitectureGraph data={null as unknown as typeof mockArchitectureData} />);

      expect(screen.getByText(/unable to load architecture/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle empty modules array', () => {
      render(<ArchitectureGraph data={{ ...mockArchitectureData, modules: [] }} />);

      expect(screen.getByText(/no modules to display/i)).toBeInTheDocument();
    });

    it('should handle missing connections gracefully', () => {
      const dataWithBadConnections = {
        ...mockArchitectureData,
        connections: [
          { from: 'cli', to: 'nonexistent', type: 'uses' },
        ],
      };

      render(<ArchitectureGraph data={dataWithBadConnections} />);

      // Should still render nodes without crashing
      expect(screen.getByTestId('node-cli')).toBeInTheDocument();
    });
  });
});
