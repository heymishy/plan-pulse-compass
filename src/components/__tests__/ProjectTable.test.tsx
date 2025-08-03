import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProjectTable from '@/components/projects/ProjectTable';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types';

// Mock the contexts and hooks
vi.mock('@/context/AppContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/utils/financialCalculations', () => ({
  calculateProjectCost: vi.fn(() => ({ totalCost: 100000 })),
}));

const mockUseApp = vi.mocked(useApp);
const mockUseToast = vi.mocked(useToast);

describe('ProjectTable', () => {
  const mockToast = vi.fn();
  const mockOnEditProject = vi.fn();
  const mockOnViewProject = vi.fn();

  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    shortname: 'TEST',
    description: 'Test project description',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 100000,
    milestones: [],
    priority: 1,
    ranking: 1,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  };

  const projectWithUndefinedStatus: Project = {
    ...mockProject,
    id: 'project-2',
    name: 'Project with undefined status',
    status: undefined as any, // This simulates the bug
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockReturnValue({ toast: mockToast });

    mockUseApp.mockReturnValue({
      projects: [],
      setProjects: vi.fn(),
      epics: [],
      setEpics: vi.fn(),
      allocations: [],
      cycles: [],
      people: [],
      roles: [],
      teams: [],
      config: {
        financialYear: {
          id: 'fy2024',
          name: 'FY2024',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          quarters: [],
        },
        priorityLevels: [],
      },
      setAllocations: vi.fn(),
      setCycles: vi.fn(),
      setPeople: vi.fn(),
      setRoles: vi.fn(),
      setTeams: vi.fn(),
      setConfig: vi.fn(),
      isLoading: false,
      error: null,
      lastSync: null,
      syncData: vi.fn(),
    });
  });

  it('should handle undefined project status gracefully (defensive coding test)', () => {
    // This test verifies our defensive handling of undefined status
    const projects = [projectWithUndefinedStatus];

    // This should NOT throw an error even when status is undefined
    expect(() => {
      render(
        <ProjectTable
          projects={projects}
          onEditProject={mockOnEditProject}
          onViewProject={mockOnViewProject}
        />
      );
    }).not.toThrow();

    // Should render the table with the project
    expect(
      screen.getByText('Project with undefined status')
    ).toBeInTheDocument();
  });

  it('should handle valid project status correctly', () => {
    // This test should pass for valid statuses
    const projects = [mockProject];

    render(
      <ProjectTable
        projects={projects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Should render the project with a proper status badge
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should handle invalid project status gracefully after fix', () => {
    // This test will pass once we fix the status handling
    const projects = [projectWithUndefinedStatus];

    render(
      <ProjectTable
        projects={projects}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // Should render the project with a fallback status badge
    expect(
      screen.getByText('Project with undefined status')
    ).toBeInTheDocument();
    // Should show a fallback status (like 'Planning')
    expect(screen.getByText('Planning')).toBeInTheDocument();
  });

  it('should handle all valid status types', () => {
    const projectsWithAllStatuses: Project[] = [
      { ...mockProject, id: '1', status: 'planning' },
      { ...mockProject, id: '2', status: 'active' },
      { ...mockProject, id: '3', status: 'completed' },
      { ...mockProject, id: '4', status: 'cancelled' },
    ];

    render(
      <ProjectTable
        projects={projectsWithAllStatuses}
        onEditProject={mockOnEditProject}
        onViewProject={mockOnViewProject}
      />
    );

    // All status badges should render correctly
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});
