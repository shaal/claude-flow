/**
 * @claude-flow/showcase - useAnimatedValue Hook Tests
 *
 * TDD test specifications for animated value transitions.
 * Tests animation from 0 to target, easing functions, and duration configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Hook import (will be implemented after tests)
import { useAnimatedValue } from '../../src/hooks/useAnimatedValue';
import type { EasingFunction } from '../../src/types';

describe('useAnimatedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Animation', () => {
    it('should animate from 0 to target value', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      // Initial value should be 0
      expect(result.current.value).toBe(0);

      // After animation completes
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.value).toBe(100);
      });
    });

    it('should animate from custom initial value', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, initialValue: 50 })
      );

      // Initial value should be 50
      expect(result.current.value).toBe(50);

      // After animation completes
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.value).toBe(100);
      });
    });

    it('should return intermediate values during animation', () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      // At halfway point
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Value should be between 0 and 100
      expect(result.current.value).toBeGreaterThan(0);
      expect(result.current.value).toBeLessThan(100);
    });

    it('should not animate when disabled', () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, enabled: false })
      );

      // Should immediately be at target
      expect(result.current.value).toBe(100);
    });
  });

  describe('Easing Functions', () => {
    it('should apply linear easing', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, easing: 'linear' })
      );

      // At 50%, value should be exactly 50
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Linear easing: 50% time = 50% value
      expect(result.current.value).toBeCloseTo(50, 0);
    });

    it('should apply ease-out easing', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, easing: 'easeOut' })
      );

      // At 50%, value should be more than 50% (starts fast, slows down)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.value).toBeGreaterThan(50);
    });

    it('should apply ease-in easing', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, easing: 'easeIn' })
      );

      // At 50%, value should be less than 50% (starts slow, speeds up)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.value).toBeLessThan(50);
    });

    it('should apply ease-in-out easing', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, easing: 'easeInOut' })
      );

      // At 50%, value should be around 50 (symmetric S-curve)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.value).toBeCloseTo(50, 5);
    });

    it('should support custom easing function', async () => {
      const customEasing: EasingFunction = (t) => t * t; // Quadratic ease-in

      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, easing: customEasing })
      );

      // At 50%, value should be 25% (0.5 * 0.5 = 0.25)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.value).toBeCloseTo(25, 0);
    });

    it('should apply spring easing', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, easing: 'spring' })
      );

      // Spring may overshoot
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Spring easing can overshoot target briefly
      expect(result.current.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Duration Configuration', () => {
    it('should complete in specified duration', async () => {
      const onComplete = vi.fn();

      renderHook(() =>
        useAnimatedValue(100, { duration: 500, onComplete })
      );

      // Before completion
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(onComplete).not.toHaveBeenCalled();

      // After completion
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle zero duration', () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 0 })
      );

      // Should immediately be at target
      expect(result.current.value).toBe(100);
    });

    it('should handle negative duration as zero', () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: -100 })
      );

      expect(result.current.value).toBe(100);
    });

    it('should support millisecond precision', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 2000 })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // At 50%
      expect(result.current.value).toBeGreaterThan(0);
      expect(result.current.value).toBeLessThanOrEqual(60); // With ease-out default
    });
  });

  describe('Value Changes', () => {
    it('should restart animation when target changes', async () => {
      const { result, rerender } = renderHook(
        (target) => useAnimatedValue(target, { duration: 1000 }),
        { initialProps: 100 }
      );

      // Complete first animation
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.value).toBe(100);

      // Change target
      rerender(200);

      // Should animate from current to new target
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.value).toBeGreaterThan(100);
      expect(result.current.value).toBeLessThan(200);
    });

    it('should animate down to lower values', async () => {
      const { result, rerender } = renderHook(
        (target) => useAnimatedValue(target, { duration: 1000, initialValue: 100 }),
        { initialProps: 100 }
      );

      // Change to lower target
      rerender(50);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.value).toBe(50);
    });

    it('should handle rapid target changes', async () => {
      const { result, rerender } = renderHook(
        (target) => useAnimatedValue(target, { duration: 1000 }),
        { initialProps: 100 }
      );

      // Rapid changes
      rerender(200);
      act(() => vi.advanceTimersByTime(100));

      rerender(150);
      act(() => vi.advanceTimersByTime(100));

      rerender(300);
      act(() => vi.advanceTimersByTime(1000));

      expect(result.current.value).toBe(300);
    });

    it('should cancel previous animation when target changes', async () => {
      const onComplete = vi.fn();

      const { rerender } = renderHook(
        (target) => useAnimatedValue(target, { duration: 1000, onComplete }),
        { initialProps: 100 }
      );

      // Start animation
      act(() => vi.advanceTimersByTime(500));

      // Change target before completion
      rerender(200);

      // Original onComplete should not be called
      act(() => vi.advanceTimersByTime(600));

      // Only one completion for the final animation
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    it('should call onStart when animation begins', () => {
      const onStart = vi.fn();

      renderHook(() =>
        useAnimatedValue(100, { duration: 1000, onStart })
      );

      expect(onStart).toHaveBeenCalled();
    });

    it('should call onUpdate on each frame', async () => {
      const onUpdate = vi.fn();

      renderHook(() =>
        useAnimatedValue(100, { duration: 1000, onUpdate })
      );

      act(() => vi.advanceTimersByTime(100));

      expect(onUpdate).toHaveBeenCalled();
      expect(onUpdate.mock.calls[0][0]).toBeGreaterThan(0);
    });

    it('should call onComplete when animation ends', async () => {
      const onComplete = vi.fn();

      renderHook(() =>
        useAnimatedValue(100, { duration: 1000, onComplete })
      );

      act(() => vi.advanceTimersByTime(1000));

      expect(onComplete).toHaveBeenCalledWith(100);
    });
  });

  describe('Control Functions', () => {
    it('should provide pause function', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => vi.advanceTimersByTime(500));
      const pausedValue = result.current.value;

      act(() => {
        result.current.pause();
        vi.advanceTimersByTime(500);
      });

      // Value should not have changed
      expect(result.current.value).toBe(pausedValue);
    });

    it('should provide resume function', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => {
        vi.advanceTimersByTime(500);
        result.current.pause();
        vi.advanceTimersByTime(500);
        result.current.resume();
        vi.advanceTimersByTime(500);
      });

      expect(result.current.value).toBe(100);
    });

    it('should provide reset function', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => vi.advanceTimersByTime(500));
      expect(result.current.value).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.value).toBe(0);
    });

    it('should provide restart function', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.value).toBe(100);

      act(() => {
        result.current.restart();
      });

      expect(result.current.value).toBe(0);

      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.value).toBe(100);
    });

    it('should provide set function for immediate value', () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => {
        result.current.set(75);
      });

      expect(result.current.value).toBe(75);
    });
  });

  describe('State Properties', () => {
    it('should indicate animation is running', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      expect(result.current.isAnimating).toBe(true);

      act(() => vi.advanceTimersByTime(1000));

      expect(result.current.isAnimating).toBe(false);
    });

    it('should report progress percentage', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      expect(result.current.progress).toBe(0);

      act(() => vi.advanceTimersByTime(500));
      expect(result.current.progress).toBeCloseTo(0.5, 1);

      act(() => vi.advanceTimersByTime(500));
      expect(result.current.progress).toBe(1);
    });

    it('should report elapsed time', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => vi.advanceTimersByTime(250));

      expect(result.current.elapsed).toBeCloseTo(250, -1);
    });

    it('should report remaining time', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      act(() => vi.advanceTimersByTime(250));

      expect(result.current.remaining).toBeCloseTo(750, -1);
    });
  });

  describe('Delay', () => {
    it('should delay animation start', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, delay: 500 })
      );

      // During delay period
      act(() => vi.advanceTimersByTime(250));
      expect(result.current.value).toBe(0);

      // After delay, animation starts
      act(() => vi.advanceTimersByTime(500));
      expect(result.current.value).toBeGreaterThan(0);
    });

    it('should complete animation at delay + duration', async () => {
      const onComplete = vi.fn();

      renderHook(() =>
        useAnimatedValue(100, { duration: 1000, delay: 500, onComplete })
      );

      act(() => vi.advanceTimersByTime(1500));

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Number Formatting', () => {
    it('should support decimal precision', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(99.99, { duration: 1000, precision: 2 })
      );

      act(() => vi.advanceTimersByTime(1000));

      expect(result.current.value).toBe(99.99);
      expect(result.current.formattedValue).toBe('99.99');
    });

    it('should round to specified precision', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, precision: 0 })
      );

      act(() => vi.advanceTimersByTime(500));

      // Value should be an integer
      expect(Number.isInteger(result.current.value)).toBe(true);
    });

    it('should format with thousand separators', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(12500, { duration: 1000, formatOptions: { useGrouping: true } })
      );

      act(() => vi.advanceTimersByTime(1000));

      expect(result.current.formattedValue).toBe('12,500');
    });

    it('should support custom format function', async () => {
      const customFormat = (value: number) => `$${value.toFixed(2)}`;

      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000, format: customFormat })
      );

      act(() => vi.advanceTimersByTime(1000));

      expect(result.current.formattedValue).toBe('$100.00');
    });
  });

  describe('Performance', () => {
    it('should use requestAnimationFrame', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });

    it('should cancel animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = renderHook(() =>
        useAnimatedValue(100, { duration: 1000 })
      );

      unmount();

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });

    it('should handle very long durations', async () => {
      const { result } = renderHook(() =>
        useAnimatedValue(100, { duration: 60000 }) // 1 minute
      );

      act(() => vi.advanceTimersByTime(30000));

      expect(result.current.value).toBeGreaterThan(0);
      expect(result.current.value).toBeLessThan(100);
    });
  });
});
