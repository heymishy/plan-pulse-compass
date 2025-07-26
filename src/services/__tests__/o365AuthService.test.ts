import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { O365AuthService } from '../o365AuthService';
import { PublicClientApplication } from '@azure/msal-browser';
import type { O365Config } from '@/types/o365Types';

// Mock MSAL
vi.mock('@azure/msal-browser');

const MockedPublicClientApplication = vi.mocked(PublicClientApplication);

describe('O365AuthService', () => {
  let authService: O365AuthService;
  let mockMsalInstance: any;
  const mockConfig: O365Config = {
    clientId: 'test-client-id',
    tenantId: 'test-tenant-id',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['User.Read', 'User.ReadBasic.All'],
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock MSAL instance
    mockMsalInstance = {
      initialize: vi.fn().mockResolvedValue(undefined),
      getAllAccounts: vi.fn().mockReturnValue([]),
      acquireTokenSilent: vi.fn(),
      acquireTokenPopup: vi.fn(),
      logoutPopup: vi.fn(),
    };

    MockedPublicClientApplication.mockImplementation(() => mockMsalInstance);

    authService = new O365AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize MSAL with correct configuration', async () => {
      await authService.initialize(mockConfig);

      expect(MockedPublicClientApplication).toHaveBeenCalledWith({
        auth: {
          clientId: 'test-client-id',
          authority: 'https://login.microsoftonline.com/test-tenant-id',
          redirectUri: 'http://localhost:3000/auth/callback',
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false,
        },
      });

      expect(mockMsalInstance.initialize).toHaveBeenCalled();
    });

    it('should use common authority when tenantId is not provided', async () => {
      const configWithoutTenant = { ...mockConfig, tenantId: undefined };
      await authService.initialize(configWithoutTenant);

      expect(MockedPublicClientApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            authority: 'https://login.microsoftonline.com/common',
          }),
        })
      );
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      await authService.initialize(mockConfig);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new O365AuthService();
      await expect(uninitializedService.authenticate()).rejects.toThrow(
        'O365AuthService not initialized'
      );
    });

    it('should perform interactive authentication when no accounts exist', async () => {
      const mockAuthResult = {
        accessToken: 'mock-access-token',
        account: {
          username: 'test@example.com',
          name: 'Test User',
          localAccountId: 'test-local-id',
        },
        expiresOn: new Date(),
        scopes: ['User.Read'],
      };

      mockMsalInstance.getAllAccounts.mockReturnValue([]);
      mockMsalInstance.acquireTokenPopup.mockResolvedValue(mockAuthResult);

      const result = await authService.authenticate();

      expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalledWith({
        scopes: ['User.Read', 'User.ReadBasic.All'],
        prompt: 'select_account',
      });

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        account: {
          username: 'test@example.com',
          name: 'Test User',
          localAccountId: 'test-local-id',
        },
        expiresOn: mockAuthResult.expiresOn,
      });
    });

    it('should try silent authentication first when accounts exist', async () => {
      const mockAccount = {
        username: 'test@example.com',
        name: 'Test User',
        localAccountId: 'test-local-id',
      };

      const mockAuthResult = {
        accessToken: 'mock-access-token',
        account: mockAccount,
        expiresOn: new Date(),
        scopes: ['User.Read'],
      };

      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(mockAuthResult);

      const result = await authService.authenticate();

      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
        scopes: ['User.Read', 'User.ReadBasic.All'],
        account: mockAccount,
      });

      expect(result.accessToken).toBe('mock-access-token');
    });
  });

  describe('getAuthStatus', () => {
    beforeEach(async () => {
      await authService.initialize(mockConfig);
    });

    it('should return null when not initialized', async () => {
      const uninitializedService = new O365AuthService();
      const result = await uninitializedService.getAuthStatus();
      expect(result).toBeNull();
    });

    it('should return null when no accounts exist', async () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([]);
      const result = await authService.getAuthStatus();
      expect(result).toBeNull();
    });

    it('should return auth result when silent authentication succeeds', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockAuthResult = {
        accessToken: 'mock-token',
        account: mockAccount,
        expiresOn: new Date(),
      };

      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(mockAuthResult);

      const result = await authService.getAuthStatus();
      expect(result?.accessToken).toBe('mock-token');
    });

    it('should return null when silent authentication fails', async () => {
      const mockAccount = { username: 'test@example.com' };

      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.acquireTokenSilent.mockRejectedValue(
        new Error('Token expired')
      );

      const result = await authService.getAuthStatus();
      expect(result).toBeNull();
    });
  });

  describe('signOut', () => {
    beforeEach(async () => {
      await authService.initialize(mockConfig);
    });

    it('should sign out when accounts exist', async () => {
      const mockAccount = { username: 'test@example.com' };
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      await authService.signOut();

      expect(mockMsalInstance.logoutPopup).toHaveBeenCalledWith({
        account: mockAccount,
      });
    });

    it('should not call logout when no accounts exist', async () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([]);

      await authService.signOut();

      expect(mockMsalInstance.logoutPopup).not.toHaveBeenCalled();
    });

    it('should handle uninitialized service gracefully', async () => {
      const uninitializedService = new O365AuthService();
      await expect(uninitializedService.signOut()).resolves.not.toThrow();
    });
  });

  describe('requestPermissions', () => {
    beforeEach(async () => {
      await authService.initialize(mockConfig);
    });

    it('should request additional permissions successfully', async () => {
      const mockAccount = { username: 'test@example.com' };
      const mockAuthResult = {
        scopes: ['User.Read', 'Directory.Read.All'],
      };

      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.acquireTokenPopup.mockResolvedValue(mockAuthResult);

      const result = await authService.requestPermissions([
        'Directory.Read.All',
      ]);

      expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalledWith({
        scopes: ['Directory.Read.All'],
        account: mockAccount,
        prompt: 'consent',
      });

      expect(result).toEqual({
        success: true,
        grantedScopes: ['User.Read', 'Directory.Read.All'],
      });
    });

    it('should handle permission request failure', async () => {
      const mockAccount = { username: 'test@example.com' };

      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);
      mockMsalInstance.acquireTokenPopup.mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await authService.requestPermissions([
        'Directory.Read.All',
      ]);

      expect(result).toEqual({
        success: false,
        grantedScopes: [],
        errorMessage: 'Permission denied',
      });
    });

    it('should return error when no authenticated account found', async () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([]);

      const result = await authService.requestPermissions([
        'Directory.Read.All',
      ]);

      expect(result).toEqual({
        success: false,
        grantedScopes: [],
        errorMessage: 'No authenticated account found',
      });
    });
  });

  describe('getPermissionStatus', () => {
    beforeEach(async () => {
      await authService.initialize(mockConfig);
    });

    it('should return default status when not initialized', async () => {
      const uninitializedService = new O365AuthService();
      const result = await uninitializedService.getPermissionStatus();

      expect(result).toEqual({
        hasBasicAccess: false,
        hasDirectoryAccess: false,
        requiresAdminConsent: false,
        availableScopes: [],
      });
    });

    it('should check permission status successfully', async () => {
      const mockAccount = { username: 'test@example.com' };

      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      // Mock successful basic access check
      mockMsalInstance.acquireTokenSilent
        .mockResolvedValueOnce({ scopes: ['User.Read'] }) // Basic access
        .mockRejectedValueOnce(new Error('Directory access denied')); // Directory access

      const result = await authService.getPermissionStatus();

      expect(result).toEqual({
        hasBasicAccess: true,
        hasDirectoryAccess: false,
        requiresAdminConsent: true,
        availableScopes: ['User.Read'],
      });
    });
  });

  describe('getAdminConsentUrl', () => {
    it('should generate correct admin consent URL', async () => {
      await authService.initialize(mockConfig);

      const url = authService.getAdminConsentUrl();

      expect(url).toContain(
        'https://login.microsoftonline.com/test-tenant-id/adminconsent'
      );
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback'
      );
      expect(url).toContain('scope=User.Read%20User.ReadBasic.All');
    });

    it('should use common tenant when tenantId not provided', async () => {
      const configWithoutTenant = { ...mockConfig, tenantId: undefined };
      await authService.initialize(configWithoutTenant);

      const url = authService.getAdminConsentUrl();

      expect(url).toContain(
        'https://login.microsoftonline.com/common/adminconsent'
      );
    });

    it('should throw error when not initialized', () => {
      expect(() => authService.getAdminConsentUrl()).toThrow(
        'O365AuthService not initialized'
      );
    });
  });
});
