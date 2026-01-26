/**
 * useD3Simulation - D3 Force Simulation Hook
 *
 * Manages D3.js force simulation for interactive node visualization.
 * Handles node positioning, forces, drag behavior, and cleanup.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { ArchitectureNode, Connection, SimulationNode, Edge, SimulationConfig, DragState, Position } from '../types';

/**
 * Internal simulation node type
 */
interface InternalSimulationNode extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Internal simulation link type
 */
interface InternalSimulationLink extends d3.SimulationLinkDatum<InternalSimulationNode> {
  source: string | InternalSimulationNode;
  target: string | InternalSimulationNode;
}

/**
 * Default simulation configuration
 */
const DEFAULT_CONFIG: SimulationConfig = {
  width: 800,
  height: 600,
  centerForce: 1,
  chargeForce: -300,
  linkForce: 0.5,
  collideForce: 50,
  alphaDecay: 0.02,
  velocityDecay: 0.4,
};

/**
 * Options for the useD3Simulation hook
 */
interface UseD3SimulationOptions {
  nodes: ArchitectureNode[];
  connections: Connection[];
  width: number;
  height: number;
  config?: Partial<SimulationConfig>;
  onTick?: (nodes: InternalSimulationNode[], links: InternalSimulationLink[]) => void;
}

/**
 * Return type for useD3Simulation hook
 */
export interface UseD3SimulationReturn {
  /** Reference to the D3 simulation */
  simulation: d3.Simulation<InternalSimulationNode, InternalSimulationLink> | null;
  /** Current simulation nodes with positions */
  nodes: InternalSimulationNode[];
  /** Current simulation links */
  links: InternalSimulationLink[];
  /** Node positions map for quick lookup */
  nodePositions: Map<string, Position>;
  /** Current drag state */
  dragState: DragState;
  /** Drag start handler */
  dragStarted: (event: d3.D3DragEvent<SVGGElement, InternalSimulationNode, InternalSimulationNode>) => void;
  /** Drag handler */
  dragged: (event: d3.D3DragEvent<SVGGElement, InternalSimulationNode, InternalSimulationNode>) => void;
  /** Drag end handler */
  dragEnded: (event: d3.D3DragEvent<SVGGElement, InternalSimulationNode, InternalSimulationNode>) => void;
  /** Reheat simulation */
  reheat: (alpha?: number) => void;
  /** Stop simulation */
  stop: () => void;
  /** Whether simulation is currently running */
  isRunning: boolean;
  /** Current simulation alpha */
  alpha: number;
}

/**
 * D3 Force Simulation Hook
 *
 * Creates and manages a D3.js force simulation for graph visualization.
 * Supports drag interactions, configurable forces, and automatic cleanup.
 *
 * @param options - Simulation options
 * @returns Simulation control interface
 */
export function useD3Simulation({
  nodes,
  connections,
  width,
  height,
  config = {},
  onTick,
}: UseD3SimulationOptions): UseD3SimulationReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const simulationRef = useRef<d3.Simulation<InternalSimulationNode, InternalSimulationLink> | null>(null);
  const [simulationNodes, setSimulationNodes] = useState<InternalSimulationNode[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<InternalSimulationLink[]>([]);
  const [nodePositions, setNodePositions] = useState<Map<string, Position>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [alpha, setAlpha] = useState(1);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNodeId: null,
    startPosition: null,
  });

  // Initialize simulation
  useEffect(() => {
    if (!nodes.length || !width || !height) return;

    const {
      centerForce,
      chargeForce,
      linkForce,
      collideForce,
      alphaDecay,
      velocityDecay,
    } = mergedConfig;

    // Create simulation nodes
    const simNodes: InternalSimulationNode[] = nodes.map((node) => ({
      id: node.id,
      x: node.position?.x ?? width / 2 + (Math.random() - 0.5) * 100,
      y: node.position?.y ?? height / 2 + (Math.random() - 0.5) * 100,
    }));

    // Create simulation links
    const simLinks: InternalSimulationLink[] = connections.map((conn) => ({
      source: conn.from,
      target: conn.to,
    }));

    // Create simulation
    const simulation = d3
      .forceSimulation<InternalSimulationNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<InternalSimulationNode, InternalSimulationLink>(simLinks)
          .id((d) => d.id)
          .distance(120)
          .strength(linkForce)
      )
      .force('charge', d3.forceManyBody().strength(chargeForce))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(centerForce))
      .force('collision', d3.forceCollide().radius(collideForce))
      .alphaDecay(alphaDecay ?? 0.02)
      .velocityDecay(velocityDecay ?? 0.4)
      .on('tick', () => {
        const currentNodes = simulation.nodes();
        setSimulationNodes([...currentNodes]);
        setSimulationLinks([...simLinks]);
        setAlpha(simulation.alpha());
        setIsRunning(simulation.alpha() > 0.001);

        // Update positions map
        const positions = new Map<string, Position>();
        currentNodes.forEach((node) => {
          positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
        });
        setNodePositions(positions);

        onTick?.(currentNodes, simLinks);
      })
      .on('end', () => {
        setIsRunning(false);
      });

    simulationRef.current = simulation;
    setIsRunning(true);

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodes, connections, width, height, mergedConfig, onTick]);

  // Drag handlers
  const dragStarted = useCallback(
    (event: d3.D3DragEvent<SVGGElement, InternalSimulationNode, InternalSimulationNode>) => {
      if (!simulationRef.current) return;
      if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;

      setDragState({
        isDragging: true,
        draggedNodeId: event.subject.id,
        startPosition: { x: event.subject.x ?? 0, y: event.subject.y ?? 0 },
      });
    },
    []
  );

  const dragged = useCallback(
    (event: d3.D3DragEvent<SVGGElement, InternalSimulationNode, InternalSimulationNode>) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    []
  );

  const dragEnded = useCallback(
    (event: d3.D3DragEvent<SVGGElement, InternalSimulationNode, InternalSimulationNode>) => {
      if (!simulationRef.current) return;
      if (!event.active) simulationRef.current.alphaTarget(0);
      // Keep node pinned after drag (remove these lines to let it float)
      // event.subject.fx = null;
      // event.subject.fy = null;

      setDragState({
        isDragging: false,
        draggedNodeId: null,
        startPosition: null,
      });
    },
    []
  );

  // Reheat simulation
  const reheat = useCallback((alphaValue = 0.5) => {
    if (simulationRef.current) {
      simulationRef.current.alpha(alphaValue).restart();
      setIsRunning(true);
    }
  }, []);

  // Stop simulation
  const stop = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      setIsRunning(false);
    }
  }, []);

  return {
    simulation: simulationRef.current,
    nodes: simulationNodes,
    links: simulationLinks,
    nodePositions,
    dragState,
    dragStarted,
    dragged,
    dragEnded,
    reheat,
    stop,
    isRunning,
    alpha,
  };
}

