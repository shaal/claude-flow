// Core visualization types

export type ViewType = 'overview' | 'topology' | 'stack' | 'agents' | 'metrics' | 'features';

export type TopologyType = 'hierarchical' | 'mesh' | 'hierarchical-mesh' | 'adaptive' | 'ring' | 'star' | 'radial' | 'grid';

export type NodeType = 'module' | 'agent' | 'service' | 'database';

export type AgentStatus = 'active' | 'idle' | 'busy' | 'error';

export type MetricVisualType = 'counter' | 'gauge' | 'progress' | 'chart';

export interface Position {
  x: number;
  y: number;
}

export interface Technology {
  name: string;
  version: string;
  purpose: string;
  icon: string;
  docUrl: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  target: number;
  baseline: number;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  technologies: Technology[];
  metrics: MetricData;
  position: Position;
  connections: string[];
  category?: string;
  lines?: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'uses' | 'extends' | 'implements' | 'depends';
  animated?: boolean;
}

export interface AgentConnection {
  targetId: string;
  type: 'coordinates' | 'delegates' | 'reports';
}

export interface Agent {
  id: string;
  type: string;
  role: string;
  capabilities: string[];
  status: AgentStatus;
  connections: AgentConnection[];
  category: string;
}

export interface TechLayer {
  id: string;
  name: string;
  description: string;
  technologies: Technology[];
  order: number;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  displayValue: string;
  unit: string;
  target: number;
  baseline: number;
  visualType: MetricVisualType;
  description: string;
  improvement?: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'implemented' | 'in-progress' | 'planned';
  icon: string;
  relatedModules: string[];
}

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  features: Feature[];
}

export interface TopologyLayout {
  type: TopologyType;
  nodePositions: Map<string, Position>;
  edgeStyles: Map<string, EdgeStyle>;
}

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeColor: string;
  animated: boolean;
  dashArray?: string;
  opacity?: number;
}

export interface AnimationState {
  isPlaying: boolean;
  speed: number;
  reducedMotion: boolean;
}

export interface FilterState {
  categories: string[];
  search: string;
  status: AgentStatus[];
}

// ============================================
// D3 Simulation Types
// ============================================

/**
 * Simulation node with D3 force properties
 */
export interface SimulationNode extends Position {
  id: string;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

/**
 * Edge for D3 force simulation
 */
export interface Edge {
  id: string;
  source: string | SimulationNode;
  target: string | SimulationNode;
  type?: 'uses' | 'depends' | 'communicates' | 'contains';
  strength?: number;
  animated?: boolean;
}

/**
 * Force simulation configuration
 */
export interface SimulationConfig {
  width: number;
  height: number;
  centerForce: number;
  chargeForce: number;
  linkForce: number;
  collideForce: number;
  alphaDecay?: number;
  velocityDecay?: number;
}

/**
 * Drag state for interactive nodes
 */
export interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  startPosition: Position | null;
}

// ============================================
// Animation Types
// ============================================

/**
 * Easing function type
 */
export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
}

// ============================================
// Responsive Layout Types
// ============================================

/**
 * Breakpoint names
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Breakpoint configuration
 */
export interface BreakpointConfig {
  breakpoint: Breakpoint;
  width: number;
  columns: number;
  padding: number;
  fontSize: number;
  nodeSize: number;
  showLabels: boolean;
}

// ============================================
// Store Types
// ============================================

/**
 * Visualization store state
 */
export interface VisualizationState {
  currentView: ViewType;
  selectedNode: ArchitectureNode | Agent | null;
  topology: TopologyType;
  filters: FilterState;
  animations: AnimationState;
  hoveredNodeId: string | null;
}

/**
 * Store actions
 */
export interface VisualizationActions {
  setView: (view: ViewType) => void;
  selectNode: (node: ArchitectureNode | Agent | null) => void;
  setTopology: (topology: TopologyType) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setAnimations: (animations: Partial<AnimationState>) => void;
  setHoveredNode: (nodeId: string | null) => void;
  reset: () => void;
}

export type VisualizationStore = VisualizationState & VisualizationActions;

// ============================================
// Layout Algorithm Types (for tests)
// ============================================

/**
 * Layout node for algorithm calculations
 */
export interface LayoutNode {
  id: string;
  width: number;
  height: number;
  level?: number;
  group?: string;
}

/**
 * Layout algorithm options
 */
export interface LayoutOptions {
  width: number;
  height: number;
  padding?: number;
  levelSpacing?: number;
  nodeSpacing?: number;
  radius?: number;
  columns?: number;
  gap?: number;
  iterations?: number;
  repulsionStrength?: number;
  minimizeCrossings?: boolean;
}

/**
 * Bounding box for layout calculations
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout configuration for responsive design
 */
export interface LayoutConfig {
  columns: number;
  gutter: number;
  containerWidth: string;
}

// ============================================
// Hook Types
// ============================================

/**
 * Simulation link for D3 force simulation
 */
export interface SimulationLink {
  source: string;
  target: string;
}

/**
 * Options for useAnimatedValue hook
 */
