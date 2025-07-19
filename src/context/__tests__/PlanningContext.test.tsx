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
import { PlanningProvider, usePlanning } from '@/context/PlanningContext';

describe('PlanningContext', () => {
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

  it('should add a new allocation', () => {
    const { result } = renderHook(() => usePlanning(), {
      wrapper: PlanningProvider,
    });

    act(() => {
      result.current.setAllocations([
        {
          id: '1',
          teamId: '1',
          epicId: '1',
          cycleId: '1',
          iterationNumber: 1,
          percentage: 100,
        },
      ]);
    });

    expect(result.current.allocations).toHaveLength(1);
    expect(result.current.allocations[0].percentage).toBe(100);
  });
});
