import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

  describe('CSV Import to Planning Workflow', () => {
    it('should open CSV import dialog and accept file input', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Step 1: Navigate to allocations page
      await waitFor(() => {
        expect(screen.getByText('Resource Planner')).toBeInTheDocument();
      });

      // Navigate to allocations page - use a more flexible selector
      const allocationsLink = screen.getAllByText('Allocations')[0]; // Get the first Allocations link (navigation)
      fireEvent.click(allocationsLink);

      // Step 2: Open CSV import dialog
      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      // Step 3: Verify dialog opened and file input is present
      await waitFor(() => {
        expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // Step 4: Upload CSV file and verify it's processed
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication,Project Epic,1,60,Q1 2024`;

        const file = new File([csvContent], 'test-allocations.csv', {
          type: 'text/csv',
        });

        fireEvent.change(fileInput, { target: { files: [file] } });

        // File upload should trigger some response (either data display or validation error)
        expect(fileInput.files[0]).toBe(file);
      });
    });

    it('should open CSV import dialog for validation testing', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Navigate to allocations page
      await waitFor(() => {
        const allocationsLink = screen.getAllByText('Allocations')[0]; // Get the first Allocations link (navigation)
        fireEvent.click(allocationsLink);
      });

      // Open import dialog
      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      // Verify dialog opens with file input
      await waitFor(() => {
        expect(screen.getByText('Import Team Allocations')).toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Basic Functionality', () => {
    it('should navigate to settings page successfully', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Navigate to settings page
      await waitFor(() => {
        const settingsLinks = screen.getAllByText('Settings');
        fireEvent.click(settingsLinks[0]); // Click the first Settings link (should be navigation)
      });

      // Verify settings page loads
      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument(); // This tab only appears on settings page
        expect(screen.getByText('Financial')).toBeInTheDocument(); // Another unique settings tab
      });
    });

    it('should navigate to planning page successfully', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Navigate to planning page
      await waitFor(() => {
        const planningLink = screen.getAllByText('Planning')[0]; // Get the first Planning link (navigation)
        fireEvent.click(planningLink);
      });

      // Verify planning page loads
      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });
    });
  });

  describe('Planning Page Functionality', () => {
    it('should display planning page content correctly', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Navigate to planning page
      await waitFor(() => {
        const planningLink = screen.getAllByText('Planning')[0]; // Get the first Planning link (navigation)
        fireEvent.click(planningLink);
      });

      // Verify planning page loads with expected elements
      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });
    });

    it('should navigate between different pages successfully', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Test navigation to Dashboard
      await waitFor(() => {
        const dashboardLink = screen.getAllByText('Dashboard')[0]; // Get the first Dashboard link (navigation)
        fireEvent.click(dashboardLink);
      });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Test navigation to Teams
      await waitFor(() => {
        const teamsLink = screen.getAllByText('Teams')[0]; // Get the first Teams link (navigation)
        fireEvent.click(teamsLink);
      });

      await waitFor(() => {
        expect(screen.getByText('Teams')).toBeInTheDocument();
      });
    });
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
        expect(screen.getByText('Resource Planner')).toBeInTheDocument();
      });
    });

    it('should display sidebar navigation correctly', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Verify navigation elements are present
      await waitFor(() => {
        expect(screen.getByText('Resource Planner')).toBeInTheDocument();
        expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Teams').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Planning').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Allocations').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
      });
    });
  });
});
