import { test, expect } from '@playwright/test';
import { setupMockServiceWorker } from '../support/msw';

test.describe('O365 Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Setup MSW for API mocking
    await setupMockServiceWorker(page);

    // Navigate to the teams page
    await page.goto('/teams');

    // Wait for page to load
    await page.waitForSelector('[data-testid="team-builder"]', {
      timeout: 10000,
    });
  });

  test('should display O365 sync button in TeamBuilder', async ({ page }) => {
    // Check if O365 sync button is visible
    const syncButton = page.locator('button:has-text("O365 Sync")');
    await expect(syncButton).toBeVisible();

    // Check if button has correct icon
    const downloadIcon = syncButton.locator('svg');
    await expect(downloadIcon).toBeVisible();
  });

  test('should open O365 sync dialog when button is clicked', async ({
    page,
  }) => {
    // Click the O365 sync button
    await page.click('button:has-text("O365 Sync")');

    // Check if dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Check dialog title
    const dialogTitle = page.locator(
      'h2:has-text("Sync Employees from Office365")'
    );
    await expect(dialogTitle).toBeVisible();

    // Check for business unit input
    const businessUnitInput = page.locator(
      'input[placeholder*="business unit"]'
    );
    await expect(businessUnitInput).toBeVisible();

    // Check for sync button
    const syncEmployeesButton = page.locator(
      'button:has-text("Sync Employees")'
    );
    await expect(syncEmployeesButton).toBeVisible();
  });

  test('should handle sync with business unit filter', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          account: {
            username: 'test@company.com',
            name: 'Test User',
            localAccountId: 'test-id',
          },
          expiresOn: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
    });

    // Mock Graph API employee sync
    await page.route('**/users**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          value: [
            {
              id: 'user1',
              displayName: 'John Doe',
              mail: 'john.doe@company.com',
              userPrincipalName: 'john.doe@company.com',
              givenName: 'John',
              surname: 'Doe',
              department: 'Engineering',
              accountEnabled: true,
            },
            {
              id: 'user2',
              displayName: 'Jane Smith',
              mail: 'jane.smith@company.com',
              userPrincipalName: 'jane.smith@company.com',
              givenName: 'Jane',
              surname: 'Smith',
              department: 'Engineering',
              accountEnabled: true,
            },
          ],
        }),
      });
    });

    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Fill business unit filter
    await page.fill('input[placeholder*="business unit"]', 'Engineering');

    // Click sync employees button
    await page.click('button:has-text("Sync Employees")');

    // Wait for sync to complete
    await page.waitForSelector('text="Last sync: 2 employees synced"', {
      timeout: 10000,
    });

    // Check that success message is displayed
    const successMessage = page.locator('text="Last sync: 2 employees synced"');
    await expect(successMessage).toBeVisible();

    // Dialog should close after successful sync
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle authentication flow', async ({ page }) => {
    // Mock MSAL authentication popup
    await page.route('**/login.microsoftonline.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <script>
                // Simulate successful authentication
                window.opener.postMessage({
                  type: 'msal:acquireTokenPopup:success',
                  accessToken: 'mock-access-token',
                  account: {
                    username: 'test@company.com',
                    name: 'Test User',
                    localAccountId: 'test-id'
                  }
                }, '*');
                window.close();
              </script>
            </body>
          </html>
        `,
      });
    });

    // Mock Graph API response
    await page.route('**/users**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          value: [
            {
              id: 'user1',
              displayName: 'Test Employee',
              mail: 'test@company.com',
              userPrincipalName: 'test@company.com',
              givenName: 'Test',
              surname: 'Employee',
              department: 'IT',
              accountEnabled: true,
            },
          ],
        }),
      });
    });

    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Click sync employees button (should trigger authentication)
    await page.click('button:has-text("Sync Employees")');

    // Wait for authentication and sync
    await page.waitForSelector('text="Last sync: 1 employees synced"', {
      timeout: 15000,
    });

    // Verify sync completed
    const successMessage = page.locator('text="Last sync: 1 employees synced"');
    await expect(successMessage).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    // Mock authentication failure
    await page.route('**/auth/**', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Authentication failed',
          error_description: 'Invalid credentials',
        }),
      });
    });

    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Click sync employees button
    await page.click('button:has-text("Sync Employees")');

    // Wait for error message
    await page.waitForSelector('[class*="bg-red-50"]', { timeout: 10000 });

    // Check that error is displayed
    const errorMessage = page.locator(
      '[class*="bg-red-50"] [class*="text-red-700"]'
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Authentication failed');
  });

  test('should handle API permission errors', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          account: { username: 'test@company.com' },
        }),
      });
    });

    // Mock Graph API permission error
    await page.route('**/users**', async route => {
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

    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Click sync employees button
    await page.click('button:has-text("Sync Employees")');

    // Wait for error message
    await page.waitForSelector('[class*="bg-red-50"]', { timeout: 10000 });

    // Check that permission error is displayed
    const errorMessage = page.locator(
      '[class*="bg-red-50"] [class*="text-red-700"]'
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Insufficient privileges');
  });

  test('should cancel sync dialog', async ({ page }) => {
    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Verify dialog is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Verify dialog is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should disable sync button during operation', async ({ page }) => {
    // Mock slow authentication
    await page.route('**/auth/**', async route => {
      // Delay response to test loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          account: { username: 'test@company.com' },
        }),
      });
    });

    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Click sync employees button
    await page.click('button:has-text("Sync Employees")');

    // Check that button shows loading state and is disabled
    const syncButton = page.locator('button:has-text("Authenticating...")');
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toBeDisabled();
  });

  test('should display sync instructions', async ({ page }) => {
    // Click sync button
    await page.click('button:has-text("O365 Sync")');

    // Check that instructions are displayed
    const instructions = page.locator('text="This will:"');
    await expect(instructions).toBeVisible();

    // Check specific instruction items
    await expect(
      page.locator('text="Import employee names and emails from Office365"')
    ).toBeVisible();
    await expect(
      page.locator('text="Filter by business unit if specified"')
    ).toBeVisible();
    await expect(
      page.locator('text="Skip employees already in the system"')
    ).toBeVisible();
    await expect(
      page.locator('text="Require Office365 authentication"')
    ).toBeVisible();
  });

  test('should integrate synced employees into people list', async ({
    page,
  }) => {
    // Mock successful sync
    await page.route('**/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          account: { username: 'test@company.com' },
        }),
      });
    });

    await page.route('**/users**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          value: [
            {
              id: 'new-user',
              displayName: 'New Employee',
              mail: 'new.employee@company.com',
              userPrincipalName: 'new.employee@company.com',
              givenName: 'New',
              surname: 'Employee',
              department: 'Sales',
              accountEnabled: true,
            },
          ],
        }),
      });
    });

    // Perform sync
    await page.click('button:has-text("O365 Sync")');
    await page.click('button:has-text("Sync Employees")');

    // Wait for sync to complete
    await page.waitForSelector('text="Last sync: 1 employees synced"', {
      timeout: 10000,
    });

    // Check that new employee appears in the unassigned people list
    await page.waitForSelector('text="New Employee"', { timeout: 5000 });
    const newEmployee = page.locator('text="New Employee"');
    await expect(newEmployee).toBeVisible();

    // Check that email is displayed
    const employeeEmail = page.locator('text="new.employee@company.com"');
    await expect(employeeEmail).toBeVisible();
  });
});
