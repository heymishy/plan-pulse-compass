import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
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
const mockAddTeam = vi.fn();
const mockUpdateTeam = vi.fn();

const mockTeam = {
  id: 'team1',
  name: 'Frontend Team',
  description: 'Frontend development team',
  type: 'permanent',
  status: 'active',
  divisionId: 'div1',
  capacity: 100,
  productOwnerId: 'person1',
  targetSkills: ['React', 'TypeScript'],
  projectIds: ['project1'],
  duration: { start: '2024-01-01', end: '2024-12-31' },
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

const mockProjects = [
  { id: 'project1', name: 'Project Alpha', description: 'Test project' },
  { id: 'project2', name: 'Project Beta', description: 'Another project' },
];

const mockTeamMembers = [
  {
    id: 'member1',
    teamId: 'team1',
    personId: 'person1',
    role: 'lead',
    allocation: 100,
  },
  {
    id: 'member2',
    teamId: 'team1',
    personId: 'person2',
    role: 'developer',
    allocation: 80,
  },
];

const mockAppData = {
  teams: [mockTeam],
  addTeam: mockAddTeam,
  updateTeam: mockUpdateTeam,
  people: mockPeople,
  divisions: mockDivisions,
  roles: [
    { id: 'role1', name: 'Developer', baseSalary: 100000 },
    { id: 'role2', name: 'Designer', baseSalary: 90000 },
  ],
  projects: mockProjects,
  teamMembers: mockTeamMembers,
  getTeamMembers: vi.fn(() => mockTeamMembers),
};

describe('TeamDialog', () => {
  beforeAll(() => {
    // Reset all modules at the start of this test suite
    vi.resetModules();
  });

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
    expect(screen.getByLabelText(/Product Owner/)).toBeInTheDocument();
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

  it('handles capacity change', async () => {
    renderComponent();

    const capacityInput = screen.getByLabelText('Weekly Capacity (hours) *');
    fireEvent.change(capacityInput, { target: { value: '150' } });

    expect(capacityInput).toHaveValue(150);
  });

  it('displays team tabs correctly', () => {
    renderComponent({ teamId: mockTeam.id });

    // Check that the tabs are rendered
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Skills & Goals')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText(/Members \(\d+\)/)).toBeInTheDocument();
  });

  it('handles skills tab functionality', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Navigate to Skills & Goals tab using userEvent
    const skillsTab = screen.getByText('Skills & Goals');
    await user.click(skillsTab);

    await waitFor(() => {
      expect(screen.getByText('Target Skills')).toBeInTheDocument();
      expect(screen.getByText('Associated Projects')).toBeInTheDocument();
    });
  });

  it('handles timeline tab functionality', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Navigate to Timeline tab
    const timelineTab = screen.getByText('Timeline');
    await user.click(timelineTab);

    await waitFor(() => {
      expect(screen.getByText('Team Duration')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });
  });

  it('handles members tab functionality', async () => {
    const user = userEvent.setup();
    renderComponent({ teamId: mockTeam.id });

    // Navigate to Members tab
    const membersTab = screen.getByText(/Members \(\d+\)/);
    await user.click(membersTab);

    await waitFor(() => {
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText(/\d+ active members/)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Ensure the name field is empty by explicitly setting it to empty string
    const nameInput = screen.getByLabelText('Team Name *');
    await user.clear(nameInput);

    // Verify it's actually empty
    expect(nameInput).toHaveValue('');

    // Try to save without required fields using direct form submission
    const form = nameInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      // Fallback to button click
      const saveButton = screen.getByText('Create Team');
      await user.click(saveButton);
    }

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
    });
  });

  it('validates capacity value', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText('Team Name *');
    await user.type(nameInput, 'Test Team');

    const capacityInput = screen.getByLabelText('Weekly Capacity (hours) *');
    await user.clear(capacityInput);
    await user.type(capacityInput, '-10');

    // Use form submission instead of button click
    const form = capacityInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const saveButton = screen.getByText('Create Team');
      await user.click(saveButton);
    }

    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Capacity must be a positive number',
          variant: 'destructive',
        });
      },
      { timeout: 5000 }
    );
  });

  it('creates new team successfully', async () => {
    const user = userEvent.setup();

    // Clear mocks to ensure clean state
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(mockAppData);
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

    renderComponent();

    const nameInput = screen.getByLabelText('Team Name *');
    await user.type(nameInput, 'New Team');

    const descriptionInput = screen.getByLabelText('Description');
    await user.type(descriptionInput, 'New team description');

    const capacityInput = screen.getByLabelText('Weekly Capacity (hours) *');
    await user.clear(capacityInput);
    await user.type(capacityInput, '80');

    const saveButton = screen.getByText('Create Team');
    await user.click(saveButton);

    await waitFor(
      () => {
        expect(mockAddTeam).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Team created successfully',
        });
      },
      { timeout: 10000 }
    );
  });

  it('updates existing team successfully', async () => {
    const user = userEvent.setup();

    // Clear mocks to ensure clean state
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(mockAppData);
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

    renderComponent({ teamId: mockTeam.id });

    const nameInput = screen.getByDisplayValue('Frontend Team');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Team');

    const saveButton = screen.getByText('Update Team');
    await user.click(saveButton);

    await waitFor(
      () => {
        expect(mockUpdateTeam).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Team updated successfully',
        });
      },
      { timeout: 10000 }
    );
  });

  it('handles cancel action', async () => {
    const mockOnClose = vi.fn();
    renderComponent({ onClose: mockOnClose });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows team member management section', async () => {
    const user = userEvent.setup();
    renderComponent({ teamId: mockTeam.id });

    // Navigate to Members tab
    const membersTab = screen.getByText(/Members \(\d+\)/);
    await user.click(membersTab);

    await waitFor(() => {
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('allows switching between tabs', async () => {
    const user = userEvent.setup();
    renderComponent({ teamId: mockTeam.id });

    // Click on Skills & Goals tab
    await user.click(screen.getByText('Skills & Goals'));

    // Check that skills content is visible
    await waitFor(() => {
      expect(screen.getByText('Target Skills')).toBeInTheDocument();
    });

    // Click on Timeline tab
    await user.click(screen.getByText('Timeline'));

    // Check that timeline content is visible
    await waitFor(() => {
      expect(screen.getByText('Team Duration')).toBeInTheDocument();
    });
  });

  it('handles team type selection', async () => {
    renderComponent();

    // Check that team type selector is present by finding the label
    expect(screen.getByText('Team Type')).toBeInTheDocument();

    // Check that the permanent option text exists (using getAllByText to handle multiple instances)
    const permanentTexts = screen.getAllByText('🏢 Permanent');
    expect(permanentTexts.length).toBeGreaterThan(0);
  });

  it('handles team status selection', async () => {
    renderComponent();

    // Check that team status selector is present by finding the label
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check that the active option text exists (using getAllByText to handle multiple instances)
    const activeTexts = screen.getAllByText('✅ Active');
    expect(activeTexts.length).toBeGreaterThan(0);
  });
});
