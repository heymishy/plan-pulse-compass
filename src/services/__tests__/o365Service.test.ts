import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { O365Service } from '../o365Service';
import { O365AuthService } from '../o365AuthService';
import { O365GraphService } from '../o365GraphService';

// Mock the services
vi.mock('../o365AuthService');
vi.mock('../o365GraphService');

const MockedO365AuthService = vi.mocked(O365AuthService);
const MockedO365GraphService = vi.mocked(O365GraphService);

describe('O365Service', () => {
  let o365Service: O365Service;
  let mockAuthService: any;
  let mockGraphService: any;

  const mockConfig = {
    clientId: 'test-client-id',
    tenantId: 'test-tenant-id',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['User.Read', 'User.ReadBasic.All'],
  };

  const mockAuthResult = {
    accessToken: 'mock-access-token',
    account: {
      username: 'test@example.com',
      name: 'Test User',
      localAccountId: 'test-local-id',
    },
    expiresOn: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock instances
    mockAuthService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      authenticate: vi.fn().mockResolvedValue(mockAuthResult),
      getAuthStatus: vi.fn().mockResolvedValue(mockAuthResult),
      signOut: vi.fn().mockResolvedValue(undefined),
      getPermissionStatus: vi.fn().mockResolvedValue({
        hasBasicAccess: true,
        hasDirectoryAccess: false,
        requiresAdminConsent: true,
        availableScopes: ['User.Read'],
      }),
      requestPermissions: vi.fn(),
      getAdminConsentUrl: vi.fn().mockReturnValue('https://consent.url'),
    };

    mockGraphService = {
      initialize: vi.fn(),
      syncEmployees: vi.fn().mockResolvedValue({
        employees: [],
        totalCount: 0,
        syncedCount: 0,
        errors: [],
        timestamp: new Date(),
      }),
      getEmployeesByBusinessUnit: vi.fn().mockResolvedValue([]),
      getBusinessUnits: vi.fn().mockResolvedValue(['Engineering', 'Marketing']),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      testConnection: vi.fn().mockResolvedValue(true),
    };

    MockedO365AuthService.mockImplementation(() => mockAuthService);
    MockedO365GraphService.mockImplementation(() => mockGraphService);

    o365Service = new O365Service();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize auth service and set initialized flag', async () => {
      await o365Service.initialize(mockConfig);

      expect(mockAuthService.initialize).toHaveBeenCalledWith(mockConfig);
      expect(o365Service.isReady()).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return false when not initialized', () => {
      expect(o365Service.isReady()).toBe(false);
    });

    it('should return true when initialized', async () => {
      await o365Service.initialize(mockConfig);
      expect(o365Service.isReady()).toBe(true);
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      await o365Service.initialize(mockConfig);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new O365Service();

      await expect(uninitializedService.authenticate()).rejects.toThrow(
        'O365Service not initialized'
      );
    });

    it('should authenticate and initialize graph service', async () => {
      const result = await o365Service.authenticate();

      expect(mockAuthService.authenticate).toHaveBeenCalled();
      expect(mockGraphService.initialize).toHaveBeenCalledWith(
        'mock-access-token'
      );
      expect(result).toEqual(mockAuthResult);
      expect(o365Service.getSyncStatus()).toBe('idle');
    });

    it('should set sync status to authenticating during process', async () => {
      // Mock authenticate to be async so we can check intermediate state
      let resolveAuth: (value: any) => void;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });
      mockAuthService.authenticate.mockReturnValue(authPromise);

      const authenticatePromise = o365Service.authenticate();

      expect(o365Service.getSyncStatus()).toBe('authenticating');

      resolveAuth!(mockAuthResult);
      await authenticatePromise;

      expect(o365Service.getSyncStatus()).toBe('idle');
    });

    it('should set sync status to error on failure', async () => {
      mockAuthService.authenticate.mockRejectedValue(new Error('Auth failed'));

      await expect(o365Service.authenticate()).rejects.toThrow('Auth failed');
      expect(o365Service.getSyncStatus()).toBe('error');
    });
  });

  describe('getAuthStatus', () => {
    it('should return null when not initialized', async () => {
      const result = await o365Service.getAuthStatus();
      expect(result).toBeNull();
    });

    it('should return auth status and initialize graph service when authenticated', async () => {
      await o365Service.initialize(mockConfig);

      const result = await o365Service.getAuthStatus();

      expect(mockAuthService.getAuthStatus).toHaveBeenCalled();
      expect(mockGraphService.initialize).toHaveBeenCalledWith(
        'mock-access-token'
      );
      expect(result).toEqual(mockAuthResult);
    });

    it('should not initialize graph service when not authenticated', async () => {
      await o365Service.initialize(mockConfig);
      mockAuthService.getAuthStatus.mockResolvedValue(null);

      const result = await o365Service.getAuthStatus();

      expect(result).toBeNull();
      expect(mockGraphService.initialize).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should handle uninitialized service gracefully', async () => {
      await expect(o365Service.signOut()).resolves.not.toThrow();
    });

    it('should sign out and reset state', async () => {
      await o365Service.initialize(mockConfig);

      // Set some state first
      await o365Service.authenticate();
      await o365Service.syncEmployees();

      await o365Service.signOut();

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(o365Service.getSyncStatus()).toBe('idle');
      expect(o365Service.getLastSyncResult()).toBeNull();
    });
  });

  describe('syncEmployees', () => {
    beforeEach(async () => {
      await o365Service.initialize(mockConfig);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new O365Service();

      await expect(uninitializedService.syncEmployees()).rejects.toThrow(
        'O365Service not initialized'
      );
    });

    it('should throw error when not authenticated', async () => {
      mockAuthService.getAuthStatus.mockResolvedValue(null);

      await expect(o365Service.syncEmployees()).rejects.toThrow(
        'Not authenticated. Please sign in first.'
      );
    });

    it('should sync employees successfully', async () => {
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

      mockGraphService.syncEmployees.mockResolvedValue(mockSyncResult);

      const options = { businessUnit: 'Engineering', maxUsers: 100 };
      const result = await o365Service.syncEmployees(options);

      expect(mockAuthService.getAuthStatus).toHaveBeenCalled();
      expect(mockGraphService.syncEmployees).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockSyncResult);
      expect(o365Service.getLastSyncResult()).toEqual(mockSyncResult);
      expect(o365Service.getSyncStatus()).toBe('complete');
    });

    it('should set status to error when sync has errors', async () => {
      const mockSyncResult = {
        employees: [],
        totalCount: 0,
        syncedCount: 0,
        errors: [{ code: 'ERROR', message: 'Test error' }],
        timestamp: new Date(),
      };

      mockGraphService.syncEmployees.mockResolvedValue(mockSyncResult);

      await o365Service.syncEmployees();

      expect(o365Service.getSyncStatus()).toBe('error');
    });

    it('should set status to error on exception', async () => {
      mockGraphService.syncEmployees.mockRejectedValue(
        new Error('Sync failed')
      );

      await expect(o365Service.syncEmployees()).rejects.toThrow('Sync failed');
      expect(o365Service.getSyncStatus()).toBe('error');
    });
  });

  describe('getEmployeesByBusinessUnit', () => {
    beforeEach(async () => {
      await o365Service.initialize(mockConfig);
    });

    it('should get employees by business unit', async () => {
      const mockEmployees = [
        {
          id: '1',
          displayName: 'John Doe',
          mail: 'john@company.com',
          department: 'Engineering',
          businessUnit: 'Engineering',
          isActive: true,
        },
      ];

      mockGraphService.getEmployeesByBusinessUnit.mockResolvedValue(
        mockEmployees
      );

      const result =
        await o365Service.getEmployeesByBusinessUnit('Engineering');

      expect(mockAuthService.getAuthStatus).toHaveBeenCalled();
      expect(mockGraphService.getEmployeesByBusinessUnit).toHaveBeenCalledWith(
        'Engineering'
      );
      expect(result).toEqual(mockEmployees);
    });

    it('should throw error when not authenticated', async () => {
      mockAuthService.getAuthStatus.mockResolvedValue(null);

      await expect(
        o365Service.getEmployeesByBusinessUnit('Engineering')
      ).rejects.toThrow('Not authenticated. Please sign in first.');
    });
  });

  describe('getBusinessUnits', () => {
    beforeEach(async () => {
      await o365Service.initialize(mockConfig);
    });

    it('should get business units', async () => {
      const result = await o365Service.getBusinessUnits();

      expect(mockAuthService.getAuthStatus).toHaveBeenCalled();
      expect(mockGraphService.getBusinessUnits).toHaveBeenCalled();
      expect(result).toEqual(['Engineering', 'Marketing']);
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(async () => {
      await o365Service.initialize(mockConfig);
    });

    it('should get current user', async () => {
      const mockUser = {
        id: '1',
        displayName: 'Current User',
        mail: 'current@company.com',
        department: 'IT',
        businessUnit: 'IT',
        isActive: true,
      };

      mockGraphService.getCurrentUser.mockResolvedValue(mockUser);

      const result = await o365Service.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockAuthService.getAuthStatus.mockResolvedValue(null);

      const result = await o365Service.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('testConnection', () => {
    beforeEach(async () => {
      await o365Service.initialize(mockConfig);
    });

    it('should test connection successfully', async () => {
      const result = await o365Service.testConnection();

      expect(mockAuthService.getAuthStatus).toHaveBeenCalled();
      expect(mockGraphService.testConnection).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      mockAuthService.getAuthStatus.mockResolvedValue(null);

      const result = await o365Service.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('createConfig', () => {
    it('should create default config', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        VITE_O365_CLIENT_ID: 'env-client-id',
        VITE_O365_TENANT_ID: 'env-tenant-id',
        VITE_O365_REDIRECT_URI: 'http://env.example.com/callback',
      };

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      const config = O365Service.createConfig();

      expect(config).toEqual({
        clientId: 'env-client-id',
        tenantId: 'env-tenant-id',
        redirectUri: 'http://env.example.com/callback',
        scopes: ['User.Read', 'User.ReadBasic.All'],
      });

      process.env = originalEnv;
    });

    it('should use defaults when environment variables not set', () => {
      // Mock environment variables as empty
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.VITE_O365_CLIENT_ID;
      delete process.env.VITE_O365_TENANT_ID;
      delete process.env.VITE_O365_REDIRECT_URI;

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      const config = O365Service.createConfig();

      expect(config).toEqual({
        clientId: '',
        tenantId: undefined,
        redirectUri: 'http://localhost:3000/auth/callback',
        scopes: ['User.Read', 'User.ReadBasic.All'],
      });

      process.env = originalEnv;
    });

    it('should merge overrides with default config', () => {
      const config = O365Service.createConfig({
        clientId: 'override-client-id',
        scopes: ['User.Read', 'Directory.Read.All'],
      });

      expect(config.clientId).toBe('override-client-id');
      expect(config.scopes).toEqual(['User.Read', 'Directory.Read.All']);
    });
  });
});
