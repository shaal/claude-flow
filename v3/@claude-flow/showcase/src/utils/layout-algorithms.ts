/**
 * Layout Algorithms
 *
 * Layout algorithms for positioning nodes in different topologies.
 */

import type { Position, TopologyType } from '../types';

// ============================================
// Types
// ============================================

/**
 * Layout node interface
 */
interface LayoutNode {
  id: string;
  category?: string;
  tier?: number;
}

/**
 * Layout options
 */
interface LayoutOptions {
  width: number;
  height: number;
  padding?: number;
}

/**
 * Layout result
 */
export interface LayoutResult<N extends LayoutNode> {
  nodes: N[];
  positions: Map<string, Position>;
}

// ============================================
// Hierarchical Layout
// ============================================

/**
 * Hierarchical layout options
 */
export interface HierarchicalLayoutOptions extends LayoutOptions {
  nodesPerTier?: number;
  tierSpacing?: number;
  nodeSpacing?: number;
  centerNodes?: boolean;
}

/**
 * Calculate hierarchical layout positions
 * Queen/coordinator at top, workers below in tiers
 */
export function hierarchicalLayout<N extends LayoutNode>(
  nodes: N[],
  options: LayoutOptions
): Map<string, Position> {
  const { width, height, padding = 60 } = options;
  const positions = new Map<string, Position>();

  // Group by category
  const categories = new Map<string, N[]>();
  nodes.forEach((node) => {
    const cat = node.category || 'default';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(node);
  });

  const categoryList = Array.from(categories.keys());
  const layerHeight = (height - padding * 2) / Math.max(categoryList.length, 1);

  categoryList.forEach((category, layerIndex) => {
    const layerNodes = categories.get(category)!;
    const layerY = padding + layerIndex * layerHeight + layerHeight / 2;
    const nodeSpacing = (width - padding * 2) / (layerNodes.length + 1);

    layerNodes.forEach((node, nodeIndex) => {
      positions.set(node.id, {
        x: padding + (nodeIndex + 1) * nodeSpacing,
        y: layerY,
      });
    });
  });

  return positions;
}

/**
 * Advanced hierarchical layout with tier support
 */
export function hierarchicalLayoutAdvanced<N extends LayoutNode>(
  nodes: N[],
  width: number,
  height: number,
  options: HierarchicalLayoutOptions = { width, height }
): LayoutResult<N> {
  const {
    padding = 60,
    nodesPerTier = 5,
    tierSpacing = 120,
    centerNodes = true,
  } = options;

  const positions = new Map<string, Position>();

  // Sort nodes by tier if they have tier property
  const sortedNodes = [...nodes].sort((a, b) => {
    const tierA = a.tier ?? Infinity;
    const tierB = b.tier ?? Infinity;
    return tierA - tierB;
  });

  // Group nodes into tiers
  const tiers: N[][] = [];
  let currentTier: N[] = [];

  sortedNodes.forEach((node, index) => {
    const nodeTier = node.tier;

    if (nodeTier !== undefined) {
      while (tiers.length <= nodeTier) {
        tiers.push([]);
      }
      tiers[nodeTier].push(node);
    } else {
      currentTier.push(node);
      if (currentTier.length >= nodesPerTier || index === sortedNodes.length - 1) {
        tiers.push(currentTier);
        currentTier = [];
      }
    }
  });

  if (currentTier.length > 0) {
    tiers.push(currentTier);
  }

  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const totalTiers = tiers.length;
  const actualTierSpacing = Math.min(
    tierSpacing,
    availableHeight / Math.max(totalTiers - 1, 1)
  );

  tiers.forEach((tierNodes, tierIndex) => {
    const y = padding + tierIndex * actualTierSpacing;
    const tierWidth =
      tierNodes.length > 1
        ? Math.min(100 * (tierNodes.length - 1), availableWidth)
        : 0;

    const startX = centerNodes ? (width - tierWidth) / 2 : padding;

    tierNodes.forEach((node, nodeIndex) => {
      const x =
        tierNodes.length > 1
          ? startX + (tierWidth / (tierNodes.length - 1)) * nodeIndex
          : width / 2;

      positions.set(node.id, { x, y });
    });
  });

  return { nodes: sortedNodes, positions };
}

