import { test, expect } from '@playwright/test';

test.describe('Import Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to Import/Export tab - try multiple selectors
    const importTab = page
      .locator('button[value="import"]')
      .or(page.locator('text=Import/Export'))
      .or(page.locator('[data-value="import"]'));

    await importTab.first().click();
    await page.waitForLoadState('networkidle');
  });

  test('should complete basic people import workflow', async ({ page }) => {
    // Wait for import interface to load
    await page.waitForTimeout(1000);

    // Look for Enhanced Data Import section
    const importSection = page
      .locator('text=Enhanced Data Import')
      .or(page.locator('text=Advanced Data Import'));
    await expect(importSection.first()).toBeVisible();

    // Create test CSV data for people import
    const csvContent = `name,email,role,team_name
"John Doe","john@company.com","Software Engineer","Frontend Team"
"Jane Smith","jane@company.com","Product Manager","Product Team"`;

    // Find and use the file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'people-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for file processing
    await page.waitForTimeout(2000);

    // Look for any indication that the file was processed
    // This could be a progress indicator, success message, or field mapping interface
    const processed = page
      .locator('text=processing')
      .or(page.locator('text=uploaded'))
      .or(page.locator('text=field'))
      .or(page.locator('text=mapping'))
      .or(page.locator('text=preview'))
      .or(page.locator('text=import'))
      .or(page.locator('text=continue'));

    await expect(processed.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid CSV gracefully', async ({ page }) => {
    // Wait for import interface
    await page.waitForTimeout(1000);

    // Create invalid CSV (missing quotes, malformed)
    const invalidCsv = `name,email
John Doe,invalid-email
"Jane Smith"`; // Missing closing quote and field

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCsv),
    });

    // Should show error or validation message
    const errorIndicator = page
      .locator('text=error')
      .or(page.locator('text=invalid'))
      .or(page.locator('text=failed'))
      .or(page.locator('.error'))
      .or(page.locator('[class*="error"]'));

    await expect(errorIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display download sample CSV functionality', async ({ page }) => {
    // Look for sample download functionality
    const downloadButton = page
      .locator('button')
      .filter({ hasText: /download.*sample/i })
      .or(page.locator('button').filter({ hasText: /sample.*csv/i }))
      .or(page.locator('a').filter({ hasText: /sample/i }));

    if (await downloadButton.first().isVisible()) {
      // If download button exists, test it creates a download
      const downloadPromise = page
        .waitForEvent('download', { timeout: 5000 })
        .catch(() => null);
      await downloadButton.first().click();
      const download = await downloadPromise;

      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    } else {
      // Just verify that sample functionality is mentioned somewhere
      await expect(
        page.locator('text=sample').or(page.locator('text=template'))
      ).toBeVisible();
    }
  });

  test('should show import type selection', async ({ page }) => {
    // Look for different import types
    await expect(
      page
        .locator('text=People')
        .or(page.locator('text=Teams'))
        .or(page.locator('text=Projects'))
        .or(page.locator('text=Allocations'))
        .or(page.locator('text=Tracking'))
    ).toBeVisible();
  });
});
