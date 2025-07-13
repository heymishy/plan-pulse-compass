import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@/test/utils/test-utils';
import SquadManagement from '@/pages/SquadManagement';
import { Squad, SquadMember, Person, UnmappedPerson } from '@/types';

// Mock data
const mockSquads: Squad[] = [
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
];

const mockSquadMembers: SquadMember[] = [
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
];

const mockPeople: Person[] = [
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
      { skillId: 'skill2', skillName: 'TypeScript', proficiency: 'advanced' },
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
      { skillId: 'skill1', skillName: 'React', proficiency: 'intermediate' },
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
];

const mockUnmappedPeople: UnmappedPerson[] = [
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
];

const mockAppContextValue = {
  squads: mockSquads,
  squadMembers: mockSquadMembers,
  people: mockPeople,
  unmappedPeople: mockUnmappedPeople,
  divisions: [],
  teams: [],
  projects: [],
  skills: [],
  roles: [],
  getSquadMembers: vi.fn(squadId =>
    mockSquadMembers.filter(m => m.squadId === squadId && m.isActive)
  ),
  getPersonSquads: vi.fn(personId =>
    mockSquadMembers
      .filter(m => m.personId === personId && m.isActive)
      .map(m => m.squadId)
  ),
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
  // Add other required context methods as mocks
  epics: [],
  milestones: [],
  allocations: [],
  workItems: [],
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
};

// Mock useApp hook
vi.mock('@/context/AppContext', async () => {
  const actual = await vi.importActual('@/context/AppContext');
  return {
    ...actual,
    useApp: () => mockAppContextValue,
  };
});

// Mock canvas context for SquadCanvas
const mockGetContext = vi.fn(() => ({
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  set fillStyle(value: string) {},
  set strokeStyle(value: string) {},
  set lineWidth(value: number) {},
  set globalAlpha(value: number) {},
  set font(value: string) {},
  set textAlign(value: string) {},
  set textBaseline(value: string) {},
}));

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
global.ResizeObserver = MockResizeObserver;

// Test wrapper is provided by test-utils, no need for additional wrapper

