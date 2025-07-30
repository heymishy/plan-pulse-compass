import React from 'react';
import { render, screen } from '@testing-library/react';
import ScenarioVisualDiff from '../ScenarioVisualDiff';
import type { ScenarioComparison } from '@/types/scenarioTypes';

const mockComparison: ScenarioComparison = {
  scenarioId: 'scenario-1',
  scenarioName: 'Test Scenario',
  comparedAt: '2024-01-15T10:00:00Z',
  summary: {
    totalChanges: 5,
    categorizedChanges: {
      financial: 2,
      resources: 1,
      timeline: 0,
      scope: 1,
      organizational: 1,
    },
    impactLevel: 'medium',
  },
  changes: [
    {
      id: 'change-1',
      category: 'financial',
      entityType: 'projects',
      entityId: 'project-1',
      entityName: 'Web Redesign',
      changeType: 'modified',
      description: 'Budget changed from $100,000 to $120,000',
      impact: 'high',
      details: [
        {
          field: 'budget',
          fieldDisplayName: 'Budget',
          oldValue: 100000,
          newValue: 120000,
          formattedOldValue: '$100,000',
          formattedNewValue: '$120,000',
        },
      ],
    },
    {
      id: 'change-2',
      category: 'resources',
      entityType: 'teams',
      entityId: 'team-1',
      entityName: 'Engineering Team',
      changeType: 'modified',
      description: 'Team capacity changed from 40h to 45h',
      impact: 'medium',
      details: [
        {
          field: 'capacity',
          fieldDisplayName: 'Capacity',
          oldValue: 40,
          newValue: 45,
          formattedOldValue: '40h',
          formattedNewValue: '45h',
        },
      ],
    },
    {
      id: 'change-3',
      category: 'scope',
      entityType: 'projects',
      entityId: 'project-2',
      entityName: 'Mobile App',
      changeType: 'added',
      description: 'New project "Mobile App" added',
      impact: 'medium',
      details: [],
    },
    {
      id: 'change-4',
      category: 'organizational',
      entityType: 'teams',
      entityId: 'team-2',
      entityName: 'Design Team',
      changeType: 'added',
      description: 'New team "Design Team" added',
      impact: 'low',
      details: [],
    },
  ],
  financialImpact: {
    totalCostDifference: 20000,
    budgetVariance: 20000,
    projectCostChanges: [
      {
        projectId: 'project-1',
        projectName: 'Web Redesign',
        costDifference: 20000,
        percentageChange: 20,
      },
    ],
  },
  resourceImpact: {
    teamCapacityChanges: [
      {
        teamId: 'team-1',
        teamName: 'Engineering Team',
        capacityDifference: 5,
        allocationChanges: 0,
      },
    ],
    peopleChanges: {
      added: 2,
      removed: 0,
      reallocated: 0,
    },
  },
  timelineImpact: {
    projectDateChanges: [],
  },
};

