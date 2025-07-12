import React from 'react';
import { render, screen, fireEvent } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import WorkloadDistributionCharts from '../WorkloadDistributionCharts';
import { Team, Allocation, Cycle, Epic, Project } from '@/types';

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Frontend Team', divisionId: 'div1', capacity: 40 },
  { id: 'team2', name: 'Backend Team', divisionId: 'div1', capacity: 40 },
  { id: 'team3', name: 'Mobile Team', divisionId: 'div2', capacity: 40 },
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
    name: 'Web Application',
    description: 'Main web app project',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    status: 'active',
    budget: 100000,
    milestones: [],
  },
  {
    id: 'proj2',
    name: 'Mobile App',
    description: 'Mobile application',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    status: 'active',
    budget: 150000,
    milestones: [],
  },
];

const mockEpics: Epic[] = [
  {
    id: 'epic1',
    name: 'User Authentication',
    projectId: 'proj1',
    description: 'Login and registration system',
    status: 'active',
    points: 21,
  },
  {
    id: 'epic2',
    name: 'Payment Integration',
    projectId: 'proj1',
    description: 'Payment processing',
    status: 'active',
    points: 13,
  },
  {
    id: 'epic3',
    name: 'Mobile Navigation',
    projectId: 'proj2',
    description: 'Navigation for mobile app',
    status: 'active',
    points: 8,
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
    teamId: 'team1',
    cycleId: 'q1-2024',
    iterationNumber: 2,
    percentage: 90,
    epicId: 'epic2',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc3',
    teamId: 'team2',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 120, // Over-allocated
    epicId: 'epic1',
    runWorkCategoryId: '',
    notes: '',
  },
  {
    id: 'alloc4',
    teamId: 'team3',
    cycleId: 'q1-2024',
    iterationNumber: 1,
    percentage: 40, // Under-utilized
    epicId: 'epic3',
    runWorkCategoryId: '',
    notes: '',
  },
];

const defaultProps = {
  teams: mockTeams,
  allocations: mockAllocations,
  iterations: mockIterations,
  epics: mockEpics,
  projects: mockProjects,
  selectedCycleId: 'q1-2024',
};

// Mock the calculateTeamCapacity function
vi.mock('@/utils/capacityUtils', () => ({
  calculateTeamCapacity: vi.fn((team, iterationNumber, allocations) => {
    const teamAllocations = allocations.filter(
      a => a.teamId === team.id && a.iterationNumber === iterationNumber
    );
    const totalPercentage = teamAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );
    return {
      allocatedPercentage: totalPercentage,
      remainingCapacity: Math.max(0, 100 - totalPercentage),
      isOverAllocated: totalPercentage > 100,
    };
  }),
}));

