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
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });
    const teams = Array.from(
      { length: 100 },
      (_, i) =>
        `"Team ${i}","team-${i}@company.com","Engineer","Team ${i}","team-${i}","permanent","80000","","","2023-01-15","","true","Engineering","div-${Math.floor(i / 10)}","160"`
    );
    const csvContent = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,division_id,team_capacity\n${teams.join('\n')}`;
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'max-scale.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await page.waitForSelector('text=Import Completed', { timeout: 300000 });
    await expect(page.getByTestId('inserted-count')).toContainText('100');
  });

  test('should maintain UI responsiveness during large imports', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });
    const largeCsvContent =
      'name,email,role\n' +
      Array.from(
        { length: 5000 },
        (_, i) => `"User ${i}","user${i}@company.com","Engineer"`
      ).join('\n');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeCsvContent),
    });
    // Check navigation elements are still visible during import
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });
    // Check if import is still processing or completed
    const isProcessing = await page.locator('text=Processing').isVisible();
    const isCompleted = await page.locator('text=Import Completed').isVisible();
    expect(isProcessing || isCompleted).toBe(true);
  });
});
