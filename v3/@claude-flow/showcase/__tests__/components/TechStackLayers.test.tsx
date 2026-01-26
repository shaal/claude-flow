/**
 * @claude-flow/showcase - TechStackLayers Component Tests
 *
 * TDD test specifications for technology stack visualization.
 * Tests layer rendering, technology cards, and dependency visualization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Component imports (will be implemented after tests)
import { TechStackLayers } from '../../src/components/stack/TechStackLayers';
import { mockTechStackData, mockTechLayers } from '../__mocks__/techstack-data';
import type { TechLayer, Technology } from '../../src/types';

describe('TechStackLayers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Layer Display', () => {
    it('should render all technology layers', () => {
      // Given: 6 technology layers
      render(<TechStackLayers data={mockTechStackData} />);

      // Then: all layers visible in stack order
      expect(screen.getByTestId('layer-runtime')).toBeInTheDocument();
      expect(screen.getByTestId('layer-core-framework')).toBeInTheDocument();
      expect(screen.getByTestId('layer-memory')).toBeInTheDocument();
      expect(screen.getByTestId('layer-security')).toBeInTheDocument();
      expect(screen.getByTestId('layer-communication')).toBeInTheDocument();
      expect(screen.getByTestId('layer-intelligence')).toBeInTheDocument();
    });

    it('should display layer names correctly', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      expect(screen.getByText('Runtime')).toBeInTheDocument();
      expect(screen.getByText('Core Framework')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Intelligence')).toBeInTheDocument();
    });

    it('should render layers in correct vertical order', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      const layers = screen.getAllByTestId(/^layer-/);
      const layerIds = layers.map(l => l.getAttribute('data-testid'));

      // Verify order from bottom to top (runtime at bottom, intelligence at top)
      const expectedOrder = [
        'layer-runtime',
        'layer-core-framework',
        'layer-memory',
        'layer-security',
        'layer-communication',
        'layer-intelligence',
      ];

      // In visual stack, runtime is at the bottom
      expect(layerIds).toEqual(expectedOrder);
    });

    it('should display layer descriptions', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      const runtimeLayer = screen.getByTestId('layer-runtime');
      expect(runtimeLayer).toHaveTextContent('Node.js 20+');
    });

    it('should show layer icons', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      const runtimeIcon = screen.getByTestId('layer-icon-runtime');
      expect(runtimeIcon).toBeInTheDocument();
    });
  });

  describe('Technology Cards', () => {
    it('should show technology cards within layers', async () => {
      // Given: layer with multiple technologies
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      // When: layer expanded
      const runtimeLayer = screen.getByTestId('layer-runtime');
      await user.click(runtimeLayer);

      // Then: technology cards appear
      expect(screen.getByTestId('tech-card-nodejs')).toBeInTheDocument();
      expect(screen.getByTestId('tech-card-typescript')).toBeInTheDocument();
    });

    it('should display technology name and version', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));

      const nodejsCard = screen.getByTestId('tech-card-nodejs');
      expect(nodejsCard).toHaveTextContent('Node.js');
      expect(nodejsCard).toHaveTextContent('20+');
    });

    it('should display technology icons', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));

      const nodejsIcon = screen.getByTestId('tech-icon-nodejs');
      expect(nodejsIcon).toBeInTheDocument();
    });

    it('should show technology purpose on hover', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));

      const nodejsCard = screen.getByTestId('tech-card-nodejs');
      await user.hover(nodejsCard);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('JavaScript runtime environment');
    });

    it('should link to documentation on click', async () => {
      const onTechClick = vi.fn();
      render(<TechStackLayers data={mockTechStackData} onTechnologyClick={onTechClick} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));
      await user.click(screen.getByTestId('tech-card-nodejs'));

      expect(onTechClick).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Node.js',
        docUrl: expect.stringContaining('nodejs.org'),
      }));
    });

    it('should display all technologies in a layer when expanded', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-memory'));

      expect(screen.getByTestId('tech-card-agentdb')).toBeInTheDocument();
      expect(screen.getByTestId('tech-card-hnsw')).toBeInTheDocument();
      expect(screen.getByTestId('tech-card-sqlite')).toBeInTheDocument();
    });
  });

  describe('Layer Expansion', () => {
    it('should animate layer expansion', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const layer = screen.getByTestId('layer-runtime');
      await user.click(layer);

      expect(layer).toHaveClass('layer-expanding');

      await waitFor(() => {
        expect(layer).toHaveClass('layer-expanded');
      });
    });

    it('should collapse layer when clicked again', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const layer = screen.getByTestId('layer-runtime');

      // Expand
      await user.click(layer);
      await waitFor(() => {
        expect(layer).toHaveClass('layer-expanded');
      });

      // Collapse
      await user.click(layer);
      await waitFor(() => {
        expect(layer).not.toHaveClass('layer-expanded');
      });
    });

    it('should only expand one layer at a time by default', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const runtimeLayer = screen.getByTestId('layer-runtime');
      const memoryLayer = screen.getByTestId('layer-memory');

      await user.click(runtimeLayer);
      await waitFor(() => expect(runtimeLayer).toHaveClass('layer-expanded'));

      await user.click(memoryLayer);
      await waitFor(() => {
        expect(memoryLayer).toHaveClass('layer-expanded');
        expect(runtimeLayer).not.toHaveClass('layer-expanded');
      });
    });

    it('should allow multiple expanded layers when multiExpand enabled', async () => {
      render(<TechStackLayers data={mockTechStackData} multiExpand={true} />);
      const user = userEvent.setup();

      const runtimeLayer = screen.getByTestId('layer-runtime');
      const memoryLayer = screen.getByTestId('layer-memory');

      await user.click(runtimeLayer);
      await user.click(memoryLayer);

      await waitFor(() => {
        expect(runtimeLayer).toHaveClass('layer-expanded');
        expect(memoryLayer).toHaveClass('layer-expanded');
      });
    });

    it('should show expand indicator icon', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      const layer = screen.getByTestId('layer-runtime');
      const expandIcon = layer.querySelector('[data-icon="expand"]');

      expect(expandIcon).toBeInTheDocument();
    });

    it('should rotate expand icon when expanded', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const layer = screen.getByTestId('layer-runtime');
      await user.click(layer);

      const expandIcon = layer.querySelector('[data-icon="expand"]');
      expect(expandIcon).toHaveClass('icon-rotated');
    });
  });

  describe('Dependency Visualization', () => {
    it('should draw dependency lines between technologies', async () => {
      // Given: technologies with dependencies
      render(<TechStackLayers data={mockTechStackData} showDependencies={true} />);
      const user = userEvent.setup();

      // Expand layers to see dependencies
      await user.click(screen.getByTestId('layer-runtime'));
      await user.click(screen.getByTestId('layer-core-framework'));

      // Then: curved lines connect related items
      const dependencyLines = screen.getAllByTestId(/^dependency-line-/);
      expect(dependencyLines.length).toBeGreaterThan(0);
    });

    it('should style dependency lines as curved paths', async () => {
      render(<TechStackLayers data={mockTechStackData} showDependencies={true} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));
      await user.click(screen.getByTestId('layer-core-framework'));

      const dependencyLine = screen.getByTestId('dependency-line-nodejs-agentic-flow');
      expect(dependencyLine).toHaveAttribute('d', expect.stringContaining('C')); // Bezier curve
    });

    it('should highlight dependency path on technology hover', async () => {
      render(<TechStackLayers data={mockTechStackData} showDependencies={true} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));
      await user.click(screen.getByTestId('layer-core-framework'));

      const nodejsCard = screen.getByTestId('tech-card-nodejs');
      await user.hover(nodejsCard);

      const dependencyLine = screen.getByTestId('dependency-line-nodejs-agentic-flow');
      expect(dependencyLine).toHaveClass('dependency-highlighted');
    });

    it('should toggle dependencies visibility', async () => {
      render(<TechStackLayers data={mockTechStackData} showDependencies={true} />);
      const user = userEvent.setup();

      const toggleButton = screen.getByRole('switch', { name: /show dependencies/i });

      // Dependencies should be visible initially
      expect(screen.queryByTestId(/^dependency-line-/)).toBeInTheDocument();

      // Toggle off
      await user.click(toggleButton);
      expect(screen.queryByTestId(/^dependency-line-/)).not.toBeInTheDocument();

      // Toggle on
      await user.click(toggleButton);
      expect(screen.queryByTestId(/^dependency-line-/)).toBeInTheDocument();
    });

    it('should show dependency direction with arrows', async () => {
      render(<TechStackLayers data={mockTechStackData} showDependencies={true} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));

      const dependencyLine = screen.getByTestId('dependency-line-nodejs-agentic-flow');
      expect(dependencyLine).toHaveAttribute('marker-end', 'url(#arrow)');
    });
  });

  describe('Filtering', () => {
    it('should filter technologies by search', async () => {
      render(<TechStackLayers data={mockTechStackData} showSearch={true} />);
      const user = userEvent.setup();

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'HNSW');

      // Memory layer should auto-expand
      const memoryLayer = screen.getByTestId('layer-memory');
      expect(memoryLayer).toHaveClass('layer-expanded');

      // HNSW card should be highlighted
      const hnswCard = screen.getByTestId('tech-card-hnsw');
      expect(hnswCard).toHaveClass('tech-search-match');
    });

    it('should filter by technology category', async () => {
      render(<TechStackLayers data={mockTechStackData} showFilters={true} />);
      const user = userEvent.setup();

      const databaseFilter = screen.getByRole('checkbox', { name: /database/i });
      await user.click(databaseFilter);

      // Only database technologies should be visible
      expect(screen.getByTestId('tech-card-sqlite')).toBeVisible();
      expect(screen.getByTestId('tech-card-agentdb')).toBeVisible();

      // Non-database techs should be hidden
      expect(screen.queryByTestId('tech-card-nodejs')).toHaveClass('tech-filtered-out');
    });
  });

  describe('Layer Colors', () => {
    it('should apply distinct colors to each layer', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      const layers = screen.getAllByTestId(/^layer-/);
      const colors = layers.map(l => getComputedStyle(l).backgroundColor);

      // Each layer should have a different color
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(layers.length);
    });

    it('should apply custom color scheme when provided', () => {
      const customColors = {
        runtime: '#ff0000',
        'core-framework': '#00ff00',
        memory: '#0000ff',
        security: '#ffff00',
        communication: '#ff00ff',
        intelligence: '#00ffff',
      };

      render(<TechStackLayers data={mockTechStackData} colorScheme={customColors} />);

      const runtimeLayer = screen.getByTestId('layer-runtime');
      expect(runtimeLayer).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('Interactive Mode', () => {
    it('should show comparison mode', async () => {
      render(<TechStackLayers data={mockTechStackData} showComparison={true} />);
      const user = userEvent.setup();

      const comparisonToggle = screen.getByRole('button', { name: /compare/i });
      await user.click(comparisonToggle);

      expect(screen.getByTestId('comparison-panel')).toBeInTheDocument();
    });

    it('should allow selecting technologies for comparison', async () => {
      render(<TechStackLayers data={mockTechStackData} showComparison={true} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /compare/i }));
      await user.click(screen.getByTestId('layer-memory'));

      const agentdbCard = screen.getByTestId('tech-card-agentdb');
      const sqliteCard = screen.getByTestId('tech-card-sqlite');

      await user.click(agentdbCard);
      await user.click(sqliteCard);

      const comparison = screen.getByTestId('comparison-panel');
      expect(comparison).toHaveTextContent('AgentDB');
      expect(comparison).toHaveTextContent('SQLite');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for layers', () => {
      render(<TechStackLayers data={mockTechStackData} />);

      const runtimeLayer = screen.getByTestId('layer-runtime');
      expect(runtimeLayer).toHaveAttribute('aria-label', expect.stringContaining('Runtime'));
      expect(runtimeLayer).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded on layer expansion', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const layer = screen.getByTestId('layer-runtime');
      await user.click(layer);

      expect(layer).toHaveAttribute('aria-expanded', 'true');
    });

    it('should support keyboard navigation between layers', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const firstLayer = screen.getByTestId('layer-runtime');
      firstLayer.focus();

      await user.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(screen.getByTestId('layer-core-framework'));
    });

    it('should expand layer on Enter key', async () => {
      render(<TechStackLayers data={mockTechStackData} />);
      const user = userEvent.setup();

      const layer = screen.getByTestId('layer-runtime');
      layer.focus();

      await user.keyboard('{Enter}');

      expect(layer).toHaveClass('layer-expanded');
    });
  });

  describe('Responsive Layout', () => {
    it('should use horizontal layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<TechStackLayers data={mockTechStackData} />);

      const container = screen.getByTestId('tech-stack-container');
      expect(container).toHaveClass('layout-horizontal');
    });

    it('should use vertical layout on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<TechStackLayers data={mockTechStackData} />);

      const container = screen.getByTestId('tech-stack-container');
      expect(container).toHaveClass('layout-vertical');
    });

    it('should stack technology cards on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<TechStackLayers data={mockTechStackData} expandedLayers={['runtime']} />);

      const techCards = screen.getAllByTestId(/^tech-card-/);
      expect(techCards[0].parentElement).toHaveClass('tech-grid-mobile');
    });
  });

  describe('Animation', () => {
    it('should animate layer entrance on mount', async () => {
      render(<TechStackLayers data={mockTechStackData} animate={true} />);

      const layers = screen.getAllByTestId(/^layer-/);

      // Initial state - layers should be animating in
      layers.forEach(layer => {
        expect(layer).toHaveClass('layer-entering');
      });

      // After animation completes
      await waitFor(() => {
        layers.forEach(layer => {
          expect(layer).not.toHaveClass('layer-entering');
        });
      }, { timeout: 1000 });
    });

    it('should stagger layer entrance animations', async () => {
      vi.useFakeTimers();

      render(<TechStackLayers data={mockTechStackData} animate={true} />);

      const layers = screen.getAllByTestId(/^layer-/);

      // First layer should animate first
      expect(layers[0]).toHaveClass('layer-entering');

      vi.advanceTimersByTime(100);

      // Second layer should start animating
      expect(layers[1]).toHaveClass('layer-entering');
      expect(layers[0]).not.toHaveClass('layer-entering');

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty layers gracefully', () => {
      render(<TechStackLayers data={{ layers: [] }} />);

      expect(screen.getByText(/no technology layers/i)).toBeInTheDocument();
    });

    it('should handle missing technology data', async () => {
      const dataWithMissingTech = {
        layers: [{
          id: 'runtime',
          name: 'Runtime',
          technologies: [
            { id: 'nodejs' }, // Missing name, version, etc.
          ],
        }],
      };

      render(<TechStackLayers data={dataWithMissingTech as unknown as typeof mockTechStackData} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('layer-runtime'));

      // Should show placeholder for missing data
      const techCard = screen.getByTestId('tech-card-nodejs');
      expect(techCard).toHaveTextContent('Unknown Technology');
    });
  });
});
