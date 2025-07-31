import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectTable from '../ProjectTable';
import { useApp } from '@/context/AppContext';

// Mock the AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the SettingsContext
vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    config: {
      financialYear: {
        id: 'fy-2024',
        name: 'FY 2024',
        startDate: '2023-10-01',
        endDate: '2024-09-30',
        quarters: [],
      },
      currencySymbol: '$',
      // Don't provide priorityLevels to test default fallback
    },
    setupComplete: true,
    updateConfig: vi.fn(),
    setSetupComplete: vi.fn(),
  }),
}));

// Mock the DndKit components to make testing easier
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => (
    <div data-testid="dnd-context" data-on-drag-end={onDragEnd}>
      {children}
    </div>
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

const mockSetProjects = vi.fn();
const mockProjects = [
  {
    id: 'project-1',
    name: 'Project One',
    description: 'First project',
    status: 'active' as const,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 100000,
    priority: 1,
    priorityOrder: 1,
    milestones: [],
  },
  {
    id: 'project-2',
    name: 'Project Two',
    description: 'Second project',
    status: 'planning' as const,
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    budget: 150000,
    priority: 2,
    priorityOrder: 2,
    milestones: [],
  },
  {
    id: 'project-3',
    name: 'Project Three',
    description: 'Third project',
    status: 'completed' as const,
    startDate: '2024-01-15',
    endDate: '2024-10-30',
    budget: 75000,
    priority: 3,
    priorityOrder: 3,
    milestones: [],
  },
];

const mockAppContext = {
  setProjects: mockSetProjects,
  setEpics: vi.fn(),
  epics: [],
  allocations: [],
  cycles: [],
  people: [],
  roles: [],
  teams: [],
};

describe('ProjectTable Drag and Drop', () => {
  const mockOnEditProject = vi.fn();
  const mockOnViewProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue(mockAppContext);
  });

  it('should render drag-and-drop enabled table', () => {
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('should display drag handles in priority order column', () => {
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Check for drag handles in priority order column
    const dragHandles = screen.getAllByLabelText('Drag to reorder');
    expect(dragHandles).toHaveLength(3); // One for each project
  });

  it('should show drag indicator when no sorting is applied', () => {
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Check for drag indicator in header
    expect(screen.getByTitle('Drag to reorder')).toBeInTheDocument();
  });

  it('should display priority order values correctly', () => {
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Check that priority order badges are displayed
    expect(screen.getByText('1')).toBeInTheDocument(); // Project One
    expect(screen.getByText('2')).toBeInTheDocument(); // Project Two
    expect(screen.getByText('3')).toBeInTheDocument(); // Project Three
  });

  it('should handle projects without priority order gracefully', () => {
    const projectsWithoutOrder = [
      {
        id: 'project-no-order',
        name: 'Project No Order',
        description: 'Project without priority order',
        status: 'active' as const,
        startDate: '2024-01-01',
        budget: 50000,
        priority: 2,
        priorityOrder: undefined,
        milestones: [],
      },
    ];

    render(
      <ProjectTable
        projects={projectsWithoutOrder}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Should fall back to priority level (2)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show sortable projects in priority order', () => {
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    const projectRows = screen.getAllByRole('row');
    // Skip header row (index 0), check project order
    const projectCells = projectRows.slice(1).map(
      row => row.querySelector('td:nth-child(3)')?.textContent // Project name column
    );

    expect(projectCells).toEqual([
      'Project One',
      'Project Two',
      'Project Three',
    ]);
  });

  it('should handle empty projects array', () => {
    render(
      <ProjectTable
        projects={[]}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();

    // Should show empty state
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
  });

  it('should maintain drag functionality with filtering', async () => {
    const user = userEvent.setup();
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Filter projects...');
    await user.type(searchInput, 'Project One');

    // Should still have drag functionality
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
  });

  it('should integrate with existing table features', () => {
    render(
      <ProjectTable
        projects={mockProjects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Check that all table features are still present
    expect(
      screen.getByPlaceholderText('Filter projects...')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Select all projects')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Select .*/)).toHaveLength(4); // 1 select all + 3 individual
    expect(screen.getAllByRole('button', { name: /Sort by/ })).toHaveLength(5); // 5 sortable columns
  });
});
