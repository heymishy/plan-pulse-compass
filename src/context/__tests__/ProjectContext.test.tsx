import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProjects } from '@/context/ProjectContext';

describe('ProjectContext', () => {
  // Enhanced setup/teardown for better isolation
  beforeAll(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear mocks and timers, rely on global setup for DOM cleanup
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('should add a new project', () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: ProjectProvider,
    });

    act(() => {
      result.current.setProjects([
        {
          id: '1',
          name: 'New Project',
          description: 'A new project',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: 'planning',
        },
      ]);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].name).toBe('New Project');
  });

  it('should update a project', () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: ProjectProvider,
    });

    act(() => {
      result.current.setProjects([
        {
          id: '1',
          name: 'Old Project Name',
          description: 'A new project',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: 'planning',
        },
      ]);
    });

    const projectId = result.current.projects[0].id;

    act(() => {
      result.current.updateProject(projectId, {
        ...result.current.projects[0],
        name: 'New Project Name',
      });
    });

    expect(result.current.projects[0].name).toBe('New Project Name');
  });
});
