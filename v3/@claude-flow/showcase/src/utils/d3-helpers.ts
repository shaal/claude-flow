/**
 * D3 Helper Utilities
 *
 * Helper functions for D3.js force simulations and SVG rendering.
 */

import * as d3 from 'd3';
import type {
  SimulationNode,
  Edge,
  Position,
  TopologyType,
  EdgeStyle,
} from '../types';

// ============================================
// Force Simulation Helpers
// ============================================

/**
 * Configuration for force simulation creation
 */
export interface ForceSimulationOptions {
  /** Strength of center force (0-1) */
  centerStrength?: number;
  /** Charge force strength (negative for repulsion) */
  chargeStrength?: number;
  /** Link force strength (0-1) */
  linkStrength?: number;
  /** Collision radius */
  collisionRadius?: number;
  /** Link distance */
  linkDistance?: number;
  /** Alpha decay rate */
  alphaDecay?: number;
  /** Velocity decay rate */
  velocityDecay?: number;
}

/**
 * Create a D3 force simulation with common defaults
 *
 * @param nodes - Array of simulation nodes
 * @param edges - Array of edges
 * @param width - Container width
 * @param height - Container height
 * @param options - Simulation options
 * @returns Configured D3 simulation
 */
export function createForceSimulation<N extends SimulationNode>(
  nodes: N[],
  edges: Edge[],
  width: number,
  height: number,
  options: ForceSimulationOptions = {}
): d3.Simulation<N, d3.SimulationLinkDatum<N>> {
  const {
    centerStrength = 1,
    chargeStrength = -300,
    linkStrength = 0.5,
    collisionRadius = 30,
    linkDistance = 100,
    alphaDecay = 0.0228,
    velocityDecay = 0.4,
  } = options;

  // Convert edges to D3-compatible link format
  const links = edges.map(edge => ({
    source: typeof edge.source === 'string' ? edge.source : edge.source.id,
    target: typeof edge.target === 'string' ? edge.target : edge.target.id,
  }));

  const simulation = d3
    .forceSimulation<N>(nodes)
    .force('center', d3.forceCenter<N>(width / 2, height / 2).strength(centerStrength))
    .force('charge', d3.forceManyBody<N>().strength(chargeStrength))
    .force(
      'link',
      d3
        .forceLink<N, d3.SimulationLinkDatum<N>>(links)
        .id((d) => d.id)
        .distance(linkDistance)
        .strength(linkStrength)
    )
    .force('collide', d3.forceCollide<N>().radius(collisionRadius))
    .alphaDecay(alphaDecay)
    .velocityDecay(velocityDecay);

  return simulation;
}

/**
 * Calculate initial node position based on topology type
 *
 * @param node - The node to position
 * @param topology - The topology layout type
 * @param index - Node index in the array
 * @param totalNodes - Total number of nodes
 * @param width - Container width
 * @param height - Container height
 * @returns Initial position for the node
 */
export function calculateNodePosition(
  node: SimulationNode,
  topology: TopologyType,
  index: number,
  totalNodes: number,
  width: number,
  height: number
): Position {
  const centerX = width / 2;
  const centerY = height / 2;
  const margin = 50;

  switch (topology) {
    case 'hierarchical': {
      // Arrange in horizontal tiers
      const tier = (node as { tier?: number }).tier ?? Math.floor(index / 5);
      const tierWidth = width - margin * 2;
      const nodesInTier = Math.min(5, totalNodes - tier * 5);
      const tierIndex = index % 5;
      const xSpacing = tierWidth / (nodesInTier + 1);

      return {
        x: margin + xSpacing * (tierIndex + 1),
        y: margin + tier * 100,
      };
    }

    case 'mesh':
    case 'ring': {
      // Arrange in a circle
      const angle = (2 * Math.PI * index) / totalNodes - Math.PI / 2;
      const radius = Math.min(width, height) / 2 - margin;

      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    }

    case 'star': {
      // First node at center, others in circle
      if (index === 0) {
        return { x: centerX, y: centerY };
      }
      const angle = (2 * Math.PI * (index - 1)) / (totalNodes - 1) - Math.PI / 2;
      const radius = Math.min(width, height) / 2 - margin;

      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    }

    case 'radial': {
      // Radial tree layout
      const tier = (node as { tier?: number }).tier ?? Math.floor(Math.sqrt(index));
      const tierRadius = (tier + 1) * 80;
      const nodesInTier = 2 * tier + 1;
      const tierIndex = index - tier * tier;
      const angleSpread = Math.PI / (nodesInTier + 1);
      const angle = -Math.PI / 2 + angleSpread * (tierIndex + 1);

      return {
        x: centerX + tierRadius * Math.cos(angle),
        y: centerY + tierRadius * Math.sin(angle),
      };
    }

    case 'grid': {
      // Grid layout
      const cols = Math.ceil(Math.sqrt(totalNodes));
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cellWidth = (width - margin * 2) / cols;
      const cellHeight = (height - margin * 2) / Math.ceil(totalNodes / cols);

      return {
        x: margin + cellWidth * col + cellWidth / 2,
        y: margin + cellHeight * row + cellHeight / 2,
      };
    }

    case 'adaptive':
    default: {
      // Random initial positions (let simulation settle)
      return {
        x: margin + Math.random() * (width - margin * 2),
        y: margin + Math.random() * (height - margin * 2),
      };
    }
  }
}

