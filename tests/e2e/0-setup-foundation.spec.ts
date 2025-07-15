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
  }) => {
    console.log('🚀 Starting foundation setup test...');

    // 1. Complete setup wizard
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/setup')) {
      console.log('📝 Completing setup wizard...');

      // Fill setup form
      await page.fill('#fyStart', '2024-01-01');
      await page.check('input[name="iterationLength"][value="fortnightly"]');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);

      // Complete setup
      await page.click('button:has-text("Complete Setup")');

      // Wait for setup to complete with proper loading state
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Give setup completion time to save to localStorage
      await page.waitForTimeout(2000);

      console.log('✅ Setup wizard completed');
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

    // 5. Verify iterations were generated (should have at least 6 iterations for Q1)
    const hasIterations = await waitForLocalStorageData(
      page,
      'planning-cycles',
      10,
      5000
    );
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
  });
});
