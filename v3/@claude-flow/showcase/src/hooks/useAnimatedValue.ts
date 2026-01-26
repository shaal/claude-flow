/**
 * useAnimatedValue - Animated Counter Hook
 *
 * Animates a numeric value from 0 (or a start value) to a target value
 * with configurable duration and easing functions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EasingFunction } from '../types';

/**
 * Easing function implementations
 */
export const easings: Record<EasingFunction | string, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const scaledTime = t * 2 - 1;
    if (scaledTime < 0) {
      return (
        -0.5 *
        Math.pow(2, 10 * scaledTime) *
        Math.sin((scaledTime - 0.1) * 5 * Math.PI)
      );
    }
    return (
      0.5 *
        Math.pow(2, -10 * scaledTime) *
        Math.sin((scaledTime - 0.1) * 5 * Math.PI) +
      1
    );
  },
  spring: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// Animation configuration is defined inline where needed

/**
 * Hook options for useAnimatedValue
 */
export interface UseAnimatedValueOptions {
  /** Start value (default: 0) */
  from?: number;
  /** Target value to animate to */
  to: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before starting animation */
  delay?: number;
  /** Easing function name or custom function */
  easing?: EasingFunction | ((t: number) => number);
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback on each frame with current value */
  onUpdate?: (value: number) => void;
  /** Number of times to repeat (0 = no repeat, -1 = infinite) */
  repeat?: number;
  /** Whether to alternate direction on repeat */
  yoyo?: boolean;
  /** Whether to start animation immediately */
  autoStart?: boolean;
}

/**
 * Hook return type
 */
export interface UseAnimatedValueReturn {
  /** Current animated value */
  value: number;
  /** Formatted string value */
  displayValue: string;
  /** Start or restart the animation */
  start: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Resume a paused animation */
  resume: () => void;
  /** Reset to start value */
  reset: () => void;
  /** Set new target value */
  setTarget: (target: number) => void;
  /** Whether animation is currently running */
  isAnimating: boolean;
  /** Progress from 0 to 1 */
  progress: number;
}

/**
 * Basic animated value hook (simplified API)
 */
export function useAnimatedValue({
  from = 0,
  to,
  duration = 1000,
  delay = 0,
  easing = easings.easeOutCubic,
  onComplete,
  onUpdate,
}: UseAnimatedValueOptions): number {
  const [value, setValue] = useState(from);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  // Get the easing function
  const easingFn = typeof easing === 'function' ? easing : easings[easing] || easings.easeOutCubic;

  useEffect(() => {
    const startAnimation = () => {
      const animate = (currentTime: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = currentTime;
        }

        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        const currentValue = from + (to - from) * easedProgress;

        setValue(currentValue);
        onUpdate?.(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;
    };
  }, [from, to, duration, delay, easingFn, onComplete, onUpdate]);

  return value;
}

/**
 * Enhanced animated value hook with full control
 */
export function useAnimatedValueAdvanced(
  targetValue: number,
  options: Omit<UseAnimatedValueOptions, 'to'> = {}
): UseAnimatedValueReturn {
  const {
    from: startValue = 0,
    duration = 1000,
    delay = 0,
    easing = 'easeOutCubic',
    onComplete,
    onUpdate,
    repeat = 0,
    yoyo = false,
    autoStart = true,
  } = options;

  const [value, setValue] = useState(startValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const targetRef = useRef(targetValue);
  const repeatCountRef = useRef(0);
  const directionRef = useRef<'forward' | 'backward'>('forward');

  const easingFn = typeof easing === 'function' ? easing : easings[easing] || easings.easeOutCubic;

  const formatValue = useCallback(
    (val: number): string => val.toFixed(0),
    []
  );

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(rawProgress);

      let currentValue: number;
      if (directionRef.current === 'forward') {
        currentValue = startValue + (targetRef.current - startValue) * easedProgress;
      } else {
        currentValue = targetRef.current - (targetRef.current - startValue) * easedProgress;
      }

      setValue(currentValue);
      setProgress(rawProgress);
      onUpdate?.(currentValue);

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (repeat > 0 && repeatCountRef.current < repeat) {
          repeatCountRef.current++;
          startTimeRef.current = 0;
          if (yoyo) {
            directionRef.current = directionRef.current === 'forward' ? 'backward' : 'forward';
          }
          animationRef.current = requestAnimationFrame(animate);
        } else if (repeat === -1) {
          startTimeRef.current = 0;
          if (yoyo) {
            directionRef.current = directionRef.current === 'forward' ? 'backward' : 'forward';
          }
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          onComplete?.();
        }
      }
    },
    [duration, easingFn, startValue, onUpdate, onComplete, repeat, yoyo]
  );

  const start = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setValue(startValue);
    setProgress(0);
    setIsAnimating(true);
    startTimeRef.current = 0;
    repeatCountRef.current = 0;
    directionRef.current = 'forward';

    if (delay > 0) {
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, delay);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate, delay, startValue]);

  const pause = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      pausedTimeRef.current = performance.now();
      setIsAnimating(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (!isAnimating && pausedTimeRef.current > 0) {
      const pauseDuration = performance.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
      setIsAnimating(true);
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate, isAnimating]);

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setValue(startValue);
    setProgress(0);
    setIsAnimating(false);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    repeatCountRef.current = 0;
    directionRef.current = 'forward';
  }, [startValue]);

  const setTarget = useCallback(
    (newTarget: number) => {
      targetRef.current = newTarget;
      if (autoStart) {
        start();
      }
    },
    [autoStart, start]
  );

  useEffect(() => {
    targetRef.current = targetValue;
  }, [targetValue]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoStart, start]);

  return {
    value,
    displayValue: formatValue(value),
    start,
    pause,
    resume,
    reset,
    setTarget,
    isAnimating,
    progress,
  };
}

/**
 * Hook for animated counter display
 */
export function useAnimatedCounter({
  to,
  duration = 2000,
  delay = 0,
  decimals = 0,
}: {
  to: number;
  duration?: number;
  delay?: number;
  decimals?: number;
}): string {
  const value = useAnimatedValue({ from: 0, to, duration, delay });
  return value.toFixed(decimals);
}

/**
 * Hook for animating multiple values simultaneously
 */
export function useAnimatedValues(
  targets: number[],
  options: Omit<UseAnimatedValueOptions, 'to'> = {}
): {
  values: number[];
  displayValues: string[];
  start: () => void;
  reset: () => void;
  isAnimating: boolean;
} {
  const [values, setValues] = useState<number[]>(
    targets.map(() => options.from ?? 0)
  );

  const {
    start,
    reset,
    isAnimating,
  } = useAnimatedValueAdvanced(1, {
    ...options,
    from: 0,
    onUpdate: (progress) => {
      const startValue = options.from ?? 0;
      setValues(targets.map((target) => startValue + (target - startValue) * progress));
    },
  });

  const displayValues = values.map((v) => v.toFixed(0));

  return {
    values,
    displayValues,
    start,
    reset,
    isAnimating,
  };
}

export default useAnimatedValue;
