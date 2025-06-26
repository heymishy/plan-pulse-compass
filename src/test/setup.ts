import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
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

// Mock date-fns to avoid date formatting errors
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024-01-15'),
  parseISO: vi.fn(() => new Date('2024-01-15')),
  isValid: vi.fn(() => true),
  addDays: vi.fn(
    (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  ),
  addWeeks: vi.fn(
    (date, weeks) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
  ),
  addMonths: vi.fn(
    (date, months) =>
      new Date(date.getTime() + months * 30 * 24 * 60 * 60 * 1000)
  ),
  differenceInDays: vi.fn(() => 30),
  differenceInWeeks: vi.fn(() => 4),
  differenceInMonths: vi.fn(() => 1),
  startOfWeek: vi.fn(date => new Date('2024-01-15')),
  endOfWeek: vi.fn(date => new Date('2024-01-21')),
  startOfMonth: vi.fn(date => new Date('2024-01-01')),
  endOfMonth: vi.fn(date => new Date('2024-01-31')),
  startOfToday: vi.fn(() => new Date('2024-01-15')),
  isWithinInterval: vi.fn(() => true),
  isBefore: vi.fn(() => false),
  isToday: vi.fn(() => false),
  isYesterday: vi.fn(() => false),
  isTomorrow: vi.fn(() => false),
}));

// Mock localStorage to avoid async operations
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
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
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
