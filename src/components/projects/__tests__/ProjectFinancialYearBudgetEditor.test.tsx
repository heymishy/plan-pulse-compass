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

    // Check for input values using getAllByDisplayValue and check both exist
    const amountInputs = screen.getAllByRole('spinbutton');
    expect(amountInputs).toHaveLength(2);
    expect(amountInputs[0]).toHaveValue(100000);
    expect(amountInputs[1]).toHaveValue(50000);

    // Financial year dropdown should be present in the table
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
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

    const amountInputs = screen.getAllByRole('spinbutton');
    const firstAmountInput = amountInputs[0]; // Get first amount input

    // Simulate onChange event directly to avoid complex user interaction issues
    fireEvent.change(firstAmountInput, { target: { value: '120000' } });

    await waitFor(() => {
      expect(mockOnBudgetsChange).toHaveBeenLastCalledWith([
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

    const fySelect = screen.getByRole('combobox');
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
    expect(screen.getByText('$0')).toBeInTheDocument();
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

    expect(
      screen.getByRole('button', { name: /Migrate Legacy Budget/i })
    ).toBeInTheDocument();
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

    await user.click(
      screen.getByRole('button', { name: /Migrate Legacy Budget/i })
    );

    expect(mockOnBudgetsChange).toHaveBeenCalledWith([
      { financialYearId: 'fy-2024', amount: 75000 },
    ]);
  });

  it('should validate financial year selection uniqueness', async () => {
    const user = userEvent.setup();
    const duplicateBudgets = [
      { financialYearId: 'fy-2024', amount: 50000 },
      { financialYearId: '', amount: 60000 },
    ];

    render(
      <ProjectFinancialYearBudgetEditor
        budgets={duplicateBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    // The component prevents duplicate selection by filtering dropdown options
    // So let's test that the validation error appears when we try to force a duplicate
    // by directly testing the behavior that already selected years don't appear in other dropdowns

    const fySelects = screen.getAllByRole('combobox');
    const secondSelect = fySelects[1]; // Get the second combobox (empty one)

    // Click the select to open it
    await user.click(secondSelect);

    // Wait for the dropdown to open
    await waitFor(() => {
      // Should see other FY options like 2025, 2026, etc. but NOT 2024
      expect(screen.getByText('FY 2025')).toBeInTheDocument();
    });

    // Verify that FY 2024 (which is already selected in first row) doesn't appear as an option
    // This confirms the validation works by preventing duplicates in the UI
    const fy2024Options = screen.queryAllByText('FY 2024');
    // Should only find the one that's already selected in the first row, not in dropdown
    expect(fy2024Options.length).toBeLessThanOrEqual(1);
  });

  it('should handle invalid budget amounts gracefully', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFinancialYearBudgetEditor
        budgets={mockFinancialYearBudgets}
        onBudgetsChange={mockOnBudgetsChange}
      />
    );

    const amountInputs = screen.getAllByRole('spinbutton');
    const firstAmountInput = amountInputs[0];

    // Simulate onChange event directly to avoid complex user interaction issues
    fireEvent.change(firstAmountInput, { target: { value: '-500' } });

    await waitFor(() => {
      expect(mockOnBudgetsChange).toHaveBeenLastCalledWith([
        { financialYearId: 'fy-2024', amount: 0 }, // Should convert negative to 0
        { financialYearId: 'fy-2025', amount: 50000 },
      ]);
    });
  });
});
