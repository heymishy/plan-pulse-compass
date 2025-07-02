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
    // Check that we're on the settings page by looking for the specific settings h1
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Should show the Enhanced Import & Export component
    await expect(
      page.getByRole('heading', { name: 'Enhanced Import & Export' })
    ).toBeVisible();
  });

  test('should show file upload interfaces', async ({ page }) => {
    // Look for file input elements
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toBeVisible();
  });

  test('should show download sample buttons', async ({ page }) => {
    // Look for sample download buttons - use first() to avoid strict mode violation
    await expect(page.locator('text=Download Sample').first()).toBeVisible();
  });
});