// ============================================
// Mesh Layout (Circle)
// ============================================

/**
 * Mesh layout options
 */
export interface MeshLayoutOptions extends LayoutOptions {
  startAngle?: number;
  radiusMultiplier?: number;
}

/**
 * Calculate mesh (circular) layout positions
 */
export function meshLayout<N extends LayoutNode>(
  nodes: N[],
  options: LayoutOptions
): Map<string, Position> {
  const { width, height, padding = 80 } = options;
  const positions = new Map<string, Position>();

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - padding;

  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
}

// ============================================
// Radial Layout
// ============================================

/**
 * Radial layout options
 */
export interface RadialLayoutOptions extends LayoutOptions {
  ringSpacing?: number;
  startAngle?: number;
  angularSpread?: number;
}

/**
 * Calculate radial tree layout positions
 */
export function radialLayout<N extends LayoutNode>(
  nodes: N[],
  width: number,
  height: number,
  options: RadialLayoutOptions = { width, height }
): LayoutResult<N> {
  const {
    padding = 50,
    ringSpacing = 80,
    startAngle = -Math.PI / 2,
    angularSpread = Math.PI * 1.5,
  } = options;

  const positions = new Map<string, Position>();
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width - padding * 2, height - padding * 2) / 2;

  // Group nodes by tier
  const tiers = new Map<number, N[]>();
  nodes.forEach((node) => {
    const tier = node.tier ?? 0;
    if (!tiers.has(tier)) {
      tiers.set(tier, []);
    }
    tiers.get(tier)!.push(node);
  });

  const sortedTiers = Array.from(tiers.entries()).sort((a, b) => a[0] - b[0]);

  sortedTiers.forEach(([tier, tierNodes]) => {
    if (tier === 0) {
      tierNodes.forEach((node) => {
        positions.set(node.id, { x: centerX, y: centerY });
      });
    } else {
      const radius = Math.min(tier * ringSpacing, maxRadius);
      const angleStep = angularSpread / Math.max(tierNodes.length - 1, 1);
      const tierStartAngle = startAngle - angularSpread / 2;

      tierNodes.forEach((node, index) => {
        const angle =
          tierNodes.length > 1
            ? tierStartAngle + angleStep * index
            : startAngle;
        positions.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
    }
  });

  return { nodes, positions };
}

// ============================================
// Grid Layout
// ============================================

/**
 * Grid layout options
 */
export interface GridLayoutOptions extends LayoutOptions {
  columns?: number;
  cellPadding?: number;
  sortFn?: (a: LayoutNode, b: LayoutNode) => number;
}

/**
 * Calculate grid layout positions
 */
export function gridLayout<N extends LayoutNode>(
  nodes: N[],
  width: number,
  height: number,
  options: GridLayoutOptions = { width, height }
): LayoutResult<N> {
  const { padding = 50, columns, sortFn } = options;
  const positions = new Map<string, Position>();

  if (nodes.length === 0) {
    return { nodes, positions };
  }

  const sortedNodes = sortFn ? [...nodes].sort(sortFn) : nodes;

  const cols = columns ?? Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);

  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  sortedNodes.forEach((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    positions.set(node.id, {
      x: padding + cellWidth * col + cellWidth / 2,
      y: padding + cellHeight * row + cellHeight / 2,
    });
  });

  return { nodes: sortedNodes, positions };
}

// ============================================
// Hierarchical-Mesh Hybrid Layout
// ============================================

/**
 * Calculate hierarchical-mesh hybrid layout
 */
export function hierarchicalMeshLayout<N extends LayoutNode>(
  nodes: N[],
  options: LayoutOptions
): Map<string, Position> {
  const { width, height, padding = 60 } = options;
  const positions = new Map<string, Position>();

  // Group by category
  const categories = new Map<string, N[]>();
  nodes.forEach((node) => {
    const cat = node.category || 'default';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(node);
  });

  const categoryList = Array.from(categories.keys());
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - padding;

  categoryList.forEach((category, catIndex) => {
    const layerNodes = categories.get(category)!;
    const categoryAngle = (2 * Math.PI * catIndex) / categoryList.length - Math.PI / 2;
    const categoryCenter = {
      x: centerX + outerRadius * 0.6 * Math.cos(categoryAngle),
      y: centerY + outerRadius * 0.6 * Math.sin(categoryAngle),
    };

    const innerRadius = 60;
    layerNodes.forEach((node, nodeIndex) => {
      if (layerNodes.length === 1) {
        positions.set(node.id, categoryCenter);
      } else {
        const nodeAngle = (2 * Math.PI * nodeIndex) / layerNodes.length;
        positions.set(node.id, {
          x: categoryCenter.x + innerRadius * Math.cos(nodeAngle),
          y: categoryCenter.y + innerRadius * Math.sin(nodeAngle),
        });
      }
    });
  });

  return positions;
}

