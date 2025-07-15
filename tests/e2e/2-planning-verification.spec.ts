import { test, expect } from '@playwright/test';
import {
  createQuartersAndIterations,
  verifyQuartersInDropdown,
} from './test-helpers';

test.describe('Planning Verification (depends on setup)', () => {
  test('should show quarters and iterations in planning page', async ({
    page,
  }) => {
    // First complete setup
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    // Complete setup if needed
    if (page.url().includes('/setup')) {
      await page.fill('#fyStart', '2024-01-01');
      await page.check('input[name="iterationLength"][value="fortnightly"]');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL('/dashboard');
    }

    // Create quarters and iterations using helper
    await createQuartersAndIterations(page);

    // Verify quarters are accessible in planning dropdown
    await verifyQuartersInDropdown(page);

    // Navigate to planning page to verify UI elements
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Should show the planning page without "Setup Required" message
    await expect(page.locator('text=Setup Required')).toHaveCount(0);

    // Should show iterations count > 0
    const iterationsText = page.locator('text=Total iterations');
    await expect(iterationsText).toBeVisible({ timeout: 5000 });

    // Should not show "no iterations found" message
    await expect(page.locator('text=No Iterations Found')).toHaveCount(0);

    // Should show team allocation matrix
    await expect(page.locator('text=Team Allocation Matrix')).toBeVisible({
      timeout: 5000,
    });

    // Should show teams in the matrix
    await expect(page.locator('text=Engineering').first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Product').first()).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Planning page verification passed - all data is visible');
  });

  test('should show quarters and iterations after generating them', async ({
    page,
  }) => {
    // First complete setup
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    // Complete setup if needed
    if (page.url().includes('/setup')) {
      await page.fill('#fyStart', '2024-01-01');
      await page.check('input[name="iterationLength"][value="fortnightly"]');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL('/dashboard');
    }

    // Create quarters and iterations using helper
    await createQuartersAndIterations(page);

    // Verify quarters are accessible in planning dropdown
    await verifyQuartersInDropdown(page);

    // Navigate to planning page to verify final state
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Should show team allocation matrix
    await expect(page.locator('text=Team Allocation Matrix')).toBeVisible({
      timeout: 5000,
    });

    // Should not show "no iterations found" message
    await expect(page.locator('text=No Iterations Found')).toHaveCount(0);

    console.log('✅ Planning page with generated data verification passed');
  });
});
