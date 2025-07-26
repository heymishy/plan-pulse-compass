import { Page } from '@playwright/test';

/**
 * Setup Mock Service Worker for API mocking in E2E tests
 */
export async function setupMockServiceWorker(page: Page) {
  // Initialize MSW in the browser context
  await page.addInitScript(() => {
    // Mock localStorage for MSAL
    if (!window.localStorage) {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
      });
    }

    // Mock sessionStorage for MSAL
    if (!window.sessionStorage) {
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
      });
    }

    // Mock crypto for MSAL
    if (!window.crypto) {
      Object.defineProperty(window, 'crypto', {
        value: {
          getRandomValues: (arr: any) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          },
          subtle: {
            digest: async () => new ArrayBuffer(32),
          },
        },
        writable: true,
      });
    }

    // Mock environment variables
    window.process = {
      env: {
        VITE_O365_CLIENT_ID: 'test-client-id',
        VITE_O365_TENANT_ID: 'test-tenant-id',
        VITE_O365_REDIRECT_URI: 'http://localhost:3000/auth/callback',
      },
    } as any;
  });

  // Set up default API route handlers
  await setupDefaultMocks(page);
}

/**
 * Setup default mock responses for common API calls
 */
async function setupDefaultMocks(page: Page) {
  // Mock MSAL authentication endpoints
  await page.route('**/login.microsoftonline.com/**', async route => {
    const url = route.request().url();

    if (url.includes('/oauth2/v2.0/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'User.Read User.ReadBasic.All',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock Microsoft Graph API endpoints
  await page.route('**/graph.microsoft.com/**', async route => {
    const url = route.request().url();

    if (url.includes('/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'current-user-id',
          displayName: 'Current User',
          mail: 'current@company.com',
          userPrincipalName: 'current@company.com',
          givenName: 'Current',
          surname: 'User',
          department: 'IT',
          accountEnabled: true,
        }),
      });
    } else if (url.includes('/users')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          value: [
            {
              id: 'user1',
              displayName: 'Mock Employee 1',
              mail: 'employee1@company.com',
              userPrincipalName: 'employee1@company.com',
              givenName: 'Mock',
              surname: 'Employee1',
              department: 'Engineering',
              accountEnabled: true,
            },
            {
              id: 'user2',
              displayName: 'Mock Employee 2',
              mail: 'employee2@company.com',
              userPrincipalName: 'employee2@company.com',
              givenName: 'Mock',
              surname: 'Employee2',
              department: 'Marketing',
              accountEnabled: true,
            },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock local API endpoints (if any)
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    const method = route.request().method();

    // Handle local API calls here if needed
    console.log(`Mock API call: ${method} ${url}`);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Mock specific O365 scenarios for testing
 */
export async function mockO365Scenarios(page: Page) {
  return {
    /**
     * Mock successful authentication flow
     */
    mockSuccessfulAuth: async () => {
      await page.route('**/login.microsoftonline.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'success-token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'User.Read User.ReadBasic.All',
          }),
        });
      });
    },

    /**
     * Mock authentication failure
     */
    mockAuthFailure: async () => {
      await page.route('**/login.microsoftonline.com/**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Authentication failed',
          }),
        });
      });
    },

    /**
     * Mock insufficient permissions
     */
    mockInsufficientPermissions: async () => {
      await page.route('**/graph.microsoft.com/v1.0/users**', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'Forbidden',
              message: 'Insufficient privileges to complete the operation.',
            },
          }),
        });
      });
    },

    /**
     * Mock large employee dataset with pagination
     */
    mockLargeDataset: async (totalEmployees = 1000) => {
      let callCount = 0;

      await page.route('**/graph.microsoft.com/v1.0/users**', async route => {
        const url = route.request().url();
        const hasSkip = url.includes('$skip=');
        const skip = hasSkip
          ? parseInt(url.match(/\$skip=(\d+)/)?.[1] || '0')
          : 0;
        const top = parseInt(url.match(/\$top=(\d+)/)?.[1] || '999');

        const employees = [];
        const remaining = totalEmployees - skip;
        const returnCount = Math.min(top, remaining, 100); // Max 100 per page

        for (let i = 0; i < returnCount; i++) {
          const empNum = skip + i + 1;
          employees.push({
            id: `user${empNum}`,
            displayName: `Employee ${empNum}`,
            mail: `employee${empNum}@company.com`,
            userPrincipalName: `employee${empNum}@company.com`,
            givenName: `Employee`,
            surname: `${empNum}`,
            department: ['Engineering', 'Marketing', 'Sales', 'HR'][empNum % 4],
            accountEnabled: true,
          });
        }

        const response: any = { value: employees };

        // Add next link if there are more results
        if (skip + returnCount < totalEmployees) {
          response['@odata.nextLink'] =
            `https://graph.microsoft.com/v1.0/users?$skip=${skip + returnCount}&$top=${top}`;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });

        callCount++;
      });
    },

    /**
     * Mock network errors
     */
    mockNetworkError: async () => {
      await page.route('**/graph.microsoft.com/**', async route => {
        await route.abort('failed');
      });
    },

    /**
     * Mock rate limiting
     */
    mockRateLimit: async () => {
      await page.route('**/graph.microsoft.com/**', async route => {
        await route.fulfill({
          status: 429,
          headers: {
            'Retry-After': '60',
          },
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'TooManyRequests',
              message: 'Too many requests',
            },
          }),
        });
      });
    },
  };
}
