/**
 * @claude-flow/showcase - useD3Simulation Hook Tests
 *
 * TDD test specifications for D3 force simulation hook.
 * Tests simulation initialization, position updates, dragging, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as d3 from 'd3';

// Hook import (will be implemented after tests)
import { useD3Simulation } from '../../src/hooks/useD3Simulation';
import type { SimulationNode, SimulationLink } from '../../src/types';

// Mock D3 simulation
const mockSimulation = {
  nodes: vi.fn().mockReturnThis(),
  force: vi.fn().mockReturnThis(),
  alpha: vi.fn().mockReturnThis(),
  alphaTarget: vi.fn().mockReturnThis(),
  alphaMin: vi.fn().mockReturnThis(),
  alphaDecay: vi.fn().mockReturnThis(),
  velocityDecay: vi.fn().mockReturnThis(),
  restart: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  tick: vi.fn(),
  on: vi.fn().mockImplementation((event, callback) => {
    if (event === 'tick' && callback) {
      // Store callback for testing
      mockSimulation._tickCallback = callback;
    }
    return mockSimulation;
  }),
  _tickCallback: null as (() => void) | null,
};

vi.mock('d3', async () => {
  const actual = await vi.importActual<typeof d3>('d3');
  return {
    ...actual,
    forceSimulation: vi.fn(() => mockSimulation),
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
      x: vi.fn().mockReturnThis(),
    })),
    forceY: vi.fn(() => ({
      strength: vi.fn().mockReturnThis(),
      y: vi.fn().mockReturnThis(),
    })),
    drag: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subject: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
    })),
  };
});

describe('useD3Simulation', () => {
  const mockNodes: SimulationNode[] = [
    { id: 'node1', x: 0, y: 0, vx: 0, vy: 0 },
    { id: 'node2', x: 100, y: 100, vx: 0, vy: 0 },
    { id: 'node3', x: 200, y: 200, vx: 0, vy: 0 },
  ];

  const mockLinks: SimulationLink[] = [
    { source: 'node1', target: 'node2' },
    { source: 'node2', target: 'node3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSimulation._tickCallback = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize force simulation with nodes', () => {
      // Given: array of nodes
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      // Then: simulation running with forces applied
      expect(d3.forceSimulation).toHaveBeenCalled();
      expect(mockSimulation.nodes).toHaveBeenCalledWith(mockNodes);
    });

    it('should configure link force', () => {
      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(d3.forceLink).toHaveBeenCalled();
      expect(mockSimulation.force).toHaveBeenCalledWith('link', expect.anything());
    });

    it('should configure charge force', () => {
      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(d3.forceManyBody).toHaveBeenCalled();
      expect(mockSimulation.force).toHaveBeenCalledWith('charge', expect.anything());
    });

    it('should configure center force', () => {
      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          width: 800,
          height: 600,
        })
      );

      expect(d3.forceCenter).toHaveBeenCalledWith(400, 300);
      expect(mockSimulation.force).toHaveBeenCalledWith('center', expect.anything());
    });

    it('should configure collision force', () => {
      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          nodeRadius: 30,
        })
      );

      expect(d3.forceCollide).toHaveBeenCalled();
      expect(mockSimulation.force).toHaveBeenCalledWith('collision', expect.anything());
    });

    it('should return simulation instance', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(result.current.simulation).toBeDefined();
    });

    it('should return current nodes', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(result.current.nodes).toEqual(mockNodes);
    });

    it('should apply custom force strengths', () => {
      const chargeStrength = -500;
      const linkDistance = 100;

      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          chargeStrength,
          linkDistance,
        })
      );

      const chargeForce = vi.mocked(d3.forceManyBody).mock.results[0].value;
      expect(chargeForce.strength).toHaveBeenCalledWith(chargeStrength);

      const linkForce = vi.mocked(d3.forceLink).mock.results[0].value;
      expect(linkForce.distance).toHaveBeenCalledWith(linkDistance);
    });
  });

  describe('Position Updates', () => {
    it('should update positions on tick', async () => {
      const onTick = vi.fn();

      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          onTick,
        })
      );

      // Simulate tick event
      act(() => {
        mockSimulation._tickCallback?.();
      });

      expect(onTick).toHaveBeenCalled();
    });

    it('should provide updated node positions on tick', async () => {
      let tickedNodes: SimulationNode[] = [];

      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          onTick: (nodes) => {
            tickedNodes = nodes;
          },
        })
      );

      // Simulate tick
      act(() => {
        mockSimulation._tickCallback?.();
      });

      expect(tickedNodes).toHaveLength(mockNodes.length);
      tickedNodes.forEach(node => {
        expect(node).toHaveProperty('x');
        expect(node).toHaveProperty('y');
      });
    });

    it('should throttle tick updates when specified', async () => {
      vi.useFakeTimers();
      const onTick = vi.fn();

      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          onTick,
          tickThrottle: 100,
        })
      );

      // Trigger multiple ticks rapidly
      for (let i = 0; i < 10; i++) {
        mockSimulation._tickCallback?.();
      }

      // Only one call should have been made (throttled)
      expect(onTick.mock.calls.length).toBeLessThan(10);

      vi.useRealTimers();
    });
  });

  describe('Dragging', () => {
    it('should handle node dragging', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      // Simulate drag start
      act(() => {
        result.current.startDrag('node1', 50, 50);
      });

      // Verify simulation reheated
      expect(mockSimulation.alphaTarget).toHaveBeenCalledWith(0.3);
      expect(mockSimulation.restart).toHaveBeenCalled();
    });

    it('should update node position during drag', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.startDrag('node1', 50, 50);
        result.current.drag(100, 150);
      });

      const draggedNode = result.current.nodes.find(n => n.id === 'node1');
      expect(draggedNode?.fx).toBe(100);
      expect(draggedNode?.fy).toBe(150);
    });

    it('should fix node position after drag end', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          fixOnDragEnd: true,
        })
      );

      act(() => {
        result.current.startDrag('node1', 50, 50);
        result.current.drag(100, 150);
        result.current.endDrag();
      });

      const draggedNode = result.current.nodes.find(n => n.id === 'node1');
      expect(draggedNode?.fx).toBe(100);
      expect(draggedNode?.fy).toBe(150);
    });

    it('should release node position after drag end when fixOnDragEnd is false', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          fixOnDragEnd: false,
        })
      );

      act(() => {
        result.current.startDrag('node1', 50, 50);
        result.current.drag(100, 150);
        result.current.endDrag();
      });

      const draggedNode = result.current.nodes.find(n => n.id === 'node1');
      expect(draggedNode?.fx).toBeNull();
      expect(draggedNode?.fy).toBeNull();
    });

    it('should cool down simulation after drag end', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.startDrag('node1', 50, 50);
        result.current.endDrag();
      });

      expect(mockSimulation.alphaTarget).toHaveBeenCalledWith(0);
    });

    it('should provide drag handlers for D3', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(result.current.dragHandlers).toBeDefined();
      expect(result.current.dragHandlers.start).toBeInstanceOf(Function);
      expect(result.current.dragHandlers.drag).toBeInstanceOf(Function);
      expect(result.current.dragHandlers.end).toBeInstanceOf(Function);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      // Given: active simulation
      const { unmount } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      // When: component unmounts
      unmount();

      // Then: simulation stopped, memory freed
      expect(mockSimulation.stop).toHaveBeenCalled();
    });

    it('should stop existing simulation when nodes change', () => {
      const { rerender } = renderHook(
        (props) => useD3Simulation(props),
        {
          initialProps: {
            nodes: mockNodes,
            links: mockLinks,
          },
        }
      );

      const newNodes: SimulationNode[] = [
        { id: 'newNode1', x: 0, y: 0, vx: 0, vy: 0 },
      ];

      rerender({
        nodes: newNodes,
        links: [],
      });

      // Old simulation should be stopped
      expect(mockSimulation.stop).toHaveBeenCalled();
    });
  });

  describe('Force Configuration', () => {
    it('should allow updating charge strength', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          chargeStrength: -100,
        })
      );

      act(() => {
        result.current.setChargeStrength(-500);
      });

      expect(mockSimulation.force).toHaveBeenCalledWith('charge', expect.anything());
      expect(mockSimulation.restart).toHaveBeenCalled();
    });

    it('should allow updating link distance', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          linkDistance: 50,
        })
      );

      act(() => {
        result.current.setLinkDistance(100);
      });

      expect(mockSimulation.force).toHaveBeenCalledWith('link', expect.anything());
      expect(mockSimulation.restart).toHaveBeenCalled();
    });

    it('should support custom force configurations', () => {
      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          customForces: {
            x: { strength: 0.1, x: 400 },
            y: { strength: 0.1, y: 300 },
          },
        })
      );

      expect(d3.forceX).toHaveBeenCalled();
      expect(d3.forceY).toHaveBeenCalled();
    });
  });

  describe('Alpha Control', () => {
    it('should allow restarting simulation', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.restart();
      });

      expect(mockSimulation.alpha).toHaveBeenCalledWith(1);
      expect(mockSimulation.restart).toHaveBeenCalled();
    });

    it('should allow pausing simulation', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.pause();
      });

      expect(mockSimulation.stop).toHaveBeenCalled();
    });

    it('should expose simulation alpha', () => {
      mockSimulation.alpha.mockReturnValue(0.5);

      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(result.current.alpha).toBe(0.5);
    });

    it('should report when simulation is active', () => {
      mockSimulation.alpha.mockReturnValue(0.1);

      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(result.current.isActive).toBe(true);
    });

    it('should report when simulation is settled', () => {
      mockSimulation.alpha.mockReturnValue(0);

      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Node Operations', () => {
    it('should allow fixing node position', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.fixNode('node1', 200, 300);
      });

      const node = result.current.nodes.find(n => n.id === 'node1');
      expect(node?.fx).toBe(200);
      expect(node?.fy).toBe(300);
    });

    it('should allow releasing fixed node', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.fixNode('node1', 200, 300);
        result.current.releaseNode('node1');
      });

      const node = result.current.nodes.find(n => n.id === 'node1');
      expect(node?.fx).toBeNull();
      expect(node?.fy).toBeNull();
    });

    it('should allow releasing all fixed nodes', () => {
      const { result } = renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
        })
      );

      act(() => {
        result.current.fixNode('node1', 100, 100);
        result.current.fixNode('node2', 200, 200);
        result.current.releaseAllNodes();
      });

      result.current.nodes.forEach(node => {
        expect(node.fx).toBeNull();
        expect(node.fy).toBeNull();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large node sets efficiently', () => {
      const largeNodes: SimulationNode[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
      }));

      const startTime = performance.now();

      renderHook(() =>
        useD3Simulation({
          nodes: largeNodes,
          links: [],
        })
      );

      const endTime = performance.now();

      // Should initialize within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should use requestAnimationFrame for updates', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      renderHook(() =>
        useD3Simulation({
          nodes: mockNodes,
          links: mockLinks,
          useRAF: true,
        })
      );

      // Trigger tick
      mockSimulation._tickCallback?.();

      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });
  });
});
