/**
 * Animation Presets
 *
 * Framer Motion animation variants and presets for consistent animations.
 */

import type { Variants, Transition, TargetAndTransition } from 'framer-motion';

// ============================================
// Transition Presets
// ============================================

/**
 * Standard transition configurations
 */
export const transitions = {
  /** Fast transition for micro-interactions */
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,

  /** Normal transition for most animations */
  normal: {
    duration: 0.3,
    ease: 'easeInOut',
  } as Transition,

  /** Slow transition for emphasis */
  slow: {
    duration: 0.5,
    ease: 'easeInOut',
  } as Transition,

  /** Spring transition for bouncy effects */
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,

  /** Gentle spring for subtle effects */
  gentleSpring: {
    type: 'spring',
    stiffness: 150,
    damping: 15,
  } as Transition,

  /** Bouncy spring for playful effects */
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  } as Transition,

  /** Smooth tween */
  smooth: {
    type: 'tween',
    duration: 0.3,
    ease: 'easeOut',
  } as Transition,
} as const;

// ============================================
// Fade Animations
// ============================================

/**
 * Fade in/out animation variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

/**
 * Fade out animation
 */
export const fadeOut: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 0, transition: transitions.normal },
  exit: { opacity: 0 },
};

/**
 * Fade in with direction
 */
export const fadeInFrom = {
  up: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: transitions.normal },
    exit: { opacity: 0, y: -10, transition: transitions.fast },
  } as Variants,

  down: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: transitions.normal },
    exit: { opacity: 0, y: 10, transition: transitions.fast },
  } as Variants,

  left: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: transitions.normal },
    exit: { opacity: 0, x: -10, transition: transitions.fast },
  } as Variants,

  right: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: transitions.normal },
    exit: { opacity: 0, x: 10, transition: transitions.fast },
  } as Variants,
} as const;

// ============================================
// Slide Animations
// ============================================

/**
 * Slide variants
 */
export const slideVariants: Variants = {
  hiddenLeft: { x: -20, opacity: 0 },
  hiddenRight: { x: 20, opacity: 0 },
  hiddenUp: { y: -20, opacity: 0 },
  hiddenDown: { y: 20, opacity: 0 },
  visible: { x: 0, y: 0, opacity: 1 },
};

// ============================================
// Scale Animations
// ============================================

/**
 * Scale variants
 */
export const scaleVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

/**
 * Scale in animation
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.9, transition: transitions.fast },
};

/**
 * Pop animation (scale with overshoot)
 */
export const pop: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1, transition: transitions.bounce },
  exit: { opacity: 0, scale: 0.5, transition: transitions.fast },
};

// ============================================
// Stagger Animations
// ============================================

/**
 * Stagger children container
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Fast stagger container
 */
export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

/**
 * Stagger item
 */
export const staggerItemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: transitions.spring,
  },
};

// ============================================
// Node/Graph Animations
// ============================================

/**
 * Node variants for graph
 */
export const nodeVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  hover: {
    scale: 1.1,
    filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))',
  },
  selected: {
    scale: 1.15,
    filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.8))',
  },
  exit: { scale: 0, opacity: 0 },
};

/**
 * Node hover animation
 */
export const nodeHover: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.1, transition: transitions.fast },
  tap: { scale: 0.95, transition: transitions.fast },
  selected: { scale: 1.15, transition: transitions.spring },
};

/**
 * Node status animations
 */
export const nodeStatus = {
  active: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } as TargetAndTransition,

  idle: {
    opacity: 0.7,
    transition: transitions.normal,
  } as TargetAndTransition,

  busy: {
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } as TargetAndTransition,

  error: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
    },
  } as TargetAndTransition,
} as const;

// ============================================
// Connection/Edge Animations
// ============================================

/**
 * Connection line variants
 */
export const connectionVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1, ease: 'easeInOut' },
  },
  highlighted: {
    opacity: 1,
    stroke: '#22c55e',
    strokeWidth: 3,
  },
};

/**
 * Connection pulse animation
 */
