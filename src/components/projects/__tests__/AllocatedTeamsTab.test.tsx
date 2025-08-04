import React from 'react';
import { screen, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApp } from '@/context/AppContext';
import {
  Project,
  Epic,
  Allocation,
  Team,
  Person,
  Role,
  Cycle,
  FinancialYear,
  Division,
  ProjectSkill,
} from '@/types';
import AllocatedTeamsTab from '../AllocatedTeamsTab';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock the financial calculations
vi.mock('@/utils/teamAllocationCalculations', () => ({
  calculateTeamAllocations: vi.fn(),
  calculateTimePeriodTotals: vi.fn(),
  findRelatedProjects: vi.fn(),
  aggregateTeamAllocationsToQuarterly: vi.fn(),
}));

// Mock data following exact TypeScript interfaces
const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'in-progress',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: 100000,
  milestones: [],
  priority: 1,
  ranking: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
};

const mockEpics: Epic[] = [
  {
    id: 'epic-1',
    name: 'Epic 1',
    description: 'Test epic 1',
    projectId: 'project-1',
    status: 'in-progress',
    priority: 'high',
    estimatedEffort: 10,
    ranking: 1,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Frontend Team',
    description: 'Frontend development team',
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
    description: 'Backend development team',
    type: 'permanent',
    status: 'active',
    capacity: 40,
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
    teamId: 'team-1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2024-01-01',
    skills: ['React', 'TypeScript'],
  },
  {
    id: 'person-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'role-2',
    teamId: 'team-2',
    isActive: true,
    employmentType: 'contractor',
    startDate: '2024-01-01',
    skills: ['Node.js', 'PostgreSQL'],
  },
];

const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Frontend Developer',
    rateType: 'annual',
    defaultAnnualSalary: 80000,
    description: 'Frontend developer role',
  },
  {
    id: 'role-2',
    name: 'Backend Developer',
    rateType: 'annual',
    defaultAnnualSalary: 85000,
    description: 'Backend developer role',
  },
];

const mockCycles: Cycle[] = [
  {
    id: 'cycle-1',
    name: 'Q1 2024',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    type: 'quarterly',
    financialYearId: 'fy-2024',
  },
  {
    id: 'cycle-2',
    name: 'Q2 2024',
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    type: 'quarterly',
    financialYearId: 'fy-2024',
  },
];

const mockFinancialYears: FinancialYear[] = [
  {
    id: 'fy-2024',
    name: 'FY 2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    quarters: ['cycle-1', 'cycle-2'],
  },
];

const mockAllocations: Allocation[] = [
  {
    id: 'alloc-1',
    teamId: 'team-1',
    cycleId: 'cycle-1',
    iterationNumber: 1,
    epicId: 'epic-1',
    percentage: 80,
    notes: 'Frontend work',
  },
  {
    id: 'alloc-2',
    teamId: 'team-2',
    cycleId: 'cycle-1',
    iterationNumber: 1,
    epicId: 'epic-1',
    percentage: 60,
    notes: 'Backend work',
  },
];

const mockDivisions: Division[] = [
  {
    id: 'div-1',
    name: 'Engineering',
    description: 'Engineering division',
    budget: 1000000,
  },
];

const mockProjectSkills: ProjectSkill[] = [
  {
    id: 'ps-1',
    projectId: 'project-1',
    skillId: 'skill-1',
    importance: 'high',
    notes: 'React skills needed',
  },
];

// Mock calculation results
const mockTeamAllocationSummaries = [
  {
    teamId: 'team-1',
    teamName: 'Frontend Team',
    allocations: [
      {
        periodId: 'cycle-1',
        periodName: 'Q1 2024',
        periodType: 'quarter' as const,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        allocatedPercentage: 80,
        cost: 15000,
        teamMembers: [
          {
            personId: 'person-1',
            personName: 'John Doe',
            allocatedPercentage: 80,
            cost: 15000,
            skills: ['React', 'TypeScript'],
          },
        ],
      },
    ],
    totalCost: 15000,
    totalAllocatedPercentage: 80,
  },
  {
    teamId: 'team-2',
    teamName: 'Backend Team',
    allocations: [
      {
        periodId: 'cycle-1',
        periodName: 'Q1 2024',
        periodType: 'quarter' as const,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        allocatedPercentage: 60,
        cost: 12000,
        teamMembers: [
          {
            personId: 'person-2',
            personName: 'Jane Smith',
            allocatedPercentage: 60,
            cost: 12000,
            skills: ['Node.js', 'PostgreSQL'],
          },
        ],
      },
    ],
    totalCost: 12000,
    totalAllocatedPercentage: 60,
  },
];