// ============================================
// Edge Path Helpers
// ============================================

/**
 * Get SVG path for an edge between two nodes
 *
 * @param source - Source node position
 * @param target - Target node position
 * @param curvature - Curvature amount (0 = straight line)
 * @returns SVG path string
 */
export function getEdgePath(
  source: Position,
  target: Position,
  curvature = 0.3
): string {
  if (curvature === 0) {
    // Straight line
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  // Curved line using quadratic bezier
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  // Calculate control point
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;

  // Perpendicular offset
  const offsetX = -dy * curvature;
  const offsetY = dx * curvature;

  const controlX = midX + offsetX;
  const controlY = midY + offsetY;

  return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
}

/**
 * Get SVG path for a self-loop edge
 *
 * @param node - Node position
 * @param radius - Loop radius
 * @returns SVG path string
 */
export function getSelfLoopPath(node: Position, radius = 30): string {
  const startX = node.x;
  const startY = node.y - 15; // Start above node

  return `
    M ${startX} ${startY}
    A ${radius} ${radius} 0 1 1 ${startX + 1} ${startY}
  `;
}

/**
 * Calculate edge path with arrow head consideration
 *
 * @param source - Source position
 * @param target - Target position
 * @param nodeRadius - Node radius to stop before
 * @returns Path string ending before target node
 */
export function getEdgePathWithArrow(
  source: Position,
  target: Position,
  nodeRadius: number = 20
): { path: string; angle: number } {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { path: '', angle: 0 };
  }

  // Normalize direction
  const unitX = dx / length;
  const unitY = dy / length;

  // Shorten path to stop at node edge
  const endX = target.x - unitX * nodeRadius;
  const endY = target.y - unitY * nodeRadius;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    path: `M ${source.x} ${source.y} L ${endX} ${endY}`,
    angle,
  };
}

// ============================================
// Color Interpolation Helpers
// ============================================

/**
 * Color scale options
 */
export type ColorScaleType =
  | 'sequential'
  | 'diverging'
  | 'categorical'
  | 'custom';

/**
 * Interpolate colors based on a value within a range
 *
 * @param value - Current value
 * @param min - Minimum value in range
 * @param max - Maximum value in range
 * @param colorStart - Starting color (at min)
 * @param colorEnd - Ending color (at max)
 * @returns Interpolated color string
 */
export function interpolateColors(
  value: number,
  min: number,
  max: number,
  colorStart = '#22c55e', // Green
  colorEnd = '#ef4444' // Red
): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const interpolator = d3.interpolateRgb(colorStart, colorEnd);
  return interpolator(normalized);
}

/**
 * Create a color scale for status indicators
 *
 * @returns Color scale function
 */
export function createStatusColorScale(): (status: string) => string {
  const colors: Record<string, string> = {
    active: '#22c55e', // Green
    idle: '#94a3b8', // Gray
    busy: '#f59e0b', // Amber
    error: '#ef4444', // Red
  };

  return (status: string) => colors[status] || colors.idle;
}

/**
 * Create a color scale for performance metrics
 *
 * @param domain - [min, max] values
 * @param thresholds - Optional threshold breakpoints
 * @returns Color scale function
 */
