import { test, expect } from '@playwright/test';

test.describe('Teams Page', () => {
  test('should display teams page', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/teams');
  });
});
