import { test, expect } from '@playwright/test';

test.describe('Import/Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test('should display enhanced import component', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await expect(page.locator('text=Enhanced Data Import')).toBeVisible();
    await expect(page.locator('text=People & Teams')).toBeVisible();
  });

  test('should allow switching between import types', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await expect(page.locator('text=People & Teams')).toBeVisible();
    await page.getByTestId('allocations-tab').click();
    await expect(page.getByTestId('allocations-tab')).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('should allow configuration of import options', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    // Show advanced options first
    await page.getByTestId('advanced-options-toggle').click();
    await expect(page.locator('text=Allow partial imports')).toBeVisible();
    await expect(page.locator('text=Strict validation')).toBeVisible();
    await expect(page.locator('text=Skip empty rows')).toBeVisible();
    // Test toggling options
    await page.locator('input[type="checkbox"]').first().click();
    await expect(page.locator('input[type="checkbox"]').first()).toBeChecked();
  });

  test('should provide file upload interface', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await expect(page.locator('text=Select CSV File')).toBeVisible();
    await expect(page.locator('input[type="file"]').first()).toBeVisible();
    await expect(page.locator('text=Enhanced Data Import')).toBeVisible();
  });

  test('should provide sample CSV download', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    const downloadButton = page.locator(
      'button:has-text("Download Sample CSV")'
    );
    await expect(downloadButton).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should import valid people and teams CSV', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    const csvContent = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,division_id,team_capacity\n"John Doe","john.doe@company.com","Software Engineer","Frontend Team","team-001","permanent","95000","","","2023-01-15","","true","Engineering","div-001","160"\n"Jane Smith","jane.smith@company.com","Product Owner","Frontend Team","team-001","permanent","120000","","","2023-01-15","","true","Engineering","div-001","160"`;
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-people.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await page.waitForSelector('text=Import Completed', { timeout: 30000 });
    await expect(page.locator('text=Total Rows')).toBeVisible();
    await expect(page.locator('text=Successful')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
  });

  test('should handle invalid CSV with errors', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    const csvContent = `name,email,role,team_name\n"John Doe","invalid-email","","Frontend Team"`;
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'invalid-people.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await page.waitForSelector('text=Validation failed', { timeout: 30000 });
    await expect(page.locator('text=Error')).toBeVisible();
  });

  test('should show progress during import', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    const rows = Array.from(
      { length: 100 },
      (_, i) =>
        `"Person ${i}","person${i}@company.com","Engineer","Team ${i}","team-${i}","permanent","95000","","","2023-01-15","","true","Engineering","div-001","160"`
    );
    const csvContent = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,division_id,team_capacity\n${rows.join('\n')}`;
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large-people.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await expect(page.locator('text=Processing')).toBeVisible();
    await page.waitForSelector('text=Import Completed', { timeout: 60000 });
  });
});
