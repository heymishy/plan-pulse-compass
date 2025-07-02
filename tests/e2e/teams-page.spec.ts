import { test, expect } from '@playwright/test';

test.describe('Teams Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Teams', { timeout: 10000 });
    await page.click('text=Teams');
    await page.waitForLoadState('networkidle');
  });

  test('should display teams page with tabs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Teams');

    // Check for main tabs
    await expect(page.locator('text=Portfolio')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Teams')).toBeVisible();
  });

  test('should switch to Analytics tab', async ({ page }) => {
    await page.click('[data-value="analytics"]');
    await page.waitForLoadState('networkidle');

    // Wait a bit for content to load
    await page.waitForTimeout(1000);

    // Check that we're on the analytics tab
    await expect(
      page.locator('[data-value="analytics"][data-state="active"]')
    ).toBeVisible();
  });

  test('should switch to Portfolio tab', async ({ page }) => {
    await page.click('[data-value="portfolio"]');
    await page.waitForLoadState('networkidle');

    // Wait a bit for content to load
    await page.waitForTimeout(1000);

    // Check that we're on the portfolio tab
    await expect(
      page.locator('[data-value="portfolio"][data-state="active"]')
    ).toBeVisible();
  });

  test('should display team summary cards', async ({ page }) => {
    // Check for summary cards that should be present
    await expect(page.locator('text=Total Teams')).toBeVisible();
    await expect(page.locator('text=Active Teams')).toBeVisible();
    await expect(page.locator('text=Total Capacity')).toBeVisible();
  });
});