describe('Squad Management UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Layout and Navigation', () => {
    it('renders squad management page with all main sections', () => {
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
      expect(screen.getByText('Unmapped People')).toBeInTheDocument();
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

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Squads')).toBeInTheDocument();
      expect(screen.getByText('People Mapping')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Skills Analysis')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  describe('Overview Tab Functionality', () => {
    it('displays recent squads in overview', () => {
      render(<SquadManagement />);

      expect(screen.getByText('Recent Squads')).toBeInTheDocument();
      expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
      expect(screen.getByText('Beta Squad')).toBeInTheDocument();
      expect(screen.getByText('project')).toBeInTheDocument();
      expect(screen.getByText('initiative')).toBeInTheDocument();
    });

    it('displays unmapped people in overview', () => {
      render(<SquadManagement />);

      expect(screen.getByText('Unmapped People')).toBeInTheDocument();
      expect(screen.getByText('Alice Wilson')).toBeInTheDocument();
      expect(screen.getByText('1 skills • 80% available')).toBeInTheDocument();
    });

    it('shows map to squad button for unmapped people', () => {
      render(<SquadManagement />);

      const mapButtons = screen.getAllByText('Map to Squad');
      expect(mapButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Squads Tab Functionality', () => {
    it('switches to squads tab and shows squad builder', async () => {
      render(<SquadManagement />);

      const squadsTab = screen.getByText('Squads');
      fireEvent.click(squadsTab);

      await waitFor(() => {
        expect(screen.getByText('Squads (2)')).toBeInTheDocument();
        expect(screen.getByText('New Squad')).toBeInTheDocument();
      });
    });

    it('displays squad cards with correct information', async () => {
      render(<SquadManagement />);

      const squadsTab = screen.getByText('Squads');
      fireEvent.click(squadsTab);

      await waitFor(() => {
        expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
        expect(screen.getByText('Beta Squad')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('planning')).toBeInTheDocument();
      });
    });

    it('opens create squad dialog when new squad button is clicked', async () => {
      render(<SquadManagement />);

      const squadsTab = screen.getByText('Squads');
      fireEvent.click(squadsTab);

      await waitFor(() => {
        const newSquadButton = screen.getByText('New Squad');
        fireEvent.click(newSquadButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Squad')).toBeInTheDocument();
        expect(screen.getByLabelText('Squad Name')).toBeInTheDocument();
      });
    });
  });

  describe('People Mapping Tab Functionality', () => {
    it('switches to people mapping tab and shows mapping interface', async () => {
      render(<SquadManagement />);

      const mappingTab = screen.getByText('People Mapping');
      fireEvent.click(mappingTab);

      await waitFor(() => {
        expect(screen.getByText('People to Squad Mapping')).toBeInTheDocument();
        expect(screen.getByText('Squad Overview')).toBeInTheDocument();
      });
    });

    it('displays unmapped people component in mapping tab', async () => {
      render(<SquadManagement />);

      const mappingTab = screen.getByText('People Mapping');
      fireEvent.click(mappingTab);

      await waitFor(() => {
        expect(screen.getByText('Unmapped People (1)')).toBeInTheDocument();
        expect(screen.getByText('Alice Wilson')).toBeInTheDocument();
      });
    });

    it('shows squad overview with capacity information', async () => {
      render(<SquadManagement />);

      const mappingTab = screen.getByText('People Mapping');
      fireEvent.click(mappingTab);

      await waitFor(() => {
        expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
        expect(screen.getByText('2 / 5 members')).toBeInTheDocument();
        expect(screen.getByText('40% capacity')).toBeInTheDocument();
      });
    });
  });

  describe('Import Tab Functionality', () => {
    it('switches to import tab and shows import system', async () => {
      render(<SquadManagement />);

      const importTab = screen.getByText('Import');
      fireEvent.click(importTab);

      await waitFor(() => {
        expect(screen.getByText('Bulk Import System')).toBeInTheDocument();
        expect(screen.getByText('CSV Import')).toBeInTheDocument();
        expect(screen.getByText('JSON Import')).toBeInTheDocument();
      });
    });

    it('opens import dialog when import button is clicked', async () => {
      render(<SquadManagement />);

      const importTab = screen.getByText('Import');
      fireEvent.click(importTab);

      await waitFor(() => {
        const importButton = screen.getByText('Import Squads');
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Import Squads and Members')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Skills Analysis Tab Functionality', () => {
    it('switches to skills analysis tab and shows analyzer', async () => {
      render(<SquadManagement />);

      const skillsTab = screen.getByText('Skills Analysis');
      fireEvent.click(skillsTab);

      await waitFor(() => {
        expect(screen.getByText('Skills Analysis')).toBeInTheDocument();
        expect(
          screen.getByText('Overview of skills across all squads')
        ).toBeInTheDocument();
      });
    });

    it('displays skills analysis tabs', async () => {
      render(<SquadManagement />);

      const skillsTab = screen.getByText('Skills Analysis');
      fireEvent.click(skillsTab);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });
    });

    it('shows skill category filter', async () => {
      render(<SquadManagement />);

      const skillsTab = screen.getByText('Skills Analysis');
      fireEvent.click(skillsTab);

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tab Functionality', () => {
    it('switches to analytics tab and shows canvas visualization', async () => {
      render(<SquadManagement />);

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(
          screen.getByText('Squad Analytics & Visualization')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Squad Canvas - Squads View')
        ).toBeInTheDocument();
      });
    });

    it('displays view mode buttons for canvas', async () => {
      render(<SquadManagement />);

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('Squads')).toBeInTheDocument();
        expect(screen.getByText('Skills')).toBeInTheDocument();
        expect(screen.getByText('Network')).toBeInTheDocument();
      });
    });

    it('changes canvas view mode when view buttons are clicked', async () => {
      render(<SquadManagement />);

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        const skillsViewButton = screen
          .getAllByText('Skills')
          .find(el => el.closest('button'));
        if (skillsViewButton) {
          fireEvent.click(skillsViewButton);
        }
      });

      await waitFor(() => {
        expect(
          screen.getByText('Squad Canvas - Skills View')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('allows squad selection and updates details', async () => {
      render(<SquadManagement />);

      const squadsTab = screen.getByText('Squads');
      fireEvent.click(squadsTab);

      await waitFor(() => {
        const alphaSquadCard = screen
          .getByText('Alpha Squad')
          .closest('.cursor-pointer');
        if (alphaSquadCard) {
          fireEvent.click(alphaSquadCard);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Squad Members (2)')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('handles search functionality in unmapped people', async () => {
      render(<SquadManagement />);

      const mappingTab = screen.getByText('People Mapping');
      fireEvent.click(mappingTab);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search people...');
        fireEvent.change(searchInput, { target: { value: 'Alice' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Alice Wilson')).toBeInTheDocument();
      });
    });

    it('shows bulk action buttons when people are selected', async () => {
      render(<SquadManagement />);

      const mappingTab = screen.getByText('People Mapping');
      fireEvent.click(mappingTab);

      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[1]; // Skip select all checkbox
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(screen.getByText('Assign to Squad')).toBeInTheDocument();
        expect(screen.getByText('Create Squad')).toBeInTheDocument();
      });
    });

    it('handles zoom controls in canvas', async () => {
      render(<SquadManagement />);

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();

        const zoomButtons = screen.getAllByRole('button');
        const zoomInButton = zoomButtons.find(btn =>
          btn.querySelector('svg')?.getAttribute('class')?.includes('lucide')
        );

        if (zoomInButton) {
          fireEvent.click(zoomInButton);
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('shows empty state when no squads exist', () => {
      const emptyContext = {
        ...mockAppContextValue,
        squads: [],
        squadMembers: [],
      };

      vi.mocked(mockAppContextValue).squads = [];
      vi.mocked(mockAppContextValue).squadMembers = [];

      render(<SquadManagement />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Total squads should be 0
    });

    it('handles missing data gracefully', () => {
      const incompleteContext = {
        ...mockAppContextValue,
        people: [],
      };

      vi.mocked(mockAppContextValue).people = [];

      render(<SquadManagement />);

      // Should not crash and should render the page
      expect(screen.getByText('Squad Management')).toBeInTheDocument();
    });

    it('validates form inputs when creating squads', async () => {
      render(<SquadManagement />);

      const squadsTab = screen.getByText('Squads');
      fireEvent.click(squadsTab);

      await waitFor(() => {
        const newSquadButton = screen.getByText('New Squad');
        fireEvent.click(newSquadButton);
      });

      await waitFor(() => {
        const createButton = screen.getByText('Create Squad');
        fireEvent.click(createButton);
      });

      // Should not call addSquad if validation fails
      expect(mockAppContextValue.addSquad).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<SquadManagement />);

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check for proper tablist
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // Check for proper tab panels
      const tabpanels = screen.getAllByRole('tabpanel');
      expect(tabpanels.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      render(<SquadManagement />);

      const firstTab = screen.getByText('Overview');
      firstTab.focus();

      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

      // Should navigate to next tab
      await waitFor(() => {
        const secondTab = screen.getByText('Squads');
        expect(document.activeElement).toBe(secondTab);
      });
    });
  });
});
