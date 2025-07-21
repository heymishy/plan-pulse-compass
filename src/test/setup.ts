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
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd') return 'Jan 01';
    if (formatStr === 'MMM yyyy') return 'Jan 2024';
    if (formatStr === 'yyyy-MM-dd') {
      if (date instanceof Date) {
        // Use local timezone instead of UTC to match the parse function
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return '2024-01-01';
    }
    return '2024-01-15';
  }),
  parse: vi.fn((dateString, formatStr, referenceDate) => {
    // Handle various date formats for testing
    try {
      // ISO format yyyy-MM-dd
      if (formatStr === 'yyyy-MM-dd') {
        const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-indexed
          const day = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[2]) < 1 || parseInt(match[2]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          // Return the corrected date (this mimics date-fns behavior)
          return date;
        }
      }

      // US format MM/dd/yyyy
      if (formatStr === 'MM/dd/yyyy') {
        const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const month = parseInt(match[1]) - 1; // JS months are 0-indexed
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[1]) < 1 || parseInt(match[1]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          return date;
        }
      }

      // UK format dd/MM/yyyy
      if (formatStr === 'dd/MM/yyyy') {
        const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-indexed
          const year = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[2]) < 1 || parseInt(match[2]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          return date;
        }
      }

      // Short US format M/d/yyyy
      if (formatStr === 'M/d/yyyy') {
        const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const month = parseInt(match[1]) - 1; // JS months are 0-indexed
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[1]) < 1 || parseInt(match[1]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          return date;
        }
      }

      // Dot format yyyy.MM.dd
      if (formatStr === 'yyyy.MM.dd') {
        const match = dateString.match(/(\d{4})\.(\d{2})\.(\d{2})/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-indexed
          const day = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[2]) < 1 || parseInt(match[2]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          return date;
        }
      }

      // Dash format dd-MM-yyyy
      if (formatStr === 'dd-MM-yyyy') {
        const match = dateString.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (match) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-indexed
          const year = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[2]) < 1 || parseInt(match[2]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          return date;
        }
      }

      // Slash ISO format yyyy/MM/dd
      if (formatStr === 'yyyy/MM/dd') {
        const match = dateString.match(/(\d{4})\/(\d{2})\/(\d{2})/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-indexed
          const day = parseInt(match[3]);

          // Reject invalid months (13, 14, etc.)
          if (parseInt(match[2]) < 1 || parseInt(match[2]) > 12)
            return new Date(NaN);

          // Create date (JS Date constructor will auto-correct invalid days)
          const date = new Date(year, month, day);

          return date;
        }
      }

      // Fallback - return invalid date
      return new Date(NaN);
    } catch (e) {
      return new Date(NaN);
    }
  }),
  parseISO: vi.fn(() => new Date('2024-01-15')),
  isValid: vi.fn(date => date instanceof Date && !isNaN(date.getTime())),
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
  isWithinInterval: vi.fn((date, interval) => {
    const d = new Date(date);
    const start = new Date(interval.start);
    const end = new Date(interval.end);
    return d >= start && d <= end;
  }),
  isBefore: vi.fn(() => false),
  isToday: vi.fn(() => false),
  eachDayOfInterval: vi.fn(() => [
    new Date('2024-01-01'),
    new Date('2024-01-02'),
  ]),
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

// Mock URL.createObjectURL for file downloads in tests while preserving URL constructor
const OriginalURL = global.URL;
Object.defineProperty(global, 'URL', {
  writable: true,
  value: class URL extends OriginalURL {
    static createObjectURL = vi.fn(() => 'mock-object-url');
    static revokeObjectURL = vi.fn();
  },
});

// Mock document.createElement for link download functionality
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'a') {
    const mockAnchor = originalCreateElement.call(document, 'a');
    mockAnchor.click = vi.fn();
    mockAnchor.remove = vi.fn();
    return mockAnchor;
  }
  return originalCreateElement.call(document, tagName);
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

// Mock PDF.js for OCR tests
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '/workers/pdf.worker.min.js',
  },
  getDocument: vi.fn(() =>
    Promise.resolve({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn(() =>
          Promise.resolve({
            getViewport: vi.fn(() => ({ width: 612, height: 792 })),
            render: vi.fn(() => ({
              promise: Promise.resolve(),
            })),
          })
        ),
      }),
    })
  ),
  version: '3.11.174',
}));

// Mock Tesseract.js for OCR tests
vi.mock('tesseract.js', () => ({
  default: {
    recognize: vi.fn(() =>
      Promise.resolve({
        data: {
          text: 'Mock OCR text extracted from document',
          confidence: 85,
        },
      })
    ),
    createWorker: vi.fn(() => ({
      loadLanguage: vi.fn(() => Promise.resolve()),
      initialize: vi.fn(() => Promise.resolve()),
      setParameters: vi.fn(() => Promise.resolve()),
      recognize: vi.fn(() =>
        Promise.resolve({
          data: {
            text: 'Mock OCR text extracted from document',
            confidence: 85,
          },
        })
      ),
      terminate: vi.fn(() => Promise.resolve()),
    })),
  },
}));

// Mock DOMMatrix for PDF.js canvas operations
global.DOMMatrix = vi.fn().mockImplementation(() => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
  is2D: true,
  isIdentity: true,
  translate: vi.fn().mockReturnThis(),
  scale: vi.fn().mockReturnThis(),
  rotate: vi.fn().mockReturnThis(),
  flipX: vi.fn().mockReturnThis(),
  flipY: vi.fn().mockReturnThis(),
  inverse: vi.fn().mockReturnThis(),
  toString: vi.fn(() => 'matrix(1, 0, 0, 1, 0, 0)'),
}));

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

// Enhanced cleanup for test isolation
import { cleanup } from '@testing-library/react';

// Cleanup after each test to prevent hanging and state pollution
afterEach(() => {
  // Clear all mocks and timers
  vi.clearAllMocks();
  vi.clearAllTimers();

  // Cleanup DOM elements created by React Testing Library
  cleanup();

  // Clear any remaining timers
  if (typeof window !== 'undefined') {
    window.clearTimeout = vi.fn();
    window.clearInterval = vi.fn();
  }

  // Reset localStorage to clean state
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }

  // Less aggressive DOM cleanup - only clear content, don't replace body
  if (typeof document !== 'undefined') {
    // Only clear innerHTML, preserve body element for subsequent tests in same file
    document.body.innerHTML = '';

    // Clear any lingering attributes or classes on document elements
    if (document.documentElement) {
      document.documentElement.className = '';
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-system-theme');
    }
  }
});

// Comprehensive cleanup between test files to prevent interference
afterAll(() => {
  // Restore all mocks to original state
  vi.restoreAllMocks();

  // Reset all modules to clean state
  vi.resetModules();

  // Clear all timers and use real timers
  vi.clearAllTimers();
  vi.useRealTimers();

  // Final DOM cleanup
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';

    // Reset document title
    document.title = '';

    // Clear any global CSS classes that might persist
    if (document.documentElement) {
      document.documentElement.className = '';
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-system-theme');
    }
  }

  // Clear localStorage completely
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }

  // Clear sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.clear();
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});
