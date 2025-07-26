import { O365AuthService } from './o365AuthService';
import { O365GraphService } from './o365GraphService';
import {
  O365Employee,
  O365Config,
  SyncResult,
  SyncStatus,
  PermissionStatus,
  AuthResult,
} from '@/types/o365Types';

/**
 * Main O365 integration service that orchestrates authentication and data sync
 */
export class O365Service {
  private authService: O365AuthService;
  private graphService: O365GraphService;
  private isInitialized: boolean = false;
  private syncStatus: SyncStatus = 'idle';
  private lastSyncResult: SyncResult | null = null;

  constructor() {
    this.authService = new O365AuthService();
    this.graphService = new O365GraphService();
  }

  /**
   * Initialize O365 service with configuration
   */
  async initialize(config: O365Config): Promise<void> {
    await this.authService.initialize(config);
    this.isInitialized = true;
  }

  /**
   * Check if service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get last sync result
   */
  getLastSyncResult(): SyncResult | null {
    return this.lastSyncResult;
  }

  /**
   * Authenticate user and check permissions
   */
  async authenticate(): Promise<AuthResult> {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    this.syncStatus = 'authenticating';

    try {
      const authResult = await this.authService.authenticate();

      // Initialize Graph client with access token
      this.graphService.initialize(authResult.accessToken);

      this.syncStatus = 'idle';
      return authResult;
    } catch (error) {
      this.syncStatus = 'error';
      throw error;
    }
  }

  /**
   * Check current authentication status
   */
  async getAuthStatus(): Promise<AuthResult | null> {
    if (!this.isInitialized) {
      return null;
    }

    const authResult = await this.authService.getAuthStatus();

    // If authenticated, ensure Graph client is initialized
    if (authResult) {
      this.graphService.initialize(authResult.accessToken);
    }

    return authResult;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    await this.authService.signOut();
    this.syncStatus = 'idle';
    this.lastSyncResult = null;
  }

  /**
   * Get permission status
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    if (!this.isInitialized) {
      return {
        hasBasicAccess: false,
        hasDirectoryAccess: false,
        requiresAdminConsent: false,
        availableScopes: [],
      };
    }

    return await this.authService.getPermissionStatus();
  }

  /**
   * Request additional permissions
   */
  async requestPermissions(scopes: string[]) {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    return await this.authService.requestPermissions(scopes);
  }

  /**
   * Get admin consent URL
   */
  getAdminConsentUrl(): string {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    return this.authService.getAdminConsentUrl();
  }

  /**
   * Sync employees from Office365
   */
  async syncEmployees(
    options: {
      businessUnit?: string;
      maxUsers?: number;
      includeInactive?: boolean;
    } = {}
  ): Promise<SyncResult> {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    // Ensure we're authenticated
    const authStatus = await this.getAuthStatus();
    if (!authStatus) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    this.syncStatus = 'syncing';

    try {
      const result = await this.graphService.syncEmployees(options);
      this.lastSyncResult = result;
      this.syncStatus = result.errors.length === 0 ? 'complete' : 'error';
      return result;
    } catch (error) {
      this.syncStatus = 'error';
      throw error;
    }
  }

  /**
   * Get employees by business unit
   */
  async getEmployeesByBusinessUnit(
    businessUnit: string
  ): Promise<O365Employee[]> {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    // Ensure we're authenticated
    const authStatus = await this.getAuthStatus();
    if (!authStatus) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    return await this.graphService.getEmployeesByBusinessUnit(businessUnit);
  }

  /**
   * Get available business units
   */
  async getBusinessUnits(): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    // Ensure we're authenticated
    const authStatus = await this.getAuthStatus();
    if (!authStatus) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    return await this.graphService.getBusinessUnits();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<O365Employee | null> {
    if (!this.isInitialized) {
      throw new Error('O365Service not initialized');
    }

    // Ensure we're authenticated
    const authStatus = await this.getAuthStatus();
    if (!authStatus) {
      return null;
    }

    return await this.graphService.getCurrentUser();
  }

  /**
   * Test Graph API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    // Ensure we're authenticated
    const authStatus = await this.getAuthStatus();
    if (!authStatus) {
      return false;
    }

    return await this.graphService.testConnection();
  }

  /**
   * Create O365 configuration from environment variables or defaults
   */
  static createConfig(overrides: Partial<O365Config> = {}): O365Config {
    return {
      clientId: process.env.VITE_O365_CLIENT_ID || '',
      tenantId: process.env.VITE_O365_TENANT_ID,
      redirectUri:
        process.env.VITE_O365_REDIRECT_URI ||
        `${window.location.origin}/auth/callback`,
      scopes: ['User.Read', 'User.ReadBasic.All', ...(overrides.scopes || [])],
      ...overrides,
    };
  }
}

// Export singleton instance
export const o365Service = new O365Service();
