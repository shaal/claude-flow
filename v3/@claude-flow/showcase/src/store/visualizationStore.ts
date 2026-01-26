import { create } from 'zustand';
import type {
  ViewType,
  TopologyType,
  ArchitectureNode,
  Agent,
  FilterState,
  AnimationState,
  PerformanceMetric,
} from '../types';

interface VisualizationState {
  // View state
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Selection state
  selectedNode: ArchitectureNode | null;
  selectedAgent: Agent | null;
  setSelectedNode: (node: ArchitectureNode | null) => void;
  setSelectedAgent: (agent: Agent | null) => void;

  // Topology state
  topology: TopologyType;
  setTopology: (topology: TopologyType) => void;

  // Filter state
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Animation state
  animations: AnimationState;
  setAnimations: (animations: Partial<AnimationState>) => void;

  // Data state
  nodes: ArchitectureNode[];
  agents: Agent[];
  metrics: PerformanceMetric[];
  setNodes: (nodes: ArchitectureNode[]) => void;
  setAgents: (agents: Agent[]) => void;
  setMetrics: (metrics: PerformanceMetric[]) => void;

  // UI state
  isSidebarOpen: boolean;
  isDetailPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleDetailPanel: () => void;
  setDetailPanelOpen: (open: boolean) => void;
}

const defaultFilters: FilterState = {
  categories: [],
  search: '',
  status: [],
};

const defaultAnimations: AnimationState = {
  isPlaying: true,
  speed: 1,
  reducedMotion: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false,
};

export const useVisualizationStore = create<VisualizationState>((set) => ({
  // View state
  currentView: 'overview',
  setCurrentView: (view) => set({ currentView: view }),

  // Selection state
  selectedNode: null,
  selectedAgent: null,
  setSelectedNode: (node) => set({ selectedNode: node, isDetailPanelOpen: node !== null }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent, isDetailPanelOpen: agent !== null }),

  // Topology state
  topology: 'hierarchical-mesh',
  setTopology: (topology) => set({ topology }),

  // Filter state
  filters: defaultFilters,
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  resetFilters: () => set({ filters: defaultFilters }),

  // Animation state
  animations: defaultAnimations,
  setAnimations: (animations) => set((state) => ({
    animations: { ...state.animations, ...animations }
  })),

  // Data state
  nodes: [],
  agents: [],
  metrics: [],
  setNodes: (nodes) => set({ nodes }),
  setAgents: (agents) => set({ agents }),
  setMetrics: (metrics) => set({ metrics }),

  // UI state
  isSidebarOpen: true,
  isDetailPanelOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleDetailPanel: () => set((state) => ({ isDetailPanelOpen: !state.isDetailPanelOpen })),
  setDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
}));
