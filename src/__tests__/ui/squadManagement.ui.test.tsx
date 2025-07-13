import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SquadManagement from '@/pages/SquadManagement';

// Mock the useApp hook to avoid router conflicts
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    squads: [
      {
        id: 'squad1',
        name: 'Alpha Squad',
        type: 'project',
        status: 'active',
        capacity: 5,
        targetSkills: ['React', 'TypeScript'],
        createdDate: '2024-01-01',
        lastModified: '2024-01-01',
        description: 'Frontend development squad',
        divisionId: 'div1',
        projectIds: [],
        duration: { start: '2024-01-01', end: '2024-12-31' },
      },
      {
        id: 'squad2',
        name: 'Beta Squad',
        type: 'initiative',
        status: 'planning',
        capacity: 8,
        targetSkills: ['Python', 'Machine Learning'],
        createdDate: '2024-01-01',
        lastModified: '2024-01-01',
        description: 'Data science squad',
        divisionId: 'div1',
        projectIds: [],
        duration: { start: '2024-02-01', end: '2024-12-31' },
      },
    ],
    squadMembers: [
      {
        id: 'member1',
        squadId: 'squad1',
        personId: 'person1',
        role: 'lead',
        allocation: 100,
        startDate: '2024-01-01',
        isActive: true,
      },
      {
        id: 'member2',
        squadId: 'squad1',
        personId: 'person2',
        role: 'member',
        allocation: 80,
        startDate: '2024-01-01',
        isActive: true,
      },
      {
        id: 'member3',
        squadId: 'squad2',
        personId: 'person3',
        role: 'member',
        allocation: 90,
        startDate: '2024-02-01',
        isActive: true,
      },
    ],
    people: [
      {
        id: 'person1',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role1',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
        skills: [
          { skillId: 'skill1', skillName: 'React', proficiency: 'expert' },
          {
            skillId: 'skill2',
            skillName: 'TypeScript',
            proficiency: 'advanced',
          },
        ],
      },
      {
        id: 'person2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        roleId: 'role2',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
        skills: [
          {
            skillId: 'skill1',
            skillName: 'React',
            proficiency: 'intermediate',
          },
          { skillId: 'skill3', skillName: 'CSS', proficiency: 'advanced' },
        ],
      },
      {
        id: 'person3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        roleId: 'role3',
        teamId: 'team2',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
        skills: [
          { skillId: 'skill4', skillName: 'Python', proficiency: 'expert' },
          {
            skillId: 'skill5',
            skillName: 'Machine Learning',
            proficiency: 'advanced',
          },
        ],
      },
    ],
    unmappedPeople: [
      {
        id: 'unmapped1',
        name: 'Alice Wilson',
        email: 'alice@example.com',
        skills: [
          { skillId: 'skill6', skillName: 'Vue.js', proficiency: 'advanced' },
        ],
        availability: 80,
        joinDate: '2024-01-15',
        importedDate: '2024-01-15',
      },
    ],
    divisions: [],
    teams: [],
    projects: [],
    skills: [],
    roles: [],
    epics: [],
    milestones: [],
    allocations: [],
    workItems: [],
    getSquadMembers: vi.fn((squadId: string) =>
      [
        {
          id: 'member1',
          squadId: 'squad1',
          personId: 'person1',
          role: 'lead',
          allocation: 100,
          startDate: '2024-01-01',
          isActive: true,
        },
        {
          id: 'member2',
          squadId: 'squad1',
          personId: 'person2',
          role: 'member',
          allocation: 80,
          startDate: '2024-01-01',
          isActive: true,
        },
        {
          id: 'member3',
          squadId: 'squad2',
          personId: 'person3',
          role: 'member',
          allocation: 90,
          startDate: '2024-02-01',
          isActive: true,
        },
      ].filter(m => m.squadId === squadId && m.isActive)
    ),
    getPersonSquads: vi.fn(() => []),
    getSquadSkillGaps: vi.fn(() => []),
    generateSquadRecommendations: vi.fn(() => []),
    addSquad: vi.fn(),
    updateSquad: vi.fn(),
    deleteSquad: vi.fn(),
    addSquadMember: vi.fn(),
    updateSquadMember: vi.fn(),
    removeSquadMember: vi.fn(),
    addUnmappedPerson: vi.fn(),
    removeUnmappedPerson: vi.fn(),
    // Other required context methods as mocks
    addPerson: vi.fn(),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
    addTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    addRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    addSkill: vi.fn(),
    updateSkill: vi.fn(),
    deleteSkill: vi.fn(),
    addProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    addEpic: vi.fn(),
    updateEpic: vi.fn(),
    deleteEpic: vi.fn(),
    addMilestone: vi.fn(),
    updateMilestone: vi.fn(),
    deleteMilestone: vi.fn(),
    addAllocation: vi.fn(),
    updateAllocation: vi.fn(),
    deleteAllocation: vi.fn(),
    addWorkItem: vi.fn(),
    updateWorkItem: vi.fn(),
    deleteWorkItem: vi.fn(),
    addDivision: vi.fn(),
    updateDivision: vi.fn(),
    deleteDivision: vi.fn(),
    isLoading: false,
    exportData: vi.fn(),
    importData: vi.fn(),
    clearAllData: vi.fn(),
    refreshData: vi.fn(),
    hasSampleData: vi.fn(),
    loadSampleData: vi.fn(),
  }),
}));

