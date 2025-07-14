import { renderHook, act } from '@testing-library/react';
import { TeamProvider, useTeams } from '@/context/TeamContext';

describe('TeamContext', () => {
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
