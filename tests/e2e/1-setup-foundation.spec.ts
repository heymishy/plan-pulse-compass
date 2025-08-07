import { test, expect } from '@playwright/test';
import {
  createQuartersAndIterations,
  waitForLocalStorageData,
  verifyQuartersInDropdown,
} from './test-helpers';

test.describe('Foundation Setup (runs first)', () => {
  test.slow(); // Give this test more time as it's foundational

  test('should complete setup wizard and create quarters with iterations', async ({
    page,
    context,
  }) => {
    console.log('🚀 Starting foundation setup test...');

    // 1. Complete setup wizard with retry logic
    let setupCompleted = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!setupCompleted && attempts < maxAttempts) {
      try {
        await page.goto('/setup', { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        if (page.url().includes('/setup')) {
          console.log('📝 Completing setup wizard...');

          // Fill setup form with better error handling
          await page.fill('#fyStart', '2024-01-01');
          await page.check(
            'input[name="iterationLength"][value="fortnightly"]'
          );

          const nextButton = page.locator('button:has-text("Next")');
          await expect(nextButton).toBeVisible({ timeout: 5000 });
          await nextButton.click();
          await page.waitForTimeout(2000);

          // Complete setup
          const completeButton = page.locator(
            'button:has-text("Complete Setup")'
          );
          await expect(completeButton).toBeVisible({ timeout: 5000 });
          await completeButton.click();

          // Wait for setup to complete with proper loading state
          await page.waitForURL('/dashboard', { timeout: 15000 });

          // Give setup completion time to save to localStorage
          await page.waitForTimeout(3000);

          console.log('✅ Setup wizard completed');
          setupCompleted = true;
        } else {
          setupCompleted = true; // Already completed
        }
        break;
      } catch (error) {
        attempts++;
        console.log(`⚠️ Setup attempt ${attempts} failed:`, error.message);
        if (attempts === maxAttempts) {
          console.log('Assuming setup already completed, continuing...');
          setupCompleted = true;
        }
        await page.waitForTimeout(2000);
      }
    }

    // 2. Verify setup completion (with extended timeout)
    const hasConfig = await waitForLocalStorageData(
      page,
      'planning-config',
      1,
      10000
    );
    const hasSetupComplete = await waitForLocalStorageData(
      page,
      'planning-setup-complete',
      1,
      10000
    );

    if (!hasConfig || !hasSetupComplete) {
      // Debug: check what's actually in localStorage
      const debugData = await page.evaluate(() => {
        return {
          allKeys: Object.keys(localStorage),
          config: localStorage.getItem('planning-config'),
          setupComplete: localStorage.getItem('planning-setup-complete'),
        };
      });
      console.log('Debug localStorage:', debugData);
      throw new Error('Setup did not complete successfully');
    }

    console.log('✅ Setup data confirmed in localStorage');

    // 3. Create quarters and iterations using helper
    await createQuartersAndIterations(page);

    // 4. Verify quarters exist in localStorage
    const hasQuarters = await waitForLocalStorageData(
      page,
      'planning-cycles',
      4,
      5000
    );
    if (!hasQuarters) {
      throw new Error('Quarters were not created successfully');
    }

    // 5. Verify iterations were generated (should have at least some iterations for Q1)
    // Check if iterations exist by type rather than total count
    const hasIterations = await page.evaluate(() => {
      const data = localStorage.getItem('planning-cycles');
      if (!data) return false;
      try {
        const cycles = JSON.parse(data);
        const iterations = cycles.filter(
          (cycle: any) => cycle.type === 'iteration'
        );
        const quarters = cycles.filter(
          (cycle: any) => cycle.type === 'quarterly'
        );
        console.log(
          `Found ${quarters.length} quarters and ${iterations.length} iterations`
        );
        return iterations.length > 0; // At least 1 iteration should exist
      } catch {
        return false;
      }
    });
    if (!hasIterations) {
      throw new Error('Iterations were not generated successfully');
    }

    // 6. Verify quarters are accessible in planning dropdown
    await verifyQuartersInDropdown(page);

    // 7. Final verification
    const finalState = await page.evaluate(() => {
      const cycles = localStorage.getItem('planning-cycles');
      const config = localStorage.getItem('planning-config');
      const setupComplete = localStorage.getItem('planning-setup-complete');

      return {
        cycles: cycles ? JSON.parse(cycles).length : 0,
        hasConfig: !!config,
        setupComplete: !!setupComplete,
      };
    });

    console.log('Final localStorage state:', finalState);
    console.log('✅ Foundation setup complete - quarters and iterations ready');

    // Ensure we have the minimum required data
    if (
      finalState.cycles < 10 ||
      !finalState.hasConfig ||
      !finalState.setupComplete
    ) {
      throw new Error('Foundation setup validation failed');
    }

    // Save storage state for other tests to use
    await context.storageState({ path: './tests/e2e/storage-state.json' });
    console.log('💾 Setup storage state saved for other tests');
  });
});
