import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should load the teams page', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/teams');
  });

  test('should load the settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/settings');
  });
});
