import '@testing-library/jest-dom';
import { afterEach, afterAll, vi } from 'vitest';

/**
 * Performance-optimized test setup
 * Minimal mocking for maximum speed
 */

// Essential crypto mock (lightweight)
vi.mock('@/utils/crypto', () => ({
  deriveKey: vi.fn().mockResolvedValue('mock-key'),
  encryptData: vi
    .fn()
    .mockResolvedValue({ iv: 'mock-iv', encrypted: 'mock-data' }),
  decryptData: vi.fn().mockResolvedValue('mock-decrypted'),
}));

// Minimal date-fns mock (only essential functions)
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd') return 'Jan 01';
    if (formatStr === 'MMM yyyy') return 'Jan 2024';
    if (formatStr === 'yyyy-MM-dd') return '2024-01-01';
    return '2024-01-15';
  }),
  parse: vi.fn(() => new Date('2024-01-15')),
  parseISO: vi.fn(() => new Date('2024-01-15')),
  isValid: vi.fn(() => true),
  addDays: vi.fn(
    (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  ),
  addWeeks: vi.fn(
    (date, weeks) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
  ),
  addMonths: vi.fn((date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  }),
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

// Minimal localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.setPrototypeOf(localStorageMock, Storage.prototype);
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Essential browser API mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
});

// Performance-optimized Date mock
const originalDate = Date;
Date.now = vi.fn(() => new Date('2024-01-15T00:00:00.000Z').getTime());

// Minimal performance mock
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  },
});

// Essential cleanup only
import { cleanup } from '@testing-library/react';

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

afterAll(() => {
  vi.restoreAllMocks();
});
