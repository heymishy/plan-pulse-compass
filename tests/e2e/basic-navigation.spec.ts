import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Settings', { timeout: 10000 });
  });

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/Plan Pulse Compass/);
  });

  test('should navigate to Teams page', async ({ page }) => {
    await page.click('text=Teams');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Teams');
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should navigate to Projects page', async ({ page }) => {
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Projects');
  });

  test('should navigate to Dashboard page', async ({ page }) => {
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
