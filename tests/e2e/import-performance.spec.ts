import { test, expect } from '@playwright/test';

test.describe('Import Performance and Stress Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test('should handle maximum scale data (100 teams)', async ({ page }) => {
    await page.click('text=Settings');
    const teams = Array.from(
      { length: 100 },
      (_, i) =>
        `"Team ${i}","team-${i}@company.com","Engineer","Team ${i}","team-${i}","permanent","80000","","","2023-01-15","","true","Engineering","div-${Math.floor(i / 10)}","160"`
    );
    const csvContent = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,division_id,team_capacity\n${teams.join('\n')}`;
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'max-scale.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await page.waitForSelector('text=Import Completed', { timeout: 300000 });
    await expect(page.locator('text=100')).toBeVisible();
  });

  test('should maintain UI responsiveness during large imports', async ({
    page,
  }) => {
    await page.click('text=Settings');
    const largeCsvContent =
      'name,email,role\n' +
      Array.from(
        { length: 5000 },
        (_, i) => `"User ${i}","user${i}@company.com","Engineer"`
      ).join('\n');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeCsvContent),
    });
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await page.click('text=Dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await page.click('text=Settings');
    await expect(page.locator('text=Import in progress')).toBeVisible();
  });
});
