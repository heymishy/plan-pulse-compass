import { test, expect } from '@playwright/test';

test.describe('People Import E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to Import/Export tab
    await page.click('[role="tab"]:has-text("Import/Export")');
    await page.waitForLoadState('networkidle');
  });

  test('should import people CSV successfully', async ({ page }) => {
    // Create test CSV data for people import
    const csvContent = `name,email,role,team_name,employment_type,annual_salary,is_active
"John Doe","john.doe@company.com","Software Engineer","Frontend Team","permanent","95000","true"
"Jane Smith","jane.smith@company.com","Product Owner","Backend Team","permanent","120000","true"
"Bob Wilson","bob.wilson@company.com","UX Designer","Design Team","contractor","85000","true"
"Alice Johnson","alice.johnson@company.com","Platform Engineer","Platform Team","permanent","110000","true"
"Charlie Brown","charlie.brown@company.com","Data Scientist","Data Team","permanent","115000","true"
"Diana Prince","diana.prince@company.com","Quality Engineer","QA Team","permanent","90000","true"`;

    // Find the Enhanced People CSV file input
    const fileInput = page.locator('#enhancedPeopleCSV');
    await expect(fileInput).toBeVisible();

    // Upload the test file
    await fileInput.setInputFiles({
      name: 'people-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for processing and look for success indicators
    await page.waitForTimeout(3000);

    // Look for success indicators (could be various messages)
    const successIndicators = page
      .locator('text=success')
      .or(page.locator('text=imported'))
      .or(page.locator('text=completed'))
      .or(page.locator('text=processed'))
      .or(page.locator('text=6')) // Number of rows processed
      .or(page.locator('[class*="success"]'))
      .or(page.locator('[class*="complete"]'));

    await expect(successIndicators.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid people CSV', async ({
    page,
  }) => {
    // Create invalid CSV (missing required fields, invalid email)
    const invalidCsv = `name,email,role
"John Doe","invalid-email","Engineer"
"Jane Smith","","Manager"`; // Missing email

    const fileInput = page.locator('#enhancedPeopleCSV');
    await expect(fileInput).toBeVisible();

    await fileInput.setInputFiles({
      name: 'invalid-people.csv',
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
      .or(page.locator('[class*="error"]'))
      .or(page.locator('[class*="danger"]'))
      .or(page.locator('[class*="destructive"]'));

    await expect(errorIndicators.first()).toBeVisible({ timeout: 5000 });
  });

  test('should download people sample CSV', async ({ page }) => {
    // Find the download sample button for people CSV
    const downloadButton = page
      .locator('text=Enhanced People CSV')
      .locator('..')
      .locator('button:has-text("Download Sample")')
      .first();

    await expect(downloadButton).toBeVisible();

    // Test download functionality
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    expect(download.suggestedFilename()).toMatch(/people|sample/i);
  });
});
