import '@testing-library/jest-dom';
import { afterEach, afterAll, vi } from 'vitest';
// import { server } from "./mocks/server";

// Establish API mocking before all tests
// beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
// afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
// afterAll(() => server.close());

// Mock crypto operations to reduce resource usage in tests
vi.mock('@/utils/crypto', () => ({
  deriveKey: vi.fn().mockResolvedValue('mock-key'),
  encryptData: vi
    .fn()
    .mockResolvedValue({ iv: 'mock-iv', encrypted: 'mock-data' }),
  decryptData: vi.fn().mockResolvedValue('mock-decrypted'),
}));

// Simplified date-fns mock - only mock what's actually used
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024-01-15'),
  parseISO: vi.fn(() => new Date('2024-01-15')),
  isValid: vi.fn(() => true),
  addDays: vi.fn(
    (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  ),
  differenceInDays: vi.fn(() => 30),
  startOfWeek: vi.fn(() => new Date('2024-01-15')),
  endOfWeek: vi.fn(() => new Date('2024-01-21')),
  startOfMonth: vi.fn(() => new Date('2024-01-01')),
  endOfMonth: vi.fn(() => new Date('2024-01-31')),
  startOfToday: vi.fn(() => new Date('2024-01-15')),
  isWithinInterval: vi.fn(() => true),
  isBefore: vi.fn(() => false),
  isToday: vi.fn(() => false),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(callback => {
  setTimeout(callback, 0);
  return 1;
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = vi.fn();

// Mock pointer capture methods and scrollIntoView for JSDOM
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Reduce console noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels if needed
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Cleanup after each test to prevent hanging
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();

  // Clear any remaining timers
  if (typeof window !== 'undefined') {
    window.clearTimeout = vi.fn();
    window.clearInterval = vi.fn();
  }
});

// Final cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});