export const connectionPulse = {
  flowingDash: {
    initial: { strokeDashoffset: 0 },
    animate: {
      strokeDashoffset: [0, -20],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  } as Variants,

  highlight: {
    initial: { opacity: 0.3 },
    animate: {
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,

  colorShift: {
    initial: { stroke: '#64748b' },
    animate: {
      stroke: ['#64748b', '#3b82f6', '#64748b'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,
} as const;

// ============================================
// Pulse Animations
// ============================================

/**
 * Pulse animation for active states
 */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Pulse animation
 */
export const pulseAnimation: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Ring pulse (for status indicators)
 */
export const ringPulse: Variants = {
  initial: { scale: 1, opacity: 0.6 },
  animate: {
    scale: [1, 1.5, 2],
    opacity: [0.6, 0.3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

// ============================================
// Highlight Animations
// ============================================

/**
 * Highlight glow effect
 */
export const highlightGlow: Variants = {
  initial: { filter: 'drop-shadow(0 0 0 rgba(59, 130, 246, 0))' },
  animate: {
    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))',
    transition: transitions.normal,
  },
  exit: {
    filter: 'drop-shadow(0 0 0 rgba(59, 130, 246, 0))',
    transition: transitions.fast,
  },
};

/**
 * Selection highlight
 */
export const selectionHighlight: Variants = {
  initial: { scale: 1, borderColor: 'transparent' },
  selected: {
    scale: 1.05,
    borderColor: '#3b82f6',
    transition: transitions.spring,
  },
  hover: { scale: 1.02, transition: transitions.fast },
};

// ============================================
// Panel/Card Animations
// ============================================

/**
 * Panel variants
 */
export const panelVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.spring,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: transitions.smooth,
  },
};

/**
 * Card hover effect
 */
export const cardVariants: Variants = {
  initial: { y: 0 },
  hover: {
    y: -4,
    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)',
    transition: transitions.spring,
  },
};

// ============================================
// Metric Animations
// ============================================

/**
 * Counter animation
 */
export const counterAnimation: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * Progress bar animation
 */
export const progressBar: Variants = {
  initial: { width: 0 },
  animate: (custom: number) => ({
    width: `${custom}%`,
    transition: { duration: 1, ease: 'easeOut' },
  }),
};

/**
 * Gauge fill animation
 */
export const gaugeFillVariants: Variants = {
  empty: { pathLength: 0 },
  filled: (progress: number) => ({
    pathLength: progress,
    transition: { duration: 1.5, ease: 'easeOut' },
  }),
};

/**
 * Gauge animation (rotation based)
 */
export const gauge: Variants = {
  initial: { rotate: -90 },
  animate: (custom: number) => ({
    rotate: -90 + (custom / 100) * 180,
    transition: { duration: 1.5, ease: 'easeOut' },
  }),
};

// ============================================
// View Transition Animations
// ============================================

/**
 * View transition
 */
export const viewTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: transitions.normal },
  exit: { opacity: 0, x: -20, transition: transitions.fast },
};

/**
 * Page transition
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Create a delayed animation variant
 */
export function withDelay(variant: Variants, delay: number): Variants {
  return {
    ...variant,
    animate: {
      ...(variant.animate as object),
      transition: {
        ...((variant.animate as { transition?: Transition })?.transition ?? {}),
        delay,
      },
    },
  };
}

/**
 * Create a custom duration variant
 */
export function withDuration(variant: Variants, duration: number): Variants {
  return {
    ...variant,
    animate: {
      ...(variant.animate as object),
      transition: {
        ...((variant.animate as { transition?: Transition })?.transition ?? {}),
        duration,
      },
    },
  };
}

/**
 * Combine multiple variants
 */
export function combineVariants(...variants: Variants[]): Variants {
  return variants.reduce(
    (acc, variant) => ({
      initial: { ...(acc.initial as object), ...(variant.initial as object) },
      animate: { ...(acc.animate as object), ...(variant.animate as object) },
      exit: { ...(acc.exit as object), ...(variant.exit as object) },
    }),
    { initial: {}, animate: {}, exit: {} }
  );
}
