import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useO365Sync } from '../useO365Sync';
import { o365Service } from '@/services/o365Service';

// Mock the O365 service
vi.mock('@/services/o365Service', () => ({
  o365Service: {
    initialize: vi.fn(),
    getAuthStatus: vi.fn(),
    authenticate: vi.fn(),
    signOut: vi.fn(),
    syncEmployees: vi.fn(),
    getEmployeesByBusinessUnit: vi.fn(),
    getBusinessUnits: vi.fn(),
    getCurrentUser: vi.fn(),
    getPermissionStatus: vi.fn(),
    requestPermissions: vi.fn(),
    getAdminConsentUrl: vi.fn(),
    testConnection: vi.fn(),
    getSyncStatus: vi.fn(),
  },
  O365Service: {
    createConfig: vi.fn(),
  },
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('useO365Sync', () => {
  const mockAuthResult = {
    accessToken: 'mock-access-token',
    account: {
      username: 'test@example.com',
      name: 'Test User',
      localAccountId: 'test-local-id',
    },
    expiresOn: new Date(),
  };

  const mockSyncResult = {
    employees: [
      {
        id: '1',
        displayName: 'John Doe',
        mail: 'john@company.com',
        department: 'Engineering',
        businessUnit: 'Engineering',
        isActive: true,
      },
    ],
    totalCount: 1,
    syncedCount: 1,
    errors: [],
    timestamp: new Date(),
  };

  const mockPermissionStatus = {
    hasBasicAccess: true,
    hasDirectoryAccess: false,
    requiresAdminConsent: true,
    availableScopes: ['User.Read'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(o365Service.initialize).mockResolvedValue(undefined);
    vi.mocked(o365Service.getAuthStatus).mockResolvedValue(null);
    vi.mocked(o365Service.authenticate).mockResolvedValue(mockAuthResult);
    vi.mocked(o365Service.signOut).mockResolvedValue(undefined);
    vi.mocked(o365Service.syncEmployees).mockResolvedValue(mockSyncResult);
    vi.mocked(o365Service.getEmployeesByBusinessUnit).mockResolvedValue(
      mockSyncResult.employees
    );
    vi.mocked(o365Service.getBusinessUnits).mockResolvedValue([
      'Engineering',
      'Marketing',
    ]);
    vi.mocked(o365Service.getCurrentUser).mockResolvedValue(null);
    vi.mocked(o365Service.getPermissionStatus).mockResolvedValue(
      mockPermissionStatus
    );
    vi.mocked(o365Service.requestPermissions).mockResolvedValue({
      success: true,
      grantedScopes: ['User.Read', 'User.ReadBasic.All'],
    });
    vi.mocked(o365Service.getAdminConsentUrl).mockReturnValue(
      'https://consent.url'
    );
    vi.mocked(o365Service.testConnection).mockResolvedValue(true);
    vi.mocked(o365Service.getSyncStatus).mockReturnValue('idle');

    // Mock O365Service.createConfig
    const o365ServiceModule = await import('@/services/o365Service');
    vi.mocked(o365ServiceModule.O365Service.createConfig).mockReturnValue({
      clientId: 'test-client-id',
      tenantId: 'test-tenant-id',
      redirectUri: 'http://localhost:3000/auth/callback',
      scopes: ['User.Read', 'User.ReadBasic.All'],
    });

    // Mock environment variables
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VITE_O365_CLIENT_ID: 'test-client-id',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize service on mount', async () => {
      renderHook(() => useO365Sync());

      await waitFor(() => {
        expect(o365Service.initialize).toHaveBeenCalled();
      });
    });

    it('should check authentication status on initialization', async () => {
      vi.mocked(o365Service.getAuthStatus).mockResolvedValue(mockAuthResult);
      vi.mocked(o365Service.getCurrentUser).mockResolvedValue(
        mockSyncResult.employees[0]
      );
      vi.mocked(o365Service.getPermissionStatus).mockResolvedValue(
        mockPermissionStatus
      );

      const { result } = renderHook(() => useO365Sync());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.currentUser).toEqual(mockSyncResult.employees[0]);
        expect(result.current.permissionStatus).toEqual(mockPermissionStatus);
      });
    });

    it('should handle initialization error when no client ID', async () => {
      const o365ServiceModule = await import('@/services/o365Service');
      vi.mocked(o365ServiceModule.O365Service.createConfig).mockReturnValue({
        clientId: '',
        scopes: ['User.Read'],
      });

      const { result } = renderHook(() => useO365Sync());

      await waitFor(() => {
        expect(result.current.error).toBe(
          'O365 Client ID not configured. Please check environment variables.'
        );
        expect(result.current.isInitialized).toBe(false);
      });
    });

    it('should handle initialization failure', async () => {
      vi.mocked(o365Service.initialize).mockRejectedValue(
        new Error('Init failed')
      );

      const { result } = renderHook(() => useO365Sync());

      await waitFor(() => {
        expect(result.current.error).toBe('Init failed');
        expect(result.current.isInitialized).toBe(false);
      });
    });
  });

  describe('authentication', () => {
    it('should authenticate successfully', async () => {
      const { result } = renderHook(() => useO365Sync());

      await act(async () => {
        const authResult = await result.current.authenticate();
        expect(authResult).toEqual(mockAuthResult);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(o365Service.authenticate).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      vi.mocked(o365Service.authenticate).mockRejectedValue(
        new Error('Auth failed')
      );

      const { result } = renderHook(() => useO365Sync());

      await act(async () => {
        await expect(result.current.authenticate()).rejects.toThrow(
          'Auth failed'
        );
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Auth failed');
    });

    it('should throw error when not initialized', async () => {
      vi.mocked(o365Service.initialize).mockRejectedValue(
        new Error('Init failed')
      );

      const { result } = renderHook(() => useO365Sync());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(false);
      });

      await act(async () => {
        await expect(result.current.authenticate()).rejects.toThrow(
          'O365 service not initialized'
        );
      });
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const { result } = renderHook(() => useO365Sync());

      // First authenticate
      await act(async () => {
        await result.current.authenticate();
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then sign out
      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(result.current.permissionStatus).toBeNull();
      expect(result.current.lastSyncResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(o365Service.signOut).toHaveBeenCalled();
    });

    it('should handle sign out failure', async () => {
      vi.mocked(o365Service.signOut).mockRejectedValue(
        new Error('Sign out failed')
      );

      const { result } = renderHook(() => useO365Sync());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toBe('Sign out failed');
    });
  });

  describe('syncEmployees', () => {
    it('should sync employees successfully', async () => {
      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      const options = { businessUnit: 'Engineering', maxUsers: 100 };

      await act(async () => {
        const syncResult = await result.current.syncEmployees(options);
        expect(syncResult).toEqual(mockSyncResult);
      });

      expect(result.current.lastSyncResult).toEqual(mockSyncResult);
      expect(o365Service.syncEmployees).toHaveBeenCalledWith(options);
    });

    it('should handle sync failure', async () => {
      vi.mocked(o365Service.syncEmployees).mockRejectedValue(
        new Error('Sync failed')
      );

      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      await act(async () => {
        await expect(result.current.syncEmployees()).rejects.toThrow(
          'Sync failed'
        );
      });

      expect(result.current.error).toBe('Sync failed');
    });

    it('should throw error when not authenticated', async () => {
      const { result } = renderHook(() => useO365Sync());

      await act(async () => {
        await expect(result.current.syncEmployees()).rejects.toThrow(
          'Not authenticated'
        );
      });
    });

    it('should update sync status during sync', async () => {
      let resolveSync: (value: any) => void;
      const syncPromise = new Promise(resolve => {
        resolveSync = resolve;
      });

      vi.mocked(o365Service.syncEmployees).mockReturnValue(syncPromise);
      vi.mocked(o365Service.getSyncStatus)
        .mockReturnValueOnce('idle')
        .mockReturnValueOnce('syncing')
        .mockReturnValueOnce('complete');

      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      // Start sync
      act(() => {
        result.current.syncEmployees();
      });

      // Complete sync
      act(() => {
        resolveSync!(mockSyncResult);
      });

      await waitFor(() => {
        expect(result.current.syncStatus).toBe('complete');
      });
    });
  });

  describe('getEmployeesByBusinessUnit', () => {
    it('should get employees by business unit', async () => {
      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      await act(async () => {
        const employees =
          await result.current.getEmployeesByBusinessUnit('Engineering');
        expect(employees).toEqual(mockSyncResult.employees);
      });

      expect(o365Service.getEmployeesByBusinessUnit).toHaveBeenCalledWith(
        'Engineering'
      );
    });

    it('should handle failure', async () => {
      vi.mocked(o365Service.getEmployeesByBusinessUnit).mockRejectedValue(
        new Error('Failed')
      );

      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      await act(async () => {
        await expect(
          result.current.getEmployeesByBusinessUnit('Engineering')
        ).rejects.toThrow('Failed to get employees');
      });

      expect(result.current.error).toBe('Failed to get employees');
    });
  });

  describe('requestPermissions', () => {
    it('should request permissions successfully', async () => {
      const { result } = renderHook(() => useO365Sync());

      await act(async () => {
        const permResult = await result.current.requestPermissions([
          'Directory.Read.All',
        ]);
        expect(permResult.success).toBe(true);
      });

      expect(o365Service.requestPermissions).toHaveBeenCalledWith([
        'Directory.Read.All',
      ]);
    });

    it('should refresh permission status after successful request', async () => {
      const newPermissions = {
        ...mockPermissionStatus,
        hasDirectoryAccess: true,
        requiresAdminConsent: false,
      };

      vi.mocked(o365Service.getPermissionStatus).mockResolvedValueOnce(
        newPermissions
      );

      const { result } = renderHook(() => useO365Sync());

      await act(async () => {
        await result.current.requestPermissions(['Directory.Read.All']);
      });

      expect(result.current.permissionStatus).toEqual(newPermissions);
    });
  });

  describe('utility methods', () => {
    it('should provide permission status utilities', async () => {
      const { result } = renderHook(() => useO365Sync());

      // Wait for initialization and load permission status
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Authenticate to load permissions
      await act(async () => {
        await result.current.authenticate();
      });

      expect(result.current.hasBasicPermissions).toBe(true);
      expect(result.current.hasDirectoryPermissions).toBe(false);
      expect(result.current.requiresAdminConsent).toBe(true);
    });

    it('should get admin consent URL', () => {
      const { result } = renderHook(() => useO365Sync());

      const url = result.current.getAdminConsentUrl();
      expect(url).toBe('https://consent.url');
    });

    it('should test connection', async () => {
      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      await act(async () => {
        const isConnected = await result.current.testConnection();
        expect(isConnected).toBe(true);
      });
    });

    it('should refresh business units', async () => {
      const { result } = renderHook(() => useO365Sync());

      // Authenticate first
      await act(async () => {
        await result.current.authenticate();
      });

      await act(async () => {
        await result.current.refreshBusinessUnits();
      });

      expect(result.current.businessUnits).toEqual([
        'Engineering',
        'Marketing',
      ]);
      expect(o365Service.getBusinessUnits).toHaveBeenCalled();
    });
  });
});