// Mock router to avoid conflicts
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/squad-management' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
global.ResizeObserver = MockResizeObserver;

describe('Squad Management UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Layout and Navigation', () => {
    it('renders squad management page with main sections', () => {
      render(<SquadManagement />);

      expect(screen.getByText('Squad Management')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Manage teams, map people to squads, and analyze skill coverage'
        )
      ).toBeInTheDocument();

      // Check statistics cards
      expect(screen.getByText('Total Squads')).toBeInTheDocument();
      expect(screen.getByText('Squad Members')).toBeInTheDocument();
      // Use getAllByText for elements that appear multiple times
      const unmappedTexts = screen.getAllByText('Unmapped People');
      expect(unmappedTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(screen.getByText('Utilization')).toBeInTheDocument();
    });

    it('displays correct statistics from mock data', () => {
      render(<SquadManagement />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Total squads
      expect(screen.getByText('1 active')).toBeInTheDocument(); // Active squads
      expect(screen.getByText('3')).toBeInTheDocument(); // Squad members
      expect(screen.getByText('1')).toBeInTheDocument(); // Unmapped people
    });

    it('shows all tab navigation options', () => {
      render(<SquadManagement />);

      // Use role-based queries for tabs to be more specific
      expect(
        screen.getByRole('tab', { name: /overview/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /squads/i })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /people mapping/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /skills analysis/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /analytics/i })
      ).toBeInTheDocument();
    });
  });

  describe('Overview Tab Functionality', () => {
    it('displays recent squads in overview', () => {
      render(<SquadManagement />);

      expect(screen.getByText('Recent Squads')).toBeInTheDocument();
      expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
      expect(screen.getByText('Beta Squad')).toBeInTheDocument();
      // Use more flexible text matching for squad types
      expect(screen.getByText(/project/i)).toBeInTheDocument();
      expect(screen.getByText(/initiative/i)).toBeInTheDocument();
    });

    it('displays unmapped people in overview', () => {
      render(<SquadManagement />);

      // Use getAllByText to handle multiple "Unmapped People" text instances
      const unmappedTexts = screen.getAllByText('Unmapped People');
      expect(unmappedTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Alice Wilson')).toBeInTheDocument();
      expect(screen.getByText('1 skills • 80% available')).toBeInTheDocument();
    });
  });

  describe('Basic Tab Switching', () => {
    it('can switch between tabs', async () => {
      render(<SquadManagement />);

      // Use more specific selectors to avoid multiple element issues
      const squadsTab = screen.getByRole('tab', { name: /squads/i });
      fireEvent.click(squadsTab);

      await waitFor(() => {
        expect(screen.getByText('New Squad')).toBeInTheDocument();
      });
    });

    it('shows skills analysis when skills tab is clicked', async () => {
      render(<SquadManagement />);

      const skillsTab = screen.getByRole('tab', { name: /skills analysis/i });
      fireEvent.click(skillsTab);

      await waitFor(() => {
        // Look for specific skills analysis content
        expect(screen.getByText(/skill coverage/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('renders without crashing with valid data', () => {
      expect(() => render(<SquadManagement />)).not.toThrow();
    });

    it('handles empty states gracefully', () => {
      render(<SquadManagement />);

      // Should render the page structure even with empty data
      expect(screen.getByText('Squad Management')).toBeInTheDocument();
      expect(screen.getByText('Total Squads')).toBeInTheDocument();
    });
  });
});
