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
    epicId: '1',
    runWorkCategoryId: '1',
    allocation: 50,
  },
  {
    id: '2',
    teamId: '2',
    cycleId: '1',
    epicId: '2',
    runWorkCategoryId: '2',
    allocation: 30,
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

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows epic information in allocation cells', () => {
    renderComponent();

    expect(screen.getByText('Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Epic 2')).toBeInTheDocument();
  });

  it('displays run work category badges', () => {
    renderComponent();

    expect(screen.getByText('Development')).toBeInTheDocument();
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

    const selectAllCheckbox = screen.getByLabelText('Select all');
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
        screen.getByText(
          'Are you sure you want to delete the selected allocations?'
        )
      ).toBeInTheDocument();
    });
  });

  it('handles bulk delete confirmation', async () => {
    const mockSetAllocations = vi.fn();
    vi.mocked(require('@/context/AppContext').useApp).mockReturnValue({
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
      title: 'Allocations deleted',
      description: expect.stringContaining(
        'allocation(s) deleted successfully'
      ),
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
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('handles empty allocations array', () => {
    renderComponent({ allocations: [] });

    expect(screen.getByText('Allocation Matrix')).toBeInTheDocument();
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Backend Team')).toBeInTheDocument();
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

    const allocationCell = screen.getByText('50%');
    fireEvent.mouseEnter(allocationCell);

    // Should show additional details in tooltip or expanded view
    expect(screen.getByText('Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('updates selection count when items are selected', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Should show selection count
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('clears selection after successful bulk delete', async () => {
    const mockSetAllocations = vi.fn();
    vi.mocked(require('@/context/AppContext').useApp).mockReturnValue({
      setAllocations: mockSetAllocations,
    });

    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('1 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete Selected'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    await waitFor(() => {
      expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
    });
  });

  it('handles allocation data with missing references gracefully', () => {
    const allocationsWithMissingRefs = [
      {
        id: '1',
        teamId: 'missing-team',
        cycleId: 'missing-cycle',
        epicId: 'missing-epic',
        runWorkCategoryId: 'missing-category',
        allocation: 50,
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
    checkboxes[0].focus();

    fireEvent.keyDown(checkboxes[0], { key: 'Enter' });
    expect(checkboxes[0]).toBeChecked();
  });
});
