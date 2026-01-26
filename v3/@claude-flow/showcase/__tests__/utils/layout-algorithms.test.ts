/**
 * @claude-flow/showcase - Layout Algorithms Tests
 *
 * TDD test specifications for layout computation algorithms.
 * Tests hierarchical, mesh, radial, and force-directed layouts.
 */

import { describe, it, expect } from 'vitest';

// Utility imports (will be implemented after tests)
import {
  calculateHierarchicalLayout,
  calculateMeshLayout,
  calculateRadialLayout,
  calculateForceDirectedLayout,
  calculateGridLayout,
  optimizeLayout,
  detectCollisions,
  resolveCollisions,
} from '../../src/utils/layout-algorithms';
import type { LayoutNode, LayoutOptions, Position } from '../../src/types';

describe('Layout Algorithms', () => {
  const mockNodes: LayoutNode[] = [
    { id: 'node1', width: 100, height: 50, level: 0 },
    { id: 'node2', width: 100, height: 50, level: 1 },
    { id: 'node3', width: 100, height: 50, level: 1 },
    { id: 'node4', width: 100, height: 50, level: 2 },
    { id: 'node5', width: 100, height: 50, level: 2 },
    { id: 'node6', width: 100, height: 50, level: 2 },
  ];

  const mockEdges = [
    { source: 'node1', target: 'node2' },
    { source: 'node1', target: 'node3' },
    { source: 'node2', target: 'node4' },
    { source: 'node2', target: 'node5' },
    { source: 'node3', target: 'node6' },
  ];

  describe('calculateHierarchicalLayout', () => {
    it('should position root node at top center', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateHierarchicalLayout(mockNodes, mockEdges, options);

      const rootPosition = positions.get('node1');
      expect(rootPosition).toBeDefined();
      expect(rootPosition?.x).toBe(400); // Center of 800px width
      expect(rootPosition?.y).toBeLessThan(100); // Near top
    });

    it('should position child nodes below parent', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateHierarchicalLayout(mockNodes, mockEdges, options);

      const rootY = positions.get('node1')?.y || 0;
      const child1Y = positions.get('node2')?.y || 0;
      const child2Y = positions.get('node3')?.y || 0;

      expect(child1Y).toBeGreaterThan(rootY);
      expect(child2Y).toBeGreaterThan(rootY);
    });

    it('should distribute siblings horizontally', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateHierarchicalLayout(mockNodes, mockEdges, options);

      const child1X = positions.get('node2')?.x || 0;
      const child2X = positions.get('node3')?.x || 0;

      expect(child1X).not.toBe(child2X);
      // Children should be evenly distributed
      expect(Math.abs(child1X - 400) - Math.abs(child2X - 400)).toBeLessThan(10);
    });

    it('should respect vertical spacing between levels', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
        levelSpacing: 100,
      };

      const positions = calculateHierarchicalLayout(mockNodes, mockEdges, options);

      const level0Y = positions.get('node1')?.y || 0;
      const level1Y = positions.get('node2')?.y || 0;
      const level2Y = positions.get('node4')?.y || 0;

      expect(level1Y - level0Y).toBeCloseTo(100, -1);
      expect(level2Y - level1Y).toBeCloseTo(100, -1);
    });

    it('should center subtrees under parent', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateHierarchicalLayout(mockNodes, mockEdges, options);

      const parentX = positions.get('node2')?.x || 0;
      const child1X = positions.get('node4')?.x || 0;
      const child2X = positions.get('node5')?.x || 0;

      // Parent should be centered over children
      const childrenCenterX = (child1X + child2X) / 2;
      expect(Math.abs(parentX - childrenCenterX)).toBeLessThan(10);
    });
  });

  describe('calculateMeshLayout', () => {
    it('should distribute nodes in a circular pattern', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateMeshLayout(mockNodes, options);

      const centerX = 400;
      const centerY = 300;

      // All nodes should be at similar distance from center
      const distances = Array.from(positions.values()).map(pos => {
        const dx = pos.x - centerX;
        const dy = pos.y - centerY;
        return Math.sqrt(dx * dx + dy * dy);
      });

      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

      distances.forEach(d => {
        expect(d).toBeCloseTo(avgDistance, -1);
      });
    });

    it('should evenly space nodes around circle', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateMeshLayout(mockNodes, options);

      const centerX = 400;
      const centerY = 300;

      // Calculate angles
      const angles = Array.from(positions.values()).map(pos => {
        return Math.atan2(pos.y - centerY, pos.x - centerX);
      }).sort((a, b) => a - b);

      // Check angle differences are roughly equal
      const expectedAngleDiff = (2 * Math.PI) / mockNodes.length;

      for (let i = 1; i < angles.length; i++) {
        const diff = angles[i] - angles[i - 1];
        expect(diff).toBeCloseTo(expectedAngleDiff, 0);
      }
    });

    it('should support custom radius', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
        radius: 200,
      };

      const positions = calculateMeshLayout(mockNodes, options);

      const centerX = 400;
      const centerY = 300;

      positions.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2)
        );
        expect(distance).toBeCloseTo(200, -1);
      });
    });
  });

  describe('calculateRadialLayout', () => {
    it('should place root at center', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateRadialLayout(mockNodes, mockEdges, options);

      const rootPosition = positions.get('node1');
      expect(rootPosition?.x).toBeCloseTo(400, -1);
      expect(rootPosition?.y).toBeCloseTo(300, -1);
    });

    it('should place children in rings around center', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
        ringSpacing: 100,
      };

      const positions = calculateRadialLayout(mockNodes, mockEdges, options);

      const centerX = 400;
      const centerY = 300;

      // Level 1 nodes should be at ring 1
      const level1Distances = ['node2', 'node3'].map(id => {
        const pos = positions.get(id)!;
        return Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
      });

      level1Distances.forEach(d => {
        expect(d).toBeCloseTo(100, -1);
      });

      // Level 2 nodes should be at ring 2
      const level2Distances = ['node4', 'node5', 'node6'].map(id => {
        const pos = positions.get(id)!;
        return Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
      });

      level2Distances.forEach(d => {
        expect(d).toBeCloseTo(200, -1);
      });
    });

    it('should distribute nodes within ring sectors', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
      };

      const positions = calculateRadialLayout(mockNodes, mockEdges, options);

      // Children of node2 should be in a sector near node2's angle
      const node2 = positions.get('node2')!;
      const node4 = positions.get('node4')!;
      const node5 = positions.get('node5')!;

      const centerX = 400;
      const centerY = 300;

      const angle2 = Math.atan2(node2.y - centerY, node2.x - centerX);
      const angle4 = Math.atan2(node4.y - centerY, node4.x - centerX);
      const angle5 = Math.atan2(node5.y - centerY, node5.x - centerX);

      // Children should be within 45 degrees of parent
      expect(Math.abs(angle4 - angle2)).toBeLessThan(Math.PI / 4);
      expect(Math.abs(angle5 - angle2)).toBeLessThan(Math.PI / 4);
    });
  });

  describe('calculateGridLayout', () => {
    it('should arrange nodes in grid', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
        columns: 3,
      };

      const positions = calculateGridLayout(mockNodes, options);

      // First row: nodes 1, 2, 3
      // Second row: nodes 4, 5, 6
      const row1Y = positions.get('node1')?.y;
      const row2Y = positions.get('node4')?.y;

      expect(positions.get('node2')?.y).toBe(row1Y);
      expect(positions.get('node3')?.y).toBe(row1Y);
      expect(positions.get('node5')?.y).toBe(row2Y);
      expect(positions.get('node6')?.y).toBe(row2Y);
    });

    it('should respect column count', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
        columns: 2,
      };

      const positions = calculateGridLayout(mockNodes, options);

      // With 2 columns, should have 3 rows
      const uniqueYValues = new Set(
        Array.from(positions.values()).map(p => Math.round(p.y))
      );

      expect(uniqueYValues.size).toBe(3);
    });

    it('should calculate even cell spacing', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        padding: 20,
        columns: 3,
        gap: 20,
      };

      const positions = calculateGridLayout(mockNodes, options);

      const x1 = positions.get('node1')?.x || 0;
      const x2 = positions.get('node2')?.x || 0;
      const x3 = positions.get('node3')?.x || 0;

      const spacing1 = x2 - x1;
      const spacing2 = x3 - x2;

      expect(spacing1).toBeCloseTo(spacing2, -1);
    });
  });

  describe('calculateForceDirectedLayout', () => {
    it('should return initial positions', () => {
      const options: LayoutOptions = {
        width: 800,
        height: 600,
        iterations: 100,
      };

      const positions = calculateForceDirectedLayout(mockNodes, mockEdges, options);

      expect(positions.size).toBe(mockNodes.length);

      positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(800);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(600);
      });
    });

    it('should separate unconnected nodes', () => {
      const disconnectedNodes = [
        { id: 'a', width: 50, height: 50 },
        { id: 'b', width: 50, height: 50 },
      ];

      const options: LayoutOptions = {
        width: 800,
        height: 600,
        iterations: 100,
        repulsionStrength: 500,
      };

      const positions = calculateForceDirectedLayout(disconnectedNodes, [], options);

      const posA = positions.get('a')!;
      const posB = positions.get('b')!;

      const distance = Math.sqrt(
        Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2)
      );

      // Unconnected nodes should be pushed apart
      expect(distance).toBeGreaterThan(100);
    });

    it('should keep connected nodes closer', () => {
      const connectedNodes = [
        { id: 'a', width: 50, height: 50 },
        { id: 'b', width: 50, height: 50 },
        { id: 'c', width: 50, height: 50 },
      ];

      const edges = [
        { source: 'a', target: 'b' },
      ];

      const options: LayoutOptions = {
        width: 800,
        height: 600,
        iterations: 100,
      };

      const positions = calculateForceDirectedLayout(connectedNodes, edges, options);

      const posA = positions.get('a')!;
      const posB = positions.get('b')!;
      const posC = positions.get('c')!;

      const distanceAB = Math.sqrt(
        Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2)
      );
      const distanceAC = Math.sqrt(
        Math.pow(posA.x - posC.x, 2) + Math.pow(posA.y - posC.y, 2)
      );

      // Connected nodes should be closer than unconnected
      expect(distanceAB).toBeLessThan(distanceAC);
    });
  });

  describe('optimizeLayout', () => {
    it('should minimize total edge length', () => {
      const initialPositions = new Map<string, Position>([
        ['node1', { x: 0, y: 0 }],
        ['node2', { x: 500, y: 0 }],
        ['node3', { x: 0, y: 500 }],
      ]);

      const edges = [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' },
      ];

      const options = {
        width: 800,
        height: 600,
        iterations: 50,
      };

      const optimized = optimizeLayout(initialPositions, edges, options);

      // Calculate total edge length before and after
      const initialLength = calculateTotalEdgeLength(initialPositions, edges);
      const optimizedLength = calculateTotalEdgeLength(optimized, edges);

      expect(optimizedLength).toBeLessThanOrEqual(initialLength);
    });

    it('should reduce edge crossings', () => {
      // Create a layout with obvious crossings
      const initialPositions = new Map<string, Position>([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 100, y: 100 }],
        ['c', { x: 100, y: 0 }],
        ['d', { x: 0, y: 100 }],
      ]);

      const edges = [
        { source: 'a', target: 'b' }, // These two edges cross
        { source: 'c', target: 'd' },
      ];

      const options = {
        width: 200,
        height: 200,
        iterations: 100,
        minimizeCrossings: true,
      };

      const optimized = optimizeLayout(initialPositions, edges, options);

      const initialCrossings = countEdgeCrossings(initialPositions, edges);
      const optimizedCrossings = countEdgeCrossings(optimized, edges);

      expect(optimizedCrossings).toBeLessThanOrEqual(initialCrossings);
    });
  });

  describe('detectCollisions', () => {
    it('should detect overlapping nodes', () => {
      const positions = new Map<string, Position>([
        ['node1', { x: 100, y: 100 }],
        ['node2', { x: 120, y: 110 }], // Overlaps with node1
        ['node3', { x: 300, y: 300 }], // No overlap
      ]);

      const nodeSizes = new Map([
        ['node1', { width: 100, height: 50 }],
        ['node2', { width: 100, height: 50 }],
        ['node3', { width: 100, height: 50 }],
      ]);

      const collisions = detectCollisions(positions, nodeSizes);

      expect(collisions).toContainEqual(
        expect.objectContaining({
          nodeA: 'node1',
          nodeB: 'node2',
        })
      );

      // node3 should not be in any collision
      const node3Collisions = collisions.filter(
        c => c.nodeA === 'node3' || c.nodeB === 'node3'
      );
      expect(node3Collisions).toHaveLength(0);
    });

    it('should return empty array when no collisions', () => {
      const positions = new Map<string, Position>([
        ['node1', { x: 0, y: 0 }],
        ['node2', { x: 200, y: 0 }],
        ['node3', { x: 400, y: 0 }],
      ]);

      const nodeSizes = new Map([
        ['node1', { width: 100, height: 50 }],
        ['node2', { width: 100, height: 50 }],
        ['node3', { width: 100, height: 50 }],
      ]);

      const collisions = detectCollisions(positions, nodeSizes);

      expect(collisions).toHaveLength(0);
    });

    it('should detect multiple collisions', () => {
      const positions = new Map<string, Position>([
        ['node1', { x: 100, y: 100 }],
        ['node2', { x: 110, y: 105 }],
        ['node3', { x: 120, y: 110 }],
      ]);

      const nodeSizes = new Map([
        ['node1', { width: 100, height: 50 }],
        ['node2', { width: 100, height: 50 }],
        ['node3', { width: 100, height: 50 }],
      ]);

      const collisions = detectCollisions(positions, nodeSizes);

      // All three nodes overlap
      expect(collisions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resolveCollisions', () => {
    it('should separate overlapping nodes', () => {
      const positions = new Map<string, Position>([
        ['node1', { x: 100, y: 100 }],
        ['node2', { x: 110, y: 105 }],
      ]);

      const nodeSizes = new Map([
        ['node1', { width: 100, height: 50 }],
        ['node2', { width: 100, height: 50 }],
      ]);

      const resolved = resolveCollisions(positions, nodeSizes, { padding: 10 });

      // Check nodes no longer overlap
      const newCollisions = detectCollisions(resolved, nodeSizes);
      expect(newCollisions).toHaveLength(0);
    });

    it('should respect padding between nodes', () => {
      const positions = new Map<string, Position>([
        ['node1', { x: 100, y: 100 }],
        ['node2', { x: 150, y: 100 }],
      ]);

      const nodeSizes = new Map([
        ['node1', { width: 100, height: 50 }],
        ['node2', { width: 100, height: 50 }],
      ]);

      const resolved = resolveCollisions(positions, nodeSizes, { padding: 20 });

      const pos1 = resolved.get('node1')!;
      const pos2 = resolved.get('node2')!;

      // Distance should include node width + padding
      const horizontalGap = Math.abs(pos2.x - pos1.x) - 100;
      expect(horizontalGap).toBeGreaterThanOrEqual(20);
    });

    it('should keep nodes within bounds', () => {
      const positions = new Map<string, Position>([
        ['node1', { x: 50, y: 50 }],
        ['node2', { x: 60, y: 55 }],
      ]);

      const nodeSizes = new Map([
        ['node1', { width: 100, height: 50 }],
        ['node2', { width: 100, height: 50 }],
      ]);

      const resolved = resolveCollisions(positions, nodeSizes, {
        bounds: { width: 800, height: 600 },
        padding: 10,
      });

      resolved.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(800);
        expect(pos.y).toBeLessThanOrEqual(600);
      });
    });
  });
});

