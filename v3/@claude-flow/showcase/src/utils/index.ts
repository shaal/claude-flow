/**
 * Utilities - Public API
 *
 * Utility functions for the Claude Flow Visual Showcase.
 */

// D3 Helpers
export {
  createForceSimulation,
  calculateNodePosition,
  getEdgePath,
  getSelfLoopPath,
  getEdgePathWithArrow,
  interpolateColors,
  createStatusColorScale,
  createPerformanceColorScale,
  createSequentialScale,
  calculateNodeSize,
  getEdgeStyle,
  createZoomBehavior,
  calculateFitZoom,
  type ForceSimulationOptions,
  type ColorScaleType,
} from './d3-helpers';

// Layout Algorithms
export {
  hierarchicalLayout,
  hierarchicalLayoutAdvanced,
  meshLayout,
  radialLayout,
  gridLayout,
  hierarchicalMeshLayout,
  starLayout,
  randomLayout,
  getLayout,
  getLayoutForTopology,
  interpolatePosition,
  interpolateLayouts,
  type LayoutResult,
  type HierarchicalLayoutOptions,
  type MeshLayoutOptions,
  type RadialLayoutOptions,
  type GridLayoutOptions,
} from './layout-algorithms';

// Animation Presets
export {
  transitions,
  fadeVariants,
  fadeIn,
  fadeOut,
  fadeInFrom,
  slideVariants,
  scaleVariants,
  scaleIn,
  pop,
  staggerContainerVariants,
  staggerContainerFast,
  staggerItemVariants,
  nodeVariants,
  nodeHover,
  nodeStatus,
  connectionVariants,
  connectionPulse,
  pulseVariants,
  pulseAnimation,
  ringPulse,
  highlightGlow,
  selectionHighlight,
  panelVariants,
  cardVariants,
  counterAnimation,
  progressBar,
  gaugeFillVariants,
  gauge,
  viewTransition,
  pageTransition,
  withDelay,
  withDuration,
  combineVariants,
} from './animation-presets';
