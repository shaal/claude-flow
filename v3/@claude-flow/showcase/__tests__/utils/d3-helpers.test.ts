/**
 * @claude-flow/showcase - D3 Helper Functions Tests
 *
 * TDD test specifications for D3 visualization utilities.
 * Tests SVG generation, path calculations, and animation helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Utility imports (will be implemented after tests)
import {
  createSvgContainer,
  calculateBezierPath,
  calculateArcPath,
  generateNodeId,
  calculateCenterPoint,
  calculateBoundingBox,
  interpolatePosition,
  createGradient,
  createDropShadow,
  generateArrowMarker,
  clampPosition,
  calculateLinkPath,
  animatePathLength,
  createZoomBehavior,
  formatNumber,
  debounce,
  throttle,
} from '../../src/utils/d3-helpers';
import type { Position, BoundingBox, LinkStyle } from '../../src/types';

describe('D3 Helper Functions', () => {
  describe('createSvgContainer', () => {
    it('should create SVG element with correct dimensions', () => {
      const container = document.createElement('div');
      const svg = createSvgContainer(container, { width: 800, height: 600 });

      expect(svg.getAttribute('width')).toBe('800');
      expect(svg.getAttribute('height')).toBe('600');
    });

    it('should apply viewBox attribute', () => {
      const container = document.createElement('div');
      const svg = createSvgContainer(container, {
        width: 800,
        height: 600,
        viewBox: '0 0 1600 1200',
      });

      expect(svg.getAttribute('viewBox')).toBe('0 0 1600 1200');
    });

    it('should preserve aspect ratio', () => {
      const container = document.createElement('div');
      const svg = createSvgContainer(container, {
        width: 800,
        height: 600,
        preserveAspectRatio: 'xMidYMid meet',
      });

      expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    });

    it('should append to container', () => {
      const container = document.createElement('div');
      createSvgContainer(container, { width: 800, height: 600 });

      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('should apply custom classes', () => {
      const container = document.createElement('div');
      const svg = createSvgContainer(container, {
        width: 800,
        height: 600,
        className: 'custom-svg-class',
      });

      expect(svg.classList.contains('custom-svg-class')).toBe(true);
    });
  });

  describe('calculateBezierPath', () => {
    it('should generate cubic bezier path between two points', () => {
      const start: Position = { x: 0, y: 0 };
      const end: Position = { x: 100, y: 100 };

      const path = calculateBezierPath(start, end);

      expect(path).toMatch(/^M\s*0[,\s]0/); // Starts with M 0,0
      expect(path).toMatch(/C/); // Contains cubic bezier command
      expect(path).toMatch(/100[,\s]100$/); // Ends at 100,100
    });

    it('should handle horizontal links', () => {
      const start: Position = { x: 0, y: 50 };
      const end: Position = { x: 200, y: 50 };

      const path = calculateBezierPath(start, end, { orientation: 'horizontal' });

      expect(path).toContain('C');
      // Control points should extend horizontally
    });

    it('should handle vertical links', () => {
      const start: Position = { x: 50, y: 0 };
      const end: Position = { x: 50, y: 200 };

      const path = calculateBezierPath(start, end, { orientation: 'vertical' });

      expect(path).toContain('C');
    });

    it('should support custom curvature', () => {
      const start: Position = { x: 0, y: 0 };
      const end: Position = { x: 100, y: 100 };

      const lowCurve = calculateBezierPath(start, end, { curvature: 0.1 });
      const highCurve = calculateBezierPath(start, end, { curvature: 0.9 });

      expect(lowCurve).not.toBe(highCurve);
    });

    it('should handle same start and end points', () => {
      const point: Position = { x: 50, y: 50 };

      const path = calculateBezierPath(point, point);

      // Should create a loop or minimal path
      expect(path).toBeDefined();
    });
  });

  describe('calculateArcPath', () => {
    it('should generate arc path', () => {
      const center: Position = { x: 100, y: 100 };

      const path = calculateArcPath(center, {
        innerRadius: 50,
        outerRadius: 80,
        startAngle: 0,
        endAngle: Math.PI / 2,
      });

      expect(path).toMatch(/^M/); // Starts with move command
      expect(path).toMatch(/A/); // Contains arc command
    });

    it('should handle full circle', () => {
      const center: Position = { x: 100, y: 100 };

      const path = calculateArcPath(center, {
        innerRadius: 0,
        outerRadius: 50,
        startAngle: 0,
        endAngle: Math.PI * 2,
      });

      expect(path).toContain('A');
      // Full circle needs special handling
    });

    it('should support donut shape', () => {
      const center: Position = { x: 100, y: 100 };

      const path = calculateArcPath(center, {
        innerRadius: 30,
        outerRadius: 50,
        startAngle: 0,
        endAngle: Math.PI,
      });

      // Should have both inner and outer arcs
      const arcMatches = path.match(/A/g);
      expect(arcMatches?.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle corner radius', () => {
      const center: Position = { x: 100, y: 100 };

      const pathWithCorner = calculateArcPath(center, {
        innerRadius: 30,
        outerRadius: 50,
        startAngle: 0,
        endAngle: Math.PI / 2,
        cornerRadius: 5,
      });

      expect(pathWithCorner).toBeDefined();
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();

      expect(id1).not.toBe(id2);
    });

    it('should include prefix', () => {
      const id = generateNodeId('node');

      expect(id).toMatch(/^node-/);
    });

    it('should generate valid DOM IDs', () => {
      const id = generateNodeId();

      // Should not start with a number
      expect(id).toMatch(/^[a-zA-Z]/);
      // Should only contain valid characters
      expect(id).toMatch(/^[a-zA-Z0-9-_]+$/);
    });
  });

  describe('calculateCenterPoint', () => {
    it('should calculate center of two points', () => {
      const p1: Position = { x: 0, y: 0 };
      const p2: Position = { x: 100, y: 100 };

      const center = calculateCenterPoint(p1, p2);

      expect(center.x).toBe(50);
      expect(center.y).toBe(50);
    });

    it('should calculate center of bounding box', () => {
      const box: BoundingBox = {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      };

      const center = calculateCenterPoint(box);

      expect(center.x).toBe(200);
      expect(center.y).toBe(150);
    });

    it('should handle array of positions', () => {
      const positions: Position[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];

      const center = calculateCenterPoint(positions);

      expect(center.x).toBe(50);
      expect(center.y).toBe(50);
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate bounding box from positions', () => {
      const positions: Position[] = [
        { x: 10, y: 20 },
        { x: 100, y: 150 },
        { x: 50, y: 80 },
      ];

      const box = calculateBoundingBox(positions);

      expect(box.x).toBe(10);
      expect(box.y).toBe(20);
      expect(box.width).toBe(90);
      expect(box.height).toBe(130);
    });

    it('should handle single position', () => {
      const positions: Position[] = [{ x: 50, y: 50 }];

      const box = calculateBoundingBox(positions);

      expect(box.x).toBe(50);
      expect(box.y).toBe(50);
      expect(box.width).toBe(0);
      expect(box.height).toBe(0);
    });

    it('should add padding when specified', () => {
      const positions: Position[] = [
        { x: 10, y: 10 },
        { x: 100, y: 100 },
      ];

      const box = calculateBoundingBox(positions, { padding: 20 });

      expect(box.x).toBe(-10);
      expect(box.y).toBe(-10);
      expect(box.width).toBe(130);
      expect(box.height).toBe(130);
    });
  });

  describe('interpolatePosition', () => {
    it('should interpolate between two positions', () => {
      const start: Position = { x: 0, y: 0 };
      const end: Position = { x: 100, y: 100 };

      expect(interpolatePosition(start, end, 0)).toEqual({ x: 0, y: 0 });
      expect(interpolatePosition(start, end, 0.5)).toEqual({ x: 50, y: 50 });
      expect(interpolatePosition(start, end, 1)).toEqual({ x: 100, y: 100 });
    });

    it('should handle t values outside 0-1 range', () => {
      const start: Position = { x: 0, y: 0 };
      const end: Position = { x: 100, y: 100 };

      // Extrapolation
      const beyond = interpolatePosition(start, end, 1.5);
      expect(beyond.x).toBe(150);
      expect(beyond.y).toBe(150);
    });

    it('should clamp when specified', () => {
      const start: Position = { x: 0, y: 0 };
      const end: Position = { x: 100, y: 100 };

      const clamped = interpolatePosition(start, end, 1.5, { clamp: true });
      expect(clamped.x).toBe(100);
      expect(clamped.y).toBe(100);
    });
  });

  describe('createGradient', () => {
    let svg: SVGSVGElement;
    let defs: SVGDefsElement;

    beforeEach(() => {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    });

    it('should create linear gradient', () => {
      const gradient = createGradient(defs, {
        type: 'linear',
        id: 'test-gradient',
        stops: [
          { offset: '0%', color: '#ff0000' },
          { offset: '100%', color: '#0000ff' },
        ],
      });

      expect(gradient.tagName).toBe('linearGradient');
      expect(gradient.id).toBe('test-gradient');
      expect(gradient.querySelectorAll('stop').length).toBe(2);
    });

    it('should create radial gradient', () => {
      const gradient = createGradient(defs, {
        type: 'radial',
        id: 'radial-gradient',
        stops: [
          { offset: '0%', color: '#ffffff' },
          { offset: '100%', color: '#000000' },
        ],
      });

      expect(gradient.tagName).toBe('radialGradient');
    });

    it('should apply gradient angle', () => {
      const gradient = createGradient(defs, {
        type: 'linear',
        id: 'angled-gradient',
        angle: 45,
        stops: [
          { offset: '0%', color: '#ff0000' },
          { offset: '100%', color: '#0000ff' },
        ],
      });

      expect(gradient.getAttribute('gradientTransform')).toContain('rotate(45)');
    });
  });

  describe('createDropShadow', () => {
    let svg: SVGSVGElement;
    let defs: SVGDefsElement;

    beforeEach(() => {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    });

    it('should create filter element', () => {
      const filter = createDropShadow(defs, {
        id: 'shadow',
        dx: 2,
        dy: 2,
        blur: 4,
      });

      expect(filter.tagName).toBe('filter');
      expect(filter.id).toBe('shadow');
    });

    it('should include feGaussianBlur', () => {
      const filter = createDropShadow(defs, {
        id: 'shadow',
        dx: 2,
        dy: 2,
        blur: 4,
      });

      expect(filter.querySelector('feGaussianBlur')).not.toBeNull();
    });

    it('should include feOffset', () => {
      const filter = createDropShadow(defs, {
        id: 'shadow',
        dx: 5,
        dy: 5,
        blur: 4,
      });

      const offset = filter.querySelector('feOffset');
      expect(offset?.getAttribute('dx')).toBe('5');
      expect(offset?.getAttribute('dy')).toBe('5');
    });
  });

  describe('generateArrowMarker', () => {
    let svg: SVGSVGElement;
    let defs: SVGDefsElement;

    beforeEach(() => {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    });

    it('should create marker element', () => {
      const marker = generateArrowMarker(defs, {
        id: 'arrow',
        size: 10,
        color: '#000000',
      });

      expect(marker.tagName).toBe('marker');
      expect(marker.id).toBe('arrow');
    });

    it('should set marker properties', () => {
      const marker = generateArrowMarker(defs, {
        id: 'arrow',
        size: 10,
        color: '#000000',
      });

      expect(marker.getAttribute('markerWidth')).toBeDefined();
      expect(marker.getAttribute('markerHeight')).toBeDefined();
      expect(marker.getAttribute('orient')).toBe('auto');
    });

    it('should contain path for arrow shape', () => {
      const marker = generateArrowMarker(defs, {
        id: 'arrow',
        size: 10,
        color: '#ff0000',
      });

      const path = marker.querySelector('path');
      expect(path).not.toBeNull();
      expect(path?.getAttribute('fill')).toBe('#ff0000');
    });
  });

  describe('clampPosition', () => {
    it('should clamp position within bounds', () => {
      const position: Position = { x: -10, y: 700 };
      const bounds: BoundingBox = { x: 0, y: 0, width: 800, height: 600 };

      const clamped = clampPosition(position, bounds);

      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(600);
    });

    it('should not modify position within bounds', () => {
      const position: Position = { x: 400, y: 300 };
      const bounds: BoundingBox = { x: 0, y: 0, width: 800, height: 600 };

      const clamped = clampPosition(position, bounds);

      expect(clamped.x).toBe(400);
      expect(clamped.y).toBe(300);
    });

    it('should account for node size', () => {
      const position: Position = { x: 790, y: 590 };
      const bounds: BoundingBox = { x: 0, y: 0, width: 800, height: 600 };
      const nodeSize = { width: 50, height: 30 };

      const clamped = clampPosition(position, bounds, nodeSize);

      expect(clamped.x).toBeLessThanOrEqual(750); // 800 - 50
      expect(clamped.y).toBeLessThanOrEqual(570); // 600 - 30
    });
  });

  describe('calculateLinkPath', () => {
    it('should generate straight line path', () => {
      const source: Position = { x: 0, y: 0 };
      const target: Position = { x: 100, y: 100 };

      const path = calculateLinkPath(source, target, { style: 'straight' });

      expect(path).toBe('M 0,0 L 100,100');
    });

    it('should generate curved path', () => {
      const source: Position = { x: 0, y: 0 };
      const target: Position = { x: 100, y: 100 };

      const path = calculateLinkPath(source, target, { style: 'curved' });

      expect(path).toContain('C'); // Cubic bezier
    });

    it('should generate step path', () => {
      const source: Position = { x: 0, y: 0 };
      const target: Position = { x: 100, y: 100 };

      const path = calculateLinkPath(source, target, { style: 'step' });

      expect(path).toContain('H'); // Horizontal line
      expect(path).toContain('V'); // Vertical line
    });

    it('should handle node connection points', () => {
      const source = { x: 50, y: 50, width: 100, height: 50 };
      const target = { x: 250, y: 150, width: 100, height: 50 };

      const path = calculateLinkPath(
        { x: source.x, y: source.y },
        { x: target.x, y: target.y },
        {
          style: 'curved',
          sourceNode: source,
          targetNode: target,
        }
      );

      // Path should start from edge of source, not center
      expect(path).not.toMatch(/^M 50,50/);
    });
  });

  describe('animatePathLength', () => {
    it('should set up stroke-dasharray animation', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0,0 L 100,100');

      // Mock getTotalLength
      path.getTotalLength = vi.fn().mockReturnValue(141.42);

      animatePathLength(path, { duration: 1000 });

      expect(path.style.strokeDasharray).toBeDefined();
      expect(path.style.strokeDashoffset).toBeDefined();
    });

    it('should apply transition style', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0,0 L 100,100');
      path.getTotalLength = vi.fn().mockReturnValue(100);

      animatePathLength(path, { duration: 500 });

      expect(path.style.transition).toContain('stroke-dashoffset');
      expect(path.style.transition).toContain('500ms');
    });
  });

  describe('createZoomBehavior', () => {
    it('should return zoom behavior object', () => {
      const zoom = createZoomBehavior({
        minZoom: 0.5,
        maxZoom: 2,
      });

      expect(zoom).toBeDefined();
      expect(zoom.scaleExtent).toBeDefined();
    });

    it('should configure scale extent', () => {
      const zoom = createZoomBehavior({
        minZoom: 0.25,
        maxZoom: 4,
      });

      const extent = zoom.scaleExtent();
      expect(extent[0]).toBe(0.25);
      expect(extent[1]).toBe(4);
    });

    it('should configure translate extent', () => {
      const zoom = createZoomBehavior({
        minZoom: 0.5,
        maxZoom: 2,
        translateExtent: [[-500, -500], [500, 500]],
      });

      const extent = zoom.translateExtent();
      expect(extent[0]).toEqual([-500, -500]);
      expect(extent[1]).toEqual([500, 500]);
    });
  });

  describe('formatNumber', () => {
    it('should format with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should format with decimal places', () => {
      expect(formatNumber(1234.5678, { decimals: 2 })).toBe('1,234.57');
    });

    it('should format as percentage', () => {
      expect(formatNumber(0.75, { style: 'percent' })).toBe('75%');
    });

    it('should format with SI prefix', () => {
      expect(formatNumber(12500, { notation: 'compact' })).toMatch(/12\.?5?K/);
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalled();
    });

    it('should only call once for rapid calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    afterEach(() => {
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should call immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalled();
    });

    it('should throttle subsequent calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should preserve last call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100, { trailing: true });

      throttled('first');
      throttled('second');
      throttled('third');

      vi.advanceTimersByTime(100);

      // Should have been called with 'first' immediately and 'third' after throttle
      expect(fn).toHaveBeenLastCalledWith('third');
    });

    afterEach(() => {
      vi.useRealTimers();
    });
  });
});