// Helper functions
function calculateTotalEdgeLength(
  positions: Map<string, Position>,
  edges: Array<{ source: string; target: string }>
): number {
  return edges.reduce((total, edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (source && target) {
      return total + Math.sqrt(
        Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)
      );
    }
    return total;
  }, 0);
}

function countEdgeCrossings(
  positions: Map<string, Position>,
  edges: Array<{ source: string; target: string }>
): number {
  let crossings = 0;

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      if (doEdgesCross(positions, edges[i], edges[j])) {
        crossings++;
      }
    }
  }

  return crossings;
}

function doEdgesCross(
  positions: Map<string, Position>,
  edge1: { source: string; target: string },
  edge2: { source: string; target: string }
): boolean {
  const a = positions.get(edge1.source);
  const b = positions.get(edge1.target);
  const c = positions.get(edge2.source);
  const d = positions.get(edge2.target);

  if (!a || !b || !c || !d) return false;

  // Skip if edges share a vertex
  if (
    edge1.source === edge2.source ||
    edge1.source === edge2.target ||
    edge1.target === edge2.source ||
    edge1.target === edge2.target
  ) {
    return false;
  }

  // Line segment intersection check
  const ccw = (p1: Position, p2: Position, p3: Position) =>
    (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);

  return (
    ccw(a, c, d) !== ccw(b, c, d) &&
    ccw(a, b, c) !== ccw(a, b, d)
  );
}
