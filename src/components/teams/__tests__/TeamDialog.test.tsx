import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamDialog from '../TeamDialog';
import { TestProviders } from '@/test/utils/test-utils';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

// Mock the hooks
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

const mockToast = vi.fn();
const mockSetTeams = vi.fn();
const mockSetPeople = vi.fn();

const mockTeam = {
  id: 'team1',
  name: 'Frontend Team',
  description: 'Frontend development team',
  divisionId: 'div1',
  capacity: 100,
  productOwnerId: 'person1',
  skills: ['React', 'TypeScript'],
  members: ['person1', 'person2'],
  created: '2024-01-01',
  modified: '2024-01-01',
};

const mockDivisions = [
  { id: 'div1', name: 'Engineering', description: 'Engineering Division' },
  { id: 'div2', name: 'Product', description: 'Product Division' },
];

const mockPeople = [
  {
    id: 'person1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'role1',
  },
  {
    id: 'person2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'role2',
  },
];

const mockSkills = [
  { id: 'skill1', name: 'React', category: 'Frontend' },
  { id: 'skill2', name: 'TypeScript', category: 'Language' },
];

const mockAppData = {
  teams: [mockTeam],
  setTeams: mockSetTeams,
  people: mockPeople,
  setPeople: mockSetPeople,
  divisions: mockDivisions,
  skills: mockSkills,
};

