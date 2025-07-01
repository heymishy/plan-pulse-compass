import { test, expect } from '@playwright/test';

test.describe('Enhanced Import Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test('should integrate with existing data context', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await expect(page.locator('text=Enhanced Data Import')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Advanced Data Import' })
    ).toBeVisible();
  });

  test('should handle data persistence after import', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    const csvContent = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,division_id,team_capacity\n"Test User","test@company.com","Engineer","Test Team","test-team","permanent","80000","","","2023-01-15","","true","Engineering","test-div","160"`;
    // Use the first file input (Enhanced Import Component)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await page.waitForSelector('text=Import Completed', { timeout: 30000 });
    await page.click('text=Dashboard');
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await expect(page.locator('text=Enhanced Data Import')).toBeVisible();
  });
});
