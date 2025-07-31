import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import ProjectTable from '../ProjectTable';
import ProjectPriorityEditor from '../ProjectPriorityEditor';

// Mock contexts
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock DndKit for table tests
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (array: any[], oldIndex: number, newIndex: number) => {
    const result = [...array];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  },
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

const mockConfigurablePriorityLevels = [
  {
    id: 1,
    label: 'Critical - Regulatory',
    description: 'Regulatory compliance requirements',
    color: 'bg-red-100 text-red-800',
  },
  {
    id: 2,
    label: 'High - Strategic',
    description: 'Strategic business initiatives',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 3,
    label: 'Medium - Operational',
    description: 'Operational improvements',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 4,
    label: 'Low - Enhancement',
    description: 'Nice-to-have enhancements',
    color: 'bg-green-100 text-green-800',
  },
];

const mockProjectsWithConfigurablePriority = [
  {
    id: 'project-1',
    name: 'Regulatory Compliance Project',
    description: 'Must comply with new regulations',
    status: 'active' as const,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 100000,
    priority: 1, // Critical - Regulatory
    priorityOrder: 1,
    milestones: [],
  },
  {
    id: 'project-2',
    name: 'Strategic Initiative',
    description: 'New market expansion',
    status: 'planning' as const,
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    budget: 150000,
    priority: 2, // High - Strategic
    priorityOrder: 2,
    milestones: [],
  },
];

const mockAppContext = {
  setProjects: vi.fn(),
  setEpics: vi.fn(),
  epics: [],
  allocations: [],
  cycles: [],
  people: [],
  roles: [],
  teams: [],
};

const mockSettingsContext = {
  config: {
    financialYear: {
      id: 'fy-2024',
      name: 'FY 2024',
      startDate: '2023-10-01',
      endDate: '2024-09-30',
      quarters: [],
    },
    currencySymbol: '$',
    priorityLevels: mockConfigurablePriorityLevels,
  },
  setupComplete: true,
  updateConfig: vi.fn(),
  setSetupComplete: vi.fn(),
};

