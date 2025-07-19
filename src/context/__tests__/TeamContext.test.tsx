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
import { TeamProvider, useTeams } from '@/context/TeamContext';

describe('TeamContext', () => {
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

  it('should add a new team', () => {
    const { result } = renderHook(() => useTeams(), { wrapper: TeamProvider });

    act(() => {
      result.current.addTeam({ name: 'New Team', capacity: 100 });
    });

    expect(result.current.teams).toHaveLength(1);
    expect(result.current.teams[0].name).toBe('New Team');
  });

  it('should update a team', () => {
    const { result } = renderHook(() => useTeams(), { wrapper: TeamProvider });

    act(() => {
      result.current.addTeam({ name: 'Old Team Name', capacity: 100 });
    });

    const teamId = result.current.teams[0].id;

    act(() => {
      result.current.updateTeam(teamId, { name: 'New Team Name' });
    });

    expect(result.current.teams[0].name).toBe('New Team Name');
  });

  it('should delete a team', () => {
    const { result } = renderHook(() => useTeams(), { wrapper: TeamProvider });

    act(() => {
      result.current.addTeam({ name: 'Team to Delete', capacity: 100 });
    });

    const teamId = result.current.teams[0].id;

    act(() => {
      result.current.deleteTeam(teamId);
    });

    expect(result.current.teams).toHaveLength(0);
  });
});