const mockTimePeriodTotals = [
  {
    periodId: 'cycle-1',
    periodName: 'Q1 2024',
    periodType: 'quarter' as const,
    totalCost: 27000,
    totalAllocatedPercentage: 140,
    teamsCount: 2,
  },
];

const mockRelatedProjects = [
  {
    projectId: 'project-2',
    projectName: 'Related Project',
    requiredSkills: ['React', 'Node.js'],
    matchingSkills: ['React'],
    matchPercentage: 50,
    requiredTeams: ['team-1'],
    conflictingTeams: ['team-1'],
  },
];

const mockAppConfig = {
  workingDaysPerWeek: 5,
  workingHoursPerDay: 8,
  workingDaysPerYear: 260,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  financialYear: mockFinancialYears[0],
  iterationLength: 'fortnightly' as const,
  quarters: mockCycles,
};

// Mock quarterly allocation data for new function
const mockQuarterlyAllocations = [
  {
    teamId: 'team-1',
    teamName: 'Frontend Team',
    financialYear: 'FY2024',
    quarters: {
      Q1: {
        allocation: 80,
        cost: 15000,
        hasAllocation: true,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        periodCount: 1,
      },
      Q2: {
        allocation: 0,
        cost: 0,
        hasAllocation: false,
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        periodCount: 0,
      },
      Q3: {
        allocation: 0,
        cost: 0,
        hasAllocation: false,
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        periodCount: 0,
      },
      Q4: {
        allocation: 0,
        cost: 0,
        hasAllocation: false,
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        periodCount: 0,
      },
    },
    totalCost: 15000,
    totalAllocation: 80,
  },
  {
    teamId: 'team-2',
    teamName: 'Backend Team',
    financialYear: 'FY2024',
    quarters: {
      Q1: {
        allocation: 60,
        cost: 12000,
        hasAllocation: true,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        periodCount: 1,
      },
      Q2: {
        allocation: 0,
        cost: 0,
        hasAllocation: false,
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        periodCount: 0,
      },
      Q3: {
        allocation: 0,
        cost: 0,
        hasAllocation: false,
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        periodCount: 0,
      },
      Q4: {
        allocation: 0,
        cost: 0,
        hasAllocation: false,
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        periodCount: 0,
      },
    },
    totalCost: 12000,
    totalAllocation: 60,
  },
];

