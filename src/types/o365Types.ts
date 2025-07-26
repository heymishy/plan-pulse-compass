// Office365 integration types
export interface O365Employee {
  id: string;
  displayName: string;
  mail: string;
  department?: string;
  businessUnit?: string;
  isActive: boolean;
}

export interface O365Config {
  clientId: string;
  tenantId?: string;
  redirectUri: string;
  scopes: string[];
}

export interface AuthResult {
  accessToken: string;
  account: {
    username: string;
    name: string;
    localAccountId: string;
  };
  expiresOn: Date;
}

export interface SyncOptions {
  businessUnit?: string;
  maxUsers?: number;
  includeInactive?: boolean;
}

export interface SyncResult {
  employees: O365Employee[];
  totalCount: number;
  syncedCount: number;
  errors: SyncError[];
  timestamp: Date;
}

export interface SyncError {
  code: string;
  message: string;
  details?: any;
}

export type SyncStatus =
  | 'idle'
  | 'authenticating'
  | 'syncing'
  | 'complete'
  | 'error';

export interface PermissionStatus {
  hasBasicAccess: boolean;
  hasDirectoryAccess: boolean;
  requiresAdminConsent: boolean;
  availableScopes: string[];
}

export interface ConsentResult {
  success: boolean;
  grantedScopes: string[];
  errorMessage?: string;
}

// Graph API response types
export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName: string;
  surname: string;
  department: string;
  accountEnabled: boolean;
}

export interface GraphUsersResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  value: GraphUser[];
}
