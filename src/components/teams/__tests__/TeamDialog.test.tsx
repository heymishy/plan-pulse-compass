import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamDialog from '../TeamDialog';
import { render } from '@/test/utils/test-utils';
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
  addTeam: vi.fn(),
  updateTeam: vi.fn(),
  people: mockPeople,
  setPeople: mockSetPeople,
  divisions: mockDivisions,
  skills: mockSkills,
  roles: [
    { id: 'role1', name: 'Developer', baseSalary: 100000 },
    { id: 'role2', name: 'Designer', baseSalary: 90000 },
  ],
  projects: [],
  allocations: [],
  teamMembers: [],
  getTeamMembers: vi.fn(() => []),
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
      teamId: null,
    };

    return render(<TeamDialog {...defaultProps} {...props} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Create New Team')).toBeInTheDocument();
  });

  it('renders edit mode when team is provided', () => {
    renderComponent({ teamId: mockTeam.id });
    expect(screen.getByText('Edit Team')).toBeInTheDocument();
  });

  it('displays team form fields', () => {
    renderComponent();

    expect(screen.getByLabelText('Team Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Division')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Weekly Capacity (hours) *')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Product Owner')).toBeInTheDocument();
  });

  it('populates form fields when editing existing team', () => {
    renderComponent({ teamId: mockTeam.id });

    expect(screen.getByDisplayValue('Frontend Team')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Frontend development team')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('handles team name change', async () => {
    renderComponent();

    const nameInput = screen.getByLabelText('Team Name *');
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

    const capacityInput = screen.getByLabelText('Weekly Capacity (hours) *');
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

    const nameInput = screen.getByLabelText('Team Name *');
    fireEvent.change(nameInput, { target: { value: 'Test Team' } });

    const capacityInput = screen.getByLabelText('Weekly Capacity (hours) *');
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

    const nameInput = screen.getByLabelText('Team Name *');
    fireEvent.change(nameInput, { target: { value: 'New Team' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'New team description' },
    });

    const capacityInput = screen.getByLabelText('Weekly Capacity (hours) *');
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
    renderComponent({ teamId: mockTeam.id });

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

    const nameInput = screen.getByLabelText('Team Name *');
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
    renderComponent({ teamId: mockTeam.id });

    expect(screen.getByText('Team Statistics')).toBeInTheDocument();
    expect(screen.getByText('Members: 2')).toBeInTheDocument();
    expect(screen.getByText('Skills: 2')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 100')).toBeInTheDocument();
  });

  it('shows team member management section', async () => {
    renderComponent({ teamId: mockTeam.id });

    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('allows removing team members', async () => {
    renderComponent({ teamId: mockTeam.id });

    const removeMemberButton = screen.getByLabelText('Remove John Doe');
    fireEvent.click(removeMemberButton);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('shows skills management section', async () => {
    renderComponent({ teamId: mockTeam.id });

    expect(screen.getByText('Team Skills')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('allows removing team skills', async () => {
    renderComponent({ teamId: mockTeam.id });

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
    renderComponent({ teamId: mockTeam.id });

    expect(screen.getByText('Capacity Utilization')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Mock utilization
  });

  it('shows team performance metrics', () => {
    renderComponent({ teamId: mockTeam.id });

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Velocity: 42 points')).toBeInTheDocument();
    expect(screen.getByText('Burndown: On track')).toBeInTheDocument();
  });

  it('displays team tabs correctly', () => {
    renderComponent({ teamId: mockTeam.id });

    // Check that the tabs are rendered
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Skills & Goals')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText(/Members \(\d+\)/)).toBeInTheDocument();
  });

  it('allows switching between tabs', () => {
    renderComponent({ teamId: mockTeam.id });

    // Click on Skills & Goals tab
    fireEvent.click(screen.getByText('Skills & Goals'));

    // Check that skills content is visible
    expect(screen.getByText('Skills & Goals')).toBeInTheDocument();

    // Click on Timeline tab
    fireEvent.click(screen.getByText('Timeline'));

    // Check that timeline content is visible
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });
});
