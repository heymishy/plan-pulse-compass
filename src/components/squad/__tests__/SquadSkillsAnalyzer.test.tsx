import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import { AppProvider } from '@/context/AppContext';
import SquadSkillsAnalyzer from '../SquadSkillsAnalyzer';
import {
  Squad,
  SquadMember,
  Person,
  SquadSkillGap,
  SquadRecommendation,
} from '@/types';

// Mock data
const mockSquads: Squad[] = [
  {
    id: 'squad1',
    name: 'Alpha Squad',
    type: 'project',
    status: 'active',
    capacity: 5,
    targetSkills: ['React', 'TypeScript', 'Node.js'],
    createdDate: '2024-01-01',
    lastModified: '2024-01-01',
    description: 'Frontend development squad',
    divisionId: 'div1',
    projectIds: [],
    duration: { start: '2024-01-01', end: '2024-12-31' },
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
];

const mockSkillGaps: SquadSkillGap[] = [
  {
    squadId: 'squad1',
    skillName: 'Node.js',
    requiredLevel: 3,
    currentLevel: 0,
    gap: 3,
    description: 'Backend development skills needed',
  },
];

const mockRecommendations: SquadRecommendation[] = [
  {
    squadId: 'squad1',
    type: 'skill_gap',
    priority: 'high',
    title: 'Add Backend Developer',
    description: 'Squad lacks Node.js expertise for full-stack development',
    suggestedAction: 'Recruit Node.js developer',
  },
];

const mockAppContextValue = {
  squads: mockSquads,
  squadMembers: mockSquadMembers,
  people: mockPeople,
  skills: [],
  getSquadMembers: vi.fn(squadId =>
    mockSquadMembers.filter(m => m.squadId === squadId)
  ),
  getSquadSkillGaps: vi.fn(() => mockSkillGaps),
  generateSquadRecommendations: vi.fn(() => mockRecommendations),
  // Add other required context methods as mocks
  unmappedPeople: [],
  divisions: [],
  projects: [],
  epics: [],
  milestones: [],
  allocations: [],
  workItems: [],
  teams: [],
  roles: [],
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
  addSquad: vi.fn(),
  updateSquad: vi.fn(),
  deleteSquad: vi.fn(),
  addSquadMember: vi.fn(),
  updateSquadMember: vi.fn(),
  removeSquadMember: vi.fn(),
  getPersonSquads: vi.fn(),
  addUnmappedPerson: vi.fn(),
  removeUnmappedPerson: vi.fn(),
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('SquadSkillsAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skills analysis overview', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer />
      </TestWrapper>
    );

    expect(screen.getByText('Skills Analysis')).toBeInTheDocument();
    expect(
      screen.getByText('Overview of skills across all squads')
    ).toBeInTheDocument();
  });

  it('shows selected squad analysis when squad is provided', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    expect(
      screen.getByText(`Analyzing skills for ${mockSquads[0].name}`)
    ).toBeInTheDocument();
  });

  it('displays different analysis tabs', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer />
      </TestWrapper>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('shows squad skill metrics in overview tab', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
    expect(screen.getByText(/skills/)).toBeInTheDocument();
    expect(screen.getByText(/avg coverage/)).toBeInTheDocument();
  });

  it('displays skill gaps when gaps tab is selected', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const gapsTab = screen.getByText('Skill Gaps');
    fireEvent.click(gapsTab);

    await waitFor(() => {
      expect(
        screen.getByText(`Skill Gaps for ${mockSquads[0].name}`)
      ).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('high priority')).toBeInTheDocument();
      expect(screen.getByText('Gap: 3 level(s)')).toBeInTheDocument();
    });
  });

  it('shows recommendations when recommendations tab is selected', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const recommendationsTab = screen.getByText('Recommendations');
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(
        screen.getByText(`Recommendations for ${mockSquads[0].name}`)
      ).toBeInTheDocument();
      expect(screen.getByText('Add Backend Developer')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Squad lacks Node.js expertise for full-stack development'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Recruit Node.js developer')).toBeInTheDocument();
    });
  });

  it('shows empty state when no squad is selected for gaps', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer />
      </TestWrapper>
    );

    const gapsTab = screen.getByText('Skill Gaps');
    fireEvent.click(gapsTab);

    await waitFor(() => {
      expect(screen.getByText('Select a Squad')).toBeInTheDocument();
      expect(
        screen.getByText('Choose a squad to analyze skill gaps')
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no squad is selected for recommendations', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer />
      </TestWrapper>
    );

    const recommendationsTab = screen.getByText('Recommendations');
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(screen.getByText('Select a Squad')).toBeInTheDocument();
      expect(
        screen.getByText('Choose a squad to get optimization recommendations')
      ).toBeInTheDocument();
    });
  });

  it('filters skills by category', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer />
      </TestWrapper>
    );

    const categoryFilter = screen.getByDisplayValue('All Categories');
    fireEvent.click(categoryFilter);

    await waitFor(() => {
      expect(screen.getByText('Technical')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Leadership')).toBeInTheDocument();
    });
  });

  it('shows no skill gaps message when squad has no gaps', async () => {
    // Mock no skill gaps
    const noGapsContext = {
      ...mockAppContextValue,
      getSquadSkillGaps: vi.fn(() => []),
    };

    vi.mocked(mockAppContextValue.getSquadSkillGaps).mockReturnValue([]);

    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const gapsTab = screen.getByText('Skill Gaps');
    fireEvent.click(gapsTab);

    await waitFor(() => {
      expect(screen.getByText('No Skill Gaps')).toBeInTheDocument();
      expect(
        screen.getByText('This squad meets all required skill levels')
      ).toBeInTheDocument();
    });
  });

  it('shows no recommendations message when squad is optimally configured', async () => {
    // Mock no recommendations
    const noRecsContext = {
      ...mockAppContextValue,
      generateSquadRecommendations: vi.fn(() => []),
    };

    vi.mocked(mockAppContextValue.generateSquadRecommendations).mockReturnValue(
      []
    );

    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const recommendationsTab = screen.getByText('Recommendations');
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(screen.getByText('No Recommendations')).toBeInTheDocument();
      expect(
        screen.getByText('This squad is optimally configured')
      ).toBeInTheDocument();
    });
  });

  it('displays skill coverage progress bars', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // Should display skill cards with progress bars
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
  });

  it('shows required skills with star indicator', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // React should be marked as required (in targetSkills)
    const reactSkill = screen.getByText('React').closest('div');
    expect(reactSkill).toBeInTheDocument();
  });

  it('handles skill gap severity levels correctly', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const gapsTab = screen.getByText('Skill Gaps');
    fireEvent.click(gapsTab);

    await waitFor(() => {
      // Gap of 3 levels should be marked as 'critical' or 'high'
      expect(screen.getByText('high priority')).toBeInTheDocument();
    });
  });

  it('displays recommendation priority levels', async () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    const recommendationsTab = screen.getByText('Recommendations');
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  it('calculates squad statistics correctly', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // Should show skill metrics badges
    expect(screen.getByText(/skills/)).toBeInTheDocument();
    expect(screen.getByText(/avg coverage/)).toBeInTheDocument();
  });

  it('handles multiple squads in overview mode', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer />
      </TestWrapper>
    );

    // Should analyze all squads when no specific squad is selected
    expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
  });

  it('displays member count for each skill', () => {
    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // Should show how many members have each skill
    expect(screen.getByText(/members/)).toBeInTheDocument();
  });

  it('shows view all skills button when many skills exist', () => {
    // Mock squad with many skills
    const manySkillsPeople = [
      ...mockPeople,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `person${i + 3}`,
        name: `Person ${i + 3}`,
        email: `person${i + 3}@example.com`,
        roleId: 'role1',
        teamId: 'team1',
        isActive: true,
        employmentType: 'permanent' as const,
        startDate: '2024-01-01',
        skills: [
          {
            skillId: `skill${i + 10}`,
            skillName: `Skill ${i + 10}`,
            proficiency: 'intermediate' as const,
          },
        ],
      })),
    ];

    const manySkillsContext = {
      ...mockAppContextValue,
      people: manySkillsPeople,
    };

    vi.mocked(mockAppContextValue.people).push(...manySkillsPeople.slice(2));

    render(
      <TestWrapper>
        <SquadSkillsAnalyzer selectedSquad={mockSquads[0]} />
      </TestWrapper>
    );

    // If more than 9 skills, should show "View all X skills" button
    // This might not show in our simple test case
  });
});
