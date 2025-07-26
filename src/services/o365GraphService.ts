import { Client } from '@microsoft/microsoft-graph-client';
import {
  O365Employee,
  SyncOptions,
  SyncResult,
  SyncError,
  GraphUser,
  GraphUsersResponse,
} from '@/types/o365Types';

export class O365GraphService {
  private graphClient: Client | null = null;

  /**
   * Initialize Graph client with access token
   */
  initialize(accessToken: string): void {
    this.graphClient = Client.init({
      authProvider: done => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Sync employees from Office365
   */
  async syncEmployees(options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    const startTime = new Date();
    const employees: O365Employee[] = [];
    const errors: SyncError[] = [];
    let totalCount = 0;

    try {
      // Build the Graph API request
      let request = this.graphClient
        .api('/users')
        .select(
          'id,displayName,mail,userPrincipalName,givenName,surname,department,accountEnabled'
        )
        .filter('accountEnabled eq true')
        .top(options.maxUsers || 999); // Set reasonable limit

      // Add department filter if specified
      if (options.businessUnit) {
        request = request.filter(
          `accountEnabled eq true and department eq '${options.businessUnit}'`
        );
      }

      // Execute the request
      const response: GraphUsersResponse = await request.get();
      totalCount = response.value.length;

      // Transform users to our format
      const transformedEmployees = response.value.map(user =>
        this.transformGraphUser(user)
      );
      employees.push(...transformedEmployees);

      // Handle pagination if needed (for large organizations)
      let nextLink = response['@odata.nextLink'];
      while (nextLink && employees.length < (options.maxUsers || 999)) {
        try {
          const nextResponse: GraphUsersResponse = await this.graphClient
            .api(nextLink)
            .get();
          const nextEmployees = nextResponse.value.map(user =>
            this.transformGraphUser(user)
          );
          employees.push(...nextEmployees);
          nextLink = nextResponse['@odata.nextLink'];
          totalCount += nextResponse.value.length;
        } catch (error) {
          errors.push({
            code: 'PAGINATION_ERROR',
            message: 'Failed to fetch additional pages',
            details: error,
          });
          break;
        }
      }
    } catch (error: unknown) {
      const errorObj = error as { code?: string; message?: string };
      errors.push({
        code: errorObj.code || 'GRAPH_API_ERROR',
        message: errorObj.message || 'Failed to fetch users from Graph API',
        details: error,
      });
    }

    return {
      employees,
      totalCount,
      syncedCount: employees.length,
      errors,
      timestamp: startTime,
    };
  }

  /**
   * Get employees by business unit
   */
  async getEmployeesByBusinessUnit(
    businessUnit: string
  ): Promise<O365Employee[]> {
    const result = await this.syncEmployees({ businessUnit });
    return result.employees;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<O365Employee | null> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    try {
      const user: GraphUser = await this.graphClient
        .api('/me')
        .select(
          'id,displayName,mail,userPrincipalName,givenName,surname,department,accountEnabled'
        )
        .get();

      return this.transformGraphUser(user);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Get available business units (departments)
   */
  async getBusinessUnits(): Promise<string[]> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    try {
      const response: GraphUsersResponse = await this.graphClient
        .api('/users')
        .select('department')
        .filter('accountEnabled eq true and department ne null')
        .get();

      // Extract unique departments
      const departments = response.value
        .map(user => user.department)
        .filter((dept, index, arr) => dept && arr.indexOf(dept) === index)
        .sort();

      return departments;
    } catch (error) {
      console.error('Failed to get business units:', error);
      return [];
    }
  }

  /**
   * Test Graph API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.graphClient) {
      return false;
    }

    try {
      await this.graphClient.api('/me').select('id').get();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Transform Graph API user to our employee format
   */
  private transformGraphUser(user: GraphUser): O365Employee {
    return {
      id: user.id,
      displayName:
        user.displayName ||
        `${user.givenName || ''} ${user.surname || ''}`.trim(),
      mail: user.mail || user.userPrincipalName,
      department: user.department,
      businessUnit: user.department, // Map department to business unit
      isActive: user.accountEnabled,
    };
  }

  /**
   * Handle Graph API errors
   */
  private handleGraphError(error: unknown): SyncError {
    const errorObj = error as { code?: string; message?: string };

    if (errorObj.code === 'Forbidden') {
      return {
        code: 'INSUFFICIENT_PERMISSIONS',
        message:
          'Insufficient permissions to access user directory. Admin consent may be required.',
        details: error,
      };
    }

    if (errorObj.code === 'Unauthorized') {
      return {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed. Please sign in again.',
        details: error,
      };
    }

    if (errorObj.code === 'TooManyRequests') {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        details: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: errorObj.message || 'An unknown error occurred',
      details: error,
    };
  }
}