describe('TeamDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(mockAppData);
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      team: null,
    };

    return render(
      <TestProviders>
        <TeamDialog {...defaultProps} {...props} />
      </TestProviders>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Add New Team')).toBeInTheDocument();
  });

  it('renders edit mode when team is provided', () => {
    renderComponent({ team: mockTeam });
    expect(screen.getByText('Edit Team')).toBeInTheDocument();
  });

  it('displays team form fields', () => {
    renderComponent();

    expect(screen.getByLabelText('Team Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Division')).toBeInTheDocument();
    expect(screen.getByLabelText('Capacity')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Owner')).toBeInTheDocument();
  });

  it('populates form fields when editing existing team', () => {
    renderComponent({ team: mockTeam });

    expect(screen.getByDisplayValue('Frontend Team')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Frontend development team')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('handles team name change', async () => {
    renderComponent();

    const nameInput = screen.getByLabelText('Team Name');
    fireEvent.change(nameInput, { target: { value: 'Backend Team' } });

    expect(nameInput).toHaveValue('Backend Team');
  });

  it('handles description change', async () => {
    renderComponent();

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'New description' },
    });

    expect(descriptionInput).toHaveValue('New description');
  });

  it('handles division selection', async () => {
    renderComponent();

    const divisionSelect = screen.getByLabelText('Division');
    fireEvent.click(divisionSelect);

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Engineering'));

    await waitFor(() => {
      expect(divisionSelect).toHaveValue('div1');
    });
  });

  it('handles capacity change', async () => {
    renderComponent();

    const capacityInput = screen.getByLabelText('Capacity');
    fireEvent.change(capacityInput, { target: { value: '150' } });

    expect(capacityInput).toHaveValue('150');
  });

  it('handles product owner selection', async () => {
    renderComponent();

    const productOwnerSelect = screen.getByLabelText('Product Owner');
    fireEvent.click(productOwnerSelect);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(productOwnerSelect).toHaveValue('person1');
    });
  });

  it('handles skills selection', async () => {
    renderComponent();

    const skillsSelect = screen.getByLabelText('Skills');
    fireEvent.click(skillsSelect);

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('React'));

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('handles team member selection', async () => {
    renderComponent();

    const membersSelect = screen.getByLabelText('Team Members');
    fireEvent.click(membersSelect);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderComponent();

    // Try to save without required fields
    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Team name is required')).toBeInTheDocument();
    });
  });

  it('validates capacity value', async () => {
    renderComponent();

    const nameInput = screen.getByLabelText('Team Name');
    fireEvent.change(nameInput, { target: { value: 'Test Team' } });

    const capacityInput = screen.getByLabelText('Capacity');
    fireEvent.change(capacityInput, { target: { value: '-10' } });

    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Capacity must be a positive number')
      ).toBeInTheDocument();
    });
  });

  it('creates new team successfully', async () => {
    renderComponent();

    const nameInput = screen.getByLabelText('Team Name');
    fireEvent.change(nameInput, { target: { value: 'New Team' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'New team description' },
    });

    const capacityInput = screen.getByLabelText('Capacity');
    fireEvent.change(capacityInput, { target: { value: '80' } });

    // Select division
    const divisionSelect = screen.getByLabelText('Division');
    fireEvent.click(divisionSelect);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Engineering'));
    });

    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetTeams).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Team created successfully',
      });
    });
  });

  it('updates existing team successfully', async () => {
    renderComponent({ team: mockTeam });

    const nameInput = screen.getByDisplayValue('Frontend Team');
    fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetTeams).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Team updated successfully',
      });
    });
  });

  it('handles save error gracefully', async () => {
    mockSetTeams.mockImplementationOnce(() => {
      throw new Error('Save failed');
    });

    renderComponent();

    const nameInput = screen.getByLabelText('Team Name');
    fireEvent.change(nameInput, { target: { value: 'Test Team' } });

    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to save team',
        variant: 'destructive',
      });
    });
  });

  it('handles cancel action', async () => {
    const mockOnClose = vi.fn();
    renderComponent({ onClose: mockOnClose });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays team statistics when editing', () => {
    renderComponent({ team: mockTeam });

    expect(screen.getByText('Team Statistics')).toBeInTheDocument();
    expect(screen.getByText('Members: 2')).toBeInTheDocument();
    expect(screen.getByText('Skills: 2')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 100')).toBeInTheDocument();
  });

  it('shows team member management section', async () => {
    renderComponent({ team: mockTeam });

    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('allows removing team members', async () => {
    renderComponent({ team: mockTeam });

    const removeMemberButton = screen.getByLabelText('Remove John Doe');
    fireEvent.click(removeMemberButton);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('shows skills management section', async () => {
    renderComponent({ team: mockTeam });

    expect(screen.getByText('Team Skills')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('allows removing team skills', async () => {
    renderComponent({ team: mockTeam });

    const removeSkillButton = screen.getByLabelText('Remove React skill');
    fireEvent.click(removeSkillButton);

    await waitFor(() => {
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });
  });

  it('handles bulk member addition', async () => {
    renderComponent();

    const bulkAddButton = screen.getByText('Bulk Add Members');
    fireEvent.click(bulkAddButton);

    await waitFor(() => {
      expect(screen.getByText('Add Multiple Members')).toBeInTheDocument();
    });

    // Select multiple members
    const memberCheckboxes = screen.getAllByRole('checkbox');
    fireEvent.click(memberCheckboxes[0]);
    fireEvent.click(memberCheckboxes[1]);

    const addSelectedButton = screen.getByText('Add Selected');
    fireEvent.click(addSelectedButton);

    await waitFor(() => {
      expect(screen.getByText('2 members added')).toBeInTheDocument();
    });
  });

  it('calculates team capacity utilization', () => {
    renderComponent({ team: mockTeam });

    expect(screen.getByText('Capacity Utilization')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Mock utilization
  });

  it('shows team performance metrics', () => {
    renderComponent({ team: mockTeam });

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Velocity: 42 points')).toBeInTheDocument();
    expect(screen.getByText('Burndown: On track')).toBeInTheDocument();
  });

  it('handles team archival', async () => {
    renderComponent({ team: mockTeam });

    const archiveButton = screen.getByText('Archive Team');
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm Archive')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Yes, Archive');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetTeams).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Team Archived',
        description: 'Team has been archived successfully',
      });
    });
  });

  it('prevents archival of active teams with assignments', async () => {
    const activeTeam = { ...mockTeam, hasActiveAssignments: true };
    renderComponent({ team: activeTeam });

    const archiveButton = screen.getByText('Archive Team');
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Cannot archive team with active assignments')
      ).toBeInTheDocument();
    });
  });

  it('handles team duplication', async () => {
    renderComponent({ team: mockTeam });

    const duplicateButton = screen.getByText('Duplicate Team');
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Frontend Team (Copy)')
      ).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetTeams).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Team duplicated successfully',
      });
    });
  });

  it('shows team history and audit trail', () => {
    renderComponent({ team: mockTeam });

    fireEvent.click(screen.getByText('History'));

    expect(screen.getByText('Team History')).toBeInTheDocument();
    expect(screen.getByText('Created: 2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('Last Modified: 2024-01-01')).toBeInTheDocument();
  });
});
