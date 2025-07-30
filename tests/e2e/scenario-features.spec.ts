import { test, expect } from '@playwright/test';

test.describe('Scenario Management Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and ensure it's loaded
    await page.goto('/');

    // Wait for the app to be fully loaded
    await page.waitForSelector('[data-testid="app-loaded"]', {
      timeout: 10000,
    });

    // Skip setup if it hasn't been completed
    const setupButton = page.locator('text=Complete Setup');
    if (await setupButton.isVisible()) {
      await setupButton.click();
      await page.waitForSelector('[data-testid="setup-complete"]');
    }
  });

  test('should navigate to scenario analysis page', async ({ page }) => {
    // Navigate to scenario analysis
    await page.goto('/scenario-analysis');

    // Check that the scenario analysis page loads
    await expect(page.locator('h1')).toContainText('Scenario Analysis');

    // Check for scenario switcher component
    await expect(
      page.locator('[data-testid="scenario-switcher"]')
    ).toBeVisible();
  });

  test('should create a new scenario', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Open create scenario dialog
    await page.locator('text=Create Scenario').click();

    // Fill in scenario details
    await page.locator('input[name="name"]').fill('Test E2E Scenario');
    await page
      .locator('textarea[name="description"]')
      .fill('A test scenario created via E2E testing');

    // Create the scenario
    await page.locator('button:has-text("Create Scenario")').click();

    // Wait for scenario to be created and check for success feedback
    await expect(page.locator('text=Scenario Created')).toBeVisible({
      timeout: 5000,
    });

    // Verify the scenario appears in the list
    await expect(page.locator('text=Test E2E Scenario')).toBeVisible();
  });

  test('should switch between scenarios and live mode', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Create a test scenario first
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Switch Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    // Switch to the scenario
    await page.locator('[data-testid="scenario-selector"]').click();
    await page.locator('text=Switch Test Scenario').click();

    // Verify scenario banner appears
    await expect(page.locator('[data-testid="scenario-banner"]')).toBeVisible();
    await expect(page.locator('text=Switch Test Scenario')).toBeVisible();

    // Switch back to live mode
    await page.locator('text=Switch to Live').click();

    // Verify scenario banner disappears
    await expect(
      page.locator('[data-testid="scenario-banner"]')
    ).not.toBeVisible();
  });

  test('should show scenario context in Projects page', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Create and switch to a scenario
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Projects Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    await page.locator('[data-testid="scenario-selector"]').click();
    await page.locator('text=Projects Test Scenario').click();

    // Navigate to Projects page
    await page.goto('/projects');

    // Verify scenario banner and context are shown
    await expect(page.locator('[data-testid="scenario-banner"]')).toBeVisible();
    await expect(page.locator('text=Projects Test Scenario')).toBeVisible();
    await expect(
      page.locator('text=Viewing projects in scenario')
    ).toBeVisible();
  });

  test('should show scenario context in Planning page', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Create and switch to a scenario
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Planning Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    await page.locator('[data-testid="scenario-selector"]').click();
    await page.locator('text=Planning Test Scenario').click();

    // Navigate to Planning page
    await page.goto('/planning');

    // Verify scenario banner and context are shown
    await expect(page.locator('[data-testid="scenario-banner"]')).toBeVisible();
    await expect(page.locator('text=Planning Test Scenario')).toBeVisible();
    await expect(
      page.locator('text=Planning allocations in scenario')
    ).toBeVisible();
  });

  test('should perform scenario comparison', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Create a scenario
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Comparison Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    // Navigate to scenario management
    await page.locator('text=Manage Scenarios').click();

    // Find the scenario and compare it
    const scenarioRow = page.locator('tr:has-text("Comparison Test Scenario")');
    await scenarioRow.locator('[data-testid="scenario-actions"]').click();
    await page.locator('text=Compare').click();

    // Verify comparison page loads
    await expect(page.locator('text=Scenario Comparison')).toBeVisible();
    await expect(page.locator('text=Impact Summary')).toBeVisible();
  });

  test('should create scenario from template', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Open create scenario dialog
    await page.locator('text=Create Scenario').click();

    // Select a template
    await page.locator('[data-testid="template-selector"]').click();
    await page.locator('text=Budget Reduction').click();

    // Fill in template parameters
    await page.locator('input[name="name"]').fill('Budget Reduction Scenario');
    await page.locator('input[name="budgetReduction"]').fill('15');

    // Create scenario
    await page.locator('button:has-text("Create Scenario")').click();

    // Verify scenario is created with template
    await expect(page.locator('text=Scenario Created')).toBeVisible();
    await expect(page.locator('text=Budget Reduction Scenario')).toBeVisible();
    await expect(page.locator('text=Budget Reduction')).toBeVisible(); // Template badge
  });

  test('should export and import scenarios', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Create a scenario to export
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Export Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    // Navigate to scenario management
    await page.locator('text=Manage Scenarios').click();

    // Export scenario
    await page.locator('text=Export').click();

    // Select the scenario to export
    await page.locator('text=Export Test Scenario').click();

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Export 1 Scenario")').click();
    const download = await downloadPromise;

    // Verify download happened
    expect(download.suggestedFilename()).toMatch(
      /scenarios-export-\d{4}-\d{2}-\d{2}\.json/
    );
  });

  test('should delete scenarios', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Create a scenario to delete
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Delete Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    // Navigate to scenario management
    await page.locator('text=Manage Scenarios').click();

    // Delete the scenario
    const scenarioRow = page.locator('tr:has-text("Delete Test Scenario")');
    await scenarioRow.locator('[data-testid="scenario-actions"]').click();
    await page.locator('text=Delete').click();

    // Confirm deletion
    await page.locator('button:has-text("Delete")').click();

    // Verify scenario is deleted
    await expect(page.locator('text=Scenario Deleted')).toBeVisible();
    await expect(page.locator('text=Delete Test Scenario')).not.toBeVisible();
  });

  test('should handle scenario modifications and tracking', async ({
    page,
  }) => {
    await page.goto('/scenario-analysis');

    // Create and switch to a scenario
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Modification Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    await page.locator('[data-testid="scenario-selector"]').click();
    await page.locator('text=Modification Test Scenario').click();

    // Go to Teams page and make a modification
    await page.goto('/teams');

    // Verify we're in scenario mode
    await expect(page.locator('[data-testid="scenario-banner"]')).toBeVisible();

    // Try to add a team (this should trigger scenario-aware operations)
    await page.locator('text=Add Team').click();
    await page.locator('input[name="name"]').fill('Test Scenario Team');
    await page.locator('button:has-text("Add Team")').click();

    // Verify scenario update notification
    await expect(page.locator('text=Scenario Updated')).toBeVisible();
  });

  test('should maintain scenario state across page navigation', async ({
    page,
  }) => {
    await page.goto('/scenario-analysis');

    // Create and switch to a scenario
    await page.locator('text=Create Scenario').click();
    await page.locator('input[name="name"]').fill('Navigation Test Scenario');
    await page.locator('button:has-text("Create Scenario")').click();
    await page.waitForSelector('text=Scenario Created');

    await page.locator('[data-testid="scenario-selector"]').click();
    await page.locator('text=Navigation Test Scenario').click();

    // Navigate to different pages and verify scenario context is maintained
    const pagesToTest = ['/projects', '/planning', '/teams', '/people'];

    for (const pageUrl of pagesToTest) {
      await page.goto(pageUrl);
      await expect(
        page.locator('[data-testid="scenario-banner"]')
      ).toBeVisible();
      await expect(page.locator('text=Navigation Test Scenario')).toBeVisible();
    }
  });

  test('should handle scenario expiration cleanup', async ({ page }) => {
    await page.goto('/scenario-analysis');

    // Navigate to scenario management
    await page.locator('text=Manage Scenarios').click();

    // Click cleanup expired scenarios
    await page.locator('text=Cleanup Expired').click();

    // Should show some feedback (even if no expired scenarios)
    // This tests the cleanup functionality is accessible
    await expect(page.locator('text=Scenarios Cleaned Up')).toBeVisible({
      timeout: 5000,
    });
  });
});
