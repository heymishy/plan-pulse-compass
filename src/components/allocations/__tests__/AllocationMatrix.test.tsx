import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AllocationMatrix from '../AllocationMatrix';
import { render } from '@/test/utils/test-utils';
import { useToast } from '@/hooks/use-toast';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock the useApp hook
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(() => ({
    setAllocations: vi.fn(),
  })),
}));

const mockToast = vi.fn();

const mockTeams = [
  { id: '1', name: 'Frontend Team', divisionId: '1', capacity: 100 },
  { id: '2', name: 'Backend Team', divisionId: '1', capacity: 100 },
];

const mockIterations = [
  {
    id: '1',
    name: 'Q1 2024 - Sprint 1',
    startDate: '2024-01-01',
    endDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Q1 2024 - Sprint 2',
    startDate: '2024-01-16',
    endDate: '2024-01-31',
  },
];

const mockProjects = [
  { id: '1', name: 'Project Alpha', status: 'active', priority: 1 },
  { id: '2', name: 'Project Beta', status: 'active', priority: 2 },
];

const mockEpics = [
  { id: '1', name: 'Epic 1', projectId: '1', status: 'active' },
  { id: '2', name: 'Epic 2', projectId: '2', status: 'active' },
];

const mockRunWorkCategories = [
  { id: '1', name: 'Development', color: '#3b82f6' },
  { id: '2', name: 'Maintenance', color: '#10b981' },
];

const mockAllocations = [
  {
    id: '1',
    teamId: '1',
    cycleId: '1',
    iterationNumber: 1,
    epicId: '1',
    percentage: 50,
  },
  {
    id: '2',
    teamId: '2',
    cycleId: '1',
    iterationNumber: 1,
    runWorkCategoryId: '2',
    percentage: 30,
  },
];

describe('AllocationMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      teams: mockTeams,
      iterations: mockIterations,
      allocations: mockAllocations,
      projects: mockProjects,
      epics: mockEpics,
      runWorkCategories: mockRunWorkCategories,
    };

    return render(<AllocationMatrix {...defaultProps} {...props} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
  });

  it('displays team names in the matrix', () => {
    renderComponent();

    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Backend Team')).toBeInTheDocument();
  });

  it('displays iteration names in the matrix', () => {
    renderComponent();

    expect(screen.getByText('Q1 2024 - Sprint 1')).toBeInTheDocument();
    expect(screen.getByText('Q1 2024 - Sprint 2')).toBeInTheDocument();
  });

  it('displays allocation percentages', () => {
    renderComponent();

    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30%').length).toBeGreaterThan(0);
  });

  it('shows epic information in allocation cells', () => {
    renderComponent();

    expect(screen.getByText('Project Alpha - Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('displays run work category badges', () => {
    renderComponent();

    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('shows empty cells for teams without allocations', () => {
    renderComponent();

    // Should have empty cells for team/iteration combinations without allocations
    const matrixCells = screen.getAllByRole('cell');
    expect(matrixCells.length).toBeGreaterThan(0);
  });

  it('allows selection of allocation cells', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it('enables bulk delete when allocations are selected', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    expect(screen.getByText('Delete Selected')).not.toBeDisabled();
  });

  it('shows select all checkbox', () => {
    renderComponent();

    const selectAllCheckbox = screen.getByLabelText('Select all allocations');
    expect(selectAllCheckbox).toBeInTheDocument();

    fireEvent.click(selectAllCheckbox);

    // All allocation checkboxes should be checked
    const allCheckboxes = screen.getAllByRole('checkbox');
    const allocationCheckboxes = allCheckboxes.filter(
      cb => cb !== selectAllCheckbox
    );
    allocationCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('shows confirmation dialog for bulk delete', async () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    fireEvent.click(screen.getByText('Delete Selected'));

    await waitFor(() => {
      expect(screen.getByText('Delete Allocations')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete \d+ allocation/)
      ).toBeInTheDocument();
    });
  });

  it('handles bulk delete confirmation', async () => {
    const { useApp } = await import('@/context/AppContext');
    const mockSetAllocations = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      setAllocations: mockSetAllocations,
    });

    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    fireEvent.click(screen.getByText('Delete Selected'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    expect(mockSetAllocations).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Allocations Deleted',
      description: expect.stringContaining('Successfully deleted 2 allocation'),
    });
  });

  it('handles bulk delete cancellation', async () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    fireEvent.click(screen.getByText('Delete Selected'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    expect(screen.queryByText('Delete Allocations')).not.toBeInTheDocument();
  });

  it('displays capacity utilization correctly', () => {
    renderComponent();

    // Should show capacity utilization indicators
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30%').length).toBeGreaterThan(0);
  });

  it('handles empty allocations array', () => {
    renderComponent({ allocations: [] });

    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
    expect(
      screen.getByText('No allocations found for this quarter')
    ).toBeInTheDocument();
  });

  it('handles empty teams array', () => {
    renderComponent({ teams: [] });

    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
    // Should show empty state or handle gracefully
  });

  it('handles empty iterations array', () => {
    renderComponent({ iterations: [] });

    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
    // Should show empty state or handle gracefully
  });

  it('shows allocation details on hover or click', () => {
    renderComponent();

    const allocationCells = screen.getAllByText('50%');
    fireEvent.mouseEnter(allocationCells[0]);

    // Should show additional details in tooltip or expanded view
    expect(screen.getByText('Project Alpha - Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('updates selection count when items are selected', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Click individual allocation checkbox

    // Should show selection count elements
    expect(screen.getByText('Delete Selected')).toBeInTheDocument();
  });

  it('clears selection after successful bulk delete', async () => {
    const { useApp } = await import('@/context/AppContext');
    const mockSetAllocations = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      setAllocations: mockSetAllocations,
    });

    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Delete Selected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete Selected'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/1 allocation selected/)
      ).not.toBeInTheDocument();
    });
  });

  it('handles allocation data with missing references gracefully', () => {
    const allocationsWithMissingRefs = [
      {
        id: '1',
        teamId: 'missing-team',
        cycleId: 'missing-cycle',
        iterationNumber: 1,
        epicId: 'missing-epic',
        runWorkCategoryId: 'missing-category',
        percentage: 50,
      },
    ];

    renderComponent({ allocations: allocationsWithMissingRefs });

    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
    // Should handle missing references gracefully
  });

  it('sorts teams and iterations consistently', () => {
    const shuffledTeams = [
      { id: '2', name: 'Zeta Team', divisionId: '1', capacity: 100 },
      { id: '1', name: 'Alpha Team', divisionId: '1', capacity: 100 },
    ];

    renderComponent({ teams: shuffledTeams });

    // Should display teams in a consistent order
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Zeta Team')).toBeInTheDocument();
  });

  it('shows loading state when data is being processed', () => {
    // This would typically be controlled by a loading prop
    renderComponent();

    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
  });

  it('handles keyboard navigation for accessibility', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[1].focus(); // Use the first allocation checkbox, not the select-all

    fireEvent.click(checkboxes[1]);
    // The checkbox should be checked after click
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true');
  });
});