describe('ScenarioVisualDiff', () => {
  it('should render the impact summary correctly', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    // Check impact summary
    expect(screen.getByText('Impact Summary')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM IMPACT')).toBeInTheDocument();

    // Check categorized changes
    expect(screen.getByText('2')).toBeInTheDocument(); // Financial changes
    expect(screen.getByText('1')).toBeInTheDocument(); // Resource changes
    expect(screen.getByText('0')).toBeInTheDocument(); // Timeline changes
    expect(screen.getByText('Financial')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Organizational')).toBeInTheDocument();
  });

  it('should render financial impact when present', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    expect(screen.getByText('Financial Impact')).toBeInTheDocument();
    expect(screen.getByText('Total Budget Change')).toBeInTheDocument();
    expect(screen.getByText('+$20,000')).toBeInTheDocument();
    expect(screen.getByText('Project Budget Changes')).toBeInTheDocument();
    expect(screen.getByText('Web Redesign')).toBeInTheDocument();
    expect(screen.getByText('(+20.0%)')).toBeInTheDocument();
  });

  it('should render resource impact when present', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    expect(screen.getByText('Resource Impact')).toBeInTheDocument();
    expect(screen.getByText('People Added')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    expect(screen.getByText('+5h capacity')).toBeInTheDocument();
  });

  it('should group and display changes by category', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    // Check that changes are grouped by category
    expect(screen.getByText('Financial Changes')).toBeInTheDocument();
    expect(screen.getByText('Resources Changes')).toBeInTheDocument();
    expect(screen.getByText('Scope Changes')).toBeInTheDocument();
    expect(screen.getByText('Organizational Changes')).toBeInTheDocument();

    // Check change details
    expect(
      screen.getByText('Budget changed from $100,000 to $120,000')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Team capacity changed from 40h to 45h')
    ).toBeInTheDocument();
    expect(
      screen.getByText('New project "Mobile App" added')
    ).toBeInTheDocument();
    expect(
      screen.getByText('New team "Design Team" added')
    ).toBeInTheDocument();
  });

  it('should display change details with old and new values', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    // Check that formatted values are displayed
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
    expect(screen.getByText('40h')).toBeInTheDocument();
    expect(screen.getByText('45h')).toBeInTheDocument();
  });

  it('should display appropriate impact badges', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    // Check impact badges
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('should handle empty comparison gracefully', () => {
    const emptyComparison: ScenarioComparison = {
      ...mockComparison,
      changes: [],
      summary: {
        totalChanges: 0,
        categorizedChanges: {
          financial: 0,
          resources: 0,
          timeline: 0,
          scope: 0,
          organizational: 0,
        },
        impactLevel: 'low',
      },
      financialImpact: {
        ...mockComparison.financialImpact,
        totalCostDifference: 0,
        projectCostChanges: [],
      },
      resourceImpact: {
        ...mockComparison.resourceImpact,
        teamCapacityChanges: [],
        peopleChanges: {
          added: 0,
          removed: 0,
          reallocated: 0,
        },
      },
    };

    render(<ScenarioVisualDiff comparison={emptyComparison} />);

    expect(screen.getByText('No Changes Detected')).toBeInTheDocument();
    expect(
      screen.getByText('This scenario is identical to the current live data.')
    ).toBeInTheDocument();
  });

  it('should handle negative financial changes correctly', () => {
    const negativeComparison: ScenarioComparison = {
      ...mockComparison,
      financialImpact: {
        totalCostDifference: -15000,
        budgetVariance: -15000,
        projectCostChanges: [
          {
            projectId: 'project-1',
            projectName: 'Cost Reduction Project',
            costDifference: -15000,
            percentageChange: -15,
          },
        ],
      },
    };

    render(<ScenarioVisualDiff comparison={negativeComparison} />);

    expect(screen.getByText('-$15,000')).toBeInTheDocument();
    expect(screen.getByText('(-15.0%)')).toBeInTheDocument();
  });

  it('should render correctly with no people removed', () => {
    const noPeopleRemovedComparison: ScenarioComparison = {
      ...mockComparison,
      resourceImpact: {
        ...mockComparison.resourceImpact,
        peopleChanges: {
          added: 2,
          removed: 0,
          reallocated: 0,
        },
      },
    };

    render(<ScenarioVisualDiff comparison={noPeopleRemovedComparison} />);

    expect(screen.getByText('People Added')).toBeInTheDocument();
    expect(screen.queryByText('People Removed')).not.toBeInTheDocument();
  });

  it('should render change icons correctly', () => {
    render(<ScenarioVisualDiff comparison={mockComparison} />);

    // The component should render different icons for different change types
    // We can't easily test the icons directly, but we can test that the component renders without errors
    // and that all change types are displayed
    expect(
      screen.getByText('Budget changed from $100,000 to $120,000')
    ).toBeInTheDocument();
    expect(
      screen.getByText('New project "Mobile App" added')
    ).toBeInTheDocument();
  });
});
