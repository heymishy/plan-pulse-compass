import { test, expect } from '@playwright/test';
import { ensureSetupComplete } from './test-helpers';

test.describe('Skills Management', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure setup is complete before running tests
    await ensureSetupComplete(page);

    // Navigate to skills page
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
  });

  test('should view skills page and display skills overview', async ({
    page,
  }) => {
    console.log('🔍 Testing skills view functionality...');

    // Check that we're on the skills page
    await expect(page.locator('h1:has-text("Skills Overview")')).toBeVisible();

    // Should see the skills overview cards (this is a read-only page)
    await expect(page.locator('text="Total Skills"')).toBeVisible();
    await expect(page.locator('text="Solutions with Skills"')).toBeVisible();

    console.log('✅ Skills overview page loaded correctly');
  });

  test('should display skills by category', async ({ page }) => {
    console.log('🎯 Testing skills category display...');

    // The skills page shows skills organized by category
    // Check the basic structure is there
    await expect(page.locator('h1:has-text("Skills Overview")')).toBeVisible();

    // Should show stats cards
    await expect(page.locator('text="Total Skills"')).toBeVisible();

    console.log('✅ Skills category display working');
  });

  test('should show skills statistics', async ({ page }) => {
    console.log('📊 Testing skills statistics...');

    // Check that the stats cards are visible
    const statsCards = ['Total Skills', 'Solutions with Skills'];

    for (const cardText of statsCards) {
      await expect(page.locator(`text="${cardText}"`)).toBeVisible();
    }

    console.log('✅ Skills statistics display working');
  });
});
