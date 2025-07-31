import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectPriorityEditor from '../ProjectPriorityEditor';

// Mock the SettingsContext
vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    config: {
      financialYear: {
        id: 'fy-2024',
        name: 'FY 2024',
        startDate: '2023-10-01',
        endDate: '2024-09-30',
        quarters: [],
      },
      currencySymbol: '$',
      // Don't provide priorityLevels to test default fallback
    },
    setupComplete: true,
    updateConfig: vi.fn(),
    setSetupComplete: vi.fn(),
  }),
}));

describe('ProjectPriorityEditor', () => {
  const mockOnPriorityChange = vi.fn();
  const mockOnPriorityOrderChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render priority and priority order fields', () => {
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={5}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    expect(screen.getByText('Project Priority')).toBeInTheDocument();
    expect(screen.getAllByText('Priority Order')).toHaveLength(2); // Label and help text
    // Priority shows as badge with value 2 in multiple places
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    // Check for priority order input with value 5 using a more specific selector
    const priorityOrderInput = screen.getByLabelText('Priority Order');
    expect(priorityOrderInput).toHaveValue(5);
  });

  it('should show priority level descriptions', () => {
    render(
      <ProjectPriorityEditor
        priority={1}
        priorityOrder={undefined}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it('should update priority value', async () => {
    const user = userEvent.setup();
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={undefined}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    const prioritySelect = screen.getByRole('combobox', {
      name: /priority level/i,
    });
    await user.click(prioritySelect);

    await waitFor(() => {
      expect(screen.getByText('Priority 1')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Priority 1'));

    expect(mockOnPriorityChange).toHaveBeenCalledWith(1);
  });

  it('should update priority order value', async () => {
    const user = userEvent.setup();
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={5}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    const priorityOrderInput = screen.getByLabelText('Priority Order');
    // Simulate onChange event directly to avoid complex user interaction issues
    fireEvent.change(priorityOrderInput, { target: { value: '3' } });

    expect(mockOnPriorityOrderChange).toHaveBeenLastCalledWith(3);
  });

  it('should show fallback behavior explanation when priority order is not set', () => {
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={undefined}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    expect(
      screen.getByText(/falls back to priority level/i)
    ).toBeInTheDocument();
  });

  it('should validate priority order as positive integer', async () => {
    const user = userEvent.setup();
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={5}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    const priorityOrderInput = screen.getByLabelText('Priority Order');
    // Simulate onChange event directly to avoid complex user interaction issues
    fireEvent.change(priorityOrderInput, { target: { value: '-2' } });

    // Should call with 1 (minimum valid value)
    expect(mockOnPriorityOrderChange).toHaveBeenLastCalledWith(1);
  });

  it('should handle empty priority order input', async () => {
    const user = userEvent.setup();
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={5}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    const priorityOrderInput = screen.getByLabelText('Priority Order');
    // Simulate onChange event directly to avoid complex user interaction issues
    fireEvent.change(priorityOrderInput, { target: { value: '' } });

    expect(mockOnPriorityOrderChange).toHaveBeenLastCalledWith(undefined);
  });

  it('should display priority badges with correct colors', () => {
    render(
      <ProjectPriorityEditor
        priority={1}
        priorityOrder={1}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    const priorityBadges = screen.getAllByText('1');
    // Get the main priority level badge (first one)
    const priorityBadge = priorityBadges[0];
    expect(priorityBadge).toHaveClass('bg-red-100');
  });

  it('should show help text explaining the difference between priority and priority order', () => {
    render(
      <ProjectPriorityEditor
        priority={2}
        priorityOrder={5}
        onPriorityChange={mockOnPriorityChange}
        onPriorityOrderChange={mockOnPriorityOrderChange}
      />
    );

    // Look for the help text by checking for both keywords separately
    expect(screen.getByText('Priority Level')).toBeInTheDocument();
    expect(screen.getByText('is a general classification')).toBeInTheDocument();
    expect(screen.getByText('Priority Order')).toBeInTheDocument();
    expect(
      screen.getByText('provides fine-grained sorting')
    ).toBeInTheDocument();
  });
});