describe('AllocatedTeamsTab', () => {
  const mockAppContext = {
    projects: [mockProject],
    epics: mockEpics,
    allocations: mockAllocations,
    teams: mockTeams,
    people: mockPeople,
    roles: mockRoles,
    cycles: mockCycles,
    financialYears: mockFinancialYears,
    divisions: mockDivisions,
    projectSkills: mockProjectSkills,
    config: mockAppConfig,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(mockAppContext);

    // Setup calculation mocks
    const {
      calculateTeamAllocations,
      calculateTimePeriodTotals,
      findRelatedProjects,
      aggregateTeamAllocationsToQuarterly,
    } = await import('@/utils/teamAllocationCalculations');

    vi.mocked(calculateTeamAllocations).mockReturnValue(
      mockTeamAllocationSummaries
    );
    vi.mocked(calculateTimePeriodTotals).mockReturnValue(mockTimePeriodTotals);
    vi.mocked(findRelatedProjects).mockReturnValue(mockRelatedProjects);
    vi.mocked(aggregateTeamAllocationsToQuarterly).mockReturnValue(
      mockQuarterlyAllocations
    );
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByTestId('allocated-teams-tab')).toBeInTheDocument();
    });

    it('should display the main heading', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(
        screen.getByText('Team Allocations & Cost Analysis')
      ).toBeInTheDocument();
    });

    it('should show team allocations by quarter section', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(
        screen.getByText('Team Allocations by Quarter')
      ).toBeInTheDocument();
    });

    it('should show project summary section', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('Project Summary')).toBeInTheDocument();
    });

    it('should show related projects section', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('Related Projects Analysis')).toBeInTheDocument();
    });
  });

  describe('Quarterly Team Allocations', () => {
    it('should display allocated teams with their names', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getAllByText('Frontend Team')).toHaveLength(2); // Team card + related projects reference
      expect(screen.getByText('Backend Team')).toBeInTheDocument();
    });

    it('should show team costs in correct format', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      // Should display formatted currency amounts (multiple instances are expected)
      expect(screen.getAllByText('$15,000')).toHaveLength(2); // Total cost badge + period cost
      expect(screen.getAllByText('$12,000')).toHaveLength(2); // Total cost badge + period cost for Backend team
    });

    it('should display team allocation percentages', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getAllByText('80%')).toHaveLength(2); // Total allocation + period allocation
      expect(screen.getAllByText('60%')).toHaveLength(2); // Total allocation + period allocation for Backend team
    });

    it('should show quarterly breakdown with quarters', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      // Each team should show Q1, Q2, Q3, Q4 labels (one per team)
      expect(screen.getAllByText('Q1')).toHaveLength(2); // 2 teams × 1 Q1 label each
      expect(screen.getAllByText('Q2')).toHaveLength(2); // 2 teams × 1 Q2 label each
      expect(screen.getAllByText('Q3')).toHaveLength(2); // 2 teams × 1 Q3 label each
      expect(screen.getAllByText('Q4')).toHaveLength(2); // 2 teams × 1 Q4 label each
    });

    it('should display financial year information', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getAllByText('FY2024')).toHaveLength(2); // One for each team
    });
  });

  describe('Project Summary', () => {
    it('should display teams involved count', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Teams count
      expect(screen.getByText('Teams Involved')).toBeInTheDocument();
    });

    it('should show total budget', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('$27,000')).toBeInTheDocument(); // Total of 15k + 12k
      expect(screen.getByText('Total Budget')).toBeInTheDocument();
    });

    it('should display average team allocation', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('70%')).toBeInTheDocument(); // Average of 80% and 60%
      expect(screen.getByText('Avg Team Allocation')).toBeInTheDocument();
    });
  });

  describe('Related Projects Analysis', () => {
    it('should display related project names', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('Related Project')).toBeInTheDocument();
    });

    it('should show skill match percentages', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('50% match')).toBeInTheDocument();
    });

    it('should display required skills', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      // Should show skills in related projects and team member badges
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0);
    });

    it('should show matching skills', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('Matching:')).toBeInTheDocument();
    });

    it('should display conflicting teams when they exist', () => {
      render(<AllocatedTeamsTab project={mockProject} />);

      expect(screen.getByText('Team Conflicts:')).toBeInTheDocument();
      expect(screen.getAllByText('Frontend Team')).toHaveLength(2); // Team header + conflict reference
    });
  });

  describe('Empty States', () => {
    it('should handle projects with no team allocations', async () => {
      const { calculateTeamAllocations, aggregateTeamAllocationsToQuarterly } =
        await import('@/utils/teamAllocationCalculations');
      vi.mocked(calculateTeamAllocations).mockReturnValue([]);
      vi.mocked(aggregateTeamAllocationsToQuarterly).mockReturnValue([]);

      render(<AllocatedTeamsTab project={mockProject} />);

      expect(
        screen.getByText('No team allocations found for this project.')
      ).toBeInTheDocument();
    });

    it('should handle projects with no related projects', async () => {
      const { findRelatedProjects } = await import(
        '@/utils/teamAllocationCalculations'
      );
      vi.mocked(findRelatedProjects).mockReturnValue([]);

      render(<AllocatedTeamsTab project={mockProject} />);

      expect(
        screen.getByText(
          'No related projects found based on skill requirements.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Data Integration', () => {
    it('should call calculateTeamAllocations with correct parameters', async () => {
      const { calculateTeamAllocations } = await import(
        '@/utils/teamAllocationCalculations'
      );

      render(<AllocatedTeamsTab project={mockProject} />);

      expect(calculateTeamAllocations).toHaveBeenCalledWith(
        mockProject,
        mockEpics,
        mockAllocations,
        mockTeams,
        mockPeople,
        mockRoles,
        mockCycles,
        mockFinancialYears,
        mockAppConfig
      );
    });

    it('should call aggregateTeamAllocationsToQuarterly with team summaries', async () => {
      const { aggregateTeamAllocationsToQuarterly } = await import(
        '@/utils/teamAllocationCalculations'
      );

      render(<AllocatedTeamsTab project={mockProject} />);

      expect(aggregateTeamAllocationsToQuarterly).toHaveBeenCalledWith(
        mockTeamAllocationSummaries,
        mockFinancialYears,
        mockCycles
      );
    });

    it('should call findRelatedProjects with correct parameters', async () => {
      const { findRelatedProjects } = await import(
        '@/utils/teamAllocationCalculations'
      );

      render(<AllocatedTeamsTab project={mockProject} />);

      expect(findRelatedProjects).toHaveBeenCalledWith(
        mockProject,
        [mockProject],
        mockProjectSkills,
        mockTeamAllocationSummaries
      );
    });
  });
});
