import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  ProjectCommandCenterModal,
  ProjectCommandCenterModalProps,
} from '../ProjectCommandCenterModal';
import { Project, Epic, Milestone, Team, Person } from '@/types';
import { calculateProjectCost } from '@/utils/financialCalculations';

// Mock the required contexts and utilities
const mockUseApp = {
  projects: [],
  epics: [],
  milestones: [],
  teams: [] as Team[],
  people: [] as Person[],
  updateProject: vi.fn(),
  addEpic: vi.fn(),
  updateEpic: vi.fn(),
  deleteEpic: vi.fn(),
  addMilestone: vi.fn(),
  updateMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
  allocations: [],
  cycles: [],
};

const mockUseToast = {
  toast: vi.fn(),
};

// Mock all the external dependencies
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => mockUseToast,
}));

vi.mock('@/utils/financialCalculations', () => ({
  calculateProjectCost: vi.fn(() => ({
    totalCost: 500000,
    breakdown: [],
    teamBreakdown: [],
    monthlyBurnRate: 25000,
    totalDurationInDays: 365,
  })),
}));

vi.mock('@/utils/calculateProjectedEndDate', () => ({
  calculateProjectedEndDate: () => new Date('2024-12-31'),
}));

vi.mock('@/utils/projectBudgetUtils', () => ({
  calculateProjectTotalBudget: () => 600000,
}));

