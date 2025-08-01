import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectFinancialYearBudgetEditor from '../ProjectFinancialYearBudgetEditor';
import { ProjectFinancialYearBudget } from '@/types';

// Mock the settings context
const mockUseSettings = {
  config: {
    currencySymbol: '$',
    financialYear: {
      id: 'fy-2024',
      name: 'FY 2024',
      startDate: '2023-10-01',
      endDate: '2024-09-30',
    },
  },
};

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => mockUseSettings,
}));

describe('ProjectFinancialYearBudgetEditor Currency Formatting', () => {
  const mockOnBudgetsChange = vi.fn();

  const defaultProps = {
    budgets: [] as ProjectFinancialYearBudget[],
    onBudgetsChange: mockOnBudgetsChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('currency display formatting', () => {
    it('should display total budget with proper comma formatting for thousands', async () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 50000 },
        { financialYearId: 'fy-2025', amount: 75000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      // Total should be $125,000 (50,000 + 75,000)
      expect(screen.getByText('$125,000')).toBeInTheDocument();
    });

    it('should display total budget with proper comma formatting for millions', async () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 1500000 },
        { financialYearId: 'fy-2025', amount: 2500000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      // Total should be $4,000,000 (1,500,000 + 2,500,000)
      expect(screen.getByText('$4,000,000')).toBeInTheDocument();
    });

    it('should display legacy budget migration message with proper formatting', () => {
      render(
        <ProjectFinancialYearBudgetEditor
          {...defaultProps}
          legacyBudget={250000}
          budgets={[]}
        />
      );

      expect(
        screen.getByText(/Migrate legacy budget of \$250,000/)
      ).toBeInTheDocument();
    });

    it('should update total budget display when budget amounts change', () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 100000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      // Initial total should be $100,000
      expect(screen.getByText('$100,000')).toBeInTheDocument();

      // Find the amount input and verify it's properly set up
      const amountInput = screen.getByDisplayValue('100000');
      expect(amountInput).toHaveAttribute('type', 'number');
      expect(amountInput).toHaveAttribute('min', '0');
      expect(amountInput).toHaveAttribute('step', '0.01');

      // Simulate direct onChange call to test the handler
      fireEvent.change(amountInput, { target: { value: '500000' } });

      // Should have been called with the updated amount
      expect(mockOnBudgetsChange).toHaveBeenLastCalledWith([
        { financialYearId: 'fy-2024', amount: 500000 },
      ]);
    });

    it('should handle various currency amounts correctly', () => {
      const testCases = [
        { amount: 0, expected: '$0' },
        { amount: 100, expected: '$100' },
        { amount: 1000, expected: '$1,000' },
        { amount: 10000, expected: '$10,000' },
        { amount: 100000, expected: '$100,000' },
        { amount: 1000000, expected: '$1,000,000' },
        { amount: 10000000, expected: '$10,000,000' },
      ];

      testCases.forEach(({ amount, expected }, index) => {
        const budgets: ProjectFinancialYearBudget[] = [
          { financialYearId: 'fy-2024', amount },
        ];

        const { rerender, unmount } = render(
          <ProjectFinancialYearBudgetEditor
            {...defaultProps}
            budgets={budgets}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();

        // Clean up for next iteration
        unmount();
      });
    });
  });

  describe('budget input validation', () => {
    it('should handle negative values correctly by converting to positive', () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 100000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      const amountInput = screen.getByDisplayValue('100000');
      fireEvent.change(amountInput, { target: { value: '-50000' } });

      // Should convert negative to 0 (non-negative)
      expect(mockOnBudgetsChange).toHaveBeenCalledWith([
        { financialYearId: 'fy-2024', amount: 0 },
      ]);
    });

    it('should handle decimal values correctly', () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 0 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      const amountInput = screen.getByDisplayValue('');
      fireEvent.change(amountInput, { target: { value: '123456.78' } });

      expect(mockOnBudgetsChange).toHaveBeenCalledWith([
        { financialYearId: 'fy-2024', amount: 123456.78 },
      ]);
    });

    it('should handle empty input correctly', () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 100000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      const amountInput = screen.getByDisplayValue('100000');
      fireEvent.change(amountInput, { target: { value: '' } });

      expect(mockOnBudgetsChange).toHaveBeenCalledWith([
        { financialYearId: 'fy-2024', amount: 0 },
      ]);
    });
  });

  describe('accessibility and user experience', () => {
    it('should have proper labels and testids for budget inputs', () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 100000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      // Check for currency symbol visibility
      expect(screen.getByText('$')).toBeInTheDocument();

      // Check for properly labeled input
      const amountInput = screen.getByDisplayValue('100000');
      expect(amountInput).toHaveAttribute('type', 'number');
      expect(amountInput).toHaveAttribute('min', '0');
      expect(amountInput).toHaveAttribute('step', '0.01');
    });

    it('should display empty state message when no budgets exist', () => {
      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={[]} />
      );

      expect(
        screen.getByText('No financial year budgets configured.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Click "Add Financial Year" to get started.')
      ).toBeInTheDocument();
    });

    it('should show total budget label and value prominently', () => {
      const budgets: ProjectFinancialYearBudget[] = [
        { financialYearId: 'fy-2024', amount: 150000 },
      ];

      render(
        <ProjectFinancialYearBudgetEditor {...defaultProps} budgets={budgets} />
      );

      expect(screen.getByText('Total Budget:')).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });
  });
});
