import { renderHook, act, cleanup } from '@testing-library/react';
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
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

describe('SettingsContext', () => {
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
  it('should update the config', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    act(() => {
      result.current.setConfig({
        financialYear: { startDate: '2024-01-01' },
        quarters: [],
        iterationLength: 'fortnightly',
      });
    });

    expect(result.current.config?.financialYear.startDate).toBe('2024-01-01');
  });

  it('should update the setup complete flag', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    act(() => {
      result.current.setIsSetupComplete(true);
    });

    expect(result.current.isSetupComplete).toBe(true);
  });
});
