import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TeamTable from '../TeamTable';
import { Team, Skill, Person, Division, Role } from '@/types';
import { createTestAppProvider } from '@/test/utils/test-utils';

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Create test data
const createMockSkills = (): Skill[] => [
  {
    id: 'skill1',
    name: 'React',
    category: 'Frontend',
    description: 'React.js framework',
  },
  {
    id: 'skill2',
    name: 'Node.js',
    category: 'Backend',
    description: 'Node.js runtime',
  },
  {
    id: 'skill3',
    name: 'TypeScript',
    category: 'Language',
    description: 'TypeScript language',
  },
  {
    id: 'skill4',
    name: 'PostgreSQL',
    category: 'Database',
    description: 'PostgreSQL database',
  },
  {
    id: 'skill5',
    name: 'AWS',
    category: 'Cloud',
    description: 'Amazon Web Services',
  },
];

const createMockTeams = (): Team[] => [
  {
    id: 'team1',
    name: 'Frontend Team',
    description: 'UI development team',
    type: 'permanent',
    status: 'active',
    divisionId: 'division1',
    productOwnerId: 'person1',
    capacity: 40,
    targetSkills: ['skill1', 'skill3'], // React, TypeScript
    projectIds: ['project1'],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team2',
    name: 'Backend Team',
    description: 'API development team',
    type: 'permanent',
    status: 'active',
    divisionId: 'division2',
    capacity: 60,
    targetSkills: ['skill2', 'skill3', 'skill4', 'skill5'], // Node.js, TypeScript, PostgreSQL, AWS
    projectIds: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team3',
    name: 'No Skills Team',
    description: 'Team without skills',
    type: 'project',
    status: 'planning',
    capacity: 20,
    targetSkills: [], // No skills
    projectIds: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'team4',
    name: 'Invalid Skills Team',
    description: 'Team with invalid skill references',
    type: 'permanent',
    status: 'active',
    capacity: 30,
    targetSkills: ['invalid-skill1', 'skill1', 'invalid-skill2'], // Mix of valid and invalid
    projectIds: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const createMockPeople = (): Person[] => [
  {
    id: 'person1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    teamId: 'team1',
    divisionId: 'division1',
    roleId: 'role1',
    employmentType: 'permanent',
    startDate: '2024-01-01',
  },
  {
    id: 'person2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isActive: true,
    teamId: 'team2',
    divisionId: 'division2',
    roleId: 'role2',
    employmentType: 'contractor',
    startDate: '2024-01-01',
  },
  {
    id: 'person3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    isActive: true,
    teamId: 'team1',
    divisionId: 'division1',
    roleId: 'role3', // Quality Engineer
    employmentType: 'contractor',
    startDate: '2024-01-01',
  },
  {
    id: 'person4',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    isActive: true,
    teamId: 'team1',
    divisionId: 'division1',
    roleId: 'role4', // Software Engineer
    employmentType: 'permanent',
    startDate: '2024-01-01',
  },
];

const createMockDivisions = (): Division[] => [
  {
    id: 'division1',
    name: 'Engineering',
    description: 'Engineering division',
  },
  {
    id: 'division2',
    name: 'Product',
    description: 'Product division',
  },
];

const createMockRoles = (): Role[] => [
  {
    id: 'role1',
    name: 'Product Owner',
    description: 'Product owner role',
    rateType: 'annual',
    defaultAnnualSalary: 120000,
  },
  {
    id: 'role2',
    name: 'Developer',
    description: 'Developer role',
    rateType: 'annual',
    defaultAnnualSalary: 100000,
  },
  {
    id: 'role3',
    name: 'Quality Engineer',
    description: 'Quality Engineer role',
    rateType: 'annual',
    defaultAnnualSalary: 95000,
  },
  {
    id: 'role4',
    name: 'Software Engineer',
    description: 'Software Engineer role',
    rateType: 'annual',
    defaultAnnualSalary: 100000,
  },
];

describe('TeamTable Skills Display', () => {
  const mockOnEditTeam = vi.fn();
  let mockTeams: Team[];
  let mockSkills: Skill[];
  let mockPeople: Person[];
  let mockDivisions: Division[];
  let mockRoles: Role[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTeams = createMockTeams();
    mockSkills = createMockSkills();
    mockPeople = createMockPeople();
    mockDivisions = createMockDivisions();
    mockRoles = createMockRoles();
  });

  const renderTeamTable = (overrides: any = {}) => {
    const providerProps = {
      teams: mockTeams,
      people: mockPeople,
      skills: mockSkills,
      divisions: mockDivisions,
      roles: mockRoles,
      ...overrides,
    };

    const TestProvider = createTestAppProvider(providerProps);

    return render(
      <TestProvider>
        <TeamTable teams={mockTeams} onEditTeam={mockOnEditTeam} />
      </TestProvider>
    );
  };

  describe('Skills Column Display', () => {
    it('should display skills column header', () => {
      renderTeamTable();
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });

    it('should display skill names for teams with valid skills', () => {
      renderTeamTable();

      // Frontend Team should show React and TypeScript
      expect(screen.getAllByText('React')).toHaveLength(2); // React appears in Frontend Team and Invalid Skills Team
      expect(screen.getAllByText('TypeScript')).toHaveLength(2); // TypeScript appears in Frontend Team and Backend Team
    });

    it('should display first 3 skills with overflow indicator', () => {
      renderTeamTable();

      // Backend Team has 4 skills, should show first 3 + "+1" indicator
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getAllByText('TypeScript')).toHaveLength(2); // TypeScript appears in Frontend Team and Backend Team
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should display "No skills" for teams without skills', () => {
      renderTeamTable();
      expect(screen.getByText('No skills')).toBeInTheDocument();
    });

    it('should handle teams with invalid skill references gracefully', () => {
      renderTeamTable();

      // Invalid Skills Team should only show valid skill (React)
      // Invalid skills should be filtered out
      const skillBadges = screen.getAllByText('React');
      expect(skillBadges).toHaveLength(2); // React appears in Frontend Team and Invalid Skills Team

      // Should not show error messages for invalid skills
      expect(screen.queryByText('invalid-skill1')).not.toBeInTheDocument();
      expect(screen.queryByText('invalid-skill2')).not.toBeInTheDocument();
    });

    it('should display skills with proper badge styling', () => {
      renderTeamTable();

      const reactBadges = screen.getAllByText('React');
      expect(reactBadges[0]).toHaveClass('text-xs');
      // Check for shadcn/ui badge classes instead of generic .badge
      expect(reactBadges[0]).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border'
      );
    });
  });

  describe('Empty and Error States', () => {
    it('should handle empty skills array gracefully', () => {
      renderTeamTable({ skills: [] });

      // Should show "No skills" for all teams
      const noSkillsTexts = screen.getAllByText('No skills');
      expect(noSkillsTexts.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined skills gracefully', () => {
      renderTeamTable({ skills: null });

      // Should not crash and show fallback text
      const noSkillsTexts = screen.getAllByText('No skills');
      expect(noSkillsTexts.length).toBeGreaterThan(0);
    });

    it('should handle teams with null targetSkills', () => {
      const teamsWithNullSkills = mockTeams.map(team => ({
        ...team,
        targetSkills: team.id === 'team1' ? null : team.targetSkills,
      })) as any;

      renderTeamTable({ teams: teamsWithNullSkills });

      // Should not crash
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    it('should handle teams with undefined targetSkills', () => {
      const teamsWithUndefinedSkills = mockTeams.map(team => {
        const { targetSkills, ...teamWithoutSkills } = team;
        return team.id === 'team1' ? teamWithoutSkills : team;
      }) as any;

      renderTeamTable({ teams: teamsWithUndefinedSkills });

      // Should not crash
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });
  });

  describe('Table Layout and Interaction', () => {
    it('should maintain correct column count with skills column', () => {
      renderTeamTable();

      // Should have 9 columns total (including Skills column)
      const headerCells = screen.getAllByRole('columnheader');
      expect(headerCells).toHaveLength(9);

      // Verify skills column is in correct position
      expect(headerCells[5]).toHaveTextContent('Skills');
    });

    it('should handle team editing interaction', async () => {
      const user = userEvent.setup();
      renderTeamTable();

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(
        btn => btn.querySelector('svg') && !btn.textContent?.includes('Delete')
      );

      if (editButton) {
        await user.click(editButton);
        expect(mockOnEditTeam).toHaveBeenCalled();
      }
    });

    it('should handle team selection with skills display', async () => {
      const user = userEvent.setup();
      renderTeamTable();

      const checkboxes = screen.getAllByRole('checkbox');
      const teamCheckbox = checkboxes.find(cb =>
        cb.getAttribute('aria-label')?.includes('Frontend Team')
      );

      if (teamCheckbox) {
        await user.click(teamCheckbox);
        // Should not affect skills display
        expect(screen.getAllByText('React')).toHaveLength(2);
      }
    });
  });

  describe('Skills Display Performance', () => {
    it('should efficiently render large numbers of teams with skills', () => {
      const largeTeamSet = Array.from({ length: 50 }, (_, i) => ({
        ...mockTeams[0],
        id: `team${i}`,
        name: `Team ${i}`,
        targetSkills: mockSkills.slice(0, 3).map(s => s.id),
      }));

      const startTime = performance.now();
      renderTeamTable({ teams: largeTeamSet });
      const endTime = performance.now();

      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    it('should handle teams with many skills efficiently', () => {
      const teamWithManySkills: Team = {
        ...mockTeams[0],
        targetSkills: mockSkills
          .map(s => s.id)
          .concat(['extra1', 'extra2', 'extra3']),
      };

      renderTeamTable({ teams: [teamWithManySkills] });

      // Should show overflow indicator
      expect(screen.getByText(/^\+\d+$/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for team selection', () => {
      renderTeamTable();

      expect(screen.getByLabelText('Select all teams')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Frontend Team')).toBeInTheDocument();
    });

    it('should maintain table accessibility with skills column', () => {
      renderTeamTable();

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders[5]).toHaveTextContent('Skills');
    });

    it('should have proper semantic markup for skills badges', () => {
      renderTeamTable();

      const skillBadges = screen.getAllByText('React');
      expect(skillBadges).toHaveLength(2);
      skillBadges.forEach(badge => {
        // Check for shadcn/ui badge classes
        expect(badge).toHaveClass('text-xs');
        expect(badge).toHaveClass(
          'inline-flex',
          'items-center',
          'rounded-full',
          'border'
        );
      });
    });
  });

  describe('Integration with Team Data', () => {
    it('should update skills display when team data changes', () => {
      const { rerender } = renderTeamTable();

      expect(screen.getAllByText('React')).toHaveLength(2);

      // Update team skills
      const updatedTeams = mockTeams.map(team =>
        team.id === 'team1'
          ? { ...team, targetSkills: ['skill2'] } // Change to Node.js
          : team
      );

      const UpdatedProvider = createTestAppProvider({
        teams: updatedTeams,
        skills: mockSkills,
        people: mockPeople,
        divisions: mockDivisions,
        roles: mockRoles,
      });

      rerender(
        <UpdatedProvider>
          <TeamTable teams={updatedTeams} onEditTeam={mockOnEditTeam} />
        </UpdatedProvider>
      );

      expect(screen.getAllByText('Node.js')).toHaveLength(2); // Node.js appears in Backend Team and updated Frontend Team
    });

    it('should handle skill data updates correctly', () => {
      const { rerender } = renderTeamTable();

      expect(screen.getAllByText('React')).toHaveLength(2);

      // Update skill names
      const updatedSkills = mockSkills.map(skill =>
        skill.id === 'skill1' ? { ...skill, name: 'React.js' } : skill
      );

      const UpdatedProvider = createTestAppProvider({
        teams: mockTeams,
        skills: updatedSkills,
        people: mockPeople,
        divisions: mockDivisions,
        roles: mockRoles,
      });

      rerender(
        <UpdatedProvider>
          <TeamTable teams={mockTeams} onEditTeam={mockOnEditTeam} />
        </UpdatedProvider>
      );

      expect(screen.getAllByText('React.js')).toHaveLength(2); // React.js appears where React used to appear
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });
  });

  // New tests for Issue #74 Enhancement
  describe('Team Composition Metrics - Issue #74', () => {
    it('should display Contract/Perm % column instead of Capacity', () => {
      renderTeamTable();

      // Should have new column header
      expect(screen.getByText('Contract/Perm %')).toBeInTheDocument();

      // Should NOT have old Capacity column
      expect(screen.queryByText('Capacity')).not.toBeInTheDocument();
    });

    it('should display SE/QE Roles % column instead of Utilization', () => {
      renderTeamTable();

      // Should have new column header
      expect(screen.getByText('SE/QE Roles %')).toBeInTheDocument();

      // Should NOT have old Utilization column
      expect(screen.queryByText('Utilization')).not.toBeInTheDocument();
    });

    it('should calculate permanent vs contractor percentages correctly', () => {
      renderTeamTable();

      // Team1 has 3 people: 2 permanent (John, Alice) + 1 contractor (Bob) = 67% perm, 33% cont
      const team1Row = screen.getByText('Frontend Team').closest('tr');
      expect(team1Row).toBeInTheDocument();
      expect(team1Row).toHaveTextContent('67% perm');
      expect(team1Row).toHaveTextContent('33% cont');
    });

    it('should calculate SE vs QE role percentages correctly', () => {
      renderTeamTable();

      // Team1 has: 1 PO (John), 1 QE (Bob), 1 SE (Alice) = 3 people
      // SE/QE focus: 1 SE, 1 QE out of 3 = 33% SE, 33% QE
      const team1Row = screen.getByText('Frontend Team').closest('tr');
      expect(team1Row).toBeInTheDocument();
      expect(team1Row).toHaveTextContent('33% SE');
      expect(team1Row).toHaveTextContent('33% QE');
    });

    it('should display role composition with visual indicators', () => {
      renderTeamTable();

      const team1Row = screen.getByText('Frontend Team').closest('tr');
      expect(team1Row).toBeInTheDocument();

      // Should have visual progress bars or indicators
      const roleCell = team1Row?.querySelector('td:nth-child(8)'); // SE/QE Roles % column (8th column)
      expect(roleCell).toBeInTheDocument();

      // Check for progress bar elements (role breakdown indicators)
      const progressElements = roleCell?.querySelectorAll('div[class*="bg-"]');
      expect(progressElements?.length).toBeGreaterThan(0);
    });

    it('should not display "(Team PO)" label in Product Owner column', () => {
      renderTeamTable();

      // Product Owner column should show clean names without labels
      const team1Row = screen.getByText('Frontend Team').closest('tr');
      expect(team1Row).toBeInTheDocument();
      expect(team1Row).toHaveTextContent('John Doe');
      expect(team1Row).not.toHaveTextContent('(Team PO)');
      expect(team1Row).not.toHaveTextContent('(Acting)');
      expect(team1Row).not.toHaveTextContent('(External)');
    });

    it('should handle teams with no members gracefully', () => {
      const emptyTeams = [
        {
          id: 'empty-team',
          name: 'Empty Team',
          description: 'No members',
          type: 'permanent' as const,
          status: 'planning' as const,
          capacity: 40,
          divisionId: 'division1',
          targetSkills: [],
          createdDate: '2024-01-01T00:00:00Z',
          lastModified: '2024-01-01T00:00:00Z',
        },
      ];

      const TestProvider = createTestAppProvider({
        teams: emptyTeams,
        people: [],
        skills: [],
        divisions: mockDivisions,
        roles: mockRoles,
      });

      render(
        <TestProvider>
          <TeamTable teams={emptyTeams} onEditTeam={mockOnEditTeam} />
        </TestProvider>
      );

      const emptyTeamRow = screen.getByText('Empty Team').closest('tr');
      expect(emptyTeamRow).toBeInTheDocument();

      // Should show 0% for all metrics
      expect(emptyTeamRow).toHaveTextContent('0% perm');
      expect(emptyTeamRow).toHaveTextContent('0% cont');
      expect(emptyTeamRow).toHaveTextContent('0% SE');
      expect(emptyTeamRow).toHaveTextContent('0% QE');
    });

    it('should handle edge case with only contractors', () => {
      const contractorOnlyPeople = createMockPeople().map(person => ({
        ...person,
        employmentType: 'contractor' as const,
      }));

      renderTeamTable({ people: contractorOnlyPeople });

      const team1Row = screen.getByText('Frontend Team').closest('tr');
      expect(team1Row).toBeInTheDocument();
      expect(team1Row).toHaveTextContent('0% perm');
      expect(team1Row).toHaveTextContent('100% cont');
    });

    it('should handle edge case with only permanent employees', () => {
      const permanentOnlyPeople = createMockPeople().map(person => ({
        ...person,
        employmentType: 'permanent' as const,
      }));

      renderTeamTable({ people: permanentOnlyPeople });

      const team1Row = screen.getByText('Frontend Team').closest('tr');
      expect(team1Row).toBeInTheDocument();
      expect(team1Row).toHaveTextContent('100% perm');
      expect(team1Row).toHaveTextContent('0% cont');
    });
  });
});
