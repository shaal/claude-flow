/**
 * Vitest test setup file
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock requestAnimationFrame
let rafId = 0;
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation((callback: FrameRequestCallback) => {
    rafId++;
    setTimeout(() => callback(performance.now()), 16);
    return rafId;
  }),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation((id: number) => {
    // No-op for mock
  }),
});

// Mock SVG methods
if (typeof SVGElement !== 'undefined') {
  SVGElement.prototype.getTotalLength = vi.fn().mockReturnValue(100);
  SVGElement.prototype.getPointAtLength = vi.fn().mockReturnValue({ x: 0, y: 0 });
  SVGElement.prototype.getBBox = vi.fn().mockReturnValue({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
}

// Mock performance.now
if (typeof performance === 'undefined') {
  // @ts-expect-error - Mocking for test environment
  global.performance = {
    now: vi.fn().mockReturnValue(Date.now()),
  };
}

// Mock scroll behavior
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock Element.prototype.scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = vi.fn().mockImplementation((element: Element) => {
  return {
    ...originalGetComputedStyle(element),
    backgroundColor: 'rgb(255, 255, 255)',
    color: 'rgb(0, 0, 0)',
    getPropertyValue: (prop: string) => '',
  };
});

// Console mocking (suppress warnings in tests unless needed)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Suppress specific React warnings in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render') ||
      message.includes('Warning: An update to') ||
      message.includes('act(...)'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};
