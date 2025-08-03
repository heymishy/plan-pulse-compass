import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TeamBuilder from '../TeamBuilder';
import { render } from '@/test/utils/test-utils';
import { Team, TeamMember, Person, Role, Division, Skill } from '@/types';
import { useApp } from '@/context/AppContext';
import { useO365SyncWithSettings } from '@/hooks/useO365SyncWithSettings';
import { useSettings } from '@/context/SettingsContext';

// Mock the context and hooks
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/hooks/useO365SyncWithSettings', () => ({
  useO365SyncWithSettings: vi.fn(),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

// Mock data
const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Frontend Team',
    description: 'Handles UI development',
    type: 'permanent',
    status: 'active',
    capacity: 40,
    divisionId: 'div-1',
    targetSkills: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Backend Team',
    description: 'Handles API development',
    type: 'project',
    status: 'planning',
    capacity: 30,
    divisionId: 'div-1',
    targetSkills: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'role-1',
    divisionId: 'div-1',
    teamId: 'team-1', // Assigned to team-1
    isActive: true,
    startDate: '2024-01-01',
    employmentType: 'permanent',
    roleType: 'developer',
    skills: ['React', 'TypeScript'],
  },
  {
    id: 'person-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'role-1',
    divisionId: 'div-1',
    teamId: undefined, // Unassigned
    isActive: true,
    startDate: '2024-01-01',
    employmentType: 'contractor',
    roleType: 'developer',
    skills: ['Node.js', 'Python'],
  },
  {
    id: 'person-3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    roleId: 'role-2',
    divisionId: 'div-1',
    teamId: 'team-1', // Also assigned to team-1
    isActive: true,
    startDate: '2024-01-01',
    employmentType: 'contractor', // Changed to contractor for 50/50 split
    roleType: 'manager',
    skills: ['Leadership', 'Project Management'],
  },
];

const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    teamId: 'team-1',
    personId: 'person-1',
    role: 'member',
    allocation: 100,
    startDate: '2024-01-01',
    isActive: true,
  },
];

const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Developer',
    description: 'Software Developer',
    level: 1,
    category: 'Technical',
  },
  {
    id: 'role-2',
    name: 'Manager',
    description: 'Team Manager',
    level: 2,
    category: 'Management',
  },
];

const mockDivisions: Division[] = [
  {
    id: 'div-1',
    name: 'Engineering',
    description: 'Engineering Division',
  },
];

const mockSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'React',
    category: 'Frontend',
  },
  {
    id: 'skill-2',
    name: 'TypeScript',
    category: 'Programming',
  },
];

