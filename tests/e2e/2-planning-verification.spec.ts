import { test, expect } from '@playwright/test';

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

    // Navigate to planning page
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Should show the planning page without "Setup Required" message
    await expect(page.locator('text=Setup Required')).toHaveCount(0);

    // Should show quarters in the dropdown
    await expect(page.locator('text=Q1 2024').first()).toBeVisible({
      timeout: 5000,
    });

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

    // Navigate to planning page
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Open cycle management
    await page.click('button:has-text("Manage Cycles")');
    await page.waitForTimeout(1000);

    // Generate quarters if not exists
    const quarterButton = page.locator(
      'button:has-text("Generate Standard Quarters")'
    );
    if ((await quarterButton.count()) > 0) {
      await quarterButton.click();
      await page.waitForTimeout(2000);
    }

    // Generate iterations for Q1
    const q1Row = page.locator('div:has-text("Q1 2024")').first();
    await expect(q1Row).toBeVisible({ timeout: 5000 });

    const generateButton = page.locator(
      'button:has-text("Generate Iterations")'
    );
    await generateButton.first().click();
    await page.waitForTimeout(2000);

    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Reload planning page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show quarters and iterations
    await expect(page.locator('text=Q1 2024').first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Team Allocation Matrix')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=No Iterations Found')).toHaveCount(0);

    console.log('✅ Planning page with generated data verification passed');
  });
});
