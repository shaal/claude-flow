/**
 * @claude-flow/showcase - MetricsDashboard Component Tests
 *
 * TDD test specifications for performance metrics visualization.
 * Tests metric rendering, animated values, and responsive layouts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Component imports (will be implemented after tests)
import { MetricsDashboard } from '../../src/components/metrics/MetricsDashboard';
import { mockMetricsData, mockPerformanceMetrics } from '../__mocks__/metrics-data';
import type { PerformanceMetric, MetricVisualType } from '../../src/types';

describe('MetricsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Metric Display', () => {
    it('should render all performance metrics', () => {
      // Given: metrics data
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      // Then: all 6 key metrics visible
      expect(screen.getByTestId('metric-hnsw-search')).toBeInTheDocument();
      expect(screen.getByTestId('metric-flash-attention')).toBeInTheDocument();
      expect(screen.getByTestId('metric-memory-reduction')).toBeInTheDocument();
      expect(screen.getByTestId('metric-cli-startup')).toBeInTheDocument();
      expect(screen.getByTestId('metric-mcp-response')).toBeInTheDocument();
      expect(screen.getByTestId('metric-sona-adaptation')).toBeInTheDocument();
    });

    it('should display metric names correctly', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      expect(screen.getByText('HNSW Search')).toBeInTheDocument();
      expect(screen.getByText('Flash Attention')).toBeInTheDocument();
      expect(screen.getByText('Memory Reduction')).toBeInTheDocument();
      expect(screen.getByText('CLI Startup')).toBeInTheDocument();
      expect(screen.getByText('MCP Response')).toBeInTheDocument();
      expect(screen.getByText('SONA Adaptation')).toBeInTheDocument();
    });

    it('should display metric values with units', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const hnswMetric = screen.getByTestId('metric-hnsw-search');
      expect(hnswMetric).toHaveTextContent('12500x');
      expect(hnswMetric).toHaveTextContent('faster');
    });

    it('should render correct visual type for each metric', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      // Counter type
      const hnswMetric = screen.getByTestId('metric-hnsw-search');
      expect(hnswMetric.querySelector('[data-visual-type="counter"]')).toBeInTheDocument();

      // Gauge type
      const flashAttention = screen.getByTestId('metric-flash-attention');
      expect(flashAttention.querySelector('[data-visual-type="gauge"]')).toBeInTheDocument();

      // Progress type
      const memoryReduction = screen.getByTestId('metric-memory-reduction');
      expect(memoryReduction.querySelector('[data-visual-type="progress"]')).toBeInTheDocument();
    });

    it('should display metric icons', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const hnswIcon = screen.getByTestId('metric-icon-hnsw-search');
      expect(hnswIcon).toBeInTheDocument();
    });
  });

  describe('Animated Counter Values', () => {
    it('should animate counter values from 0 to target', async () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={true} />);

      const counterElement = screen.getByTestId('counter-hnsw-search');

      // Initial value should be 0
      expect(counterElement).toHaveTextContent('0');

      // After animation completes
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(counterElement).toHaveTextContent('12500');
      });
    });

    it('should animate counter with easing function', async () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={true} />);

      const counterElement = screen.getByTestId('counter-hnsw-search');

      // At halfway point, value should be less than half (ease-out)
      act(() => {
        vi.advanceTimersByTime(1000); // Half of 2000ms duration
      });

      const currentValue = parseInt(counterElement.textContent || '0', 10);
      expect(currentValue).toBeGreaterThan(0);
      expect(currentValue).toBeLessThan(12500);
    });

    it('should support configurable animation duration', async () => {
      render(
        <MetricsDashboard
          metrics={mockMetricsData.performance}
          animate={true}
          animationDuration={1000}
        />
      );

      const counterElement = screen.getByTestId('counter-hnsw-search');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(counterElement).toHaveTextContent('12500');
      });
    });

    it('should not animate when animate prop is false', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={false} />);

      const counterElement = screen.getByTestId('counter-hnsw-search');

      // Value should be target immediately
      expect(counterElement).toHaveTextContent('12500');
    });

    it('should format large numbers with separators', async () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={false} />);

      const counterElement = screen.getByTestId('counter-hnsw-search');
      expect(counterElement).toHaveTextContent('12,500');
    });
  });

  describe('Gauge Visualization', () => {
    it('should render gauge with correct fill level', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const gauge = screen.getByTestId('gauge-flash-attention');
      const fillElement = gauge.querySelector('.gauge-fill');

      // Flash attention speedup is 7.47x with max of 10x
      // So fill should be 74.7%
      expect(fillElement).toHaveStyle({ width: '74.7%' });
    });

    it('should animate gauge fill', async () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={true} />);

      const gauge = screen.getByTestId('gauge-flash-attention');
      const fillElement = gauge.querySelector('.gauge-fill');

      // Initial state
      expect(fillElement).toHaveStyle({ width: '0%' });

      // After animation
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(fillElement).toHaveStyle({ width: '74.7%' });
      });
    });

    it('should show gauge markers', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const gauge = screen.getByTestId('gauge-flash-attention');
      const markers = gauge.querySelectorAll('.gauge-marker');

      expect(markers.length).toBeGreaterThan(0);
    });

    it('should display current value in gauge center', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={false} />);

      const gaugeValue = screen.getByTestId('gauge-value-flash-attention');
      expect(gaugeValue).toHaveTextContent('7.47x');
    });
  });

  describe('Progress Ring Visualization', () => {
    it('should render progress ring with correct percentage', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const progressRing = screen.getByTestId('progress-memory-reduction');
      const circleElement = progressRing.querySelector('.progress-circle');

      // Memory reduction is 75%
      // Circle stroke-dasharray should reflect this
      expect(circleElement).toHaveAttribute('stroke-dasharray', expect.stringMatching(/75/));
    });

    it('should animate progress ring', async () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={true} />);

      const progressRing = screen.getByTestId('progress-memory-reduction');
      const circleElement = progressRing.querySelector('.progress-circle');

      // Initial state - no fill
      expect(circleElement).toHaveAttribute('stroke-dashoffset', expect.stringMatching(/100/));

      // After animation
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(circleElement).toHaveAttribute('stroke-dashoffset', expect.stringMatching(/25/));
      });
    });

    it('should display percentage in center', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={false} />);

      const progressValue = screen.getByTestId('progress-value-memory-reduction');
      expect(progressValue).toHaveTextContent('75%');
    });
  });

  describe('Timing Bar Visualization', () => {
    it('should render timing bar with correct fill', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const timingBar = screen.getByTestId('timing-cli-startup');
      const fillElement = timingBar.querySelector('.timing-fill');

      // CLI startup is 500ms with target of 1000ms
      expect(fillElement).toHaveStyle({ width: '50%' });
    });

    it('should show timing value', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} animate={false} />);

      const timingValue = screen.getByTestId('timing-value-cli-startup');
      expect(timingValue).toHaveTextContent('<500ms');
    });

    it('should color code timing bars based on threshold', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const cliTiming = screen.getByTestId('timing-cli-startup');
      const mcpTiming = screen.getByTestId('timing-mcp-response');

      // CLI at 500ms (good)
      expect(cliTiming).toHaveClass('timing-good');

      // MCP at <100ms (excellent)
      expect(mcpTiming).toHaveClass('timing-excellent');
    });
  });

  describe('Baseline Comparison', () => {
    it('should show comparison to baseline', () => {
      // Given: metric with baseline
      render(<MetricsDashboard metrics={mockMetricsData.performance} showBaseline={true} />);

      // Then: improvement percentage visible
      const hnswMetric = screen.getByTestId('metric-hnsw-search');
      const comparison = hnswMetric.querySelector('.baseline-comparison');

      expect(comparison).toBeInTheDocument();
      expect(comparison).toHaveTextContent('12,500x faster than baseline');
    });

    it('should display baseline value', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} showBaseline={true} />);

      const hnswMetric = screen.getByTestId('metric-hnsw-search');
      const baselineValue = hnswMetric.querySelector('.baseline-value');

      expect(baselineValue).toHaveTextContent('Baseline: 1x');
    });

    it('should show improvement indicator', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} showBaseline={true} />);

      const hnswMetric = screen.getByTestId('metric-hnsw-search');
      const improvementIndicator = hnswMetric.querySelector('.improvement-indicator');

      expect(improvementIndicator).toHaveClass('improvement-positive');
      expect(improvementIndicator.querySelector('[data-icon="arrow-up"]')).toBeInTheDocument();
    });

    it('should handle negative improvements', () => {
      const metricsWithRegression: PerformanceMetric[] = [
        {
          name: 'Test Metric',
          id: 'test-metric',
          value: 50,
          unit: 'ms',
          target: 100,
          baseline: 40,
          visualType: 'timing' as MetricVisualType,
        },
      ];

      render(<MetricsDashboard metrics={metricsWithRegression} showBaseline={true} />);

      const metric = screen.getByTestId('metric-test-metric');
      const improvementIndicator = metric.querySelector('.improvement-indicator');

      expect(improvementIndicator).toHaveClass('improvement-negative');
    });
  });

  describe('Responsive Layout', () => {
    it('should stack metrics on mobile', () => {
      // Given: mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));

      // When: rendered
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      // Then: metrics in single column
      const container = screen.getByTestId('metrics-dashboard');
      expect(container).toHaveClass('layout-mobile');

      const grid = container.querySelector('.metrics-grid');
      expect(grid).toHaveStyle({ gridTemplateColumns: '1fr' });
    });

    it('should use grid layout on tablet', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const container = screen.getByTestId('metrics-dashboard');
      expect(container).toHaveClass('layout-tablet');

      const grid = container.querySelector('.metrics-grid');
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' });
    });

    it('should use 3-column grid on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const container = screen.getByTestId('metrics-dashboard');
      expect(container).toHaveClass('layout-desktop');

      const grid = container.querySelector('.metrics-grid');
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
    });

    it('should resize metrics cards on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const metricCard = screen.getByTestId('metric-hnsw-search');
      expect(metricCard).toHaveClass('metric-card-compact');
    });
  });

  describe('Real-time Updates', () => {
    it('should update metrics when data changes', async () => {
      const { rerender } = render(
        <MetricsDashboard metrics={mockMetricsData.performance} />
      );

      const updatedMetrics = mockMetricsData.performance.map(m =>
        m.id === 'hnsw-search' ? { ...m, value: 15000 } : m
      );

      rerender(<MetricsDashboard metrics={updatedMetrics} />);

      const counterElement = screen.getByTestId('counter-hnsw-search');
      expect(counterElement).toHaveTextContent('15,000');
    });

    it('should animate value changes', async () => {
      vi.useRealTimers();

      const { rerender } = render(
        <MetricsDashboard metrics={mockMetricsData.performance} animate={true} />
      );

      const updatedMetrics = mockMetricsData.performance.map(m =>
        m.id === 'hnsw-search' ? { ...m, value: 15000 } : m
      );

      rerender(<MetricsDashboard metrics={updatedMetrics} animate={true} />);

      // Should show transition animation
      const counterElement = screen.getByTestId('counter-hnsw-search');
      expect(counterElement.parentElement).toHaveClass('value-updating');

      vi.useFakeTimers();
    });

    it('should support polling for updates', async () => {
      const fetchMetrics = vi.fn().mockResolvedValue(mockMetricsData.performance);

      render(
        <MetricsDashboard
          metrics={mockMetricsData.performance}
          pollingEnabled={true}
          pollingInterval={5000}
          onPoll={fetchMetrics}
        />
      );

      // Advance time by polling interval
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(fetchMetrics).toHaveBeenCalled();
    });
  });

  describe('Interactivity', () => {
    it('should show metric details on click', async () => {
      vi.useRealTimers();

      render(<MetricsDashboard metrics={mockMetricsData.performance} />);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('metric-hnsw-search'));

      const detailPanel = await screen.findByTestId('metric-detail-panel');
      expect(detailPanel).toBeInTheDocument();
      expect(detailPanel).toHaveTextContent('HNSW Search');
      expect(detailPanel).toHaveTextContent('150x-12,500x faster vector search');

      vi.useFakeTimers();
    });

    it('should show historical chart on metric click', async () => {
      vi.useRealTimers();

      render(
        <MetricsDashboard
          metrics={mockMetricsData.performance}
          showHistory={true}
        />
      );
      const user = userEvent.setup();

      await user.click(screen.getByTestId('metric-hnsw-search'));

      const chart = await screen.findByTestId('metric-history-chart');
      expect(chart).toBeInTheDocument();

      vi.useFakeTimers();
    });

    it('should allow toggling metric visibility', async () => {
      vi.useRealTimers();

      render(
        <MetricsDashboard
          metrics={mockMetricsData.performance}
          configurable={true}
        />
      );
      const user = userEvent.setup();

      const configButton = screen.getByRole('button', { name: /configure/i });
      await user.click(configButton);

      const hnswToggle = screen.getByRole('switch', { name: /hnsw search/i });
      await user.click(hnswToggle);

      expect(screen.queryByTestId('metric-hnsw-search')).not.toBeInTheDocument();

      vi.useFakeTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for metrics', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const hnswMetric = screen.getByTestId('metric-hnsw-search');
      expect(hnswMetric).toHaveAttribute('aria-label', expect.stringContaining('HNSW Search'));
    });

    it('should announce value changes', async () => {
      const { rerender } = render(
        <MetricsDashboard metrics={mockMetricsData.performance} />
      );

      const updatedMetrics = mockMetricsData.performance.map(m =>
        m.id === 'hnsw-search' ? { ...m, value: 15000 } : m
      );

      rerender(<MetricsDashboard metrics={updatedMetrics} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/HNSW Search.*updated.*15,000/);
    });

    it('should support keyboard navigation', async () => {
      vi.useRealTimers();

      render(<MetricsDashboard metrics={mockMetricsData.performance} />);
      const user = userEvent.setup();

      const firstMetric = screen.getByTestId('metric-hnsw-search');
      firstMetric.focus();

      await user.keyboard('{Tab}');

      expect(document.activeElement).not.toBe(firstMetric);
      expect(document.activeElement?.getAttribute('data-testid')).toMatch(/^metric-/);

      vi.useFakeTimers();
    });

    it('should have sufficient color contrast', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} />);

      const metricValue = screen.getByTestId('counter-hnsw-search');
      const computedStyle = getComputedStyle(metricValue);

      // Value text should have good contrast
      expect(computedStyle.color).not.toBe('transparent');
    });
  });

  describe('Theming', () => {
    it('should support dark theme', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} theme="dark" />);

      const container = screen.getByTestId('metrics-dashboard');
      expect(container).toHaveClass('theme-dark');
    });

    it('should support light theme', () => {
      render(<MetricsDashboard metrics={mockMetricsData.performance} theme="light" />);

      const container = screen.getByTestId('metrics-dashboard');
      expect(container).toHaveClass('theme-light');
    });

    it('should apply custom color scheme', () => {
      const customColors = {
        primary: '#3b82f6',
        positive: '#22c55e',
        negative: '#ef4444',
      };

      render(
        <MetricsDashboard
          metrics={mockMetricsData.performance}
          colorScheme={customColors}
        />
      );

      const positiveIndicator = screen.getByTestId('metric-hnsw-search')
        .querySelector('.improvement-indicator');

      expect(positiveIndicator).toHaveStyle({ color: '#22c55e' });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty metrics array', () => {
      render(<MetricsDashboard metrics={[]} />);

      expect(screen.getByText(/no metrics available/i)).toBeInTheDocument();
    });

    it('should handle invalid metric values', () => {
      const invalidMetrics: PerformanceMetric[] = [
        {
          name: 'Invalid Metric',
          id: 'invalid-metric',
          value: NaN,
          unit: 'x',
          target: 100,
          baseline: 1,
          visualType: 'counter' as MetricVisualType,
        },
      ];

      render(<MetricsDashboard metrics={invalidMetrics} />);

      const counter = screen.getByTestId('counter-invalid-metric');
      expect(counter).toHaveTextContent('--');
    });

    it('should handle missing required fields gracefully', () => {
      const incompleteMetrics = [
        { id: 'incomplete' } as unknown as PerformanceMetric,
      ];

      render(<MetricsDashboard metrics={incompleteMetrics} />);

      const metric = screen.getByTestId('metric-incomplete');
      expect(metric).toHaveTextContent('Unknown Metric');
    });
  });
});
