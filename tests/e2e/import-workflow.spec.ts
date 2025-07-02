import { test, expect } from '@playwright/test';

test.describe('Import Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to Import/Export tab using correct Radix UI selector
    await page.click('[role="tab"]:has-text("Import/Export")');
    await page.waitForLoadState('networkidle');
  });

  test('should show Enhanced Import & Export section', async ({ page }) => {
    // Look for Enhanced Import & Export section
    await expect(page.locator('text=Enhanced Import & Export')).toBeVisible();
  });

  test('should show Advanced Data Import section', async ({ page }) => {
    // Look for Advanced Data Import heading specifically
    await expect(
      page.getByRole('heading', { name: 'Advanced Data Import' })
    ).toBeVisible();
  });

  test('should have file inputs for CSV upload', async ({ page }) => {
    // Should have at least one file input for CSV uploads
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toBeVisible();
  });
});
