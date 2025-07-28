import { useState, useEffect } from 'react';
import { o365Service } from '@/services/o365Service';
import {
  SyncResult,
  SyncStatus,
  O365Employee,
  PermissionStatus,
  AuthResult,
  O365Config,
  SyncOptions,
} from '@/types/o365Types';
import { AppConfig } from '@/types';

/**
 * Hook for managing Office365 employee sync functionality using settings configuration
 */
export function useO365SyncWithSettings(config: AppConfig | null) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<O365Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);

  // Initialize O365 service when config changes
  useEffect(() => {
    const initializeService = async () => {
      // Reset state
      setIsInitialized(false);
      setIsAuthenticated(false);
      setError(null);
      setCurrentUser(null);
      setPermissionStatus(null);
      setBusinessUnits([]);
      setLastSyncResult(null);

      if (!config?.integrations?.o365) {
        setError('O365 integration not configured. Please check settings.');
        return;
      }

      const o365Config = config.integrations.o365;

      if (!o365Config.enabled) {
        setError('O365 integration is disabled in settings.');
        return;
      }

      if (!o365Config.clientId) {
        setError('O365 Client ID not configured. Please check settings.');
        return;
      }

      try {
        const serviceConfig: O365Config = {
          clientId: o365Config.clientId,
          tenantId: o365Config.tenantId,
          redirectUri:
            o365Config.redirectUri || 'http://localhost:3000/auth/callback',
          scopes: ['User.Read', 'User.ReadBasic.All'],
        };

        await o365Service.initialize(serviceConfig);
        setIsInitialized(true);
        setError(null);

        // Check if user is already authenticated
        const authStatus = await o365Service.getAuthStatus();
        if (authStatus) {
          setIsAuthenticated(true);
          await loadUserData();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize O365 service'
        );
        console.error('O365 initialization failed:', err);
      }
    };

    initializeService();
  }, [config]);

  // Load user data after authentication
  const loadUserData = async () => {
    try {
      const [permissions, user, units] = await Promise.all([
        o365Service.getPermissionStatus(),
        o365Service.getCurrentUser(),
        o365Service.getBusinessUnits().catch(() => []), // Don't fail if business units can't be loaded
      ]);

      setPermissionStatus(permissions);
      setCurrentUser(user);
      setBusinessUnits(units);
    } catch (err) {
      console.error('Failed to load user data:', err);
      // Don't set error here as this is non-critical
    }
  };

  /**
   * Authenticate user with Office365
   */
  const authenticate = async (): Promise<AuthResult> => {
    if (!isInitialized) {
      throw new Error('O365 service not initialized');
    }

    try {
      setError(null);
      const authResult = await o365Service.authenticate();
      setIsAuthenticated(true);
      await loadUserData();
      return authResult;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Sign out user
   */
  const signOut = async (): Promise<void> => {
    try {
      await o365Service.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setPermissionStatus(null);
      setBusinessUnits([]);
      setLastSyncResult(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  /**
   * Sync employees from Office365
   */
  const syncEmployees = async (
    options: SyncOptions = {}
  ): Promise<SyncResult> => {
    if (!isInitialized) {
      throw new Error('O365 service not initialized');
    }

    if (!isAuthenticated) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    try {
      setError(null);

      // Update sync status based on service status
      const updateStatus = () => {
        setSyncStatus(o365Service.getSyncStatus());
      };

      // Poll for status updates during sync
      const statusInterval = setInterval(updateStatus, 500);

      const result = await o365Service.syncEmployees(options);

      clearInterval(statusInterval);
      setSyncStatus(o365Service.getSyncStatus());
      setLastSyncResult(result);

      return result;
    } catch (err) {
      setSyncStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Get employees by business unit
   */
  const getEmployeesByBusinessUnit = async (
    businessUnit: string
  ): Promise<O365Employee[]> => {
    if (!isInitialized || !isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);
      return await o365Service.getEmployeesByBusinessUnit(businessUnit);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get employees';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Request additional permissions
   */
  const requestPermissions = async (scopes: string[]) => {
    if (!isInitialized) {
      throw new Error('O365 service not initialized');
    }

    try {
      setError(null);
      const result = await o365Service.requestPermissions(scopes);

      // Refresh permission status
      if (result.success) {
        const newPermissions = await o365Service.getPermissionStatus();
        setPermissionStatus(newPermissions);
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Permission request failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Get admin consent URL
   */
  const getAdminConsentUrl = (): string => {
    if (!isInitialized) {
      throw new Error('O365 service not initialized');
    }

    return o365Service.getAdminConsentUrl();
  };

  /**
   * Test O365 connection
   */
  const testConnection = async (): Promise<boolean> => {
    if (!isInitialized || !isAuthenticated) {
      return false;
    }

    try {
      return await o365Service.testConnection();
    } catch (err) {
      console.error('Connection test failed:', err);
      return false;
    }
  };

  /**
   * Refresh business units list
   */
  const refreshBusinessUnits = async (): Promise<void> => {
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    try {
      const units = await o365Service.getBusinessUnits();
      setBusinessUnits(units);
    } catch (err) {
      console.error('Failed to refresh business units:', err);
    }
  };

  return {
    // State
    isInitialized,
    isAuthenticated,
    syncStatus,
    lastSyncResult,
    permissionStatus,
    currentUser,
    error,
    businessUnits,

    // Actions
    authenticate,
    signOut,
    syncEmployees,
    getEmployeesByBusinessUnit,
    requestPermissions,
    getAdminConsentUrl,
    testConnection,
    refreshBusinessUnits,

    // Utilities
    hasBasicPermissions: permissionStatus?.hasBasicAccess || false,
    hasDirectoryPermissions: permissionStatus?.hasDirectoryAccess || false,
    requiresAdminConsent: permissionStatus?.requiresAdminConsent || false,
  };
}
