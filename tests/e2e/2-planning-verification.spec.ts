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

    // Should show quarters in the quarter dropdown
    // The quarters should be loaded and the page should not show "Setup Required"
    // This indicates quarters exist and are accessible to the planning page
    const quarterDropdown = page
      .locator('label:has-text("Quarter")')
      .locator('..')
      .locator('[role="combobox"]');
    await expect(quarterDropdown).toBeVisible({ timeout: 5000 });

    // Verify that the dropdown has options by clicking it
    await quarterDropdown.click();
    await page.waitForTimeout(1000);

    // Should see Q1 2024 in the dropdown options
    await expect(
      page.locator('[role="option"]:has-text("Q1 2024")')
    ).toBeVisible({
      timeout: 5000,
    });

    // Close dropdown
    await page.keyboard.press('Escape');

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
    // Open the quarter dropdown to see available quarters
    const quarterSelect = page
      .locator('label:has-text("Quarter")')
      .locator('..');
    const quarterTrigger = quarterSelect.locator('[role="combobox"]');
    await quarterTrigger.click();
    await page.waitForTimeout(500);

    // Should see Q1 2024 in the dropdown options
    await expect(
      page.locator('[role="option"]:has-text("Q1 2024")')
    ).toBeVisible({
      timeout: 5000,
    });

    // Close dropdown
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Team Allocation Matrix')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=No Iterations Found')).toHaveCount(0);

    console.log('✅ Planning page with generated data verification passed');
  });
});
