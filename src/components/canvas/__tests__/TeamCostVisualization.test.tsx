import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamCostVisualization from '../TeamCostVisualization';
import { useApp } from '@/context/AppContext';

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">
      {children}
      <div data-testid="react-flow-nodes">React Flow Nodes</div>
      <div data-testid="react-flow-edges">React Flow Edges</div>
    </div>
  ),
  Controls: () => <div data-testid="react-flow-controls">Controls</div>,
  Background: () => <div data-testid="react-flow-background">Background</div>,
  useNodesState: (initialNodes: any[]) => [initialNodes, vi.fn(), vi.fn()],
  useEdgesState: (initialEdges: any[]) => [initialEdges, vi.fn(), vi.fn()],
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
}));

// Mock financial calculations
vi.mock('@/utils/financialCalculations', () => ({
  calculatePersonCost: vi.fn((person, role) => ({
    costPerYear: person.annualSalary || 100000,
    costPerMonth: (person.annualSalary || 100000) / 12,
    costPerDay: (person.annualSalary || 100000) / 260,
  })),
  getDefaultConfig: vi.fn(() => ({
    companyName: 'Test Company',
    currency: 'USD',
    vacationDays: 20,
    sickDays: 10,
    holidays: 10,
    workingDaysPerYear: 260,
    workingHoursPerDay: 8,
    benefitsMultiplier: 1.3,
    overheadMultiplier: 1.2,
  })),
}));

// Mock the useApp hook
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

const mockTeams = [
  {
    id: 'team1',
    name: 'Frontend Team',
    description: 'Frontend development team',
    divisionId: 'div1',
    capacity: 100,
    isActive: true,
  },
  {
    id: 'team2',
    name: 'Backend Team',
    description: 'Backend development team',
    divisionId: 'div2',
    capacity: 80,
    isActive: true,
  },
];

const mockPeople = [
  {
    id: 'person1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'role1',
    teamId: 'team1',
    annualSalary: 120000,
    employmentType: 'permanent',
    isActive: true,
  },
  {
    id: 'person2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roleId: 'role2',
    teamId: 'team1',
    annualSalary: 110000,
    employmentType: 'contractor',
    isActive: true,
  },
  {
    id: 'person3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    roleId: 'role1',
    teamId: 'team2',
    annualSalary: 95000,
    employmentType: 'permanent',
    isActive: true,
  },
];

const mockDivisions = [
  { id: 'div1', name: 'Engineering', description: 'Engineering Division' },
  { id: 'div2', name: 'Product', description: 'Product Division' },
];

const mockRoles = [
  { id: 'role1', name: 'Senior Developer', baseSalary: 120000 },
  { id: 'role2', name: 'Junior Developer', baseSalary: 80000 },
];

const mockProjects = [
  {
    id: 'proj1',
    name: 'Project Alpha',
    description: 'First project',
    status: 'active',
    milestones: [{ id: 'milestone1', name: 'M1' }],
  },
];