/**
 * Internal D3 link type
 */
interface D3Link {
  source: string;
  target: string;
}

/**
 * Generic simulation hook for custom node types
 */
export function useGenericD3Simulation<N extends SimulationNode>(
  nodes: N[],
  edges: Edge[],
  config: Partial<SimulationConfig> = {},
  onTick?: (nodes: N[]) => void
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const simulationRef = useRef<d3.Simulation<N, d3.SimulationLinkDatum<N>> | null>(null);
  const nodesRef = useRef<N[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);

  const [nodePositions, setNodePositions] = useState<Map<string, Position>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [alpha, setAlpha] = useState(1);

  // Convert edges to D3-compatible format
  const convertEdges = useCallback((edgeList: Edge[]): D3Link[] => {
    return edgeList.map(edge => ({
      source: typeof edge.source === 'string' ? edge.source : edge.source.id,
      target: typeof edge.target === 'string' ? edge.target : edge.target.id,
    }));
  }, []);

  const updatePositions = useCallback((simNodes: N[]) => {
    const positions = new Map<string, Position>();
    simNodes.forEach((node) => {
      positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
    });
    setNodePositions(positions);
    setAlpha(simulationRef.current?.alpha() ?? 0);
    setIsRunning((simulationRef.current?.alpha() ?? 0) > 0.001);
  }, []);

  useEffect(() => {
    const { width, height, centerForce, chargeForce, linkForce, collideForce, alphaDecay, velocityDecay } =
      mergedConfig;

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const d3Links = convertEdges(edgesRef.current);

    const simulation = d3
      .forceSimulation<N>(nodesRef.current)
      .force('center', d3.forceCenter<N>(width / 2, height / 2).strength(centerForce))
      .force('charge', d3.forceManyBody<N>().strength(chargeForce))
      .force(
        'link',
        d3
          .forceLink<N, d3.SimulationLinkDatum<N>>(d3Links)
          .id((d) => d.id)
          .strength(linkForce)
      )
      .force('collide', d3.forceCollide<N>().radius(collideForce))
      .alphaDecay(alphaDecay ?? 0.0228)
      .velocityDecay(velocityDecay ?? 0.4)
      .on('tick', () => {
        updatePositions(nodesRef.current);
        onTick?.(nodesRef.current);
      })
      .on('end', () => {
        setIsRunning(false);
      });

    simulationRef.current = simulation;
    setIsRunning(true);

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [mergedConfig, updatePositions, onTick, convertEdges]);

  useEffect(() => {
    nodesRef.current = nodes;
    if (simulationRef.current) {
      simulationRef.current.nodes(nodes);
    }
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
    if (simulationRef.current) {
      const linkForce = simulationRef.current.force<d3.ForceLink<N, d3.SimulationLinkDatum<N>>>('link');
      if (linkForce) {
        linkForce.links(convertEdges(edges));
      }
    }
  }, [edges, convertEdges]);

  const reheat = useCallback((alphaValue = 0.3) => {
    if (simulationRef.current) {
      simulationRef.current.alpha(alphaValue).restart();
      setIsRunning(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      setIsRunning(false);
    }
  }, []);

  return {
    simulationRef,
    nodePositions,
    reheat,
    stop,
    isRunning,
    alpha,
  };
}

export default useD3Simulation;
