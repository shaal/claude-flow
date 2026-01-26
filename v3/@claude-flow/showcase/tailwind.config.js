/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Color Palette from PRD Appendix A
      colors: {
        // Primary - Claude Blue
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Accent - Neural Green
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Status Colors
        status: {
          active: '#22c55e',
          idle: '#94a3b8',
          busy: '#f59e0b',
          error: '#ef4444',
          warning: '#eab308',
          info: '#3b82f6',
        },
        // Background - Dark Theme
        bg: {
          dark: '#0f172a',
          darker: '#020617',
          card: '#1e293b',
          'card-hover': '#334155',
          hover: '#334155',
          elevated: '#1e293b',
        },
        // Text Colors
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          muted: '#475569',
        },
        // Border Colors
        border: {
          DEFAULT: '#334155',
          subtle: '#1e293b',
          strong: '#475569',
          focus: '#3b82f6',
        },
      },
      // Typography from PRD
      fontFamily: {
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      // Font Sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      // Box Shadow with Glow Effects
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-accent': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-active': '0 0 15px rgba(34, 197, 94, 0.4)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.5)',
      },
      // Transitions
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
        'slower': '500ms',
      },
      // Z-Index Scale
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'fixed': '30',
        'overlay': '40',
        'modal': '50',
        'popover': '60',
        'tooltip': '70',
      },
      // Min Heights for Touch Targets (Accessibility)
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      // Custom Animations
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'dash': 'dash 1s linear infinite',
        'dash-slow': 'dash 2s linear infinite',
        'dash-reverse': 'dash-reverse 1s linear infinite',
        'flow': 'flow 3s ease-in-out infinite',
        'count': 'count 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.3s ease-out forwards',
        'expand': 'expand 0.3s ease-out forwards',
        'collapse': 'collapse 0.3s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        'glow-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 24px rgba(59, 130, 246, 0.5))' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'dash': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '24' },
        },
        'dash-reverse': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        'flow': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'count': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'expand': {
          from: { maxHeight: '0', opacity: '0' },
          to: { maxHeight: '500px', opacity: '1' },
        },
        'collapse': {
          from: { maxHeight: '500px', opacity: '1' },
          to: { maxHeight: '0', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(3deg)' },
          '75%': { transform: 'rotate(-3deg)' },
        },
      },
      // Responsive Breakpoints (Mobile-first)
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    // Custom plugin for animation delays
    function ({ addUtilities }) {
      addUtilities({
        '.animation-delay-100': { animationDelay: '100ms' },
        '.animation-delay-200': { animationDelay: '200ms' },
        '.animation-delay-300': { animationDelay: '300ms' },
        '.animation-delay-500': { animationDelay: '500ms' },
        '.animation-delay-700': { animationDelay: '700ms' },
        '.animation-delay-1000': { animationDelay: '1000ms' },
      });
    },
    // Custom plugin for glow effects
    function ({ addUtilities }) {
      addUtilities({
        '.glow-primary': {
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        },
        '.glow-accent': {
          boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
        },
        '.glow-active': {
          boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)',
        },
        '.text-gradient': {
          backgroundImage: 'linear-gradient(135deg, #60a5fa, #4ade80)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.glass': {
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
        },
      });
    },
    // Custom plugin for focus ring
    function ({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          outline: 'none',
        },
        '.focus-ring:focus-visible': {
          outline: '2px solid #3b82f6',
          outlineOffset: '2px',
          borderRadius: '0.375rem',
        },
      });
    },
  ],
  // Dark mode configuration
  darkMode: 'class',
};