export function createPerformanceColorScale(
  domain: [number, number] = [0, 100],
  thresholds?: { good: number; warning: number }
): (value: number) => string {
  const { good = domain[1] * 0.7, warning = domain[1] * 0.4 } = thresholds || {};

  return (value: number) => {
    if (value >= good) return '#22c55e'; // Green - good
    if (value >= warning) return '#f59e0b'; // Amber - warning
    return '#ef4444'; // Red - critical
  };
}

/**
 * Create a D3 sequential color scale
 *
 * @param interpolator - D3 color interpolator
 * @param domain - [min, max] values
 * @returns Scale function
 */
export function createSequentialScale(
  interpolator: (t: number) => string = d3.interpolateBlues,
  domain: [number, number] = [0, 100]
): d3.ScaleSequential<string> {
  return d3.scaleSequential(interpolator).domain(domain);
}

// ============================================
// Node Size Helpers
// ============================================

/**
 * Calculate node size based on a metric
 *
 * @param value - Metric value
 * @param min - Minimum value
 * @param max - Maximum value
 * @param minSize - Minimum node size
 * @param maxSize - Maximum node size
 * @returns Calculated node size
 */
export function calculateNodeSize(
  value: number,
  min: number,
  max: number,
  minSize = 20,
  maxSize = 60
): number {
  const normalized = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, normalized));
  return minSize + clamped * (maxSize - minSize);
}

// ============================================
// Edge Style Helpers
// ============================================

/**
 * Get edge style based on connection type
 *
 * @param type - Connection type
 * @param isHighlighted - Whether edge is highlighted
 * @returns Edge style configuration
 */
export function getEdgeStyle(
  type: Edge['type'] = 'uses',
  isHighlighted = false
): EdgeStyle {
  const baseStyles: Record<NonNullable<Edge['type']>, EdgeStyle> = {
    uses: {
      stroke: '#64748b',
      strokeColor: '#64748b',
      strokeWidth: 1.5,
      animated: false,
    },
    depends: {
      stroke: '#3b82f6',
      strokeColor: '#3b82f6',
      strokeWidth: 2,
      animated: false,
      dashArray: '5,5',
    },
    communicates: {
      stroke: '#22c55e',
      strokeColor: '#22c55e',
      strokeWidth: 2,
      animated: true,
    },
    contains: {
      stroke: '#94a3b8',
      strokeColor: '#94a3b8',
      strokeWidth: 1,
      animated: false,
      dashArray: '2,2',
    },
  };

  const style = baseStyles[type || 'uses'];

  if (isHighlighted) {
    return {
      ...style,
      stroke: '#f59e0b',
      strokeWidth: (style.strokeWidth ?? 1) * 1.5,
    } as EdgeStyle;
  }

  return style as EdgeStyle;
}

// ============================================
// Zoom/Pan Helpers
// ============================================

/**
 * Create a D3 zoom behavior
 *
 * @param minZoom - Minimum zoom level
 * @param maxZoom - Maximum zoom level
 * @param onZoom - Callback when zoom changes
 * @returns D3 zoom behavior
 */
export function createZoomBehavior(
  minZoom = 0.5,
  maxZoom = 3,
  onZoom?: (transform: d3.ZoomTransform) => void
): d3.ZoomBehavior<SVGSVGElement, unknown> {
  return d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([minZoom, maxZoom])
    .on('zoom', (event) => {
      onZoom?.(event.transform);
    });
}

/**
 * Calculate zoom to fit all nodes
 *
 * @param nodes - Array of nodes with positions
 * @param width - Container width
 * @param height - Container height
 * @param padding - Padding around nodes
 * @returns Zoom transform parameters
 */
export function calculateFitZoom(
  nodes: SimulationNode[],
  width: number,
  height: number,
  padding = 50
): { scale: number; translateX: number; translateY: number } {
  if (nodes.length === 0) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  const xExtent = d3.extent(nodes, (d) => d.x) as [number, number];
  const yExtent = d3.extent(nodes, (d) => d.y) as [number, number];

  const nodesWidth = xExtent[1] - xExtent[0];
  const nodesHeight = yExtent[1] - yExtent[0];

  const scaleX = (width - padding * 2) / nodesWidth;
  const scaleY = (height - padding * 2) / nodesHeight;
  const scale = Math.min(scaleX, scaleY, 2);

  const centerX = (xExtent[0] + xExtent[1]) / 2;
  const centerY = (yExtent[0] + yExtent[1]) / 2;

  return {
    scale,
    translateX: width / 2 - centerX * scale,
    translateY: height / 2 - centerY * scale,
  };
}