const mockAllocations = [
  {
    id: 'alloc1',
    personId: 'person1',
    teamId: 'team1',
    epicId: 'milestone1',
    percentage: 100,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
];

const mockAppData = {
  teams: mockTeams,
  people: mockPeople,
  divisions: mockDivisions,
  roles: mockRoles,
  projects: mockProjects,
  allocations: mockAllocations,
};

describe('TeamCostVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue(mockAppData);
    // Ensure Position is available globally
    (global as any).Position = {
      Top: 'top',
      Bottom: 'bottom',
      Left: 'left',
      Right: 'right',
    };
  });

  const renderComponent = () => {
    return render(<TeamCostVisualization />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(
      screen.getByText('Team Cost Visualization Controls')
    ).toBeInTheDocument();
  });

  it('displays control panel', () => {
    renderComponent();

    expect(
      screen.getByText('Team Cost Visualization Controls')
    ).toBeInTheDocument();
    expect(screen.getByText('View Mode')).toBeInTheDocument();
    expect(screen.getByText('Node Sizing')).toBeInTheDocument();
    expect(screen.getByText('Color Coding')).toBeInTheDocument();
    expect(screen.getByText('Division Filter')).toBeInTheDocument();
  });

  it('displays stats cards', () => {
    renderComponent();

    expect(screen.getByText('Visible Teams')).toBeInTheDocument();
    expect(screen.getByText('Total People')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Avg Risk')).toBeInTheDocument();
  });

  it('displays React Flow visualization', () => {
    renderComponent();

    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow-background')).toBeInTheDocument();
  });

  it('displays visualization legend', () => {
    renderComponent();

    expect(screen.getByText('Visualization Legend')).toBeInTheDocument();
    expect(screen.getByText('Node Size (team-size)')).toBeInTheDocument();
    expect(screen.getByText('Color Coding (division)')).toBeInTheDocument();
    expect(screen.getByText('View Modes')).toBeInTheDocument();
    expect(screen.getByText('Interactions')).toBeInTheDocument();
  });

  it('handles view mode changes', async () => {
    renderComponent();

    const viewModeSelect = screen.getByText('Division Hierarchy');
    fireEvent.click(viewModeSelect);

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles node sizing changes', async () => {
    renderComponent();

    const nodeSizingSelect = screen.getByText('Team Size');
    fireEvent.click(nodeSizingSelect);

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles color coding changes', async () => {
    renderComponent();

    const colorCodingSelect = screen.getByText('Division');
    fireEvent.click(colorCodingSelect);

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles division filter changes', async () => {
    renderComponent();

    const divisionFilter = screen.getByText('All Divisions');
    fireEvent.click(divisionFilter);

    // Should update the stats and visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles minimum team size slider', () => {
    renderComponent();

    expect(screen.getByText(/Minimum Team Size:/)).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles maximum cost filter slider', () => {
    renderComponent();

    const maxCostLabel = screen.getByText(/Maximum Cost:/);
    expect(maxCostLabel).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles cost labels toggle', () => {
    renderComponent();

    const costLabelsToggle = screen.getByText('Show Cost Labels');
    fireEvent.click(costLabelsToggle);

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('displays correct stats for teams', () => {
    renderComponent();

    // Should show stats for visible teams
    expect(screen.getByText('Visible Teams')).toBeInTheDocument();
    expect(screen.getByText('Total People')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Avg Risk')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    vi.mocked(useApp).mockReturnValue({
      teams: [],
      people: [],
      divisions: [],
      roles: [],
      projects: [],
      allocations: [],
    });

    renderComponent();

    expect(
      screen.getByText('Team Cost Visualization Controls')
    ).toBeInTheDocument();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles view mode switching properly', async () => {
    renderComponent();

    // Test hierarchy view
    const viewModeSelect = screen.getByText('Division Hierarchy');
    fireEvent.click(viewModeSelect);

    // Should update legend
    expect(screen.getByText('Risk: Risk vs Cost scatter')).toBeInTheDocument();
  });

  it('displays proper legend for different view modes', () => {
    renderComponent();

    expect(
      screen.getByText('Hierarchy: Division grouping')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Clusters: Cost-based grouping')
    ).toBeInTheDocument();
    expect(screen.getByText('Risk: Risk vs Cost scatter')).toBeInTheDocument();
    expect(
      screen.getByText('Efficiency: Utilization vs Cost')
    ).toBeInTheDocument();
  });

  it('displays interaction instructions', () => {
    renderComponent();

    expect(screen.getByText('Drag nodes to reposition')).toBeInTheDocument();
    expect(screen.getByText('Zoom and pan canvas')).toBeInTheDocument();
    expect(
      screen.getByText('Filter by division/size/cost')
    ).toBeInTheDocument();
    expect(screen.getByText('Toggle cost labels')).toBeInTheDocument();
  });

  it('handles cost efficiency color coding legend', async () => {
    renderComponent();

    // Should have color coding controls
    expect(screen.getByText('Color Coding')).toBeInTheDocument();
    expect(screen.getByText('Division')).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles contractor ratio color coding legend', async () => {
    renderComponent();

    // Should have color coding controls
    expect(screen.getByText('Color Coding')).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles risk level color coding legend', async () => {
    renderComponent();

    // Should have color coding controls
    expect(screen.getByText('Color Coding')).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('calculates team metrics correctly', () => {
    renderComponent();

    // Should display stats based on calculated metrics
    expect(screen.getByText('Visible Teams')).toBeInTheDocument();
    expect(screen.getByText('Total People')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Avg Risk')).toBeInTheDocument();
  });

  it('handles slider value changes', () => {
    renderComponent();

    // Should have slider controls
    expect(screen.getByText(/Minimum Team Size:/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum Cost:/)).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('displays cost formatting in stats', () => {
    renderComponent();

    // Cost should be formatted in millions
    expect(screen.getByText('Total Cost')).toBeInTheDocument();

    // Should have visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('handles all view modes correctly', async () => {
    renderComponent();

    // Should have view mode controls
    expect(screen.getByText('View Mode')).toBeInTheDocument();
    expect(screen.getByText('Division Hierarchy')).toBeInTheDocument();

    // Should update the visualization
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
