import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { O365GraphService } from '../o365GraphService';
import { Client } from '@microsoft/microsoft-graph-client';

// Mock Microsoft Graph Client
vi.mock('@microsoft/microsoft-graph-client');

const MockedClient = vi.mocked(Client);

describe('O365GraphService', () => {
  let graphService: O365GraphService;
  let mockGraphClient: any;

  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Graph client
    mockGraphClient = {
      api: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      top: vi.fn().mockReturnThis(),
      get: vi.fn(),
    };

    MockedClient.init = vi.fn().mockReturnValue(mockGraphClient);

    graphService = new O365GraphService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize Graph client with access token', () => {
      graphService.initialize(mockAccessToken);

      expect(MockedClient.init).toHaveBeenCalledWith({
        authProvider: expect.any(Function),
      });
    });

    it('should call auth provider callback with access token', () => {
      const mockDone = vi.fn();

      graphService.initialize(mockAccessToken);

      // Get the auth provider function that was passed to Client.init
      const authProvider = MockedClient.init.mock.calls[0][0].authProvider;
      authProvider(mockDone);

      expect(mockDone).toHaveBeenCalledWith(null, mockAccessToken);
    });
  });

  describe('syncEmployees', () => {
    beforeEach(() => {
      graphService.initialize(mockAccessToken);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new O365GraphService();

      await expect(uninitializedService.syncEmployees()).rejects.toThrow(
        'Graph client not initialized'
      );
    });

    it('should sync employees successfully', async () => {
      const mockResponse = {
        value: [
          {
            id: '1',
            displayName: 'John Doe',
            mail: 'john.doe@company.com',
            userPrincipalName: 'john.doe@company.com',
            givenName: 'John',
            surname: 'Doe',
            department: 'Engineering',
            accountEnabled: true,
          },
          {
            id: '2',
            displayName: 'Jane Smith',
            mail: 'jane.smith@company.com',
            userPrincipalName: 'jane.smith@company.com',
            givenName: 'Jane',
            surname: 'Smith',
            department: 'Marketing',
            accountEnabled: true,
          },
        ],
      };

      mockGraphClient.get.mockResolvedValue(mockResponse);

      const result = await graphService.syncEmployees();

      expect(mockGraphClient.api).toHaveBeenCalledWith('/users');
      expect(mockGraphClient.select).toHaveBeenCalledWith(
        'id,displayName,mail,userPrincipalName,givenName,surname,department,accountEnabled'
      );
      expect(mockGraphClient.filter).toHaveBeenCalledWith(
        'accountEnabled eq true'
      );
      expect(mockGraphClient.top).toHaveBeenCalledWith(999);

      expect(result.employees).toHaveLength(2);
      expect(result.employees[0]).toEqual({
        id: '1',
        displayName: 'John Doe',
        mail: 'john.doe@company.com',
        department: 'Engineering',
        businessUnit: 'Engineering',
        isActive: true,
      });
      expect(result.syncedCount).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should filter by business unit when specified', async () => {
      const mockResponse = { value: [] };
      mockGraphClient.get.mockResolvedValue(mockResponse);

      await graphService.syncEmployees({ businessUnit: 'Engineering' });

      expect(mockGraphClient.filter).toHaveBeenCalledWith(
        "accountEnabled eq true and department eq 'Engineering'"
      );
    });

    it('should respect maxUsers limit', async () => {
      const mockResponse = { value: [] };
      mockGraphClient.get.mockResolvedValue(mockResponse);

      await graphService.syncEmployees({ maxUsers: 100 });

      expect(mockGraphClient.top).toHaveBeenCalledWith(100);
    });

    it('should handle pagination', async () => {
      const firstResponse = {
        value: [
          {
            id: '1',
            displayName: 'John Doe',
            mail: 'john.doe@company.com',
            userPrincipalName: 'john.doe@company.com',
            givenName: 'John',
            surname: 'Doe',
            department: 'Engineering',
            accountEnabled: true,
          },
        ],
        '@odata.nextLink': '/users?$skip=1',
      };

      const secondResponse = {
        value: [
          {
            id: '2',
            displayName: 'Jane Smith',
            mail: 'jane.smith@company.com',
            userPrincipalName: 'jane.smith@company.com',
            givenName: 'Jane',
            surname: 'Smith',
            department: 'Marketing',
            accountEnabled: true,
          },
        ],
      };

      mockGraphClient.get
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await graphService.syncEmployees();

      expect(mockGraphClient.api).toHaveBeenCalledWith('/users');
      expect(mockGraphClient.api).toHaveBeenCalledWith('/users?$skip=1');
      expect(result.employees).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error');
      apiError.code = 'Forbidden';
      mockGraphClient.get.mockRejectedValue(apiError);

      const result = await graphService.syncEmployees();

      expect(result.employees).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        code: 'Forbidden',
        message: 'API Error',
        details: apiError,
      });
    });

    it('should handle pagination errors gracefully', async () => {
      const firstResponse = {
        value: [
          {
            id: '1',
            displayName: 'John Doe',
            mail: 'john.doe@company.com',
            userPrincipalName: 'john.doe@company.com',
            givenName: 'John',
            surname: 'Doe',
            department: 'Engineering',
            accountEnabled: true,
          },
        ],
        '@odata.nextLink': '/users?$skip=1',
      };

      mockGraphClient.get
        .mockResolvedValueOnce(firstResponse)
        .mockRejectedValueOnce(new Error('Pagination failed'));

      const result = await graphService.syncEmployees();

      expect(result.employees).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('PAGINATION_ERROR');
    });
  });

  describe('getEmployeesByBusinessUnit', () => {
    beforeEach(() => {
      graphService.initialize(mockAccessToken);
    });

    it('should get employees by business unit', async () => {
      const mockResponse = {
        value: [
          {
            id: '1',
            displayName: 'John Doe',
            mail: 'john.doe@company.com',
            userPrincipalName: 'john.doe@company.com',
            givenName: 'John',
            surname: 'Doe',
            department: 'Engineering',
            accountEnabled: true,
          },
        ],
      };

      mockGraphClient.get.mockResolvedValue(mockResponse);

      const employees =
        await graphService.getEmployeesByBusinessUnit('Engineering');

      expect(employees).toHaveLength(1);
      expect(employees[0].businessUnit).toBe('Engineering');
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      graphService.initialize(mockAccessToken);
    });

    it('should get current user profile successfully', async () => {
      const mockUser = {
        id: '1',
        displayName: 'Current User',
        mail: 'current@company.com',
        userPrincipalName: 'current@company.com',
        givenName: 'Current',
        surname: 'User',
        department: 'IT',
        accountEnabled: true,
      };

      mockGraphClient.get.mockResolvedValue(mockUser);

      const user = await graphService.getCurrentUser();

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me');
      expect(user).toEqual({
        id: '1',
        displayName: 'Current User',
        mail: 'current@company.com',
        department: 'IT',
        businessUnit: 'IT',
        isActive: true,
      });
    });

    it('should return null when API call fails', async () => {
      mockGraphClient.get.mockRejectedValue(new Error('API Error'));

      const user = await graphService.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new O365GraphService();

      await expect(uninitializedService.getCurrentUser()).rejects.toThrow(
        'Graph client not initialized'
      );
    });
  });

  describe('getBusinessUnits', () => {
    beforeEach(() => {
      graphService.initialize(mockAccessToken);
    });

    it('should get unique business units', async () => {
      const mockResponse = {
        value: [
          { department: 'Engineering' },
          { department: 'Marketing' },
          { department: 'Engineering' }, // Duplicate
          { department: 'Sales' },
          { department: null }, // Should be filtered out
        ],
      };

      mockGraphClient.get.mockResolvedValue(mockResponse);

      const businessUnits = await graphService.getBusinessUnits();

      expect(mockGraphClient.api).toHaveBeenCalledWith('/users');
      expect(mockGraphClient.select).toHaveBeenCalledWith('department');
      expect(mockGraphClient.filter).toHaveBeenCalledWith(
        'accountEnabled eq true and department ne null'
      );

      expect(businessUnits).toEqual(['Engineering', 'Marketing', 'Sales']);
    });

    it('should return empty array when API call fails', async () => {
      mockGraphClient.get.mockRejectedValue(new Error('API Error'));

      const businessUnits = await graphService.getBusinessUnits();

      expect(businessUnits).toEqual([]);
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      graphService.initialize(mockAccessToken);
    });

    it('should return true when connection test succeeds', async () => {
      mockGraphClient.get.mockResolvedValue({ id: 'test-id' });

      const result = await graphService.testConnection();

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me');
      expect(mockGraphClient.select).toHaveBeenCalledWith('id');
      expect(result).toBe(true);
    });

    it('should return false when connection test fails', async () => {
      mockGraphClient.get.mockRejectedValue(new Error('Connection failed'));

      const result = await graphService.testConnection();

      expect(result).toBe(false);
    });

    it('should return false when not initialized', async () => {
      const uninitializedService = new O365GraphService();

      const result = await uninitializedService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('transformGraphUser', () => {
    beforeEach(() => {
      graphService.initialize(mockAccessToken);
    });

    it('should transform Graph user correctly', async () => {
      const mockResponse = {
        value: [
          {
            id: '1',
            displayName: '', // Empty display name
            mail: null, // No mail, should use userPrincipalName
            userPrincipalName: 'test@company.com',
            givenName: 'Test',
            surname: 'User',
            department: 'Engineering',
            accountEnabled: true,
          },
        ],
      };

      mockGraphClient.get.mockResolvedValue(mockResponse);

      const result = await graphService.syncEmployees();

      expect(result.employees[0]).toEqual({
        id: '1',
        displayName: 'Test User', // Should construct from givenName + surname
        mail: 'test@company.com', // Should use userPrincipalName when mail is null
        department: 'Engineering',
        businessUnit: 'Engineering',
        isActive: true,
      });
    });
  });
});
