import { test, expect } from '@playwright/test';

test.describe('Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to Import/Export tab
    await page.click('button[value="import"]');
    await page.waitForLoadState('networkidle');
  });

  test('should display import/export settings page', async ({ page }) => {
    // Check that we're on the import/export settings
    await expect(page.locator('h1')).toContainText('Settings');

    // Should show import components
    await expect(page.locator('text=Enhanced Data Import')).toBeVisible();
    await expect(page.locator('text=Advanced Data Import')).toBeVisible();
  });

  test('should show file upload interface', async ({ page }) => {
    // Look for file input elements
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toBeVisible();

    // Should show upload buttons or areas
    await expect(
      page.locator('text=Select CSV File').or(page.locator('text=Upload'))
    ).toBeVisible();
  });

  test('should display import type selection', async ({ page }) => {
    // Should show different import type options
    await expect(
      page.locator('text=People & Teams').or(page.locator('text=People'))
    ).toBeVisible();
    await expect(
      page.locator('text=Projects').or(page.locator('text=Allocations'))
    ).toBeVisible();
  });

  test('should show sample CSV download options', async ({ page }) => {
    // Look for sample download buttons
    const downloadButtons = page
      .locator('button')
      .filter({ hasText: /download.*sample|sample.*csv/i });
    await expect(downloadButtons.first()).toBeVisible();
  });

  test('should handle CSV file upload', async ({ page }) => {
    // Create a simple test CSV
    const csvContent = `name,email,role\n"Test User","test@example.com","Engineer"`;

    // Find first file input
    const fileInput = page.locator('input[type="file"]').first();

    // Upload the test file
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Should show some indication of file processing
    await expect(
      page
        .locator('text=processing')
        .or(page.locator('text=uploaded'))
        .or(page.locator('text=selected'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show advanced import options', async ({ page }) => {
    // Look for advanced options toggles or sections
    await expect(
      page
        .locator('text=Advanced')
        .or(page.locator('text=Options'))
        .or(page.locator('text=Configuration'))
    ).toBeVisible();
  });
});