describe.skip('ProjectCommandCenterModal Currency Formatting', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project description',
    status: 'in-progress',
    priority: 'high',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 550000,
    divisionId: 'dev',
    managerId: 'manager-1',
    teamIds: ['team-1'],
    epicIds: ['epic-1'],
    milestoneIds: ['milestone-1'],
    dependsOn: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
    financialYearBudgets: [
      { financialYearId: 'fy-2024', amount: 300000 },
      { financialYearId: 'fy-2025', amount: 250000 },
    ],
  };

  const defaultProps: ProjectCommandCenterModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    project: mockProject,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the financial calculations mock to default values
    const mockCalc = vi.mocked(calculateProjectCost);
    mockCalc.mockImplementation(() => ({
      totalCost: 500000,
      breakdown: [],
      teamBreakdown: [],
      monthlyBurnRate: 25000,
      totalDurationInDays: 365,
    }));
  });

  describe('overview tab currency formatting', () => {
    it('should display estimated cost with proper comma formatting', () => {
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Should show estimated cost with commas
      expect(screen.getByText('$500,000')).toBeInTheDocument();
    });

    it('should display monthly burn rate with proper comma formatting', () => {
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Should show monthly burn rate with commas
      expect(screen.getByText('$25,000')).toBeInTheDocument();
    });

    it('should display budget variance with proper comma formatting', () => {
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Budget is $600,000, cost is $500,000, so variance should be $100,000
      expect(screen.getByText('$100,000')).toBeInTheDocument();
    });
  });

  describe('financials tab currency formatting', () => {
    it('should display total estimated cost in financials tab with commas', async () => {
      const user = userEvent.setup();
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Switch to financials tab
      const financialsTab = screen.getByTestId('financials-tab');
      await user.click(financialsTab);

      // Wait for tab content to load
      await waitFor(() => {
        expect(screen.getByText('Cost Summary')).toBeInTheDocument();
      });

      // Should show total estimated cost with commas in financials tab
      expect(screen.getByText('$500,000')).toBeInTheDocument();
    });

    it('should display monthly burn rate in financials tab with commas', async () => {
      const user = userEvent.setup();
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Switch to financials tab
      const financialsTab = screen.getByTestId('financials-tab');
      await user.click(financialsTab);

      // Wait for tab content to load
      await waitFor(() => {
        expect(screen.getByText('Cost Summary')).toBeInTheDocument();
      });

      // Should show monthly burn rate with commas in financials tab
      expect(screen.getByText('$25,000')).toBeInTheDocument();
    });

    it('should display budget variance in financials tab with proper formatting', async () => {
      const user = userEvent.setup();
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Switch to financials tab
      const financialsTab = screen.getByTestId('financials-tab');
      await user.click(financialsTab);

      // Wait for tab content to load
      await waitFor(() => {
        expect(screen.getByText('Budget Analysis')).toBeInTheDocument();
      });

      // Should show budget variance with commas - this will be in the remaining budget field
      const remainingBudgetElements = screen.getAllByText(/\$100,000/);
      expect(remainingBudgetElements.length).toBeGreaterThan(0);
    });

    it('should handle different currency amounts correctly', async () => {
      const testAmounts = [
        { totalCost: 1000, monthlyBurnRate: 83, expected: '$1,000' },
        { totalCost: 15000, monthlyBurnRate: 1250, expected: '$15,000' },
        { totalCost: 250000, monthlyBurnRate: 20833, expected: '$250,000' },
      ];

      for (const { totalCost, monthlyBurnRate, expected } of testAmounts) {
        // Reset and configure the mock for this test case
        const mockCalc = vi.mocked(calculateProjectCost);
        mockCalc.mockImplementation(() => ({
          totalCost,
          breakdown: [],
          teamBreakdown: [],
          monthlyBurnRate,
          totalDurationInDays: 365,
        }));

        const user = userEvent.setup();
        const { unmount } = render(
          <ProjectCommandCenterModal {...defaultProps} />
        );

        // Switch to financials tab to see the currency formatting
        const financialsTab = screen.getByTestId('financials-tab');
        await user.click(financialsTab);

        // Wait for tab content to load
        await waitFor(() => {
          expect(screen.getByText('Cost Summary')).toBeInTheDocument();
        });

        // Check that the expected currency amount appears in the DOM
        // Use a more flexible matcher that can find the text anywhere
        const elementsWithAmount = screen.getAllByText((content, element) => {
          return (
            content.includes(expected) ||
            element?.textContent?.includes(expected)
          );
        });

        expect(elementsWithAmount.length).toBeGreaterThan(0);

        // Clean up for next iteration
        unmount();
      }
    });
  });

  describe('budget input field', () => {
    it('should display currency symbol in budget input field', () => {
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Should show $ symbol in budget input
      const budgetSection = screen.getByLabelText('Budget').closest('div');
      expect(budgetSection).toBeInTheDocument();
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('should handle budget input changes correctly', () => {
      render(<ProjectCommandCenterModal {...defaultProps} />);

      const budgetInput = screen.getByTestId(
        'project-budget'
      ) as HTMLInputElement;
      expect(budgetInput.value).toBe('550000');

      // Budget input should be a number type
      expect(budgetInput.type).toBe('number');
    });
  });

  describe('financial year budget integration', () => {
    it('should integrate properly with ProjectFinancialYearBudgetEditor', async () => {
      const user = userEvent.setup();
      render(<ProjectCommandCenterModal {...defaultProps} />);

      // Verify we're on the overview tab initially
      expect(screen.getByTestId('overview-tab')).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Switch to financials tab
      const financialsTab = screen.getByTestId('financials-tab');
      await user.click(financialsTab);

      // Wait for tab switch and check that the financials tab is now active
      await waitFor(() => {
        expect(financialsTab).toHaveAttribute('aria-selected', 'true');
      });

      // Should show the tab content with financial data
      expect(screen.getByText('Cost Summary')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero amounts correctly', () => {
      const mockCalculateProjectCost = vi.fn().mockReturnValue({
        totalCost: 0,
        breakdown: [],
        teamBreakdown: [],
        monthlyBurnRate: 0,
        totalDurationInDays: 0,
      });

      vi.doMock('@/utils/financialCalculations', () => ({
        calculateProjectCost: mockCalculateProjectCost,
      }));

      render(<ProjectCommandCenterModal {...defaultProps} />);

      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('should handle very large amounts correctly', () => {
      const mockCalculateProjectCost = vi.fn().mockReturnValue({
        totalCost: 999999999,
        breakdown: [],
        teamBreakdown: [],
        monthlyBurnRate: 83333333,
        totalDurationInDays: 365,
      });

      vi.doMock('@/utils/financialCalculations', () => ({
        calculateProjectCost: mockCalculateProjectCost,
      }));

      render(<ProjectCommandCenterModal {...defaultProps} />);

      expect(screen.getByText('$999,999,999')).toBeInTheDocument();
      expect(screen.getByText('$83,333,333')).toBeInTheDocument();
    });
  });
});
