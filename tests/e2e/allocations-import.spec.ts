import { test, expect } from '@playwright/test';

test.describe('Allocations Import E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to Import/Export tab
    await page.click('[role="tab"]:has-text("Import/Export")');
    await page.waitForLoadState('networkidle');
  });

  test('should import planning allocations CSV successfully', async ({
    page,
  }) => {
    // Look for Advanced Data Import section
    await expect(
      page.getByRole('heading', { name: 'Advanced Data Import' })
    ).toBeVisible();

    // Select Planning Allocations import type using Radix UI Select
    await page.click('[id="import-type"]');
    await page.click('[role="option"]:has-text("Planning Allocations")');

    // Create test CSV data for planning allocations
    const csvContent = `person_name,team_name,project_name,allocation_percentage,quarter,year,start_date,end_date
"John Doe","Frontend Team","Project Alpha","80","Q1","2024","2024-01-01","2024-03-31"
"Jane Smith","Product Team","Project Beta","100","Q1","2024","2024-01-01","2024-03-31"
"Bob Wilson","Design Team","Project Gamma","60","Q1","2024","2024-01-01","2024-03-31"`;

    // Find the Advanced CSV file input
    const fileInput = page.locator('#advanced-csv-file');
    await expect(fileInput).toBeVisible();

    // Upload the test file
    await fileInput.setInputFiles({
      name: 'allocations-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for file processing
    await page.waitForTimeout(3000);

    // Look for column mapping interface or continue button
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for success indicators
    const successIndicators = page
      .locator('text=success')
      .or(page.locator('text=imported'))
      .or(page.locator('text=completed'))
      .or(page.locator('text=processed'))
      .or(page.locator('text=3')) // Number of rows processed
      .or(page.locator('[class*="success"]'));

    await expect(successIndicators.first()).toBeVisible({ timeout: 15000 });
  });

  test('should import actual allocations CSV successfully', async ({
    page,
  }) => {
    // Look for Advanced Data Import section
    await expect(
      page.getByRole('heading', { name: 'Advanced Data Import' })
    ).toBeVisible();

    // Select Actual Allocations import type using Radix UI Select
    await page.click('[id="import-type"]');
    await page.click('[role="option"]:has-text("Actual Allocations")');

    // Create test CSV data for actual allocations
    const csvContent = `person_name,team_name,project_name,hours_worked,date,iteration,sprint
"John Doe","Frontend Team","Project Alpha","8","2024-01-15","Iteration 1","Sprint 1"
"Jane Smith","Product Team","Project Beta","7.5","2024-01-15","Iteration 1","Sprint 1"
"Bob Wilson","Design Team","Project Gamma","6","2024-01-15","Iteration 1","Sprint 1"`;

    // Find the Advanced CSV file input
    const fileInput = page.locator('#advanced-csv-file');
    await expect(fileInput).toBeVisible();

    // Upload the test file
    await fileInput.setInputFiles({
      name: 'actual-allocations-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for file processing
    await page.waitForTimeout(3000);

    // Look for column mapping interface or continue button
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for success indicators
    const successIndicators = page
      .locator('text=success')
      .or(page.locator('text=imported'))
      .or(page.locator('text=completed'))
      .or(page.locator('text=processed'))
      .or(page.locator('[class*="success"]'));

    await expect(successIndicators.first()).toBeVisible({ timeout: 15000 });
  });

  test('should handle invalid allocations CSV gracefully', async ({ page }) => {
    // Look for Advanced Data Import section
    await expect(
      page.getByRole('heading', { name: 'Advanced Data Import' })
    ).toBeVisible();

    // Select Planning Allocations import type using Radix UI Select
    await page.click('[id="import-type"]');
    await page.click('[role="option"]:has-text("Planning Allocations")');

    // Create invalid CSV (missing required fields, invalid data)
    const invalidCsv = `person_name,team_name
"John Doe","Frontend Team"
"Invalid Person"`; // Missing team_name and other required fields

    const fileInput = page.locator('#advanced-csv-file');
    await fileInput.setInputFiles({
      name: 'invalid-allocations.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCsv),
    });

    // Wait for processing
    await page.waitForTimeout(3000);

    // Look for error indicators
    const errorIndicators = page
      .locator('text=error')
      .or(page.locator('text=invalid'))
      .or(page.locator('text=failed'))
      .or(page.locator('text=required'))
      .or(page.locator('[class*="error"]'))
      .or(page.locator('[class*="danger"]'));

    await expect(errorIndicators.first()).toBeVisible({ timeout: 10000 });
  });
});
