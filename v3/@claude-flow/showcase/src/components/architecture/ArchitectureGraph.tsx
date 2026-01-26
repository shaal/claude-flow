import { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { useVisualizationStore } from '../../store/visualizationStore';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { NodeDetail } from './NodeDetail';
import { ConnectionLine } from './ConnectionLine';
import architectureData from '../../data/architecture.json';
import type { ArchitectureNode, Connection } from '../../types';
import { staggerContainerVariants } from '../../utils/animation-presets';

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  description: string;
  category?: string;
  lines?: number;
}

export function ArchitectureGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedNode, setSelectedNode, isSidebarOpen } = useVisualizationStore();
  const { getContainerSize } = useResponsiveLayout();
  const { width, height } = getContainerSize(isSidebarOpen);

  const nodes: SimNode[] = useMemo(
    () =>
      architectureData.modules.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        description: m.description,
        category: m.category,
        lines: m.lines,
      })),
    []
  );

  const links = useMemo(
    () =>
      architectureData.connections.map((c) => ({
        source: c.from,
        target: c.to,
        type: c.type,
      })),
    []
  );

  const handleNodeClick = useCallback(
    (node: SimNode) => {
      const fullNode = architectureData.modules.find((m) => m.id === node.id);
      if (fullNode) {
        setSelectedNode(fullNode as unknown as ArchitectureNode);
      }
    },
    [setSelectedNode]
  );

  useEffect(() => {
    if (!svgRef.current || !width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create container groups
    const container = svg.append('g').attr('class', 'graph-container');
    const linksGroup = container.append('g').attr('class', 'links');
    const nodesGroup = container.append('g').attr('class', 'nodes');

    // Create simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(150)
          .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // Draw links
    const link = linksGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'connection-line')
      .attr('stroke', '#3b82f6')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2);

    // Draw nodes
    const node = nodesGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleNodeClick(d))
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node background
    node
      .append('circle')
      .attr('r', 40)
      .attr('fill', (d) => {
        const colors: Record<string, string> = {
          core: '#3b82f6',
          coordination: '#22c55e',
          intelligence: '#8b5cf6',
          integration: '#f59e0b',
          security: '#ef4444',
          infrastructure: '#6b7280',
        };
        return colors[d.category || 'core'] || '#3b82f6';
      })
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d) => {
        const colors: Record<string, string> = {
          core: '#3b82f6',
          coordination: '#22c55e',
          intelligence: '#8b5cf6',
          integration: '#f59e0b',
          security: '#ef4444',
          infrastructure: '#6b7280',
        };
        return colors[d.category || 'core'] || '#3b82f6';
      })
      .attr('stroke-width', 2);

    // Node icon
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.1em')
      .attr('fill', 'white')
      .attr('font-size', '20px')
      .text((d) => {
        const icons: Record<string, string> = {
          cli: '\u2318',
          memory: '\u25A6',
          swarm: '\u2630',
          mcp: '\u2699',
          hooks: '\u26A1',
          neural: '\u2699',
          embeddings: '\u25C6',
          agents: '\u263A',
          'hive-mind': '\u2B23',
          security: '\u26E8',
          daemon: '\u25B6',
        };
        return icons[d.id] || '\u25CF';
      });

    // Node label
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3.5em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text((d) => d.name.replace('@claude-flow/', ''));

    // Hover effects
    node
      .on('mouseenter', function () {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', 45)
          .attr('fill-opacity', 0.4);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', 40)
          .attr('fill-opacity', 0.2);
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, handleNodeClick]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <svg
        ref={svgRef}
        width={width}
        height={height - 48}
        className="bg-bg-dark"
        style={{ display: 'block' }}
      />

      {/* Legend */}
      <div className="absolute top-4 left-4 p-3 rounded-lg bg-bg-card/80 backdrop-blur border border-white/10">
        <div className="text-xs font-medium text-gray-400 mb-2">Categories</div>
        <div className="space-y-1">
          {[
            { name: 'Core', color: '#3b82f6' },
            { name: 'Coordination', color: '#22c55e' },
            { name: 'Intelligence', color: '#8b5cf6' },
            { name: 'Integration', color: '#f59e0b' },
            { name: 'Security', color: '#ef4444' },
          ].map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-gray-300">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </motion.div>
  );
}
