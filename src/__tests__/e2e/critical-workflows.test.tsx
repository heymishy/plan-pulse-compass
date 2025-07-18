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
    it('should complete full CSV import and allocation planning workflow', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Step 1: Navigate to allocations page
      await waitFor(() => {
        expect(screen.getByText('Plan Pulse Compass')).toBeInTheDocument();
      });

      // Navigate to allocations page - use a more flexible selector
      const allocationsLink = screen.getByText('Allocations');
      fireEvent.click(allocationsLink);

      // Step 2: Open CSV import dialog
      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      // Step 3: Upload CSV file
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();

        const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication,Project Epic,1,60,Q1 2024
Frontend Team,Bug Fixes,Run Work,1,40,Q1 2024
Backend Team,User Authentication,Project Epic,1,80,Q1 2024
Backend Team,Maintenance,Run Work,1,20,Q1 2024`;

        const file = new File([csvContent], 'test-allocations.csv', {
          type: 'text/csv',
        });

        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Step 4: Review parsed data
      await waitFor(() => {
        expect(screen.getByText('Frontend Team')).toBeInTheDocument();
        expect(screen.getByText('User Authentication')).toBeInTheDocument();
        expect(screen.getByText('Backend Team')).toBeInTheDocument();
      });

      // Step 5: Import data
      await waitFor(() => {
        const importDataButton = screen.getByRole('button', {
          name: /import.*records/i,
        });
        fireEvent.click(importDataButton);
      });

      // Step 6: Verify import success (dialog closes automatically)
      await waitFor(() => {
        expect(
          screen.queryByText('Import Team Allocations')
        ).not.toBeInTheDocument();
      });

      // Step 7: Verify allocations appear in planning view
      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
      });
    });

    it('should handle CSV import validation errors gracefully', async () => {
      render(
        <NoRouterProviders>
          <App />
        </NoRouterProviders>
      );

      // Navigate to allocations page
      await waitFor(() => {
        const allocationsLink = screen.getByText('Allocations');
        fireEvent.click(allocationsLink);
      });

      // Open import dialog
      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      // Upload invalid CSV
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const invalidCsv = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Invalid Team,User Authentication,Project Epic,1,60,Q1 2024
Frontend Team,Invalid Epic,Project Epic,1,150,Q1 2024`;

        const file = new File([invalidCsv], 'invalid-allocations.csv', {
          type: 'text/csv',
        });

        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Verify error messages appear
      await waitFor(() => {
        expect(
          screen.getByText(/Team.*not found/i) ||
            screen.getByText(/Invalid.*150/i)
        ).toBeInTheDocument();
      });

      // Verify import button is disabled
      await waitFor(() => {
        const importButton = screen.getByRole('button', {
          name: /import.*records/i,
        });
        expect(importButton).toBeDisabled();
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
        const settingsLink = screen.getByText('Settings');
        fireEvent.click(settingsLink);
      });

      // Verify settings page loads
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
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
        const planningLink = screen.getByText('Planning');
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
        const planningLink = screen.getByText('Planning');
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
        const dashboardLink = screen.getByText('Dashboard');
        fireEvent.click(dashboardLink);
      });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Test navigation to Teams
      await waitFor(() => {
        const teamsLink = screen.getByText('Teams');
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
        expect(screen.getByText('Plan Pulse Compass')).toBeInTheDocument();
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
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('Planning')).toBeInTheDocument();
        expect(screen.getByText('Allocations')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });
});
