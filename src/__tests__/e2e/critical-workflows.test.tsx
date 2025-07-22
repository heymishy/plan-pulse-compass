import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';
import { NoRouterProviders } from '@/test/utils/test-utils';

/**
 * End-to-End Critical Workflow Tests
 * Tests for GitHub Issue #34 - Critical workflow testing
 */
describe('Critical Workflow E2E Tests', () => {
  beforeEach(() => {
    // Reset any global state
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Application Load and Basic Functionality', () => {
    it('should load the application without crashing', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Verify the application loads
      await waitFor(() => {
        expect(
          screen.getAllByText('Plan Pulse Compass').length
        ).toBeGreaterThan(0);
      });
    });

    it('should render basic navigation structure', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Verify basic structure loads
      await waitFor(() => {
        expect(
          screen.getAllByText('Plan Pulse Compass').length
        ).toBeGreaterThan(0);
        // Check for search input which indicates navigation loaded
        const searchInput = screen.getByPlaceholderText(
          'Search navigation... (⌘K)'
        );
        expect(searchInput).toBeInTheDocument();
      });
    });
  });
});
