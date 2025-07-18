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
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Step 1: Navigate to allocations page
      await waitFor(() => {
        expect(screen.getByText('Plan Pulse Compass')).toBeInTheDocument();
      });

      // Navigate to allocations if not default page
      const allocationsLink = screen.queryByText('Allocations');
      if (allocationsLink) {
        fireEvent.click(allocationsLink);
      }

      // Step 2: Open CSV import dialog
      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      // Step 3: Upload CSV file
      await waitFor(() => {
        const fileInput = screen.getByLabelText('Choose CSV file');
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
        const importDataButton = screen.getByText('Import Data');
        fireEvent.click(importDataButton);
      });

      // Step 6: Verify import success
      await waitFor(() => {
        expect(screen.getByText('Import successful')).toBeInTheDocument();
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
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Navigate to allocations page
      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      // Upload invalid CSV
      await waitFor(() => {
        const fileInput = screen.getByLabelText('Choose CSV file');
        const invalidCsv = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Invalid Team,User Authentication,Project Epic,1,60,Q1 2024
Frontend Team,Invalid Epic,Project Epic,1,150,Q1 2024`;

        const file = new File([invalidCsv], 'invalid-allocations.csv', {
          type: 'text/csv',
        });

        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Verify error messages
      await waitFor(() => {
        expect(
          screen.getByText(/Team "Invalid Team" not found/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Invalid percentage 150/)).toBeInTheDocument();
      });

      // Verify import button is disabled
      await waitFor(() => {
        const importButton = screen.getByText('Import Data');
        expect(importButton).toBeDisabled();
      });
    });
  });

  describe('Quarter/Iteration Setup Workflow', () => {
    it('should complete quarter and iteration setup workflow', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Step 1: Navigate to settings/setup
      await waitFor(() => {
        const settingsLink = screen.getByText('Settings');
        fireEvent.click(settingsLink);
      });

      // Step 2: Open quarter setup
      await waitFor(() => {
        const quarterSetupButton = screen.getByText('Quarter Setup');
        fireEvent.click(quarterSetupButton);
      });

      // Step 3: Set financial year start
      await waitFor(() => {
        const fyStartInput = screen.getByLabelText('Financial Year Start');
        fireEvent.change(fyStartInput, { target: { value: '2024-01-01' } });
      });

      // Step 4: Generate standard quarters
      await waitFor(() => {
        const generateQuartersButton = screen.getByText(
          'Generate Standard Quarters'
        );
        fireEvent.click(generateQuartersButton);
      });

      // Step 5: Verify quarters created
      await waitFor(() => {
        expect(screen.getByText('Q1 2024')).toBeInTheDocument();
        expect(screen.getByText('Q2 2024')).toBeInTheDocument();
        expect(screen.getByText('Q3 2024')).toBeInTheDocument();
        expect(screen.getByText('Q4 2024')).toBeInTheDocument();
      });

      // Step 6: Set up iterations for Q1
      await waitFor(() => {
        const q1SetupButton = screen.getByText('Setup Iterations');
        fireEvent.click(q1SetupButton);
      });

      // Step 7: Select iteration length
      await waitFor(() => {
        const iterationLengthSelect = screen.getByLabelText('Iteration Length');
        fireEvent.change(iterationLengthSelect, {
          target: { value: 'fortnightly' },
        });
      });

      // Step 8: Generate iterations
      await waitFor(() => {
        const generateIterationsButton = screen.getByText(
          'Generate Iterations'
        );
        fireEvent.click(generateIterationsButton);
      });

      // Step 9: Verify iterations created
      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
        expect(screen.getByText('Sprint 2')).toBeInTheDocument();
        expect(screen.getByText('Sprint 3')).toBeInTheDocument();
      });

      // Step 10: Save configuration
      await waitFor(() => {
        const saveButton = screen.getByText('Save Configuration');
        fireEvent.click(saveButton);
      });

      // Step 11: Verify success message
      await waitFor(() => {
        expect(
          screen.getByText('Quarter and iteration setup completed successfully')
        ).toBeInTheDocument();
      });
    });

    it('should handle custom financial year configurations', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Navigate to quarter setup
      await waitFor(() => {
        const settingsLink = screen.getByText('Settings');
        fireEvent.click(settingsLink);
      });

      await waitFor(() => {
        const quarterSetupButton = screen.getByText('Quarter Setup');
        fireEvent.click(quarterSetupButton);
      });

      // Set custom financial year start (July 1st)
      await waitFor(() => {
        const fyStartInput = screen.getByLabelText('Financial Year Start');
        fireEvent.change(fyStartInput, { target: { value: '2024-07-01' } });
      });

      // Generate custom quarters
      await waitFor(() => {
        const generateQuartersButton = screen.getByText(
          'Generate Standard Quarters'
        );
        fireEvent.click(generateQuartersButton);
      });

      // Verify custom quarter dates
      await waitFor(() => {
        expect(screen.getByText('Q1 2024')).toBeInTheDocument();
        expect(
          screen.getByText('Jul 1, 2024 - Sep 30, 2024')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Planning Allocation Workflow', () => {
    it('should complete full planning allocation workflow', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Step 1: Navigate to planning page
      await waitFor(() => {
        const planningLink = screen.getByText('Planning');
        fireEvent.click(planningLink);
      });

      // Step 2: Select team for allocation
      await waitFor(() => {
        const teamSelect = screen.getByLabelText('Select Team');
        fireEvent.change(teamSelect, { target: { value: 'team-frontend' } });
      });

      // Step 3: Select quarter and iteration
      await waitFor(() => {
        const quarterSelect = screen.getByLabelText('Select Quarter');
        fireEvent.change(quarterSelect, { target: { value: 'q1-2024' } });
      });

      await waitFor(() => {
        const iterationSelect = screen.getByLabelText('Select Iteration');
        fireEvent.change(iterationSelect, { target: { value: 'sprint-1' } });
      });

      // Step 4: Add epic allocation
      await waitFor(() => {
        const addAllocationButton = screen.getByText('Add Allocation');
        fireEvent.click(addAllocationButton);
      });

      await waitFor(() => {
        const epicSelect = screen.getByLabelText('Select Epic');
        fireEvent.change(epicSelect, { target: { value: 'epic-auth' } });
      });

      await waitFor(() => {
        const percentageInput = screen.getByLabelText('Percentage');
        fireEvent.change(percentageInput, { target: { value: '70' } });
      });

      // Step 5: Add run work allocation
      await waitFor(() => {
        const addRunWorkButton = screen.getByText('Add Run Work');
        fireEvent.click(addRunWorkButton);
      });

      await waitFor(() => {
        const runWorkSelect = screen.getByLabelText('Select Run Work Category');
        fireEvent.change(runWorkSelect, { target: { value: 'run-bugs' } });
      });

      await waitFor(() => {
        const runWorkPercentageInput = screen.getByLabelText(
          'Run Work Percentage'
        );
        fireEvent.change(runWorkPercentageInput, { target: { value: '30' } });
      });

      // Step 6: Save allocations
      await waitFor(() => {
        const saveButton = screen.getByText('Save Allocations');
        fireEvent.click(saveButton);
      });

      // Step 7: Verify allocation summary
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument(); // Total allocation
        expect(screen.getByText('70%')).toBeInTheDocument(); // Epic allocation
        expect(screen.getByText('30%')).toBeInTheDocument(); // Run work allocation
      });

      // Step 8: Verify capacity utilization
      await waitFor(() => {
        expect(screen.getByText('Team Capacity: 100%')).toBeInTheDocument();
        expect(
          screen.getByText('Status: Perfectly Allocated')
        ).toBeInTheDocument();
      });
    });

    it('should detect and warn about over-allocation', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Navigate to planning page
      await waitFor(() => {
        const planningLink = screen.getByText('Planning');
        fireEvent.click(planningLink);
      });

      // Select team and iteration
      await waitFor(() => {
        const teamSelect = screen.getByLabelText('Select Team');
        fireEvent.change(teamSelect, { target: { value: 'team-frontend' } });
      });

      await waitFor(() => {
        const iterationSelect = screen.getByLabelText('Select Iteration');
        fireEvent.change(iterationSelect, { target: { value: 'sprint-1' } });
      });

      // Add over-allocation
      await waitFor(() => {
        const addAllocationButton = screen.getByText('Add Allocation');
        fireEvent.click(addAllocationButton);
      });

      await waitFor(() => {
        const percentageInput = screen.getByLabelText('Percentage');
        fireEvent.change(percentageInput, { target: { value: '120' } });
      });

      // Verify over-allocation warning
      await waitFor(() => {
        expect(
          screen.getByText('Warning: Over-allocation detected')
        ).toBeInTheDocument();
        expect(screen.getByText('Team Capacity: 120%')).toBeInTheDocument();
        expect(screen.getByText('Status: Over-allocated')).toBeInTheDocument();
      });

      // Verify recommendations
      await waitFor(() => {
        expect(
          screen.getByText('Recommendation: Reduce allocation by 20%')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Integration Workflow Testing', () => {
    it('should complete full workflow from setup to allocation planning', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Step 1: Initial setup - create teams
      await waitFor(() => {
        const setupLink = screen.getByText('Setup');
        fireEvent.click(setupLink);
      });

      await waitFor(() => {
        const addTeamButton = screen.getByText('Add Team');
        fireEvent.click(addTeamButton);
      });

      await waitFor(() => {
        const teamNameInput = screen.getByLabelText('Team Name');
        fireEvent.change(teamNameInput, { target: { value: 'Test Team' } });
      });

      await waitFor(() => {
        const capacityInput = screen.getByLabelText('Capacity');
        fireEvent.change(capacityInput, { target: { value: '160' } });
      });

      await waitFor(() => {
        const saveTeamButton = screen.getByText('Save Team');
        fireEvent.click(saveTeamButton);
      });

      // Step 2: Create epics
      await waitFor(() => {
        const addEpicButton = screen.getByText('Add Epic');
        fireEvent.click(addEpicButton);
      });

      await waitFor(() => {
        const epicNameInput = screen.getByLabelText('Epic Name');
        fireEvent.change(epicNameInput, { target: { value: 'Test Epic' } });
      });

      await waitFor(() => {
        const effortInput = screen.getByLabelText('Effort');
        fireEvent.change(effortInput, { target: { value: '55' } });
      });

      await waitFor(() => {
        const saveEpicButton = screen.getByText('Save Epic');
        fireEvent.click(saveEpicButton);
      });

      // Step 3: Setup quarters
      await waitFor(() => {
        const quarterSetupButton = screen.getByText('Quarter Setup');
        fireEvent.click(quarterSetupButton);
      });

      await waitFor(() => {
        const generateQuartersButton = screen.getByText(
          'Generate Standard Quarters'
        );
        fireEvent.click(generateQuartersButton);
      });

      // Step 4: Import allocations via CSV
      await waitFor(() => {
        const allocationsLink = screen.getByText('Allocations');
        fireEvent.click(allocationsLink);
      });

      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Test Team,Test Epic,Project Epic,1,80,Q1 2024
Test Team,Bug Fixes,Run Work,1,20,Q1 2024`;

      await waitFor(() => {
        const fileInput = screen.getByLabelText('Choose CSV file');
        const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const importDataButton = screen.getByText('Import Data');
        fireEvent.click(importDataButton);
      });

      // Step 5: Verify complete workflow
      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument();
        expect(screen.getByText('Test Epic')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
      });

      // Step 6: Navigate to dashboard and verify summary
      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard');
        fireEvent.click(dashboardLink);
      });

      await waitFor(() => {
        expect(screen.getByText('Teams: 1')).toBeInTheDocument();
        expect(screen.getByText('Epics: 1')).toBeInTheDocument();
        expect(screen.getByText('Allocations: 2')).toBeInTheDocument();
        expect(
          screen.getByText('Average Utilization: 100%')
        ).toBeInTheDocument();
      });
    });

    it('should handle workflow with data validation errors', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Try to import CSV without teams/epics setup
      await waitFor(() => {
        const allocationsLink = screen.getByText('Allocations');
        fireEvent.click(allocationsLink);
      });

      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Nonexistent Team,Nonexistent Epic,Project Epic,1,80,Q1 2024`;

      await waitFor(() => {
        const fileInput = screen.getByLabelText('Choose CSV file');
        const file = new File([csvContent], 'invalid.csv', {
          type: 'text/csv',
        });
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Verify validation errors
      await waitFor(() => {
        expect(
          screen.getByText(/Team "Nonexistent Team" not found/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Epic "Nonexistent Epic" not found/)
        ).toBeInTheDocument();
      });

      // Verify helpful suggestions
      await waitFor(() => {
        expect(
          screen.getByText('Setup teams and epics first')
        ).toBeInTheDocument();
        expect(screen.getByText('Go to Setup')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle large datasets without performance degradation', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Generate large CSV dataset
      const headerRow =
        'teamName,epicName,epicType,sprintNumber,percentage,quarter';
      const dataRows = Array.from(
        { length: 1000 },
        (_, i) =>
          `Team ${i % 10},Epic ${i % 20},Project Epic,${(i % 6) + 1},${25 + (i % 50)},Q1 2024`
      );
      const largeCsv = [headerRow, ...dataRows].join('\n');

      await waitFor(() => {
        const importButton = screen.getByText('Import Allocations');
        fireEvent.click(importButton);
      });

      const startTime = performance.now();

      await waitFor(() => {
        const fileInput = screen.getByLabelText('Choose CSV file');
        const file = new File([largeCsv], 'large.csv', { type: 'text/csv' });
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('1000 rows processed')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time
      expect(processingTime).toBeLessThan(10000); // 10 seconds
    });

    it('should maintain state consistency across navigation', async () => {
      render(
        <BrowserRouter>
          <NoRouterProviders>
            <App />
          </NoRouterProviders>
        </BrowserRouter>
      );

      // Create allocation
      await waitFor(() => {
        const planningLink = screen.getByText('Planning');
        fireEvent.click(planningLink);
      });

      await waitFor(() => {
        const addAllocationButton = screen.getByText('Add Allocation');
        fireEvent.click(addAllocationButton);
      });

      // Navigate away and back
      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard');
        fireEvent.click(dashboardLink);
      });

      await waitFor(() => {
        const planningLink = screen.getByText('Planning');
        fireEvent.click(planningLink);
      });

      // Verify state is maintained
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });
  });
});
