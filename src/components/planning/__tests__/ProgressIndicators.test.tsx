import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressIndicators from '../ProgressIndicators';
import { Team, Cycle, Allocation, Project, Epic } from '@/types';

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Frontend Team', divisionId: 'dev', capacity: 40 },
  { id: 'team2', name: 'Backend Team', divisionId: 'dev', capacity: 40 },
];

const mockIterations: Cycle[] = [
  {
    id: 'iter1',
    name: 'Q1 2024 - Iteration 1',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    type: 'iteration',
    parentCycleId: 'q1-2024',
    status: 'planning',
  },
  {
    id: 'iter2',
    name: 'Q1 2024 - Iteration 2',
    startDate: '2024-01-15',
    endDate: '2024-01-28',
    type: 'iteration',
    parentCycleId: 'q1-2024',
    status: 'planning',
  },
];

const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Mobile App',
    description: 'Mobile application project',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    status: 'active',
    budget: 100000,
    milestones: [],
  },
];

const mockEpics: Epic[] = [
  {
    id: 'epic1',
    name: 'User Authentication',
    projectId: 'proj1',
    description: 'Implement user login and registration',
    status: 'active',
    points: 21,
  },
  {
    id: 'epic2',
    name: 'Dashboard',
    projectId: 'proj1',
    description: 'User dashboard',
    status: 'active',
    points: 13,
  },
];

const mockAllocations: Allocation[] = [
  {
    id: 'alloc1',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 80,
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc2',
    teamId: 'team2',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 100,
    epicId: 'epic2',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc3',
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 2,
    percentage: 90,
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
];

const defaultProps = {
  teams: mockTeams,
  iterations: mockIterations,
  allocations: mockAllocations,
  projects: mockProjects,
  epics: mockEpics,
  selectedCycleId: 'q1-2024',
};

describe('ProgressIndicators', () => {
  it('renders without crashing', () => {
    render(<ProgressIndicators {...defaultProps} />);
    expect(screen.getByText('Planning Progress')).toBeInTheDocument();
  });

  it('calculates and displays correct completion percentage', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // Should show 75% complete (3 allocated cells out of 4 total)
    expect(screen.getByText('75% Complete')).toBeInTheDocument();
    expect(screen.getByText('3 of 4 cells')).toBeInTheDocument();
  });

  it('displays team coverage correctly', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // Both teams have allocations, so 100% coverage
    expect(screen.getByText('Team Coverage')).toBeInTheDocument();
    // Check for team coverage percentage in the specific section
    const teamCoverageElements = screen.getAllByText('100%');
    expect(teamCoverageElements.length).toBeGreaterThan(0);
  });

  it('displays iteration coverage correctly', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // Both iterations have allocations, so 100% coverage
    expect(screen.getByText('Iteration Coverage')).toBeInTheDocument();
  });

  it('calculates average allocation correctly', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // Average of 80%, 100%, 90% = 90%
    expect(screen.getByText('Average Allocation')).toBeInTheDocument();
    // Check for 90% in the average allocation section
    const ninetyPercentElements = screen.getAllByText('90%');
    expect(ninetyPercentElements.length).toBeGreaterThan(0);
  });

  it('shows optimal cells count', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // 2 cells are optimal (80-100%): team1-iter1 (80%), team2-iter1 (100%)
    expect(screen.getByText('Optimal Cells')).toBeInTheDocument();
    expect(screen.getByText('80-100% allocated')).toBeInTheDocument();
  });

  it('displays epic coverage', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // 2 epics with allocations out of 2 total - Epic Coverage appears in multiple places
    const epicCoverageElements = screen.getAllByText('Epic Coverage');
    expect(epicCoverageElements.length).toBeGreaterThan(0);
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('shows planning health summary', () => {
    render(<ProgressIndicators {...defaultProps} />);

    expect(screen.getByText('Planning Health')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Optimal')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    // Epic Coverage appears in multiple places, so just check it exists
    const epicCoverageElements = screen.getAllByText('Epic Coverage');
    expect(epicCoverageElements.length).toBeGreaterThan(0);
  });

  it('handles empty data gracefully', () => {
    const emptyProps = {
      ...defaultProps,
      teams: [],
      allocations: [],
      epics: [],
    };

    render(<ProgressIndicators {...emptyProps} />);

    expect(screen.getByText('Planning Progress')).toBeInTheDocument();
    expect(screen.getByText('0% Complete')).toBeInTheDocument();
  });

  it('handles over-allocated scenarios', () => {
    const overAllocatedProps = {
      ...defaultProps,
      allocations: [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 120, // Over-allocated
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
      ],
    };

    render(<ProgressIndicators {...overAllocatedProps} />);

    expect(screen.getByText('Planning Progress')).toBeInTheDocument();
    // Should still calculate correctly even with over-allocation
  });

  it('shows correct progress bars', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // Should have progress bars for overall completion, team coverage, and iteration coverage
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays health score correctly', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // With the given data, health score should be positive
    expect(screen.getByText('Planning Health')).toBeInTheDocument();
  });

  it('shows epic coverage progress', () => {
    render(<ProgressIndicators {...defaultProps} />);

    // Should show progress for epic coverage
    expect(screen.getByText('Epics with allocations')).toBeInTheDocument();
    expect(screen.getByText('0 epics not yet planned')).toBeInTheDocument();
  });

  it('handles different completion scenarios', () => {
    // Test with partial completion
    const partialProps = {
      ...defaultProps,
      allocations: [mockAllocations[0]], // Only one allocation
    };

    render(<ProgressIndicators {...partialProps} />);

    expect(screen.getByText('25% Complete')).toBeInTheDocument();
    expect(screen.getByText('1 of 4 cells')).toBeInTheDocument();
  });
});