export interface AnimatedValueOptions {
  duration: number;
  initialValue?: number;
  enabled?: boolean;
  easing?: EasingFunction | ((t: number) => number);
  delay?: number;
  precision?: number;
  formatOptions?: Intl.NumberFormatOptions;
  format?: (value: number) => string;
  onStart?: () => void;
  onUpdate?: (value: number) => void;
  onComplete?: (finalValue: number) => void;
}

/**
 * Options for useResponsiveLayout hook
 */
export interface ResponsiveLayoutOptions {
  breakpoints?: Record<string, number>;
  layouts?: Record<Breakpoint, LayoutConfig>;
  debounce?: number;
  throttle?: number;
  onChange?: (info: { breakpoint: Breakpoint; previousBreakpoint: Breakpoint }) => void;
  onResize?: (info: { width: number; height: number }) => void;
  onCalculate?: () => void;
  defaultBreakpoint?: Breakpoint;
  defaultWidth?: number;
  defaultHeight?: number;
  containerRef?: React.RefObject<HTMLElement>;
}

// ============================================
// D3 Helper Types
// ============================================

/**
 * SVG container options
 */
export interface SvgContainerOptions {
  width: number;
  height: number;
  viewBox?: string;
  preserveAspectRatio?: string;
  className?: string;
}

/**
 * Bezier path options
 */
export interface BezierPathOptions {
  orientation?: 'horizontal' | 'vertical';
  curvature?: number;
}

/**
 * Arc path options
 */
export interface ArcPathOptions {
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  cornerRadius?: number;
}

/**
 * Gradient options
 */
export interface GradientOptions {
  type: 'linear' | 'radial';
  id: string;
  stops: Array<{ offset: string; color: string; opacity?: number }>;
  angle?: number;
}

/**
 * Drop shadow options
 */
export interface DropShadowOptions {
  id: string;
  dx: number;
  dy: number;
  blur: number;
  color?: string;
  opacity?: number;
}

/**
 * Arrow marker options
 */
export interface ArrowMarkerOptions {
  id: string;
  size: number;
  color: string;
}

/**
 * Link style types
 */
export type LinkStyle = 'straight' | 'curved' | 'step';

/**
 * Link path options
 */
export interface LinkPathOptions {
  style: LinkStyle;
  sourceNode?: { width: number; height: number };
  targetNode?: { width: number; height: number };
}

/**
 * Zoom behavior options
 */
export interface ZoomBehaviorOptions {
  minZoom: number;
  maxZoom: number;
  translateExtent?: [[number, number], [number, number]];
}

// ============================================
// Agent Category Types
// ============================================

/**
 * Agent category for grouping
 */
export interface AgentCategory {
  id: string;
  name: string;
  count: number;
}

// ============================================
// Tech Stack Types
// ============================================

/**
 * Tech stack data
 */
export interface TechStackData {
  version: string;
  layers: TechLayer[];
  dependencies: Array<{ from: string; to: string }>;
}

// ============================================
// Metrics Types
// ============================================

/**
 * Metrics data
 */
export interface MetricsData {
  version: string;
  performance: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    improvementsCount: number;
    regressionsCount: number;
    overallScore: number;
  };
  history: Array<{
    timestamp: string;
    metrics: Record<string, number>;
  }>;
}

// ============================================
// Architecture Types
// ============================================

/**
 * Architecture data
 */
export interface ArchitectureData {
  version: string;
  modules: ArchitectureNode[];
  connections: Connection[];
}

// ============================================
// Component Props Types
// ============================================

/**
 * ArchitectureGraph component props
 */
export interface ArchitectureGraphProps {
  data: ArchitectureData;
  viewMode?: 'hierarchical' | 'mesh' | 'radial';
  minZoom?: number;
  maxZoom?: number;
  onNodeClick?: (node: ArchitectureNode) => void;
  onNodeHover?: (node: ArchitectureNode | null) => void;
}

/**
 * AgentVisualization component props
 */
export interface AgentVisualizationProps {
  agents: Agent[];
  topology?: TopologyType;
  showCategories?: boolean;
  showTopologySelector?: boolean;
  showConnections?: boolean;
  showSearch?: boolean;
  onTopologyChange?: (topology: TopologyType) => void;
  onAgentClick?: (agent: Agent) => void;
}

/**
 * TechStackLayers component props
 */
export interface TechStackLayersProps {
  data: TechStackData;
  multiExpand?: boolean;
  showDependencies?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showComparison?: boolean;
  expandedLayers?: string[];
  colorScheme?: Record<string, string>;
  animate?: boolean;
  onTechnologyClick?: (tech: Technology) => void;
}

/**
 * MetricsDashboard component props
 */
export interface MetricsDashboardProps {
  metrics: PerformanceMetric[];
  animate?: boolean;
  animationDuration?: number;
  showBaseline?: boolean;
  showHistory?: boolean;
  configurable?: boolean;
  pollingEnabled?: boolean;
  pollingInterval?: number;
  onPoll?: () => Promise<PerformanceMetric[]>;
  theme?: 'light' | 'dark';
  colorScheme?: {
    primary?: string;
    positive?: string;
    negative?: string;
  };
}
