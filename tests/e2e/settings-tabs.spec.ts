import { test, expect } from '@playwright/test';

test.describe('Settings Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Settings', { timeout: 10000 });
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings page with tabs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('text=General')).toBeVisible();
    await expect(page.locator('text=Import/Export')).toBeVisible();
  });

  test('should switch to Import/Export tab', async ({ page }) => {
    await page.click('text=Import/Export');
    await page.waitForLoadState('networkidle');
    // Just verify the tab is active using data-state attribute
    await expect(
      page.locator('[value="import"][data-state="active"]')
    ).toBeVisible();
  });

  test('should switch to Teams & Roles tab', async ({ page }) => {
    await page.click('text=Teams & Roles');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[value="teams"][data-state="active"]')
    ).toBeVisible();
  });

  test('should switch to Financial tab', async ({ page }) => {
    await page.click('text=Financial');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[value="financial"][data-state="active"]')
    ).toBeVisible();
  });
});
