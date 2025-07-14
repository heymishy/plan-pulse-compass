import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

describe('SettingsContext', () => {
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
