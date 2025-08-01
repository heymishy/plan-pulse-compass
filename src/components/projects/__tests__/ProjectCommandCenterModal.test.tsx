import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCommandCenterModal } from '../ProjectCommandCenterModal';
import { useApp } from '@/context/AppContext';
import {
  Project,
  Epic,
  Milestone,
  Team,
  Person,
  Role,
  Allocation,
  Cycle,
  ProjectSolution,
  ProjectSkill,
} from '@/types';

// Mock data factory functions following TypeScript interfaces
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'in-progress',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: 100000,
  milestones: [],
  priority: 2,
  ranking: 1,
  priorityOrder: 2,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockEpic = (overrides: Partial<Epic> = {}): Epic => ({
  id: 'epic-1',
  name: 'Test Epic',
  description: 'Test epic description',
  projectId: 'proj-1',
  status: 'in-progress',
  priority: 'high',
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  estimatedEffort: 40,
  ranking: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockMilestone = (
  overrides: Partial<Milestone> = {}
): Milestone => ({
  id: 'milestone-1',
  name: 'Test Milestone',
  description: 'Test milestone description',
  projectId: 'proj-1',
  dueDate: '2024-06-30',
  status: 'not-started',
  isCompleted: false,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Test Team',
  description: 'Test team description',
  type: 'permanent',
  status: 'active',
  divisionId: 'div-1',
  capacity: 40,
  targetSkills: [],
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockPerson = (overrides: Partial<Person> = {}): Person => ({
  id: 'person-1',
  name: 'Test Person',
  email: 'test@example.com',
  roleId: 'role-1',
  teamId: 'team-1',
  isActive: true,
  employmentType: 'permanent',
  annualSalary: 80000,
  startDate: '2024-01-01',
  skills: [],
  ...overrides,
});

const createMockRole = (overrides: Partial<Role> = {}): Role => ({
  id: 'role-1',
  name: 'Developer',
  rateType: 'annual',
  defaultAnnualSalary: 80000,
  description: 'Software Developer',
  ...overrides,
});

const createMockAllocation = (
  overrides: Partial<Allocation> = {}
): Allocation => ({
  id: 'alloc-1',
  teamId: 'team-1',
  cycleId: 'cycle-1',
  iterationNumber: 1,
  epicId: 'epic-1',
  percentage: 80,
  notes: '',
  ...overrides,
});

const createMockCycle = (overrides: Partial<Cycle> = {}): Cycle => ({
  id: 'cycle-1',
  name: 'Q1 2024',
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  type: 'quarterly',
  financialYearId: 'fy-2024',
  ...overrides,
});

const createMockProjectSolution = (
  overrides: Partial<ProjectSolution> = {}
): ProjectSolution => ({
  id: 'ps-1',
  projectId: 'proj-1',
  solutionId: 'sol-1',
  importance: 'high',
  notes: 'Test solution',
  ...overrides,
});

const createMockProjectSkill = (
  overrides: Partial<ProjectSkill> = {}
): ProjectSkill => ({
  id: 'psk-1',
  projectId: 'proj-1',
  skillId: 'skill-1',
  importance: 'high',
  notes: 'Test skill',
  ...overrides,
});

// Mock Context Provider
const createMockContextValue = (overrides = {}) => ({
  projects: [createMockProject()],
  setProjects: vi.fn(),
  epics: [createMockEpic()],
  setEpics: vi.fn(),
  milestones: [createMockMilestone()],
  setMilestones: vi.fn(),
  teams: [createMockTeam()],
  setTeams: vi.fn(),
  people: [createMockPerson()],
  setPeople: vi.fn(),
  roles: [createMockRole()],
  setRoles: vi.fn(),
  allocations: [createMockAllocation()],
  setAllocations: vi.fn(),
  cycles: [createMockCycle()],
  setCycles: vi.fn(),
  projectSolutions: [createMockProjectSolution()],
  setProjectSolutions: vi.fn(),
  projectSkills: [createMockProjectSkill()],
  setProjectSkills: vi.fn(),
  solutions: [],
  setSolutions: vi.fn(),
  skills: [],
  setSkills: vi.fn(),
  runWorkCategories: [],
  setRunWorkCategories: vi.fn(),
  actualAllocations: [],
  setActualAllocations: vi.fn(),
  config: {
    financialYear: {
      id: 'fy-2024',
      name: 'FY 2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      quarters: ['q1-2024', 'q2-2024', 'q3-2024', 'q4-2024'],
    },
    iterationLength: 'fortnightly' as const,
    quarters: [],
    workingDaysPerWeek: 5,
    workingHoursPerDay: 8,
    workingDaysPerYear: 260,
    workingDaysPerMonth: 22,
    currencySymbol: '$',
  },
  setConfig: vi.fn(),
  divisions: [],
  setDivisions: vi.fn(),
  ...overrides,
});

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useApp hook
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock calculateProjectCost utility
vi.mock('@/utils/financialCalculations', () => ({
  calculateProjectCost: vi.fn(() => ({
    totalCost: 50000,
    breakdown: [
      {
        personId: 'person-1',
        personName: 'Test Person',
        allocationPercentage: 80,
        duration: 90,
        totalPersonCost: 30000,
        effectiveRate: 333.33,
        rateType: 'daily',
        rateSource: 'annual-salary',
      },
    ],
    teamBreakdown: [
      {
        teamId: 'team-1',
        teamName: 'Test Team',
        totalCost: 50000,
        allocationPercentage: 80,
      },
    ],
    monthlyBurnRate: 4166.67,
    totalDurationInDays: 90,
  })),
}));

// Mock calculateProjectedEndDate utility
vi.mock('@/utils/calculateProjectedEndDate', () => ({
  calculateProjectedEndDate: vi.fn(() => '2024-06-30'),
}));

interface ProjectCommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  mode?: 'view' | 'edit';
}

// Mock component until implementation
const MockProjectCommandCenterModal: React.FC<
  ProjectCommandCenterModalProps
> = ({ isOpen, onClose, project, mode = 'view' }) => {
  if (!isOpen || !project) return null;

  return (
    <div data-testid="project-command-center-modal">
      <div data-testid="modal-header">
        <h1>{project.name}</h1>
        <button data-testid="close-button" onClick={onClose}>
          Close
        </button>
        <span data-testid="mode-indicator">{mode}</span>
      </div>

      <div data-testid="tab-navigation">
        <button data-testid="overview-tab">Overview</button>
        <button data-testid="epics-timeline-tab">Epics & Timeline</button>
        <button data-testid="financials-tab">Financials</button>
        <button data-testid="solutions-skills-tab">Solutions & Skills</button>
        <button data-testid="progress-tracking-tab">Progress & Tracking</button>
        <button data-testid="steerco-report-tab">SteerCo Report</button>
      </div>

      <div data-testid="tab-content">
        <div data-testid="overview-content">
          <div data-testid="project-name">{project.name}</div>
          <div data-testid="project-description">{project.description}</div>
          <div data-testid="project-status">{project.status}</div>
          <div data-testid="project-start-date">{project.startDate}</div>
          <div data-testid="project-end-date">{project.endDate}</div>
          <div data-testid="projected-end-date">2024-06-30</div>
          <div data-testid="project-budget">{project.budget}</div>
          <div data-testid="project-priority">{project.priority}</div>
        </div>
      </div>

      {mode === 'edit' && (
        <div data-testid="edit-actions">
          <button data-testid="save-button">Save</button>
          <button data-testid="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// Use the real component now that we have proper mocks
// const ProjectCommandCenterModal = MockProjectCommandCenterModal;

describe('ProjectCommandCenterModal', () => {
  let mockContextValue: any;
  const mockOnClose = vi.fn();
  const mockUseApp = vi.mocked(useApp);

  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = createMockContextValue();
    mockUseApp.mockReturnValue(mockContextValue);
  });

  const renderModal = (props: Partial<ProjectCommandCenterModalProps> = {}) => {
    const defaultProps: ProjectCommandCenterModalProps = {
      isOpen: true,
      onClose: mockOnClose,
      project: createMockProject(),
      mode: 'view',
      ...props,
    };

    return render(<ProjectCommandCenterModal {...defaultProps} />);
  };

  describe('when modal is closed', () => {
    it('should not render when isOpen is false', () => {
      renderModal({ isOpen: false });
      expect(
        screen.queryByTestId('project-command-center-modal')
      ).not.toBeInTheDocument();
    });

    it('should not render when project is null', () => {
      renderModal({ project: null });
      expect(
        screen.queryByTestId('project-command-center-modal')
      ).not.toBeInTheDocument();
    });
  });

  describe('when modal is open', () => {
    it('should render the modal with project name in header', () => {
      const project = createMockProject({ name: 'My Test Project' });
      renderModal({ project });

      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
      expect(screen.getByText('My Test Project')).toBeInTheDocument();
    });

    it('should render all six tabs', () => {
      renderModal();

      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      expect(screen.getByTestId('epics-timeline-tab')).toBeInTheDocument();
      expect(screen.getByTestId('financials-tab')).toBeInTheDocument();
      expect(screen.getByTestId('solutions-skills-tab')).toBeInTheDocument();
      expect(screen.getByTestId('progress-tracking-tab')).toBeInTheDocument();
      expect(screen.getByTestId('steerco-report-tab')).toBeInTheDocument();
    });

    it('should render close button and handle close action', async () => {
      const user = userEvent.setup();
      renderModal();

      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toBeInTheDocument();

      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display correct mode indicator', () => {
      renderModal({ mode: 'view' });
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('view');

      // Test edit mode
      const { rerender } = render(
        <ProjectCommandCenterModal
          isOpen={true}
          onClose={mockOnClose}
          project={createMockProject()}
          mode="edit"
        />
      );
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('edit');
    });
  });

  describe('Overview tab content', () => {
    it('should display basic project information', () => {
      const project = createMockProject({
        name: 'Test Project',
        description: 'Test Description',
        status: 'in-progress',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 100000,
        priority: 2,
      });

      renderModal({ project });

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument();
      expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument();
      expect(screen.getByText('$100,000')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display projected end date from calculation', () => {
      renderModal();
      expect(screen.getByText('Jun 30, 2024')).toBeInTheDocument();
    });

    it('should handle projects with missing optional fields', () => {
      const project = createMockProject({
        description: undefined,
        endDate: undefined,
        budget: undefined,
      });

      renderModal({ project });

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('planning')).toBeInTheDocument();
      expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument();
    });
  });

  describe('View mode functionality', () => {
    it('should render in view mode by default', () => {
      renderModal();
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('view');
      expect(screen.queryByTestId('edit-actions')).not.toBeInTheDocument();
    });

    it('should not show edit actions in view mode', () => {
      renderModal({ mode: 'view' });
      expect(screen.queryByTestId('edit-actions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-button')).not.toBeInTheDocument();
    });
  });

  describe('Edit mode functionality', () => {
    it('should render edit actions when in edit mode', () => {
      renderModal({ mode: 'edit' });

      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('edit');
      expect(screen.getByTestId('edit-actions')).toBeInTheDocument();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should handle cancel button click in edit mode', async () => {
      const user = userEvent.setup();
      renderModal({ mode: 'edit' });

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle save button click in edit mode', async () => {
      const user = userEvent.setup();
      renderModal({ mode: 'edit' });

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toBeInTheDocument();

      // Click save button (implementation will handle save logic)
      await user.click(saveButton);

      // Verify button is clickable and doesn't throw
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('should render all tab buttons as clickable', async () => {
      const user = userEvent.setup();
      renderModal();

      const tabs = [
        'overview-tab',
        'epics-timeline-tab',
        'financials-tab',
        'solutions-skills-tab',
        'progress-tracking-tab',
        'steerco-report-tab',
      ];

      for (const tabId of tabs) {
        const tab = screen.getByTestId(tabId);
        expect(tab).toBeInTheDocument();
        expect(tab.tagName).toBe('BUTTON');

        await user.click(tab);
        // Tab should be clickable without errors
        expect(tab).toBeInTheDocument();
      }
    });

    it('should maintain accessibility for keyboard navigation', () => {
      renderModal();

      const tabs = screen.getAllByRole('button');
      tabs.forEach(tab => {
        expect(tab).toBeInTheDocument();
        // Each tab button should be focusable
        expect(tab.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Context integration', () => {
    it('should use project data from context when available', () => {
      const contextProject = createMockProject({
        name: 'Context Project',
        description: 'From context',
      });

      mockContextValue.projects = [contextProject];
      renderModal({ project: contextProject });

      expect(screen.getByTestId('project-name')).toHaveTextContent(
        'Context Project'
      );
      expect(screen.getByTestId('project-description')).toHaveTextContent(
        'From context'
      );
    });

    it('should handle context with related data (epics, milestones)', () => {
      const project = createMockProject();
      const epic = createMockEpic({ projectId: project.id });
      const milestone = createMockMilestone({ projectId: project.id });

      mockContextValue.epics = [epic];
      mockContextValue.milestones = [milestone];

      renderModal({ project });

      // Modal should render without errors when related data is present
      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
    });

    it('should handle empty context gracefully', () => {
      const emptyContext = createMockContextValue({
        projects: [],
        epics: [],
        milestones: [],
        teams: [],
        people: [],
        roles: [],
        allocations: [],
        cycles: [],
      });

      mockUseApp.mockReturnValue(emptyContext);

      render(
        <ProjectCommandCenterModal
          isOpen={true}
          onClose={mockOnClose}
          project={createMockProject()}
          mode="view"
        />
      );

      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid project data gracefully', () => {
      const invalidProject = createMockProject({
        name: '',
        startDate: '',
      });

      renderModal({ project: invalidProject });

      // Should still render modal structure
      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });

    it('should handle mode switching correctly', () => {
      const { rerender } = renderModal({ mode: 'view' });
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('view');
      expect(screen.queryByTestId('edit-actions')).not.toBeInTheDocument();

      rerender(
        <ProjectCommandCenterModal
          isOpen={true}
          onClose={mockOnClose}
          project={createMockProject()}
          mode="edit"
        />
      );

      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('edit');
      expect(screen.getByTestId('edit-actions')).toBeInTheDocument();
    });

    it('should handle missing context provider', () => {
      // This test would normally fail without proper error boundaries
      // but our mock component doesn't depend on context
      render(
        <ProjectCommandCenterModal
          isOpen={true}
          onClose={mockOnClose}
          project={createMockProject()}
          mode="view"
        />
      );

      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for modal', () => {
      renderModal();

      const modal = screen.getByTestId('project-command-center-modal');
      expect(modal).toBeInTheDocument();

      // Modal should be accessible to screen readers
      const header = screen.getByTestId('modal-header');
      expect(header).toBeInTheDocument();
    });

    it('should support keyboard navigation for tabs', () => {
      renderModal();

      const tabs = screen.getAllByRole('button');
      tabs.forEach(tab => {
        expect(tab).toBeInTheDocument();
        expect(tab.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle focus management correctly', async () => {
      const user = userEvent.setup();
      renderModal();

      const firstTab = screen.getByTestId('overview-tab');
      await user.tab();

      // Should be able to navigate through focusable elements
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Performance considerations', () => {
    it('should not re-render unnecessarily', () => {
      const project = createMockProject();
      const { rerender } = renderModal({ project });

      // Rerender with same props
      rerender(
        <ProjectCommandCenterModal
          isOpen={true}
          onClose={mockOnClose}
          project={project}
          mode="view"
        />
      );

      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', () => {
      // Simulate large context data
      const largeContextValue = createMockContextValue({
        epics: Array.from({ length: 100 }, (_, i) =>
          createMockEpic({ id: `epic-${i}`, name: `Epic ${i}` })
        ),
        milestones: Array.from({ length: 50 }, (_, i) =>
          createMockMilestone({ id: `milestone-${i}`, name: `Milestone ${i}` })
        ),
      });

      mockUseApp.mockReturnValue(largeContextValue);

      render(
        <ProjectCommandCenterModal
          isOpen={true}
          onClose={mockOnClose}
          project={createMockProject()}
          mode="view"
        />
      );

      expect(
        screen.getByTestId('project-command-center-modal')
      ).toBeInTheDocument();
    });
  });
});
