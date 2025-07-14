import { renderHook, act } from '@testing-library/react';
import { GoalProvider, useGoals } from '@/context/GoalContext';

describe('GoalContext', () => {
  it('should add a new goal', () => {
    const { result } = renderHook(() => useGoals(), { wrapper: GoalProvider });

    act(() => {
      result.current.addGoal({ name: 'New Goal', description: 'A new goal' });
    });

    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].name).toBe('New Goal');
  });

  it('should update a goal', () => {
    const { result } = renderHook(() => useGoals(), { wrapper: GoalProvider });

    act(() => {
      result.current.addGoal({
        name: 'Old Goal Name',
        description: 'A new goal',
      });
    });

    const goalId = result.current.goals[0].id;

    act(() => {
      result.current.updateGoal(goalId, { name: 'New Goal Name' });
    });

    expect(result.current.goals[0].name).toBe('New Goal Name');
  });
});
