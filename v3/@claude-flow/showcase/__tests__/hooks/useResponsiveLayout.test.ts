/**
 * @claude-flow/showcase - useResponsiveLayout Hook Tests
 *
 * TDD test specifications for responsive layout detection.
 * Tests breakpoint detection and resize event handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Hook import (will be implemented after tests)
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import type { Breakpoint, LayoutConfig } from '../../src/types';

describe('useResponsiveLayout', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    vi.clearAllMocks();
  });

  const setWindowSize = (width: number, height: number = 768) => {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    window.dispatchEvent(new Event('resize'));
  };

  describe('Breakpoint Detection', () => {
    it('should detect mobile breakpoint', () => {
      setWindowSize(375);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
    });

    it('should detect tablet breakpoint', () => {
      setWindowSize(768);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('tablet');
      expect(result.current.isTablet).toBe(true);
    });

    it('should detect desktop breakpoint', () => {
      setWindowSize(1024);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
    });

    it('should detect wide breakpoint', () => {
      setWindowSize(1280);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('wide');
      expect(result.current.isWide).toBe(true);
    });

    it('should detect ultrawide breakpoint', () => {
      setWindowSize(1920);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('ultrawide');
      expect(result.current.isUltrawide).toBe(true);
    });

    it('should return exact width and height', () => {
      setWindowSize(1024, 768);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });
  });

  describe('Custom Breakpoints', () => {
    it('should support custom breakpoint configuration', () => {
      setWindowSize(500);

      const customBreakpoints: Record<string, number> = {
        small: 480,
        medium: 720,
        large: 1080,
      };

      const { result } = renderHook(() =>
        useResponsiveLayout({ breakpoints: customBreakpoints })
      );

      expect(result.current.breakpoint).toBe('medium');
    });

    it('should handle breakpoint boundaries correctly', () => {
      // At exact boundary
      setWindowSize(768);

      const { result } = renderHook(() => useResponsiveLayout());

      // Should be tablet at 768px (lower bound of tablet)
      expect(result.current.breakpoint).toBe('tablet');
    });

    it('should handle below minimum breakpoint', () => {
      setWindowSize(320);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('mobile');
    });
  });

  describe('Resize Event Handling', () => {
    it('should update on window resize', async () => {
      setWindowSize(1024);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('desktop');

      // Resize to mobile
      act(() => {
        setWindowSize(375);
      });

      await waitFor(() => {
        expect(result.current.breakpoint).toBe('mobile');
      });
    });

    it('should debounce resize events', async () => {
      vi.useFakeTimers();
      const onChange = vi.fn();

      renderHook(() => useResponsiveLayout({ onChange, debounce: 100 }));

      // Rapid resize events
      act(() => {
        setWindowSize(400);
        setWindowSize(500);
        setWindowSize(600);
        setWindowSize(700);
      });

      // Only one call after debounce period
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onChange).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should throttle resize events when configured', async () => {
      vi.useFakeTimers();
      const onChange = vi.fn();

      renderHook(() => useResponsiveLayout({ onChange, throttle: 100 }));

      // Rapid resize events over 500ms
      for (let i = 0; i < 10; i++) {
        act(() => {
          setWindowSize(400 + i * 50);
          vi.advanceTimersByTime(50);
        });
      }

      // Should be called approximately every 100ms
      expect(onChange.mock.calls.length).toBeLessThanOrEqual(6);

      vi.useRealTimers();
    });

    it('should clean up resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useResponsiveLayout());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Orientation', () => {
    it('should detect landscape orientation', () => {
      setWindowSize(1024, 768);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.orientation).toBe('landscape');
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.isPortrait).toBe(false);
    });

    it('should detect portrait orientation', () => {
      setWindowSize(768, 1024);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.orientation).toBe('portrait');
      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
    });

    it('should detect square orientation', () => {
      setWindowSize(800, 800);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.orientation).toBe('square');
    });

    it('should update orientation on resize', async () => {
      setWindowSize(1024, 768);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isLandscape).toBe(true);

      act(() => {
        setWindowSize(768, 1024);
      });

      await waitFor(() => {
        expect(result.current.isPortrait).toBe(true);
      });
    });
  });

  describe('Aspect Ratio', () => {
    it('should calculate aspect ratio', () => {
      setWindowSize(1920, 1080);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.aspectRatio).toBeCloseTo(1.78, 1); // 16:9
    });

    it('should detect common aspect ratios', () => {
      setWindowSize(1920, 1080);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.is16x9).toBe(true);
      expect(result.current.is4x3).toBe(false);
    });

    it('should detect 4:3 aspect ratio', () => {
      setWindowSize(1024, 768);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.is4x3).toBe(true);
    });
  });

  describe('Device Type', () => {
    it('should detect touch device', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', { value: {} });

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isTouch).toBe(true);
    });

    it('should detect non-touch device', () => {
      // Remove touch support
      delete (window as unknown as { ontouchstart?: unknown }).ontouchstart;

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isTouch).toBe(false);
    });

    it('should detect high DPI display', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isRetina).toBe(true);
      expect(result.current.devicePixelRatio).toBe(2);
    });
  });

  describe('Media Query Matching', () => {
    it('should match media query', () => {
      setWindowSize(1024);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.matchesQuery('(min-width: 768px)')).toBe(true);
      expect(result.current.matchesQuery('(min-width: 1280px)')).toBe(false);
    });

    it('should react to media query changes', async () => {
      setWindowSize(1024);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.matchesQuery('(min-width: 768px)')).toBe(true);

      act(() => {
        setWindowSize(640);
      });

      await waitFor(() => {
        expect(result.current.matchesQuery('(min-width: 768px)')).toBe(false);
      });
    });

    it('should support reduced motion preference', () => {
      const mockMediaQuery = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      window.matchMedia = mockMediaQuery;

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it('should support dark mode preference', () => {
      const mockMediaQuery = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-color-scheme: dark'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      window.matchMedia = mockMediaQuery;

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.prefersDarkMode).toBe(true);
    });
  });

  describe('Layout Configuration', () => {
    it('should return layout config based on breakpoint', () => {
      setWindowSize(1024);

      const { result } = renderHook(() => useResponsiveLayout());

      const config = result.current.getLayoutConfig();

      expect(config).toEqual(expect.objectContaining({
        columns: expect.any(Number),
        gutter: expect.any(Number),
        containerWidth: expect.any(String),
      }));
    });

    it('should return mobile layout config', () => {
      setWindowSize(375);

      const { result } = renderHook(() => useResponsiveLayout());

      const config = result.current.getLayoutConfig();

      expect(config.columns).toBe(1);
    });

    it('should return desktop layout config', () => {
      setWindowSize(1200);

      const { result } = renderHook(() => useResponsiveLayout());

      const config = result.current.getLayoutConfig();

      expect(config.columns).toBe(3);
    });

    it('should support custom layout configurations', () => {
      setWindowSize(1024);

      const customLayouts: Record<Breakpoint, LayoutConfig> = {
        mobile: { columns: 1, gutter: 8, containerWidth: '100%' },
        tablet: { columns: 2, gutter: 16, containerWidth: '90%' },
        desktop: { columns: 4, gutter: 24, containerWidth: '1200px' },
        wide: { columns: 5, gutter: 32, containerWidth: '1400px' },
        ultrawide: { columns: 6, gutter: 40, containerWidth: '1600px' },
      };

      const { result } = renderHook(() =>
        useResponsiveLayout({ layouts: customLayouts })
      );

      const config = result.current.getLayoutConfig();

      expect(config.columns).toBe(4);
    });
  });

  describe('Container Queries', () => {
    it('should support container element sizing', () => {
      const containerRef = { current: { offsetWidth: 600, offsetHeight: 400 } };

      const { result } = renderHook(() =>
        useResponsiveLayout({ containerRef: containerRef as unknown as React.RefObject<HTMLElement> })
      );

      expect(result.current.containerWidth).toBe(600);
      expect(result.current.containerHeight).toBe(400);
    });

    it('should update on container resize', async () => {
      const containerRef = { current: { offsetWidth: 600, offsetHeight: 400 } };

      const { result, rerender } = renderHook(() =>
        useResponsiveLayout({ containerRef: containerRef as unknown as React.RefObject<HTMLElement> })
      );

      expect(result.current.containerWidth).toBe(600);

      // Simulate container resize
      containerRef.current.offsetWidth = 800;

      // Trigger re-render
      rerender();

      // Note: In real implementation, ResizeObserver would trigger this
      expect(result.current.containerWidth).toBe(800);
    });
  });

  describe('Callbacks', () => {
    it('should call onChange when breakpoint changes', async () => {
      setWindowSize(1024);
      const onChange = vi.fn();

      renderHook(() => useResponsiveLayout({ onChange }));

      act(() => {
        setWindowSize(375);
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
          breakpoint: 'mobile',
          previousBreakpoint: 'desktop',
        }));
      });
    });

    it('should not call onChange when size changes within breakpoint', async () => {
      setWindowSize(1024);
      const onChange = vi.fn();

      renderHook(() => useResponsiveLayout({ onChange }));

      // Clear initial call
      onChange.mockClear();

      // Resize within desktop breakpoint
      act(() => {
        setWindowSize(1100);
      });

      // Should not trigger callback
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should call onResize for every resize event', async () => {
      vi.useFakeTimers();
      setWindowSize(1024);
      const onResize = vi.fn();

      renderHook(() => useResponsiveLayout({ onResize, debounce: 0 }));
      onResize.mockClear();

      act(() => {
        setWindowSize(1025);
        vi.advanceTimersByTime(10);
      });

      expect(onResize).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('SSR Support', () => {
    it('should handle server-side rendering', () => {
      // Simulate SSR by removing window
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting to undefined for SSR test
      global.window = undefined;

      const { result } = renderHook(() =>
        useResponsiveLayout({ defaultBreakpoint: 'desktop' })
      );

      expect(result.current.breakpoint).toBe('desktop');

      global.window = originalWindow;
    });

    it('should use default values when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting to undefined for SSR test
      global.window = undefined;

      const { result } = renderHook(() =>
        useResponsiveLayout({ defaultWidth: 1024, defaultHeight: 768 })
      );

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);

      global.window = originalWindow;
    });
  });

  describe('Performance', () => {
    it('should memoize breakpoint calculation', () => {
      setWindowSize(1024);

      const { result, rerender } = renderHook(() => useResponsiveLayout());

      const firstBreakpoint = result.current.breakpoint;

      rerender();

      // Should return same reference
      expect(result.current.breakpoint).toBe(firstBreakpoint);
    });

    it('should not recalculate on unrelated re-renders', () => {
      const calculationSpy = vi.fn();

      const { rerender } = renderHook(() =>
        useResponsiveLayout({ onCalculate: calculationSpy })
      );

      calculationSpy.mockClear();

      // Re-render without resize
      rerender();

      expect(calculationSpy).not.toHaveBeenCalled();
    });
  });
});
