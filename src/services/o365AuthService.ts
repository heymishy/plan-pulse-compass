import {
  PublicClientApplication,
  AccountInfo,
  SilentRequest,
  PopupRequest,
  AuthenticationResult,
  InteractionRequiredAuthError,
  BrowserAuthError,
} from '@azure/msal-browser';
import {
  AuthResult,
  O365Config,
  ConsentResult,
  PermissionStatus,
} from '@/types/o365Types';

export class O365AuthService {
  private msalInstance: PublicClientApplication | null = null;
  private config: O365Config | null = null;

  /**
   * Initialize the MSAL instance with configuration
   */
  async initialize(config: O365Config): Promise<void> {
    this.config = config;

    const msalConfig = {
      auth: {
        clientId: config.clientId,
        authority: config.tenantId
          ? `https://login.microsoftonline.com/${config.tenantId}`
          : 'https://login.microsoftonline.com/common',
        redirectUri: config.redirectUri,
      },
      cache: {
        cacheLocation: 'localStorage' as const,
        storeAuthStateInCookie: false,
      },
    };

    this.msalInstance = new PublicClientApplication(msalConfig);
    await this.msalInstance.initialize();
  }

  /**
   * Authenticate user and get access token
   */
  async authenticate(): Promise<AuthResult> {
    if (!this.msalInstance || !this.config) {
      throw new Error('O365AuthService not initialized');
    }

    try {
      // Try silent authentication first
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const silentRequest: SilentRequest = {
          scopes: this.config.scopes,
          account: accounts[0],
        };

        try {
          const response =
            await this.msalInstance.acquireTokenSilent(silentRequest);
          return this.mapAuthResult(response);
        } catch (error) {
          if (error instanceof InteractionRequiredAuthError) {
            // Fall through to interactive authentication
          } else {
            throw error;
          }
        }
      }

      // Interactive authentication
      const loginRequest: PopupRequest = {
        scopes: this.config.scopes,
        prompt: 'select_account',
      };

      const response = await this.msalInstance.acquireTokenPopup(loginRequest);
      return this.mapAuthResult(response);
    } catch (error) {
      if (error instanceof BrowserAuthError) {
        throw new Error(`Authentication failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check current authentication status
   */
  async getAuthStatus(): Promise<AuthResult | null> {
    if (!this.msalInstance || !this.config) {
      return null;
    }

    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return null;
    }

    try {
      const silentRequest: SilentRequest = {
        scopes: this.config.scopes,
        account: accounts[0],
      };

      const response =
        await this.msalInstance.acquireTokenSilent(silentRequest);
      return this.mapAuthResult(response);
    } catch (error) {
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    if (!this.msalInstance) {
      return;
    }

    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await this.msalInstance.logoutPopup({
        account: accounts[0],
      });
    }
  }

  /**
   * Request additional permissions
   */
  async requestPermissions(scopes: string[]): Promise<ConsentResult> {
    if (!this.msalInstance) {
      throw new Error('O365AuthService not initialized');
    }

    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return {
          success: false,
          grantedScopes: [],
          errorMessage: 'No authenticated account found',
        };
      }

      const request: PopupRequest = {
        scopes,
        account: accounts[0],
        prompt: 'consent',
      };

      const response = await this.msalInstance.acquireTokenPopup(request);

      return {
        success: true,
        grantedScopes: response.scopes,
      };
    } catch (error) {
      return {
        success: false,
        grantedScopes: [],
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check permission status
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    if (!this.msalInstance || !this.config) {
      return {
        hasBasicAccess: false,
        hasDirectoryAccess: false,
        requiresAdminConsent: false,
        availableScopes: [],
      };
    }

    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return {
        hasBasicAccess: false,
        hasDirectoryAccess: false,
        requiresAdminConsent: false,
        availableScopes: [],
      };
    }

    try {
      // Test basic access (User.Read)
      const basicScopes = ['User.Read'];
      const basicRequest: SilentRequest = {
        scopes: basicScopes,
        account: accounts[0],
      };

      let hasBasicAccess = false;
      let availableScopes: string[] = [];

      try {
        const basicResponse =
          await this.msalInstance.acquireTokenSilent(basicRequest);
        hasBasicAccess = true;
        availableScopes = basicResponse.scopes;
      } catch (error) {
        // Basic access not available
      }

      // Test directory access (User.ReadBasic.All)
      const directoryScopes = ['User.ReadBasic.All'];
      const directoryRequest: SilentRequest = {
        scopes: directoryScopes,
        account: accounts[0],
      };

      let hasDirectoryAccess = false;
      try {
        await this.msalInstance.acquireTokenSilent(directoryRequest);
        hasDirectoryAccess = true;
        availableScopes = [...availableScopes, ...directoryScopes];
      } catch (error) {
        // Directory access not available or requires consent
      }

      return {
        hasBasicAccess,
        hasDirectoryAccess,
        requiresAdminConsent: !hasDirectoryAccess && hasBasicAccess,
        availableScopes: [...new Set(availableScopes)],
      };
    } catch (error) {
      return {
        hasBasicAccess: false,
        hasDirectoryAccess: false,
        requiresAdminConsent: true,
        availableScopes: [],
      };
    }
  }

  /**
   * Get admin consent URL
   */
  getAdminConsentUrl(): string {
    if (!this.config) {
      throw new Error('O365AuthService not initialized');
    }

    const tenantId = this.config.tenantId || 'common';
    const scopes = this.config.scopes.join(' ');

    return (
      `https://login.microsoftonline.com/${tenantId}/adminconsent?` +
      `client_id=${this.config.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}`
    );
  }

  /**
   * Map MSAL auth result to our format
   */
  private mapAuthResult(response: AuthenticationResult): AuthResult {
    return {
      accessToken: response.accessToken,
      account: {
        username: response.account?.username || '',
        name: response.account?.name || '',
        localAccountId: response.account?.localAccountId || '',
      },
      expiresOn: response.expiresOn || new Date(),
    };
  }
}