describe('TeamBuilder', () => {
  const mockAddTeam = vi.fn();
  const mockUpdateTeam = vi.fn();
  const mockDeleteTeam = vi.fn();
  const mockAddTeamMember = vi.fn();
  const mockUpdateTeamMember = vi.fn();
  const mockRemoveTeamMember = vi.fn();
  const mockGetTeamMembers = vi.fn();
  const mockUpdatePerson = vi.fn();
  const mockAddPerson = vi.fn();

  const mockAppContext = {
    teams: mockTeams,
    teamMembers: mockTeamMembers,
    people: mockPeople,
    roles: mockRoles,
    divisions: mockDivisions,
    projects: [],
    personSkills: [],
    addTeam: mockAddTeam,
    updateTeam: mockUpdateTeam,
    deleteTeam: mockDeleteTeam,
    addTeamMember: mockAddTeamMember,
    updateTeamMember: mockUpdateTeamMember,
    removeTeamMember: mockRemoveTeamMember,
    getTeamMembers: mockGetTeamMembers,
    updatePerson: mockUpdatePerson,
    addPerson: mockAddPerson,
    skills: mockSkills,
  };

  const mockO365Hook = {
    syncEmployees: vi.fn(),
    syncStatus: 'idle' as const,
    lastSyncResult: null,
    isAuthenticated: false,
    authenticate: vi.fn(),
    error: null,
  };

  const mockSettings = {
    config: {
      o365: {
        enabled: true,
        clientId: 'test-client-id',
        tenantId: 'test-tenant-id',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeamMembers.mockImplementation((teamId: string) =>
      mockTeamMembers.filter(tm => tm.teamId === teamId && tm.isActive)
    );

    // Setup mocks
    vi.mocked(useApp).mockReturnValue(mockAppContext);
    vi.mocked(useO365SyncWithSettings).mockReturnValue(mockO365Hook);
    vi.mocked(useSettings).mockReturnValue(mockSettings);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<TeamBuilder />);

      expect(screen.getByTestId('team-builder')).toBeInTheDocument();
      expect(screen.getByText('Teams (2)')).toBeInTheDocument();
      expect(screen.getAllByText('Select a Team')).toHaveLength(2);
      expect(screen.getByText('Unassigned People')).toBeInTheDocument();
    });

    it('should display teams in the left panel', () => {
      render(<TeamBuilder />);

      expect(screen.getByText('Frontend Team')).toBeInTheDocument();
      expect(screen.getByText('Backend Team')).toBeInTheDocument();
    });

    it('should display unassigned people in the right panel', () => {
      render(<TeamBuilder />);

      // Jane Smith should be visible as unassigned
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  describe('Team Selection', () => {
    it('should show team details when a team is selected', async () => {
      const mockOnTeamChange = vi.fn();
      render(<TeamBuilder onTeamChange={mockOnTeamChange} />);

      const frontendTeam = screen.getByText('Frontend Team');
      fireEvent.click(frontendTeam);

      expect(mockOnTeamChange).toHaveBeenCalledWith(mockTeams[0]);
    });

    it('should display team members when team is selected', () => {
      render(<TeamBuilder selectedTeam={mockTeams[0]} />);

      expect(screen.getByText('Team Members (2)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  describe('Person Removal - Issue #71', () => {
    it('should remove person with TeamMember record (existing functionality)', async () => {
      render(<TeamBuilder selectedTeam={mockTeams[0]} />);

      // Verify team members are displayed
      expect(screen.getByText('Team Members (2)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

      // Find all remove buttons by looking for Trash2 components
      const allButtons = screen.getAllByRole('button');
      const removeButtons = allButtons.filter(button => {
        const svg = button.querySelector('svg');
        if (!svg) return false;
        // Check for lucide-trash2 class in the SVG
        const classes = svg.className.baseVal || svg.className || '';
        return (
          classes.includes('lucide-trash2') ||
          button.innerHTML.includes('lucide-trash2')
        );
      });

      // Should have 2 remove buttons (one for each team member)
      expect(removeButtons).toHaveLength(2);

      // Click the first remove button (should be John's)
      fireEvent.click(removeButtons[0]);

      // Should call removeTeamMember with John's TeamMember ID and updatePerson
      await waitFor(() => {
        expect(mockRemoveTeamMember).toHaveBeenCalledWith('tm-1');
        expect(mockUpdatePerson).toHaveBeenCalledWith('person-1', {
          teamId: undefined,
        });
      });
    });

    it('should remove person without TeamMember record (bug fix for temp IDs)', async () => {
      render(<TeamBuilder selectedTeam={mockTeams[0]} />);

      // Find all remove buttons
      const allButtons = screen.getAllByRole('button');
      const removeButtons = allButtons.filter(button => {
        const svg = button.querySelector('svg');
        if (!svg) return false;
        const classes = svg.className.baseVal || svg.className || '';
        return (
          classes.includes('lucide-trash2') ||
          button.innerHTML.includes('lucide-trash2')
        );
      });

      // Should have 2 remove buttons
      expect(removeButtons).toHaveLength(2);

      // Click the second remove button (should be Bob's with temp ID)
      fireEvent.click(removeButtons[1]);

      // After the fix, this should work correctly for temp IDs
      await waitFor(() => {
        // Should NOT call removeTeamMember for temp IDs (no TeamMember record to remove)
        expect(mockRemoveTeamMember).not.toHaveBeenCalled();
        // SHOULD call updatePerson to clear teamId for Bob (person-3)
        expect(mockUpdatePerson).toHaveBeenCalledWith('person-3', {
          teamId: undefined,
        });
      });
    });
  });

  describe('Enhanced Person Details - Issue #70', () => {
    describe('Unassigned People Column', () => {
      it('should display role title for unassigned people', () => {
        render(<TeamBuilder />);

        // Jane Smith should be unassigned and show her role details
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();

        // Should show role title (Developer from role-1) - check that there are multiple instances
        expect(screen.getAllByText('Developer')).toHaveLength(2); // One for unassigned Jane, one for team member John
      });

      it('should display employment type for unassigned people', () => {
        render(<TeamBuilder />);

        // Jane Smith is a contractor - should appear in badges
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getAllByText('Contractor')).toHaveLength(1); // Only Jane is contractor
      });

      it('should display role type for unassigned people', () => {
        render(<TeamBuilder />);

        // Jane Smith has roleType: 'developer' - formatted as 'Developer'
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getAllByText('Developer')).toHaveLength(2); // Jane (roleType) + both John & Jane (role name)
      });

      it('should display division for unassigned people', () => {
        render(<TeamBuilder />);

        // Jane Smith is in Engineering division
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getAllByText('Engineering')).toHaveLength(1); // Only Jane unassigned shows division badge
      });
    });

    describe('Team Member Details', () => {
      it('should display enhanced details for team members', () => {
        render(<TeamBuilder selectedTeam={mockTeams[0]} />);

        // Should show both John Doe and Bob Wilson with enhanced details
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

        // Should show multiple role titles, employment types, role types, divisions
        expect(screen.getAllByText('Developer')).toHaveLength(4); // John's role + roleType instances
        expect(screen.getAllByText('Manager')).toHaveLength(2); // Bob's role + roleType instances
        expect(screen.getAllByText('Permanent')).toHaveLength(1); // Only John is permanent (Bob is contractor)
        expect(screen.getAllByText('Engineering')).toHaveLength(3); // Team section header + both team members show division
      });
    });

    describe('Team Statistics', () => {
      it('should display perm/contractor ratio', () => {
        render(<TeamBuilder selectedTeam={mockTeams[0]} />);

        // Team has 1 permanent (John) and 1 contractor (Bob) = 50%/50%
        expect(screen.getByText(/50%.*permanent/i)).toBeInTheDocument();
        expect(screen.getByText(/50%.*contractor/i)).toBeInTheDocument();
      });

      it('should display role type split', () => {
        render(<TeamBuilder selectedTeam={mockTeams[0]} />);

        // Team has 1 developer (John) and 1 manager (Bob)
        expect(screen.getByText(/50%.*developer/i)).toBeInTheDocument();
        expect(screen.getByText(/50%.*manager/i)).toBeInTheDocument();
      });

      it('should display total cost per financial year', () => {
        render(<TeamBuilder selectedTeam={mockTeams[0]} />);

        // Should show some cost calculation based on roles and allocations
        expect(screen.getByText(/total cost/i)).toBeInTheDocument();
        expect(screen.getByText(/\$\d+/)).toBeInTheDocument();
      });
    });
  });

  describe('Person Assignment', () => {
    it('should allow selecting unassigned people', async () => {
      const user = userEvent.setup();
      render(<TeamBuilder selectedTeam={mockTeams[0]} />);

      // Find Jane Smith in unassigned list
      const janeCheckbox = screen
        .getByText('Jane Smith')
        .closest('.p-3')
        ?.querySelector('[role="checkbox"]');

      expect(janeCheckbox).toBeInTheDocument();

      await user.click(janeCheckbox!);

      // Should show assign button
      expect(screen.getByText(/Assign 1 to Frontend Team/)).toBeInTheDocument();
    });

    it('should assign selected people to team', async () => {
      const user = userEvent.setup();
      render(<TeamBuilder selectedTeam={mockTeams[0]} />);

      // Select Jane Smith
      const janeCheckbox = screen
        .getByText('Jane Smith')
        .closest('.p-3')
        ?.querySelector('[role="checkbox"]');

      await user.click(janeCheckbox!);

      // Click assign button
      const assignButton = screen.getByText(/Assign 1 to Frontend Team/);
      await user.click(assignButton);

      // Should call addTeamMember and updatePerson
      expect(mockAddTeamMember).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-1',
          personId: 'person-2',
          role: 'member',
          allocation: 100,
        })
      );

      expect(mockUpdatePerson).toHaveBeenCalledWith('person-2', {
        teamId: 'team-1',
      });
    });
  });

  describe('Filtering', () => {
    it('should filter people by search term', async () => {
      const user = userEvent.setup();
      render(<TeamBuilder />);

      const searchInput = screen.getByPlaceholderText('Search people...');
      await user.type(searchInput, 'Jane');

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should show assigned people when toggle is enabled', async () => {
      const user = userEvent.setup();
      render(<TeamBuilder />);

      const toggleCheckbox = screen.getByLabelText(
        /Show people already in teams/
      );
      await user.click(toggleCheckbox);

      // Should now show all people, including assigned ones
      expect(screen.getByText('All People')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  describe('Team Creation', () => {
    it('should open create team dialog', async () => {
      const user = userEvent.setup();
      render(<TeamBuilder />);

      const newTeamButton = screen.getByText('New Team');
      await user.click(newTeamButton);

      expect(screen.getByText('Create New Team')).toBeInTheDocument();
      expect(screen.getByLabelText('Team Name')).toBeInTheDocument();
    });

    it('should create new team with provided data', async () => {
      const user = userEvent.setup();
      render(<TeamBuilder />);

      // Open dialog
      const newTeamButton = screen.getByText('New Team');
      await user.click(newTeamButton);

      // Fill form
      const nameInput = screen.getByLabelText('Team Name');
      await user.type(nameInput, 'New Test Team');

      const descriptionTextarea = screen.getByLabelText('Description');
      await user.type(descriptionTextarea, 'Test team description');

      // Create team
      const createButton = screen.getByText('Create Team');
      await user.click(createButton);

      expect(mockAddTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Test Team',
          description: 'Test team description',
          type: 'project',
          status: 'planning',
          capacity: 40,
        })
      );
    });
  });
});
