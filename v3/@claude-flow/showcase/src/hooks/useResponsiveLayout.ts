/**
 * useResponsiveLayout - Responsive Breakpoint Hook
 *
 * Detects the current viewport breakpoint and provides
 * layout configuration based on screen size.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Breakpoint, BreakpointConfig } from '../types';

/**
 * Default breakpoint widths
 */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

/**
 * Breakpoints interface for boolean flags
 */
export interface Breakpoints {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  wide: boolean;
}

/**
 * Default breakpoint configurations
 */
const DEFAULT_CONFIGS: Record<Breakpoint, BreakpointConfig> = {
  mobile: {
    breakpoint: 'mobile',
    width: 640,
    columns: 1,
    padding: 16,
    fontSize: 14,
    nodeSize: 24,
    showLabels: false,
  },
  tablet: {
    breakpoint: 'tablet',
    width: 768,
    columns: 2,
    padding: 24,
    fontSize: 14,
    nodeSize: 32,
    showLabels: true,
  },
  desktop: {
    breakpoint: 'desktop',
    width: 1024,
    columns: 3,
    padding: 32,
    fontSize: 16,
    nodeSize: 40,
    showLabels: true,
  },
  wide: {
    breakpoint: 'wide',
    width: 1280,
    columns: 4,
    padding: 40,
    fontSize: 16,
    nodeSize: 48,
    showLabels: true,
  },
};

/**
 * Hook options
 */
export interface UseResponsiveLayoutOptions {
  /** Custom breakpoint widths */
  breakpoints?: Partial<Record<Breakpoint, number>>;
  /** Custom breakpoint configurations */
  configs?: Partial<Record<Breakpoint, Partial<BreakpointConfig>>>;
  /** Debounce delay for resize events (ms) */
  debounceDelay?: number;
  /** SSR fallback breakpoint */
  ssrFallback?: Breakpoint;
}

/**
 * Hook return type
 */
export interface UseResponsiveLayoutReturn {
  /** Current viewport width */
  width: number;
  /** Current viewport height */
  height: number;
  /** Current breakpoint name */
  breakpoint: Breakpoint;
  /** Breakpoint boolean flags */
  breakpoints: Breakpoints;
  /** Current breakpoint configuration */
  config: BreakpointConfig;
  /** Whether viewport is mobile size */
  mobile: boolean;
  /** Whether viewport is tablet size */
  tablet: boolean;
  /** Whether viewport is desktop size */
  desktop: boolean;
  /** Whether viewport is wide size */
  wide: boolean;
  /** Whether viewport is mobile or tablet */
  isMobileOrTablet: boolean;
  /** Whether viewport is at least tablet size */
  isAtLeastTablet: boolean;
  /** Whether viewport is at least desktop size */
  isAtLeastDesktop: boolean;
  /** Get container size accounting for sidebar */
  getContainerSize: (sidebarOpen: boolean) => { width: number; height: number };
  /** Check if current breakpoint matches */
  isBreakpoint: (bp: Breakpoint) => boolean;
  /** Check if current breakpoint is at least the specified one */
  isAtLeast: (bp: Breakpoint) => boolean;
  /** Get responsive value based on breakpoint */
  getResponsiveValue: <T>(values: Partial<Record<Breakpoint, T>>, fallback: T) => T;
}

/**
 * Get current breakpoint from width
 */
function getBreakpointFromWidth(
  width: number,
  breakpointValues: typeof BREAKPOINTS
): Breakpoint {
  if (width >= breakpointValues.wide) return 'wide';
  if (width >= breakpointValues.desktop) return 'desktop';
  if (width >= breakpointValues.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Responsive Layout Hook
 *
 * @param options - Hook configuration options
 * @returns Responsive layout information and utilities
 */
export function useResponsiveLayout(
  options: UseResponsiveLayoutOptions = {}
): UseResponsiveLayoutReturn {
  const {
    breakpoints: customBreakpoints,
    configs: customConfigs,
    debounceDelay: _debounceDelay,
    ssrFallback = 'desktop',
  } = options;

  // Merge breakpoints
  const breakpointValues = useMemo(
    () => ({ ...BREAKPOINTS, ...customBreakpoints }),
    [customBreakpoints]
  );

  // Merge configs
  const configs = useMemo(() => {
    const merged = { ...DEFAULT_CONFIGS };
    if (customConfigs) {
      (Object.keys(customConfigs) as Breakpoint[]).forEach((key) => {
        merged[key] = { ...merged[key], ...customConfigs[key] };
      });
    }
    return merged;
  }, [customConfigs]);

  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : breakpointValues[ssrFallback],
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [breakpointFlags, setBreakpointFlags] = useState<Breakpoints>({
    mobile: false,
    tablet: false,
    desktop: ssrFallback === 'desktop',
    wide: ssrFallback === 'wide',
  });

  const currentBreakpoint = useMemo(
    () => getBreakpointFromWidth(dimensions.width, breakpointValues),
    [dimensions.width, breakpointValues]
  );

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setDimensions({ width, height });
    setBreakpointFlags({
      mobile: width < breakpointValues.tablet,
      tablet: width >= breakpointValues.tablet && width < breakpointValues.desktop,
      desktop: width >= breakpointValues.desktop && width < breakpointValues.wide,
      wide: width >= breakpointValues.wide,
    });
  }, [breakpointValues]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateDimensions();

    const handleResize = () => {
      requestAnimationFrame(updateDimensions);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  const getContainerSize = useCallback(
    (sidebarOpen: boolean) => {
      const sidebarWidth = sidebarOpen ? 256 : 0;
      return {
        width: dimensions.width - sidebarWidth,
        height: dimensions.height - 64, // Header height
      };
    },
    [dimensions]
  );

  const isBreakpoint = useCallback(
    (bp: Breakpoint): boolean => currentBreakpoint === bp,
    [currentBreakpoint]
  );

  const isAtLeast = useCallback(
    (bp: Breakpoint): boolean => {
      const order: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
      const currentIndex = order.indexOf(currentBreakpoint);
      const targetIndex = order.indexOf(bp);
      return currentIndex >= targetIndex;
    },
    [currentBreakpoint]
  );

  const getResponsiveValue = useCallback(
    <T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
      const order: Breakpoint[] = ['wide', 'desktop', 'tablet', 'mobile'];

      for (const bp of order) {
        if (isAtLeast(bp) && values[bp] !== undefined) {
          return values[bp] as T;
        }
      }

      const reverseOrder: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
      for (const bp of reverseOrder) {
        if (values[bp] !== undefined) {
          return values[bp] as T;
        }
      }

      return fallback;
    },
    [isAtLeast]
  );

  return {
    width: dimensions.width,
    height: dimensions.height,
    breakpoint: currentBreakpoint,
    breakpoints: breakpointFlags,
    config: configs[currentBreakpoint],
    mobile: breakpointFlags.mobile,
    tablet: breakpointFlags.tablet,
    desktop: breakpointFlags.desktop,
    wide: breakpointFlags.wide,
    isMobileOrTablet: breakpointFlags.mobile || breakpointFlags.tablet,
    isAtLeastTablet: isAtLeast('tablet'),
    isAtLeastDesktop: isAtLeast('desktop'),
    getContainerSize,
    isBreakpoint,
    isAtLeast,
    getResponsiveValue,
  };
}

/**
 * Hook for detecting reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook for detecting color scheme preference
 */
export function useColorScheme(): 'light' | 'dark' {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return prefersDark ? 'dark' : 'light';
}

export default useResponsiveLayout;
