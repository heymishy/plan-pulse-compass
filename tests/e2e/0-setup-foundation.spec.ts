import { test, expect } from '@playwright/test';

test.describe('Foundation Setup (runs first)', () => {
  test('should complete setup wizard and create quarters with iterations', async ({
    page,
  }) => {
    // 1. Complete setup wizard
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/dashboard')) {
      console.log('Setup already complete');
    } else {
      await expect(page.locator('#fyStart')).toBeVisible({ timeout: 5000 });
      await page.fill('#fyStart', '2024-01-01');
      await page.check('input[name="iterationLength"][value="fortnightly"]');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL('/dashboard');
      await page.waitForLoadState('networkidle');
      console.log('✅ Setup wizard completed');
    }

    // 2. Navigate to Planning and create cycles
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // 3. Open cycle management
    await page.click('button:has-text("Manage Cycles")');
    await page.waitForTimeout(1000);

    // 4. Check if quarters already exist
    const existingQuarters = await page.locator('text=Q1 2024').count();

    if (existingQuarters === 0) {
      console.log('Creating quarters...');

      // Generate quarters - try multiple button texts
      const quarterButtons = [
        'button:has-text("Generate Standard Quarters")',
        'button:has-text("Generate Quarters")',
        'button:has-text("Create Quarters")',
      ];

      let quarterButtonFound = false;
      for (const selector of quarterButtons) {
        const button = page.locator(selector);
        if ((await button.count()) > 0) {
          await button.click();
          quarterButtonFound = true;
          break;
        }
      }

      if (!quarterButtonFound) {
        throw new Error('Could not find quarter generation button');
      }

      await page.waitForTimeout(2000);
      await expect(page.locator('text=Q1 2024')).toBeVisible({ timeout: 5000 });
      console.log('✅ Quarters created');
    }

    // 5. CRITICAL: Generate iterations for Q1
    const q1Row = page.locator('tr:has(td:text("Q1 2024"))');
    await expect(q1Row).toBeVisible({ timeout: 5000 });

    // Try to find and click Generate Iterations button
    const iterationButtons = [
      q1Row.locator('button:has-text("Generate Iterations")'),
      q1Row.locator('button:has-text("Generate")'),
      q1Row.locator('button').filter({ hasText: 'Iteration' }),
    ];

    let iterationButtonFound = false;
    for (const button of iterationButtons) {
      if ((await button.count()) > 0) {
        await button.click();
        iterationButtonFound = true;
        console.log('✅ Clicked iteration generation button');
        break;
      }
    }

    if (!iterationButtonFound) {
      throw new Error('Could not find iteration generation button for Q1');
    }

    await page.waitForTimeout(2000);

    // 6. Verify iterations were created
    // Check for iteration-related text or table rows
    const iterationVerifiers = [
      page.locator('text=Generated'),
      page.locator('text=iteration').first(),
      page.locator('td:has-text("Iteration")'),
      page.locator('tr:has(td:text("Q1 2024 - Iteration"))'),
    ];

    let iterationsVerified = false;
    for (const verifier of iterationVerifiers) {
      if ((await verifier.count()) > 0) {
        console.log(
          '✅ Iterations verified via:',
          await verifier.textContent()
        );
        iterationsVerified = true;
        break;
      }
    }

    if (!iterationsVerified) {
      console.log('⚠️ Could not verify iterations created - tests may fail');
    }

    // 7. Close dialog and verify planning page works
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Reload planning page to check final state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should not show "no iterations found"
    const noIterationsMessage = page.locator('text=no iterations found');
    if ((await noIterationsMessage.count()) > 0) {
      throw new Error(
        'Planning page still shows "no iterations found" - setup failed'
      );
    }

    console.log('✅ Foundation setup complete - quarters and iterations ready');
  });
});
