import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Project } from '@/types';
import ProjectTable from '../ProjectTable';

// Mock the AppContext
const mockSetProjects = vi.fn();
const mockSetEpics = vi.fn();

const mockContextValue = {
  projects: [],
  setProjects: mockSetProjects,
  epics: [],
  setEpics: mockSetEpics,
  allocations: [],
  cycles: [],
  people: [],
  roles: [],
  teams: [],
};

vi.mock('@/context/AppContext', () => ({
  useApp: () => mockContextValue,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/financialCalculations', () => ({
  calculateProjectCost: () => ({ totalCost: 100000 }),
}));

// Enhanced Project interface with financial year budgets
interface ProjectWithFYBudgets extends Omit<Project, 'budget'> {
  financialYearBudgets?: {
    financialYearId: string;
    amount: number;
  }[];
  priorityOrder: number; // Enhanced priority ordering
}

const createMockProject = (
  overrides: Partial<ProjectWithFYBudgets> = {}
): ProjectWithFYBudgets => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'planning',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  milestones: [],
  priority: 1,
  ranking: 1,
  priorityOrder: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  financialYearBudgets: [
    {
      financialYearId: 'fy2024',
      amount: 100000,
    },
    {
      financialYearId: 'fy2025',
      amount: 50000,
    },
  ],
  ...overrides,
});

const mockProjects: ProjectWithFYBudgets[] = [
  createMockProject({
    id: 'proj-1',
    name: 'Alpha Project',
    status: 'active',
    priority: 1,
    ranking: 1,
    priorityOrder: 1,
    financialYearBudgets: [
      { financialYearId: 'fy2024', amount: 150000 },
      { financialYearId: 'fy2025', amount: 50000 },
    ],
    startDate: '2024-01-01',
  }),
  createMockProject({
    id: 'proj-2',
    name: 'Beta Project',
    status: 'planning',
    priority: 2,
    ranking: 2,
    priorityOrder: 2,
    financialYearBudgets: [
      { financialYearId: 'fy2024', amount: 75000 },
      { financialYearId: 'fy2025', amount: 75000 },
    ],
    startDate: '2024-02-01',
  }),
  createMockProject({
    id: 'proj-3',
    name: 'Gamma Project',
    status: 'completed',
    priority: 3,
    ranking: 3,
    priorityOrder: 3,
    financialYearBudgets: [{ financialYearId: 'fy2024', amount: 100000 }],
    startDate: '2024-03-01',
  }),
];

describe('ProjectTable Financial Year Budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue.projects = mockProjects as any;
  });

  describe('Financial Year Budget Display', () => {
    it('should calculate total budget from financial year budgets', () => {
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Get all table cells to specifically check the budget column
      const table = screen.getByRole('table');

      // Alpha Project: 150000 + 50000 = 200000
      expect(screen.getAllByText('$200,000').length).toBeGreaterThan(0);

      // Beta Project: 75000 + 75000 = 150000
      expect(screen.getAllByText('$150,000').length).toBeGreaterThan(0);

      // Gamma Project: 100000
      expect(screen.getAllByText('$100,000').length).toBeGreaterThan(0);
    });

    it('should show "Not set" for projects without financial year budgets', () => {
      const projectsWithoutBudgets = [
        createMockProject({
          id: 'proj-no-budget',
          name: 'No Budget Project',
          financialYearBudgets: undefined,
        }),
      ];

      render(
        <ProjectTable
          projects={projectsWithoutBudgets as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });

    it('should calculate budget totals correctly with financial year budgets', () => {
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Total budget: 200000 + 150000 + 100000 = 450000
      expect(screen.getByText(/Total Budget:/)).toBeInTheDocument();
      expect(screen.getByText(/\$450,000/)).toBeInTheDocument();
      expect(screen.getByText(/3 projects/)).toBeInTheDocument();
    });

    it('should sort projects by total budget correctly', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /sort by budget/i }));

      const rows = screen.getAllByRole('row');
      // Should be sorted by total budget: $100,000, $150,000, $200,000
      expect(rows[1]).toHaveTextContent('Gamma Project');
      expect(rows[2]).toHaveTextContent('Beta Project');
      expect(rows[3]).toHaveTextContent('Alpha Project');
    });
  });

  describe('Enhanced Priority Order System', () => {
    it('should display priority order column', () => {
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('Priority')).toBeInTheDocument();

      // Check priority order values are displayed
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should sort projects by priority order', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /sort by priority/i })
      );

      const rows = screen.getAllByRole('row');
      // Should be sorted by priority order: 1, 2, 3
      expect(rows[1]).toHaveTextContent('Alpha Project');
      expect(rows[2]).toHaveTextContent('Beta Project');
      expect(rows[3]).toHaveTextContent('Gamma Project');
    });

    it('should filter projects by priority order', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Click on the priority filter dropdown
      await user.click(
        screen.getByRole('combobox', { name: /filter by priority/i })
      );

      // Wait for dropdown to open and click on 'Priority 1' option
      await waitFor(() => {
        expect(screen.getByText('Priority 1')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Priority 1'));

      await waitFor(() => {
        expect(screen.getByText('Alpha Project')).toBeInTheDocument();
        expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Project')).not.toBeInTheDocument();
      });
    });

    it('should display priority badges with correct styling', () => {
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Find priority badges (look for badges containing numbers)
      const priorityElements = screen.getAllByText(/^[1-3]$/);
      expect(priorityElements.length).toBeGreaterThanOrEqual(3);

      // Check that priority 1 has red styling (highest priority)
      const priority1Badge = priorityElements.find(
        el => el.textContent === '1' && el.classList.contains('bg-red-100')
      );
      expect(priority1Badge).toBeInTheDocument();
    });
  });

  describe('Integration with Financial Year Budgets', () => {
    it('should update budget totals when filtering projects with FY budgets', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Apply status filter to show only active projects
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );

      // Wait for dropdown to open and find the active option in the select content
      await waitFor(() => {
        const selectItems = screen.getAllByRole('option');
        expect(selectItems.length).toBeGreaterThan(0);
      });

      // Click on the 'Active' option in dropdown (find by role option)
      const options = screen.getAllByRole('option');
      const activeOption = options.find(
        option => option.textContent === 'Active'
      );
      if (activeOption) {
        await user.click(activeOption);
      }

      // Should show filtered budget for Alpha Project only (200,000)
      await waitFor(() => {
        expect(screen.getByText(/Filtered Budget:/)).toBeInTheDocument();
        expect(screen.getByText(/1 project/)).toBeInTheDocument();
      });
    });

    it('should handle projects with empty financial year budgets gracefully', () => {
      const projectsWithEmptyBudgets = [
        createMockProject({
          id: 'proj-empty',
          name: 'Empty Budget Project',
          financialYearBudgets: [],
        }),
      ];

      render(
        <ProjectTable
          projects={projectsWithEmptyBudgets as any}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('Not set')).toBeInTheDocument();
      expect(screen.getByText(/Total Budget:/)).toBeInTheDocument();
      expect(screen.getByText(/\$0/)).toBeInTheDocument();
    });
  });
});
