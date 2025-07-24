import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Integration test setup
 * Provides realistic environment for testing component interactions
 */

// Mock external services and APIs
vi.mock('@/utils/crypto', () => ({
  deriveKey: vi.fn().mockResolvedValue('mock-key'),
  encryptData: vi
    .fn()
    .mockResolvedValue({ iv: 'mock-iv', encrypted: 'mock-data' }),
  decryptData: vi.fn().mockResolvedValue('mock-decrypted'),
}));

// Realistic date-fns mock for integration scenarios
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (!date) return '';
    const d = new Date(date);
    if (formatStr === 'MMM dd')
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    if (formatStr === 'MMM yyyy')
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (formatStr === 'yyyy-MM-dd') return d.toISOString().split('T')[0];
    return d.toLocaleDateString();
  }),
  parse: vi.fn((dateString, formatStr) => {
    try {
      return new Date(dateString);
    } catch {
      return new Date('2024-01-15');
    }
  }),
  parseISO: vi.fn(dateString => new Date(dateString)),
  isValid: vi.fn(date => date instanceof Date && !isNaN(date.getTime())),
  addDays: vi.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  addWeeks: vi.fn((date, weeks) => {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  }),
  addMonths: vi.fn((date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }),
  differenceInDays: vi.fn((dateLeft, dateRight) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor(
      (new Date(dateLeft).getTime() - new Date(dateRight).getTime()) / msPerDay
    );
  }),
  startOfWeek: vi.fn(date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day;
    return new Date(result.setDate(diff));
  }),
  endOfWeek: vi.fn(date => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + 6;
    return new Date(start.setDate(diff));
  }),
  startOfMonth: vi.fn(date => new Date(date.getFullYear(), date.getMonth(), 1)),
  endOfMonth: vi.fn(
    date => new Date(date.getFullYear(), date.getMonth() + 1, 0)
  ),
  isWithinInterval: vi.fn((date, interval) => {
    const d = new Date(date);
    return d >= new Date(interval.start) && d <= new Date(interval.end);
  }),
  isBefore: vi.fn(
    (date, dateToCompare) => new Date(date) < new Date(dateToCompare)
  ),
  isToday: vi.fn(date => {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  }),
}));

// Enhanced localStorage mock with realistic behavior
const createRealisticLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
      // Dispatch storage event for testing cross-component communication
      window.dispatchEvent(
        new StorageEvent('storage', { key, newValue: value })
      );
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
      window.dispatchEvent(
        new StorageEvent('storage', { key, newValue: null })
      );
    }),
    clear: vi.fn(() => {
      store.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    }),
    length: 0,
    key: vi.fn((index: number) => {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    }),
  };
};

Object.setPrototypeOf(createRealisticLocalStorage(), Storage.prototype);
Object.defineProperty(window, 'localStorage', {
  value: createRealisticLocalStorage(),
  writable: true,
});

// Enhanced browser API mocks
global.ResizeObserver = vi.fn().mockImplementation(callback => {
  const instance = {
    observe: vi.fn(element => {
      // Simulate resize observation
      setTimeout(() => {
        callback([
          {
            target: element,
            contentRect: { width: 1024, height: 768 },
          },
        ]);
      }, 0);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
  return instance;
});

global.IntersectionObserver = vi.fn().mockImplementation(callback => ({
  observe: vi.fn(element => {
    // Simulate intersection
    setTimeout(() => {
      callback([
        {
          target: element,
          isIntersecting: true,
          intersectionRatio: 1,
        },
      ]);
    }, 0);
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Enhanced matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => {
    const matches = query.includes('max-width: 768px') ? false : true;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

// Performance timing mock
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
  },
});

// Mock navigation for routing tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
  },
  writable: true,
});

// Setup and cleanup
beforeEach(() => {
  // Reset mocks but keep realistic behavior
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  // Clear localStorage between tests
  window.localStorage.clear();
});