// ============================================
// Star Layout
// ============================================

/**
 * Star layout - center node with others in circle
 */
export function starLayout<N extends LayoutNode>(
  nodes: N[],
  width: number,
  height: number,
  options: { padding?: number; centerNodeIndex?: number } = {}
): LayoutResult<N> {
  const { padding = 50, centerNodeIndex = 0 } = options;
  const positions = new Map<string, Position>();

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width - padding * 2, height - padding * 2) / 2;

  nodes.forEach((node, index) => {
    if (index === centerNodeIndex) {
      positions.set(node.id, { x: centerX, y: centerY });
    } else {
      const outerIndex = index < centerNodeIndex ? index : index - 1;
      const totalOuter = nodes.length - 1;
      const angle = (-Math.PI / 2) + (2 * Math.PI * outerIndex) / totalOuter;

      positions.set(node.id, {
        x: centerX + maxRadius * Math.cos(angle),
        y: centerY + maxRadius * Math.sin(angle),
      });
    }
  });

  return { nodes, positions };
}

// ============================================
// Random Layout (for force simulation initial positions)
// ============================================

/**
 * Generate random initial positions
 */
export function randomLayout<N extends LayoutNode>(
  nodes: N[],
  width: number,
  height: number,
  padding = 50
): LayoutResult<N> {
  const positions = new Map<string, Position>();

  nodes.forEach((node) => {
    positions.set(node.id, {
      x: padding + Math.random() * (width - padding * 2),
      y: padding + Math.random() * (height - padding * 2),
    });
  });

  return { nodes, positions };
}

// ============================================
// Layout Selection Helper
// ============================================

/**
 * Get layout based on topology type
 */
export function getLayout<N extends LayoutNode>(
  topology: TopologyType,
  nodes: N[],
  options: LayoutOptions
): Map<string, Position> {
  switch (topology) {
    case 'hierarchical':
      return hierarchicalLayout(nodes, options);
    case 'mesh':
      return meshLayout(nodes, options);
    case 'hierarchical-mesh':
    case 'adaptive':
    default:
      return hierarchicalMeshLayout(nodes, options);
  }
}

/**
 * Get layout function for topology type
 */
export function getLayoutForTopology(
  topology: TopologyType
): <N extends LayoutNode>(
  nodes: N[],
  width: number,
  height: number,
  options?: LayoutOptions
) => LayoutResult<N> {
  switch (topology) {
    case 'hierarchical':
      return (nodes, width, height, options = { width, height }) =>
        hierarchicalLayoutAdvanced(nodes, width, height, options);
    case 'mesh':
      return (nodes, width, height, options = { width, height }) => ({
        nodes,
        positions: meshLayout(nodes, options),
      });
    case 'adaptive':
    default:
      return (nodes, width, height, options = { width, height }) =>
        randomLayout(nodes, width, height, options?.padding ?? 50);
  }
}

// ============================================
// Animation Helpers
// ============================================

/**
 * Interpolate between two positions
 */
export function interpolatePosition(
  from: Position,
  to: Position,
  progress: number
): Position {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

/**
 * Interpolate between two layouts for animation
 */
export function interpolateLayouts(
  fromPositions: Map<string, Position>,
  toPositions: Map<string, Position>,
  progress: number
): Map<string, Position> {
  const result = new Map<string, Position>();
  const eased = easeInOutCubic(progress);

  toPositions.forEach((toPos, id) => {
    const fromPos = fromPositions.get(id) ?? toPos;
    result.set(id, interpolatePosition(fromPos, toPos, eased));
  });

  return result;
}

/**
 * Cubic ease in-out function
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
