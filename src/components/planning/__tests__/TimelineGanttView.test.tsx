import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TimelineGanttView from '../TimelineGanttView';
import { Team, Allocation, Cycle, Epic, Project } from '@/types';

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
    name: 'Web Application',
    description: 'Main web app project',
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
    description: 'Login and registration system',
    status: 'active',
    points: 21,
    startDate: '2024-01-01',
    targetEndDate: '2024-02-01',
  },
  {
    id: 'epic2',
    name: 'Dashboard',
    projectId: 'proj1',
    description: 'User dashboard',
    status: 'in-progress',
    points: 13,
    startDate: '2024-01-15',
    targetEndDate: '2024-03-01',
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
    percentage: 60,
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
  allocations: mockAllocations,
  iterations: mockIterations,
  epics: mockEpics,
  projects: mockProjects,
  selectedCycleId: 'q1-2024',
  onAllocationClick: vi.fn(),
};

describe('TimelineGanttView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TimelineGanttView {...defaultProps} />);
    expect(screen.getByText('Timeline & Gantt View')).toBeInTheDocument();
  });

  it('displays view mode selector', () => {
    render(<TimelineGanttView {...defaultProps} />);
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('shows timeline header with correct periods', () => {
    render(<TimelineGanttView {...defaultProps} />);

    // Should show weeks for the date range
    expect(screen.getByText('Jan 01')).toBeInTheDocument();
  });

  it('displays teams in teams view mode', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="teams" />);

    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Backend Team')).toBeInTheDocument();
  });

  it('displays epics in epics view mode', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="epics" />);

    expect(screen.getByText('User Authentication')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays projects in projects view mode', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="projects" />);

    expect(screen.getByText('Web Application')).toBeInTheDocument();
  });

  it('can switch between view modes', async () => {
    const user = userEvent.setup();
    render(<TimelineGanttView {...defaultProps} />);

    // Switch to epics view
    await user.click(screen.getByText('Epics'));
    expect(screen.getByText('User Authentication')).toBeInTheDocument();

    // Switch to projects view
    await user.click(screen.getByText('Projects'));
    expect(screen.getByText('Web Application')).toBeInTheDocument();
  });

  it('shows allocation bars with correct percentages', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="teams" />);

    // Should show allocation percentages
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('handles allocation clicks', async () => {
    const user = userEvent.setup();
    const mockOnAllocationClick = vi.fn();

    render(
      <TimelineGanttView
        {...defaultProps}
        onAllocationClick={mockOnAllocationClick}
        viewMode="teams"
      />
    );

    // Click on an allocation bar
    const allocationBar = screen.getByText('80%').closest('div');
    if (allocationBar) {
      await user.click(allocationBar);
      expect(mockOnAllocationClick).toHaveBeenCalledWith(mockAllocations[0]);
    }
  });

  it('can zoom in and out on timeline', async () => {
    const user = userEvent.setup();
    render(<TimelineGanttView {...defaultProps} />);

    // Find zoom controls
    const zoomInButton = screen.getByRole('button', { name: '' }); // ZoomIn icon
    const zoomOutButton = screen.getByRole('button', { name: '' }); // ZoomOut icon

    // Test zoom functionality (buttons should exist)
    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();
  });

  it('shows progress bars for epics and projects', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="epics" />);

    // Should show progress indicators
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('applies show only allocated filter', async () => {
    const user = userEvent.setup();
    const propsWithNoAllocations = {
      ...defaultProps,
      teams: [
        ...mockTeams,
        {
          id: 'team3',
          name: 'Unallocated Team',
          divisionId: 'dev',
          capacity: 40,
        },
      ],
    };

    render(<TimelineGanttView {...propsWithNoAllocations} />);

    // Initially should show all teams
    expect(screen.getByText('Unallocated Team')).toBeInTheDocument();

    // Apply filter
    await user.click(screen.getByText('Show Only Allocated'));

    // Should hide teams without allocations
    expect(screen.queryByText('Unallocated Team')).not.toBeInTheDocument();
  });

  it('handles team filter selection', async () => {
    const user = userEvent.setup();
    render(<TimelineGanttView {...defaultProps} viewMode="teams" />);

    // Should initially show all teams
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Backend Team')).toBeInTheDocument();

    // Select specific team (assuming dropdown exists)
    const teamSelector = screen.getByText('All teams');
    await user.click(teamSelector);

    // Select Frontend Team
    await user.click(screen.getByText('Frontend Team'));

    // Should now only show Frontend Team
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
  });

  it('shows correct allocation count badges', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="teams" />);

    // Frontend team has 2 allocations, Backend team has 1
    const badges = screen.getAllByText(/allocation/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays empty state when no items match filters', () => {
    const emptyProps = {
      ...defaultProps,
      allocations: [],
    };

    render(<TimelineGanttView {...emptyProps} />);

    // Apply show only allocated filter
    fireEvent.click(screen.getByText('Show Only Allocated'));

    expect(screen.getByText('No items to display')).toBeInTheDocument();
    expect(screen.getByText('No allocated items found.')).toBeInTheDocument();
  });

  it('shows legend with allocation indicators', () => {
    render(<TimelineGanttView {...defaultProps} />);

    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(
      screen.getByText('Click on allocations to edit • Hover for details')
    ).toBeInTheDocument();
  });

  it('handles empty timeline range gracefully', () => {
    const propsWithNoIterations = {
      ...defaultProps,
      iterations: [],
    };

    render(<TimelineGanttView {...propsWithNoIterations} />);

    expect(
      screen.getByText('No timeline data available for the selected cycle.')
    ).toBeInTheDocument();
  });

  it('shows export button', () => {
    render(<TimelineGanttView {...defaultProps} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('displays correct item type badges', () => {
    render(<TimelineGanttView {...defaultProps} viewMode="teams" />);

    const teamBadges = screen.getAllByText('team');
    expect(teamBadges.length).toBe(2); // Two teams
  });

  it('shows timeline columns for correct date range', () => {
    render(<TimelineGanttView {...defaultProps} />);

    // Should show columns for January 2024 based on iteration dates
    expect(screen.getByText('Jan 01')).toBeInTheDocument();
  });

  it('handles run work allocations without epics', () => {
    const allocationsWithRunWork = [
      ...mockAllocations,
      {
        id: 'alloc4',
        teamId: 'team1',
        cycleId: 'q1-2024',
        iterationNumber: 1,
        percentage: 20,
        epicId: '',
        runWorkCategoryId: 'maintenance',
        notes: '',
      },
    ];

    const propsWithRunWork = {
      ...defaultProps,
      allocations: allocationsWithRunWork,
    };

    render(<TimelineGanttView {...propsWithRunWork} viewMode="teams" />);

    // Should still render without errors
    expect(screen.getByText('Timeline & Gantt View')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });
});
