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

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'planning',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: 150000,
  priority: 1,
  ranking: 1,
  milestones: [],
  tags: [],
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mockProjects: Project[] = [
  createMockProject({
    id: 'proj-1',
    name: 'Alpha Project',
    status: 'active',
    budget: 200000,
    priority: 1,
    ranking: 1,
    startDate: '2024-01-01',
  }),
  createMockProject({
    id: 'proj-2',
    name: 'Beta Project',
    status: 'planning',
    budget: 150000,
    priority: 2,
    ranking: 2,
    startDate: '2024-02-01',
  }),
  createMockProject({
    id: 'proj-3',
    name: 'Gamma Project',
    status: 'completed',
    budget: 100000,
    priority: 3,
    ranking: 3,
    startDate: '2024-03-01',
  }),
];

describe('ProjectTable Enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue.projects = mockProjects;
  });

  describe('Budget Column Display (#66)', () => {
    it('should display budget column header', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('Budget')).toBeInTheDocument();
    });

    it('should display project budget values in correct format', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Check Budget column header exists
      expect(screen.getByText('Budget')).toBeInTheDocument();

      // Check budget values are present - there may be duplicates due to Est. Cost column
      const budgetTexts = screen.getAllByText(/^\$[0-9,]+$/);
      expect(budgetTexts.length).toBeGreaterThan(0);

      // Check specific budget values exist somewhere in the table
      expect(
        screen.getByText((content, element) => {
          return (
            element?.tagName.toLowerCase() === 'span' && content === '$200,000'
          );
        })
      ).toBeInTheDocument();
    });

    it('should display "Not set" for projects without budget', () => {
      const projectsWithoutBudget = [
        createMockProject({
          id: 'proj-no-budget',
          name: 'No Budget Project',
          budget: undefined,
        }),
      ];

      render(
        <ProjectTable
          projects={projectsWithoutBudget}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  describe('Column Sorting (#65)', () => {
    it('should display sortable column headers', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Check for sort buttons/indicators
      expect(
        screen.getByRole('button', { name: /sort by project name/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sort by status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sort by budget/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sort by start date/i })
      ).toBeInTheDocument();
    });

    it('should sort projects by name in ascending order when clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /sort by project name/i })
      );

      const projectNames = screen.getAllByText(/Project$/);
      expect(projectNames[0]).toHaveTextContent('Alpha Project');
      expect(projectNames[1]).toHaveTextContent('Beta Project');
      expect(projectNames[2]).toHaveTextContent('Gamma Project');
    });

    it('should sort projects by name in descending order when clicked twice', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      const sortButton = screen.getByRole('button', {
        name: /sort by project name/i,
      });
      await user.click(sortButton);
      await user.click(sortButton);

      const projectNames = screen.getAllByText(/Project$/);
      expect(projectNames[0]).toHaveTextContent('Gamma Project');
      expect(projectNames[1]).toHaveTextContent('Beta Project');
      expect(projectNames[2]).toHaveTextContent('Alpha Project');
    });

    it('should sort projects by budget amount', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /sort by budget/i }));

      const rows = screen.getAllByRole('row');
      // Should be sorted by budget: $100,000, $150,000, $200,000
      expect(rows[1]).toHaveTextContent('Gamma Project');
      expect(rows[2]).toHaveTextContent('Beta Project');
      expect(rows[3]).toHaveTextContent('Alpha Project');
    });

    it('should sort projects by priority', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /sort by priority/i })
      );

      const rows = screen.getAllByRole('row');
      // Should be sorted by priority: 1, 2, 3
      expect(rows[1]).toHaveTextContent('Alpha Project');
      expect(rows[2]).toHaveTextContent('Beta Project');
      expect(rows[3]).toHaveTextContent('Gamma Project');
    });

    it('should sort projects by start date', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.click(
        screen.getByRole('button', { name: /sort by start date/i })
      );

      const rows = screen.getAllByRole('row');
      // Should be sorted by start date: 2024-01-01, 2024-02-01, 2024-03-01
      expect(rows[1]).toHaveTextContent('Alpha Project');
      expect(rows[2]).toHaveTextContent('Beta Project');
      expect(rows[3]).toHaveTextContent('Gamma Project');
    });
  });

  describe('Filtering System (#65)', () => {
    it('should display filter controls', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(
        screen.getByPlaceholderText(/filter projects/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /filter by status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /filter by priority/i })
      ).toBeInTheDocument();
    });

    it('should filter projects by name', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.type(screen.getByPlaceholderText(/filter projects/i), 'Alpha');

      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
      expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Project')).not.toBeInTheDocument();
    });

    it('should filter projects by status', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Click on the status filter dropdown
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );

      // Wait for dropdown to open and click on 'active' option
      await waitFor(() => {
        const options = screen.getAllByText('Active');
        expect(options.length).toBeGreaterThan(0);
      });
      // Click on the option in the dropdown (not the badge in the table)
      const activeOptions = screen.getAllByText('Active');
      const dropdownOption = activeOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || activeOptions[activeOptions.length - 1]
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Project')).toBeInTheDocument();
        expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Project')).not.toBeInTheDocument();
      });
    });

    it('should filter projects by priority', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
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

    it('should clear filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Apply filters
      await user.type(screen.getByPlaceholderText(/filter projects/i), 'Alpha');

      // Wait for clear button to appear
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /clear filters/i })
        ).toBeInTheDocument();
      });

      // Clear filters
      await user.click(screen.getByRole('button', { name: /clear filters/i }));

      // All projects should be visible again
      await waitFor(() => {
        expect(screen.getByText('Alpha Project')).toBeInTheDocument();
        expect(screen.getByText('Beta Project')).toBeInTheDocument();
        expect(screen.getByText('Gamma Project')).toBeInTheDocument();
      });
    });

    it('should combine multiple filters correctly', async () => {
      const user = userEvent.setup();
      const complexProjects = [
        ...mockProjects,
        createMockProject({
          id: 'proj-4',
          name: 'Alpha Beta Project',
          status: 'active',
          priority: 1,
        }),
      ];

      render(
        <ProjectTable
          projects={complexProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Apply name filter
      await user.type(screen.getByPlaceholderText(/filter projects/i), 'Alpha');

      // Apply status filter
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );
      await waitFor(() => {
        const options = screen.getAllByText('Active');
        expect(options.length).toBeGreaterThan(0);
      });
      const activeOptions = screen.getAllByText('Active');
      const dropdownOption = activeOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || activeOptions[activeOptions.length - 1]
      );

      // Apply priority filter
      await user.click(
        screen.getByRole('combobox', { name: /filter by priority/i })
      );
      await waitFor(() => {
        expect(screen.getByText('Priority 1')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Priority 1'));

      // Should show both Alpha projects that are active with priority 1
      await waitFor(() => {
        expect(screen.getByText('Alpha Project')).toBeInTheDocument();
        expect(screen.getByText('Alpha Beta Project')).toBeInTheDocument();
        expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Project')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Budget Totals (#66)', () => {
    it('should display total budget for all projects', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Look for the budget totals section
      expect(screen.getByText(/Total Budget:/)).toBeInTheDocument();
      expect(screen.getByText(/\$450,000/)).toBeInTheDocument();
      expect(screen.getByText(/3 projects/)).toBeInTheDocument();
    });

    it('should display filtered budget total when filters are applied', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Apply status filter
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );
      await waitFor(() => {
        const options = screen.getAllByText('Active');
        expect(options.length).toBeGreaterThan(0);
      });
      const activeOptions = screen.getAllByText('Active');
      const dropdownOption = activeOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || activeOptions[activeOptions.length - 1]
      );

      await waitFor(() => {
        expect(screen.getByText(/Filtered Budget:/)).toBeInTheDocument();
        // Look for the budget total in the footer section specifically
        const budgetElements = screen.getAllByText(/\$200,000/);
        expect(budgetElements.length).toBeGreaterThan(0);
      });
    });

    it('should update budget total when projects are filtered by name', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      await user.type(screen.getByPlaceholderText(/filter projects/i), 'Alpha');

      await waitFor(() => {
        expect(screen.getByText(/Filtered Budget:/)).toBeInTheDocument();
        // Look for the budget total in the footer section specifically
        const budgetElements = screen.getAllByText(/\$200,000/);
        expect(budgetElements.length).toBeGreaterThan(0);
      });
    });

    it('should show project count in budget totals', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText(/3 projects/)).toBeInTheDocument();
    });

    it('should update project count when filters are applied', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Apply status filter
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );
      await waitFor(() => {
        const options = screen.getAllByText('Active');
        expect(options.length).toBeGreaterThan(0);
      });
      const activeOptions = screen.getAllByText('Active');
      const dropdownOption = activeOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || activeOptions[activeOptions.length - 1]
      );

      await waitFor(() => {
        expect(screen.getByText(/1 project/)).toBeInTheDocument();
      });
    });

    it('should handle projects without budget in totals', () => {
      const projectsWithMissingBudgets = [
        ...mockProjects,
        createMockProject({
          id: 'proj-no-budget',
          name: 'No Budget Project',
          budget: undefined,
        }),
      ];

      render(
        <ProjectTable
          projects={projectsWithMissingBudgets}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Should still show $450,000 total (excluding undefined budget)
      expect(screen.getByText(/Total Budget:/)).toBeInTheDocument();
      expect(screen.getByText(/\$450,000/)).toBeInTheDocument();
      expect(screen.getByText(/4 projects/)).toBeInTheDocument();
    });
  });

  describe('Priority Column Display (#65)', () => {
    it('should display priority column header', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('should display project priority values', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display priority badge with appropriate styling', () => {
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Find priority badges (look for badges containing numbers)
      const priorityElements = screen.getAllByText(/^[1-3]$/);
      expect(priorityElements.length).toBeGreaterThanOrEqual(3);

      // Check that priority 1 has red styling
      const priority1Badge = priorityElements.find(
        el => el.textContent === '1' && el.classList.contains('bg-red-100')
      );
      expect(priority1Badge).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should maintain sorting when filters are applied', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Sort by budget first
      await user.click(screen.getByRole('button', { name: /sort by budget/i }));

      // Then apply status filter
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );
      await waitFor(() => {
        const options = screen.getAllByText('Planning');
        expect(options.length).toBeGreaterThan(0);
      });
      const planningOptions = screen.getAllByText('Planning');
      const dropdownOption = planningOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || planningOptions[planningOptions.length - 1]
      );

      // Should show only Beta Project (planning status)
      await waitFor(() => {
        expect(screen.getByText('Beta Project')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Project')).not.toBeInTheDocument();
      });
    });

    it('should update budget totals when sorting changes visible projects', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Apply filter first
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );
      await waitFor(() => {
        const options = screen.getAllByText('Planning');
        expect(options.length).toBeGreaterThan(0);
      });
      const planningOptions = screen.getAllByText('Planning');
      const dropdownOption = planningOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || planningOptions[planningOptions.length - 1]
      );

      // Then sort - should maintain the filter
      await user.click(screen.getByRole('button', { name: /sort by budget/i }));

      // Should still show filtered budget
      await waitFor(() => {
        expect(screen.getByText(/Filtered Budget:/)).toBeInTheDocument();
        const budgetElements = screen.getAllByText(/\$150,000/);
        expect(budgetElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/1 project/)).toBeInTheDocument();
      });
    });

    it('should preserve user selections when applying filters', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjects}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Select some projects first
      await user.click(screen.getAllByRole('checkbox')[1]); // Select first project checkbox
      await user.click(screen.getAllByRole('checkbox')[2]); // Select second project checkbox

      // Apply a filter that should hide one of the selected projects
      await user.click(
        screen.getByRole('combobox', { name: /filter by status/i })
      );
      await waitFor(() => {
        const options = screen.getAllByText('Active');
        expect(options.length).toBeGreaterThan(0);
      });
      const activeOptions = screen.getAllByText('Active');
      const dropdownOption = activeOptions.find(
        option =>
          option.closest('[role="option"]') || option.id?.includes('radix')
      );
      await user.click(
        dropdownOption || activeOptions[activeOptions.length - 1]
      );

      // The selection logic maintains selected state across filters
      // So we should still have 2 projects selected globally
      await waitFor(() => {
        expect(screen.getByText(/2 projects selected/)).toBeInTheDocument();
      });
    });
  });
});
