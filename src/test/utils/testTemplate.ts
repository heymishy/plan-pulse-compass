/**
 * Standardized Test Template for Consistent Test Isolation
 *
 * This template provides a standardized setup/teardown pattern that all test files
 * should follow to prevent test interference and ensure proper isolation.
 */

import { vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  resetAllContextMocks,
  setupStandardContextMocks,
} from './mockContextProviders';

/**
 * Standard test setup that should be called at the beginning of every test file
 *
 * @param customMocks - Custom mock overrides for specific test files
 * @returns Mock data objects for use in tests
 */
export const setupStandardTest = (
  customMocks: {
    appData?: any;
    themeData?: any;
    settingsData?: any;
    teamsData?: any;
    toastData?: any;
  } = {}
) => {
  // Set up comprehensive module reset before any tests run
  beforeAll(() => {
    // Reset all modules to ensure clean imports
    vi.resetModules();

    // Clear all mocks to prevent cross-file pollution
    vi.clearAllMocks();

    // Ensure real timers are used initially
    vi.useRealTimers();
  });

  // Set up fresh mocks before each test
  beforeEach(() => {
    // Reset all context mocks to clean state
    resetAllContextMocks();

    // Clear all timer mocks
    vi.clearAllTimers();

    // Ensure DOM is clean
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }

    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // Clean up after each test
  afterEach(() => {
    // Cleanup React Testing Library components
    cleanup();

    // Clear all mocks
    vi.clearAllMocks();

    // Clear all timers
    vi.clearAllTimers();

    // Reset DOM to clean state
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';

      // Reset any global CSS classes that might affect other tests
      if (document.documentElement) {
        document.documentElement.className = '';
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-system-theme');
      }
    }

    // Clear localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      if (window.localStorage) window.localStorage.clear();
      if (window.sessionStorage) window.sessionStorage.clear();
    }
  });

  // Final cleanup after all tests in the file
  afterAll(() => {
    // Restore all mocks to original implementations
    vi.restoreAllMocks();

    // Reset modules one final time
    vi.resetModules();

    // Use real timers
    vi.useRealTimers();

    // Final DOM cleanup
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
      document.title = '';

      if (document.documentElement) {
        document.documentElement.className = '';
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-system-theme');
      }
    }

    // Final storage cleanup
    if (typeof window !== 'undefined') {
      if (window.localStorage) window.localStorage.clear();
      if (window.sessionStorage) window.sessionStorage.clear();
    }
  });

  // Set up standardized context mocks
  return setupStandardContextMocks(customMocks);
};

/**
 * Standardized timeout values for consistent test behavior
 */
export const TEST_TIMEOUTS = {
  DEFAULT: 3000, // Standard timeout for most operations
  EXTENDED: 5000, // For complex async operations
  FORM_SUBMIT: 3000, // For form submissions
  API_CALL: 3000, // For API calls
  ANIMATION: 1000, // For animations and transitions
} as const;

/**
 * Standardized waitFor options to prevent timing issues
 */
export const WAIT_FOR_OPTIONS = {
  DEFAULT: { timeout: TEST_TIMEOUTS.DEFAULT },
  EXTENDED: { timeout: TEST_TIMEOUTS.EXTENDED },
  FORM_SUBMIT: { timeout: TEST_TIMEOUTS.FORM_SUBMIT },
  API_CALL: { timeout: TEST_TIMEOUTS.API_CALL },
  ANIMATION: { timeout: TEST_TIMEOUTS.ANIMATION },
} as const;

/**
 * Helper function for consistent async test operations
 *
 * @param operation - The async operation to perform
 * @param timeout - Optional timeout override
 */
export const performAsyncTest = async (
  operation: () => Promise<void>,
  timeout = TEST_TIMEOUTS.DEFAULT
) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Test operation timed out after ${timeout}ms`)),
      timeout
    );
  });

  return Promise.race([operation(), timeoutPromise]);
};

/**
 * Helper to ensure clean mock state for specific context
 */
export const resetSpecificContextMock = (
  contextName: string,
  mockImplementation: any
) => {
  vi.resetModules();
  vi.doMock(contextName, mockImplementation);
};

/**
 * Type-safe test wrapper that ensures proper setup/teardown
 */
export const createTestSuite = <T extends Record<string, any>>(
  suiteName: string,
  setupMocks: (customMocks?: any) => T,
  testDefinitions: (mocks: T) => void
) => {
  return (customMocks?: any) => {
    const mocks = setupStandardTest(customMocks);
    const additionalMocks = setupMocks(customMocks);
    const allMocks = { ...mocks, ...additionalMocks };

    describe(suiteName, () => {
      testDefinitions(allMocks);
    });
  };
};
