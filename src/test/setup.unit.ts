import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Unit test setup - focused on component isolation
 * Minimal mocking for pure unit testing
 */

// Mock external dependencies that aren't part of unit testing
vi.mock('@/utils/crypto');
vi.mock('tesseract.js');
vi.mock('pdfjs-dist');
vi.mock('pptx2json');

// Essential browser API mocks for React components
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

// Mock localStorage for components that use it
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

// Simplified date handling for unit tests
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 01, 2024'),
  parse: vi.fn(() => new Date('2024-01-01')),
  isValid: vi.fn(() => true),
  addDays: vi.fn(
    (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  ),
  differenceInDays: vi.fn(() => 1),
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