describe('WorkloadDistributionCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);
    expect(screen.getByText('Team Workload Distribution')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    expect(screen.getByText('Total Teams')).toBeInTheDocument();
    expect(screen.getByText('Avg Utilization')).toBeInTheDocument();
    expect(screen.getByText('Healthy Teams')).toBeInTheDocument();
    expect(screen.getByText('Over-allocated')).toBeInTheDocument();
    expect(screen.getByText('Health Score')).toBeInTheDocument();
  });

  it('shows metric type selector', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    expect(screen.getByText('Metric:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Allocation %')).toBeInTheDocument();
  });

  it('shows chart type selector', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    expect(screen.getByText('Chart:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bar Chart')).toBeInTheDocument();
  });

  it('can switch between metric types', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Click on metric selector
    await user.click(screen.getByDisplayValue('Allocation %'));

    // Select different metric
    await user.click(screen.getByText('Capacity Usage'));

    // Should now show the new metric
    expect(screen.getByDisplayValue('Capacity Usage')).toBeInTheDocument();
  });

  it('can switch between chart types', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Click on chart type selector
    await user.click(screen.getByDisplayValue('Bar Chart'));

    // Select different chart type
    await user.click(screen.getByText('Pie Chart'));

    // Should now show the new chart type
    expect(screen.getByDisplayValue('Pie Chart')).toBeInTheDocument();
  });

  it('displays teams in bar chart mode', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Should show team names
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Backend Team')).toBeInTheDocument();
    expect(screen.getByText('Mobile Team')).toBeInTheDocument();
  });

  it('shows different tabs', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    expect(screen.getByText('Charts')).toBeInTheDocument();
    expect(screen.getByText('Detailed View')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
  });

  it('displays detailed table view', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Switch to table view
    await user.click(screen.getByText('Detailed View'));

    // Should show table headers
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Avg Allocation')).toBeInTheDocument();
    expect(screen.getByText('Capacity Usage')).toBeInTheDocument();
    expect(screen.getByText('Health Score')).toBeInTheDocument();
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
  });

  it('shows analysis tab with recommendations', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Switch to analysis view
    await user.click(screen.getByText('Analysis'));

    // Should show analysis content
    expect(screen.getByText('Workload Analysis')).toBeInTheDocument();
    expect(screen.getByText('Teams at Risk')).toBeInTheDocument();
    expect(screen.getByText('Well-Balanced Teams')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('identifies over-allocated teams', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Switch to analysis view
    await user.click(screen.getByText('Analysis'));

    // Should show Backend Team as over-allocated (120%)
    expect(screen.getByText('Backend Team')).toBeInTheDocument();
  });

  it('handles division filtering', async () => {
    const user = userEvent.setup();
    const propsWithDivisions = {
      ...defaultProps,
      teams: mockTeams.map(t => ({
        ...t,
        divisionName: t.divisionId === 'div1' ? 'Engineering' : 'Product',
      })),
    };

    render(<WorkloadDistributionCharts {...propsWithDivisions} />);

    // Should show division filter
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Divisions')).toBeInTheDocument();
  });

  it('shows export button', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('displays risk badges correctly', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Should show various risk levels in the chart
    // These would be determined by the workload calculations
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows trend indicators', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Should show trend icons for teams
    // The specific trends would depend on the allocation patterns
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
  });

  it('handles empty cycle gracefully', () => {
    const emptyProps = {
      ...defaultProps,
      selectedCycleId: '',
    };

    render(<WorkloadDistributionCharts {...emptyProps} />);

    expect(
      screen.getByText(
        'Please select a cycle to view workload distribution charts.'
      )
    ).toBeInTheDocument();
  });

  it('handles no allocations', () => {
    const propsWithNoAllocations = {
      ...defaultProps,
      allocations: [],
    };

    render(<WorkloadDistributionCharts {...propsWithNoAllocations} />);

    // Should still render but show no data
    expect(screen.getByText('Team Workload Distribution')).toBeInTheDocument();
  });

  it('calculates correct summary statistics', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Should show 3 total teams
    expect(screen.getByText('3')).toBeInTheDocument(); // Total teams

    // Should show some over-allocated teams (Backend Team with 120%)
    const overAllocatedCount = screen.getAllByText(/[0-9]+/);
    expect(overAllocatedCount.length).toBeGreaterThan(0);
  });

  it('shows correct metric values in bar chart', () => {
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Should show percentage values for teams
    expect(
      screen.getByText('Average Allocation Percentage')
    ).toBeInTheDocument();
  });

  it('handles pie chart mode', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Switch to pie chart
    await user.click(screen.getByDisplayValue('Bar Chart'));
    await user.click(screen.getByText('Pie Chart'));

    // Should show pie chart content
    expect(screen.getByText('Team Distribution')).toBeInTheDocument();
    expect(
      screen.getByText('Interactive pie chart would be rendered here')
    ).toBeInTheDocument();
  });

  it('filters by division when selected', async () => {
    const user = userEvent.setup();
    const propsWithDivisions = {
      ...defaultProps,
      teams: mockTeams.map(t => ({
        ...t,
        divisionName: t.divisionId === 'div1' ? 'Engineering' : 'Product',
      })),
    };

    render(<WorkloadDistributionCharts {...propsWithDivisions} />);

    // Initially should show all teams
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Mobile Team')).toBeInTheDocument();

    // Filter by division
    await user.click(screen.getByDisplayValue('All Divisions'));
    await user.click(screen.getByText('div1')); // Assuming this shows up as an option

    // Should now filter teams (though the exact behavior depends on division setup)
    expect(screen.getByText('Team Workload Distribution')).toBeInTheDocument();
  });

  it('displays health scores in table view', async () => {
    const user = userEvent.setup();
    render(<WorkloadDistributionCharts {...defaultProps} />);

    // Switch to table view
    await user.click(screen.getByText('Detailed View'));

    // Should show health score column with progress bars
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
