import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useO365SyncWithSettings } from '../useO365SyncWithSettings';
import { o365Service } from '@/services/o365Service';
import { AppConfig } from '@/types';

// Mock the O365 service
vi.mock('@/services/o365Service');

const mockO365Service = vi.mocked(o365Service);

const mockConfig: AppConfig = {
  financialYear: {
    id: 'fy-2024',
    name: 'FY 2024',
    startDate: '2023-10-01',
    endDate: '2024-09-30',
  },
  iterationLength: 'fortnightly',
  quarters: [],
  workingDaysPerWeek: 5,
  workingHoursPerDay: 8,
  workingDaysPerYear: 260,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  integrations: {
    o365: {
      clientId: 'test-client-id',
      tenantId: 'test-tenant-id',
      redirectUri: 'http://localhost:3000/auth/callback',
      enabled: true,
    },
  },
};

describe('useO365SyncWithSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockO365Service.initialize = vi.fn().mockResolvedValue(undefined);
    mockO365Service.getAuthStatus = vi.fn().mockResolvedValue(null);
    mockO365Service.getSyncStatus = vi.fn().mockReturnValue('idle');
    mockO365Service.getLastSyncResult = vi.fn().mockReturnValue(null);
  });

  describe('when config has O365 integration enabled', () => {
    it('should initialize O365 service with settings config', async () => {
      renderHook(() => useO365SyncWithSettings(mockConfig));

      await waitFor(() => {
        expect(mockO365Service.initialize).toHaveBeenCalledWith({
          clientId: 'test-client-id',
          tenantId: 'test-tenant-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          scopes: ['User.Read', 'User.ReadBasic.All'],
        });
      });
    });

    it('should set initialized state to true after successful init', async () => {
      const { result } = renderHook(() => useO365SyncWithSettings(mockConfig));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should not show error when config is valid', async () => {
      const { result } = renderHook(() => useO365SyncWithSettings(mockConfig));

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('when config has O365 integration disabled', () => {
    const disabledConfig: AppConfig = {
      ...mockConfig,
      integrations: {
        o365: {
          clientId: 'test-client-id',
          tenantId: 'test-tenant-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          enabled: false,
        },
      },
    };

    it('should not initialize O365 service when disabled', async () => {
      renderHook(() => useO365SyncWithSettings(disabledConfig));

      await waitFor(() => {
        expect(mockO365Service.initialize).not.toHaveBeenCalled();
      });
    });

    it('should set error message indicating service is disabled', async () => {
      const { result } = renderHook(() =>
        useO365SyncWithSettings(disabledConfig)
      );

      await waitFor(() => {
        expect(result.current.error).toBe(
          'O365 integration is disabled in settings.'
        );
      });
    });
  });

  describe('when config is missing O365 integration', () => {
    const configWithoutO365: AppConfig = {
      ...mockConfig,
      integrations: undefined,
    };

    it('should not initialize O365 service', async () => {
      renderHook(() => useO365SyncWithSettings(configWithoutO365));

      await waitFor(() => {
        expect(mockO365Service.initialize).not.toHaveBeenCalled();
      });
    });

    it('should set error message indicating missing configuration', async () => {
      const { result } = renderHook(() =>
        useO365SyncWithSettings(configWithoutO365)
      );

      await waitFor(() => {
        expect(result.current.error).toBe(
          'O365 integration not configured. Please check settings.'
        );
      });
    });
  });

  describe('when config is missing clientId', () => {
    const configWithoutClientId: AppConfig = {
      ...mockConfig,
      integrations: {
        o365: {
          clientId: '',
          tenantId: 'test-tenant-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          enabled: true,
        },
      },
    };

    it('should not initialize O365 service', async () => {
      renderHook(() => useO365SyncWithSettings(configWithoutClientId));

      await waitFor(() => {
        expect(mockO365Service.initialize).not.toHaveBeenCalled();
      });
    });

    it('should set error message indicating missing Client ID', async () => {
      const { result } = renderHook(() =>
        useO365SyncWithSettings(configWithoutClientId)
      );

      await waitFor(() => {
        expect(result.current.error).toBe(
          'O365 Client ID not configured. Please check settings.'
        );
      });
    });
  });

  describe('when O365 service initialization fails', () => {
    it('should set error message from thrown error', async () => {
      mockO365Service.initialize.mockRejectedValue(new Error('Azure AD error'));

      const { result } = renderHook(() => useO365SyncWithSettings(mockConfig));

      await waitFor(() => {
        expect(result.current.error).toBe('Azure AD error');
      });
    });

    it('should not set initialized state to true', async () => {
      mockO365Service.initialize.mockRejectedValue(new Error('Azure AD error'));

      const { result } = renderHook(() => useO365SyncWithSettings(mockConfig));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(false);
      });
    });
  });

  describe('when config changes', () => {
    it('should reinitialize service with new config', async () => {
      const { rerender } = renderHook(
        ({ config }) => useO365SyncWithSettings(config),
        {
          initialProps: { config: mockConfig },
        }
      );

      const updatedConfig: AppConfig = {
        ...mockConfig,
        integrations: {
          o365: {
            clientId: 'new-client-id',
            tenantId: 'new-tenant-id',
            redirectUri: 'http://localhost:3000/new-callback',
            enabled: true,
          },
        },
      };

      rerender({ config: updatedConfig });

      await waitFor(() => {
        expect(mockO365Service.initialize).toHaveBeenCalledWith({
          clientId: 'new-client-id',
          tenantId: 'new-tenant-id',
          redirectUri: 'http://localhost:3000/new-callback',
          scopes: ['User.Read', 'User.ReadBasic.All'],
        });
      });
    });
  });
});
