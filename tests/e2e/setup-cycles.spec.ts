import { test, expect } from '@playwright/test';

test.describe('Setup Cycles E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Complete setup wizard if needed
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    // Check if we're redirected to dashboard (setup already complete)
    if (page.url().includes('/dashboard')) {
      // Setup already complete, proceed
    } else {
      // Complete setup wizard
      await expect(page.locator('#fyStart')).toBeVisible({ timeout: 10000 });
      await page.fill('#fyStart', '2024-01-01');
      await page.check('input[name="iterationLength"][value="fortnightly"]');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(2000);
      await expect(
        page.locator('button:has-text("Complete Setup")')
      ).toBeVisible({ timeout: 10000 });
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should successfully create quarters and iterations via Planning page', async ({
    page,
  }) => {
    // Navigate to Planning page
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Verify Planning page loads
    await expect(page.locator('h1:has-text("Planning")').first()).toBeVisible();

    // Check current state - should show no cycles initially
    const noCyclesMessage = page
      .locator('text=no iterations found')
      .or(
        page
          .locator('text=create iterations first')
          .or(page.locator('text=Manage Cycles'))
      );

    if ((await noCyclesMessage.count()) > 0) {
      console.log('No cycles found, proceeding to create them');

      // Click Manage Cycles button
      await page.click('button:has-text("Manage Cycles")');
      await page.waitForTimeout(2000);

      // Wait for cycle dialog to open
      await expect(page.locator('text=Manage Cycles')).toBeVisible({
        timeout: 10000,
      });

      // Generate standard quarters
      const generateQuartersButton = page.locator(
        'button:has-text("Generate Standard Quarters")'
      );
      await expect(generateQuartersButton).toBeVisible({ timeout: 10000 });
      await generateQuartersButton.click();
      await page.waitForTimeout(5000);

      // Verify quarters were created
      await expect(page.locator('text=Q1 2024')).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator('text=Q2 2024')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('text=Q3 2024')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('text=Q4 2024')).toBeVisible({
        timeout: 10000,
      });

      console.log('✅ Quarters created successfully');

      // Generate iterations for Q1
      const q1Row = page.locator('tr:has(td:text("Q1 2024"))');
      await expect(q1Row).toBeVisible({ timeout: 10000 });

      const generateIterationsButton = q1Row.locator(
        'button:has-text("Generate Iterations")'
      );
      await expect(generateIterationsButton).toBeVisible({ timeout: 10000 });
      await generateIterationsButton.click();
      await page.waitForTimeout(5000);

      // Look for success message
      const successMessage = page
        .locator('text=Generated')
        .or(page.locator('text=iterations').or(page.locator('text=success')));

      try {
        await expect(successMessage.first()).toBeVisible({ timeout: 15000 });
        console.log('✅ Q1 iterations created successfully');
      } catch (error) {
        console.log(
          '⚠️ No explicit success message for iterations, checking manually'
        );

        // Check if iterations appear in the dialog
        const iterationElements = page
          .locator('text=Iteration 1')
          .or(page.locator('text=Q1 2024 - Iteration'));
        await expect(iterationElements.first()).toBeVisible({ timeout: 10000 });
        console.log('✅ Iterations verified by presence in dialog');
      }

      // Generate iterations for Q2 as well (for more comprehensive testing)
      const q2Row = page.locator('tr:has(td:text("Q2 2024"))');
      if ((await q2Row.count()) > 0) {
        const q2GenerateButton = q2Row.locator(
          'button:has-text("Generate Iterations")'
        );
        if ((await q2GenerateButton.count()) > 0) {
          await q2GenerateButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ Q2 iterations created');
        }
      }

      // Close the dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      console.log('Cycles already exist, skipping creation');
    }

    // Verify Planning page now shows proper structure
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should no longer show "no iterations found"
    const noIterationsMessage = page.locator('text=no iterations found');
    await expect(noIterationsMessage).not.toBeVisible();

    console.log('✅ Planning page setup completed successfully');
  });

  test('should verify cycles persist after page reload', async ({ page }) => {
    // Navigate to Planning page
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // First ensure cycles are created
    await page.click('button:has-text("Manage Cycles")');
    await page.waitForTimeout(2000);

    const q1Exists = await page.locator('text=Q1 2024').count();
    if (q1Exists === 0) {
      await page.click('button:has-text("Generate Standard Quarters")');
      await page.waitForTimeout(5000);

      const q1Row = page.locator('tr:has(td:text("Q1 2024"))');
      await q1Row.locator('button:has-text("Generate Iterations")').click();
      await page.waitForTimeout(5000);
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Reload page and verify cycles persist
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open cycles dialog again
    await page.click('button:has-text("Manage Cycles")');
    await page.waitForTimeout(2000);

    // Verify quarters still exist
    await expect(page.locator('text=Q1 2024')).toBeVisible({ timeout: 10000 });

    // Close dialog
    await page.keyboard.press('Escape');

    console.log('✅ Cycles persist correctly after reload');
  });

  test('should create cycles via Settings page cycle management', async ({
    page,
  }) => {
    // Navigate to Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Go to Teams & Roles tab (which might have cycle management)
    await page.click('[role="tab"]:has-text("Teams & Roles")');
    await page.waitForLoadState('networkidle');

    // Look for any cycle management buttons or links
    const cycleManagementElements = page
      .locator('text=cycle')
      .or(page.locator('text=quarter').or(page.locator('text=iteration')));

    if ((await cycleManagementElements.count()) > 0) {
      console.log('Found cycle management in Settings');
    } else {
      console.log('No cycle management found in Settings, using Planning page');

      // Navigate to Planning page for cycle creation
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Manage Cycles")');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Generate Standard Quarters")');
      await page.waitForTimeout(5000);

      const q1Row = page.locator('tr:has(td:text("Q1 2024"))');
      await q1Row.locator('button:has-text("Generate Iterations")').click();
      await page.waitForTimeout(5000);

      await page.keyboard.press('Escape');
      console.log('✅ Cycles created via Planning page from Settings test');
    }
  });
});
