import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectPriorityEditor from '../ProjectPriorityEditor';

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
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
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

    const prioritySelect = screen.getByDisplayValue('2');
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

    const priorityOrderInput = screen.getByDisplayValue('5');
    await user.clear(priorityOrderInput);
    await user.type(priorityOrderInput, '3');

    expect(mockOnPriorityOrderChange).toHaveBeenCalledWith(3);
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

    const priorityOrderInput = screen.getByDisplayValue('5');
    await user.clear(priorityOrderInput);
    await user.type(priorityOrderInput, '-2');

    // Should call with 1 (minimum valid value)
    expect(mockOnPriorityOrderChange).toHaveBeenCalledWith(1);
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

    const priorityOrderInput = screen.getByDisplayValue('5');
    await user.clear(priorityOrderInput);

    expect(mockOnPriorityOrderChange).toHaveBeenCalledWith(undefined);
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

    const priorityBadge = screen.getByText('1');
    expect(priorityBadge.parentElement).toHaveClass('bg-red-100');
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

    expect(
      screen.getByText(/priority level is a general classification/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/priority order provides fine-grained sorting/i)
    ).toBeInTheDocument();
  });
});
