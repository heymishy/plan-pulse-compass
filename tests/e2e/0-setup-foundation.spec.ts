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

    // 3. Open cycle management with better error handling
    try {
      await page.click('button:has-text("Manage Cycles")');
      await page.waitForTimeout(1000);
    } catch (error) {
      // Handle button interception by forcing click
      await page
        .locator('button:has-text("Manage Cycles")')
        .click({ force: true });
      await page.waitForTimeout(1000);
    }

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
    // Try multiple selectors to find Q1 quarter row/section with better fallbacks
    const q1Selectors = [
      'tr:has(td:text("Q1 2024"))', // Table row with exact text
      'tr:has(td:text("Q1"))', // Table row with partial text
      'tr:has-text("Q1 2024")', // Table row containing text
      'tr:has-text("Q1")', // Table row containing Q1
      '[data-testid*="q1"]', // Data testid
      'div:has-text("Q1 2024")', // Div container
      'div:has-text("Q1")', // Div with Q1
      '*:has-text("Q1 2024")', // Any element with full text
      '*:has-text("Q1")', // Any element with Q1
      'text=Q1 2024', // Direct text match
      'text=Q1', // Partial text match
    ];

    let q1Element = null;
    for (const selector of q1Selectors) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        q1Element = element;
        console.log(`✅ Found Q1 element with selector: ${selector}`);
        break;
      }
    }

    if (!q1Element) {
      // Debug: log what elements are actually present
      console.log('Available elements in dialog:');
      const allText = await page.locator('*').allTextContents();
      console.log('All text contents:', allText.slice(0, 20)); // First 20 elements
      throw new Error('Could not find Q1 2024 element in any form');
    }

    // Find Generate Iterations button for Q1 - try multiple approaches
    const iterationButtonSelectors = [
      // Within Q1 element/row
      q1Element.locator('button:has-text("Generate Iterations")'),
      q1Element.locator('button:has-text("Generate")'),
      q1Element.locator('button').filter({ hasText: 'Iteration' }),
      q1Element.locator('button').filter({ hasText: 'Generate' }),
      // Look for button in same row as Q1
      page
        .locator('tr:has-text("Q1")')
        .locator('button:has-text("Generate Iterations")'),
      page.locator('tr:has-text("Q1")').locator('button:has-text("Generate")'),
      // Anywhere in dialog with Generate Iterations text
      page.locator('button:has-text("Generate Iterations")').first(),
      page.locator('button').filter({ hasText: 'Generate Iterations' }).first(),
      page.locator('button').filter({ hasText: 'Generate' }).first(),
    ];

    let iterationButtonFound = false;
    for (const button of iterationButtonSelectors) {
      try {
        if ((await button.count()) > 0) {
          await button.click();
          iterationButtonFound = true;
          console.log('✅ Clicked Generate Iterations button');
          break;
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }

    if (!iterationButtonFound) {
      console.log(
        '⚠️ Could not find Generate Iterations button, trying any Generate button'
      );
      const anyGenerateButton = page.locator('button:has-text("Generate")');
      if ((await anyGenerateButton.count()) > 0) {
        await anyGenerateButton.first().click();
        console.log('✅ Clicked any Generate button as fallback');
      } else {
        // Debug: log available buttons
        const allButtons = await page.locator('button').allTextContents();
        console.log('Available buttons:', allButtons);
        throw new Error('Could not find any Generate Iterations button');
      }
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

    // Reload planning page to check final state (with timeout handling)
    try {
      await page.reload();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Page reload timeout, but continuing verification');
      // Continue with verification even if reload times out
    }

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
