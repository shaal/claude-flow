/**
 * Hooks - Public API
 *
 * Custom React hooks for the Claude Flow Visual Showcase.
 */

export {
  useD3Simulation,
  useGenericD3Simulation,
  type UseD3SimulationReturn,
} from './useD3Simulation';

export {
  useAnimatedValue,
  useAnimatedValueAdvanced,
  useAnimatedCounter,
  useAnimatedValues,
  easings,
  type UseAnimatedValueOptions,
  type UseAnimatedValueReturn,
} from './useAnimatedValue';

export {
  useResponsiveLayout,
  useMediaQuery,
  useReducedMotion,
  useColorScheme,
  BREAKPOINTS,
  type Breakpoints,
  type UseResponsiveLayoutOptions,
  type UseResponsiveLayoutReturn,
} from './useResponsiveLayout';
