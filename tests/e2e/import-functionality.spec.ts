import { test, expect } from '@playwright/test';

test.describe('Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to Import/Export tab using correct Radix UI tab selector
    await page.click('[role="tab"]:has-text("Import/Export")');
    await page.waitForLoadState('networkidle');
  });

  test('should display import/export settings page', async ({ page }) => {
    // Check that we're on the import/export settings
    await expect(page.locator('h1')).toContainText('Settings');

    // Should show at least one import component
    await expect(
      page
        .locator('text=Enhanced Import & Export')
        .or(page.locator('text=Advanced Data Import'))
        .or(page.locator('text=Bulk Data Removal'))
    ).toBeVisible();
  });

  test('should show file upload interfaces', async ({ page }) => {
    // Look for file input elements
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toBeVisible();
  });

  test('should show download sample buttons', async ({ page }) => {
    // Look for sample download buttons with exact text
    await expect(page.locator('text=Download Sample')).toBeVisible();
  });
});