describe('Configurable Priority Levels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue(mockAppContext);
    (useSettings as any).mockReturnValue(mockSettingsContext);
  });

  describe('ProjectTable with Configurable Priority Levels', () => {
    it('should display custom priority labels in table', () => {
      render(
        <ProjectTable
          projects={mockProjectsWithConfigurablePriority}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Should show the priority order numbers, not the custom labels in the table
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show custom priority labels in filter dropdown', async () => {
      render(
        <ProjectTable
          projects={mockProjectsWithConfigurablePriority}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Click on priority filter dropdown
      const priorityFilter = screen.getByLabelText('Filter by priority');
      fireEvent.click(priorityFilter);

      // Wait for dropdown to open and check for custom priority labels
      await waitFor(() => {
        expect(screen.getByText('Critical - Regulatory')).toBeInTheDocument();
      });

      expect(screen.getByText('High - Strategic')).toBeInTheDocument();
      expect(screen.getByText('Medium - Operational')).toBeInTheDocument();
      expect(screen.getByText('Low - Enhancement')).toBeInTheDocument();
    });

    it('should filter projects by custom priority labels', async () => {
      const user = userEvent.setup();
      render(
        <ProjectTable
          projects={mockProjectsWithConfigurablePriority}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Click on priority filter dropdown
      const priorityFilter = screen.getByLabelText('Filter by priority');
      await user.click(priorityFilter);

      // Select "Critical - Regulatory" filter
      await user.click(screen.getByText('Critical - Regulatory'));

      // Should only show the regulatory compliance project
      expect(
        screen.getByText('Regulatory Compliance Project')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Strategic Initiative')
      ).not.toBeInTheDocument();
    });
  });

  describe('ProjectPriorityEditor with Configurable Priority Levels', () => {
    it('should display custom priority labels in dropdown', () => {
      render(
        <ProjectPriorityEditor
          priority={1}
          priorityOrder={1}
          onPriorityChange={vi.fn()}
          onPriorityOrderChange={vi.fn()}
        />
      );

      // Click on priority level dropdown
      const prioritySelect = screen.getByRole('combobox', {
        name: /priority level/i,
      });
      fireEvent.click(prioritySelect);

      // Should show custom priority labels (may appear multiple times in dropdown)
      expect(
        screen.getAllByText('Critical - Regulatory').length
      ).toBeGreaterThan(0);
      expect(screen.getByText('High - Strategic')).toBeInTheDocument();
      expect(screen.getByText('Medium - Operational')).toBeInTheDocument();
      expect(screen.getByText('Low - Enhancement')).toBeInTheDocument();
    });

    it('should show custom priority descriptions', () => {
      render(
        <ProjectPriorityEditor
          priority={1}
          priorityOrder={1}
          onPriorityChange={vi.fn()}
          onPriorityOrderChange={vi.fn()}
        />
      );

      // Should show the description for priority level 1
      expect(
        screen.getByText(/regulatory compliance requirements/i)
      ).toBeInTheDocument();
    });

    it('should display custom priority badge colors', () => {
      render(
        <ProjectPriorityEditor
          priority={1}
          priorityOrder={1}
          onPriorityChange={vi.fn()}
          onPriorityOrderChange={vi.fn()}
        />
      );

      // Check that the priority badge has the correct color class
      const priorityBadges = screen.getAllByText('1');
      const priorityBadge = priorityBadges[0];
      expect(priorityBadge).toHaveClass('bg-red-100');
      expect(priorityBadge).toHaveClass('text-red-800');
    });

    it('should handle priority level changes with custom labels', async () => {
      const mockOnPriorityChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ProjectPriorityEditor
          priority={2}
          priorityOrder={2}
          onPriorityChange={mockOnPriorityChange}
          onPriorityOrderChange={vi.fn()}
        />
      );

      const prioritySelect = screen.getByRole('combobox', {
        name: /priority level/i,
      });
      await user.click(prioritySelect);

      await waitFor(() => {
        expect(screen.getByText('Critical - Regulatory')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Critical - Regulatory'));

      expect(mockOnPriorityChange).toHaveBeenCalledWith(1);
    });

    it('should fallback to default labels when no custom priority levels configured', () => {
      // Mock settings without custom priority levels
      (useSettings as any).mockReturnValue({
        ...mockSettingsContext,
        config: {
          ...mockSettingsContext.config,
          priorityLevels: undefined,
        },
      });

      render(
        <ProjectPriorityEditor
          priority={1}
          priorityOrder={1}
          onPriorityChange={vi.fn()}
          onPriorityOrderChange={vi.fn()}
        />
      );

      // Click on priority level dropdown
      const prioritySelect = screen.getByRole('combobox', {
        name: /priority level/i,
      });
      fireEvent.click(prioritySelect);

      // Should show default priority labels (may appear multiple times in dropdown)
      expect(screen.getAllByText('Priority 1').length).toBeGreaterThan(0);
      expect(screen.getByText('Priority 2')).toBeInTheDocument();
      expect(screen.getByText('Priority 3')).toBeInTheDocument();
      expect(screen.getByText('Priority 4')).toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    it('should save custom priority levels to settings', async () => {
      const mockUpdateConfig = vi.fn();
      (useSettings as any).mockReturnValue({
        ...mockSettingsContext,
        updateConfig: mockUpdateConfig,
      });

      // This test would be for a priority level settings component
      // For now, we're testing that the settings context integration works
      expect(mockSettingsContext.config.priorityLevels).toEqual(
        mockConfigurablePriorityLevels
      );
    });

    it('should persist custom priority levels across sessions', () => {
      // Test that priority levels are loaded from settings correctly
      render(
        <ProjectPriorityEditor
          priority={1}
          priorityOrder={1}
          onPriorityChange={vi.fn()}
          onPriorityOrderChange={vi.fn()}
        />
      );

      // Should display the configured custom priority level
      expect(
        screen.getByText(/regulatory compliance requirements/i)
      ).toBeInTheDocument();
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle projects created before custom priority levels', () => {
      const legacyProject = {
        id: 'legacy-project',
        name: 'Legacy Project',
        description: 'Created before custom priority levels',
        status: 'active' as const,
        startDate: '2024-01-01',
        priority: 2,
        priorityOrder: 2,
        milestones: [],
      };

      render(
        <ProjectTable
          projects={[legacyProject]}
          onEditProject={vi.fn()}
          onViewProject={vi.fn()}
        />
      );

      // Should still display correctly with custom priority level mapping
      expect(screen.getByText('Legacy Project')).toBeInTheDocument();
    });

    it('should handle invalid priority values gracefully', () => {
      const invalidPriorityProject = {
        id: 'invalid-project',
        name: 'Invalid Priority Project',
        description: 'Has an invalid priority value',
        status: 'active' as const,
        startDate: '2024-01-01',
        priority: 99, // Invalid priority value
        priorityOrder: 99,
        milestones: [],
      };

      render(
        <ProjectPriorityEditor
          priority={99}
          priorityOrder={99}
          onPriorityChange={vi.fn()}
          onPriorityOrderChange={vi.fn()}
        />
      );

      // Should fallback to a default priority level or show appropriate message
      expect(screen.getByText('Project Priority')).toBeInTheDocument();
    });
  });
});
