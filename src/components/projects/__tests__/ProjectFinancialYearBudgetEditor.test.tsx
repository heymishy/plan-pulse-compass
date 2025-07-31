import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFinancialYearBudget } from '@/types';
import ProjectFinancialYearBudgetEditor from '../ProjectFinancialYearBudgetEditor';

// Mock the useSettings hook
const mockConfig = {
  financialYear: {
    id: 'fy-2024',
    name: 'FY 2024',
    startDate: '2023-10-01',
    endDate: '2024-09-30',
    quarters: [],
  },
  currencySymbol: '$',
};

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    config: mockConfig,
  }),
}));

const mockFinancialYearBudgets: ProjectFinancialYearBudget[] = [
  { financialYearId: 'fy-2024', amount: 100000 },
  { financialYearId: 'fy-2025', amount: 50000 },
];

describe('ProjectFinancialYearBudgetEditor', () => {
  const mockOnBudgetsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render financial year budgets table', () => {
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    expect(screen.getByText('Financial Year Budgets')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
    // Financial year names appear in dropdown when opened
    expect(screen.getAllByText('Select Financial Year')).toHaveLength(2);
  });

  it('should calculate and display total budget', () => {
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    expect(screen.getByText('$150,000')).toBeInTheDocument();
    expect(screen.getByText('Total Budget:')).toBeInTheDocument();
  });

  it('should add new financial year budget', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    await user.click(screen.getByText('Add Financial Year'));

    expect(mockOnBudgetsChange).toHaveBeenCalledWith([
      ...mockFinancialYearBudgets,
      { financialYearId: '', amount: 0 },
    ]);
  });

  it('should update budget amount', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    const firstAmountInput = screen.getByDisplayValue('100000');
    await user.clear(firstAmountInput);
    await user.type(firstAmountInput, '120000');

    await waitFor(() => {
      expect(mockOnBudgetsChange).toHaveBeenCalledWith([
        { financialYearId: 'fy-2024', amount: 120000 },
        { financialYearId: 'fy-2025', amount: 50000 },
      ]);
    });
  });

  it('should update financial year selection', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={[{ financialYearId: '', amount: 50000 }]}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    const fySelect = screen.getByDisplayValue('Select Financial Year');
    await user.click(fySelect);

    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('FY 2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('FY 2024'));

    expect(mockOnBudgetsChange).toHaveBeenCalledWith([
      { financialYearId: 'fy-2024', amount: 50000 },
    ]);
  });

  it('should remove financial year budget', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    const removeButtons = screen.getAllByLabelText(/remove budget/i);
    await user.click(removeButtons[0]);

    expect(mockOnBudgetsChange).toHaveBeenCalledWith([
      { financialYearId: 'fy-2025', amount: 50000 },
    ]);
  });

  it('should handle empty budgets array', () => {
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={[]}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    expect(screen.getByText('Financial Year Budgets')).toBeInTheDocument();
    expect(screen.getByText('Total Budget: $0')).toBeInTheDocument();
    expect(screen.getByText('Add Financial Year')).toBeInTheDocument();
  });

  it('should show legacy budget migration option when available', () => {
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={[]}
        legacyBudget={75000}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    expect(screen.getByText(/Migrate legacy budget/i)).toBeInTheDocument();
    expect(screen.getByText(/\$75,000/)).toBeInTheDocument();
  });

  it('should migrate legacy budget to current financial year', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={[]}
        legacyBudget={75000}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    await user.click(screen.getByText(/Migrate Legacy Budget/i));

    expect(mockOnBudgetsChange).toHaveBeenCalledWith([
      { financialYearId: 'fy-2024', amount: 75000 },
    ]);
  });

  it('should validate financial year selection uniqueness', async () => {
    const user = userEvent.setup();
    const duplicateBudgets = [
      { financialYearId: '', amount: 50000 },
      { financialYearId: 'fy-2024', amount: 60000 },
    ];

    render(
      <ProjectFinancialYearBudgetEditor
        budgets={duplicateBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    const fySelect = screen.getByDisplayValue('Select Financial Year');
    await user.click(fySelect);

    await waitFor(() => {
      expect(screen.getByText('FY 2024')).toBeInTheDocument();
    });

    await user.click(screen.getByText('FY 2024'));

    // Should show validation error for duplicate selection
    expect(screen.getByText(/already has a budget/i)).toBeInTheDocument();
  });

  it('should handle invalid budget amounts gracefully', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    const firstAmountInput = screen.getByDisplayValue('100000');
    await user.clear(firstAmountInput);
    await user.type(firstAmountInput, '-500');

    await waitFor(() => {
      expect(mockOnBudgetsChange).toHaveBeenCalledWith([
        { financialYearId: 'fy-2024', amount: 0 }, // Should convert negative to 0
        { financialYearId: 'fy-2025', amount: 50000 },
      ]);
    });
  });
});
