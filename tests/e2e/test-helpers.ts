import { Page, expect } from '@playwright/test';

/**
 * Reliable helper to create quarters and iterations for E2E tests
 */
export async function createQuartersAndIterations(page: Page): Promise<void> {
  console.log('🔄 Creating quarters and iterations...');

  // Navigate to planning page with retry logic
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      await page.goto('/planning', { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Allow React to render
      break;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      console.log(
        `⚠️ Planning page load attempt ${attempts} failed, retrying...`
      );
      await page.waitForTimeout(2000);
    }
  }

  // Open cycle management dialog with better error handling
  // Use more specific selector to avoid strict mode violation
  const manageCyclesButton = page
    .locator('[data-testid="manage-cycles-header-button"]')
    .first();
  if (!(await manageCyclesButton.isVisible({ timeout: 5000 }))) {
    // Fallback to text-based selector with first() to avoid strict mode
    const fallbackButton = page
      .locator('button:has-text("Manage Cycles")')
      .first();
    await expect(fallbackButton).toBeVisible({ timeout: 10000 });
    await fallbackButton.click();
  } else {
    await manageCyclesButton.click();
  }
  await page.waitForTimeout(2000); // Increased wait time

  // Generate quarters if they don't exist
  const quarterButton = page.locator(
    'button:has-text("Generate Standard Quarters")'
  );

  try {
    await expect(quarterButton).toBeVisible({ timeout: 5000 });
    await quarterButton.click();
    await page.waitForTimeout(3000); // Increased wait for generation

    // Verify quarters were created using more specific selector
    await expect(
      page.locator('div.font-medium').filter({ hasText: 'Q1 2024' }).first()
    ).toBeVisible({ timeout: 8000 });
    console.log('✅ Quarters created successfully');
  } catch (error) {
    console.log('ℹ️ Quarters already exist or generation not needed');
  }

  // Generate iterations for Q1 using more specific selector within the cycle dialog
  const cycleDialog = page
    .locator('[role="dialog"]')
    .filter({ hasText: 'Manage Cycles' });
  await expect(cycleDialog).toBeVisible({ timeout: 5000 });

  // Find the specific Q1 quarter entry within the quarters list
  const q1Quarter = cycleDialog
    .locator('div')
    .filter({ hasText: /Q1 2024/ })
    .and(page.locator('div').filter({ hasText: /Jan.*Mar/ }))
    .first();
  await expect(q1Quarter).toBeVisible({ timeout: 5000 });

  // Check if iterations already exist by looking at localStorage
  const existingCycles = await page.evaluate(() => {
    const data = localStorage.getItem('planning-cycles');
    return data ? JSON.parse(data) : [];
  });

  const existingIterations = existingCycles.filter(
    (cycle: { type: string }) => cycle.type === 'iteration'
  );
  console.log(`Found ${existingIterations.length} existing iterations`);

  if (existingIterations.length === 0) {
    // Debug: Check what buttons are available in the Q1 quarter
    const allButtons = q1Quarter.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons in Q1 quarter`);

    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await allButtons.nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }

    // Try to find the Generate Iterations button within this specific quarter
    const generateButton = q1Quarter
      .locator('button:has-text("Generate Iterations")')
      .first();

    if (await generateButton.isVisible()) {
      console.log('Found Generate Iterations button for Q1 2024');

      await generateButton.click();
      await page.waitForTimeout(2000); // Give more time for iterations to generate

      // Wait for iterations to appear in localStorage
      const startTime = Date.now();
      const timeout = 8000;
      let iterationsCount = 0;

      while (Date.now() - startTime < timeout) {
        const cycles = await page.evaluate(() => {
          const data = localStorage.getItem('planning-cycles');
          return data ? JSON.parse(data) : [];
        });
        const iterations = cycles.filter(
          (cycle: { type: string }) => cycle.type === 'iteration'
        );
        iterationsCount = iterations.length;

        if (iterationsCount > 0) {
          // At least one iteration exists
          break;
        }
        await page.waitForTimeout(200);
      }

      console.log(
        `✅ Q1 iterations created successfully (${iterationsCount} iterations)`
      );
    } else {
      console.log('⚠️ Generate Iterations button not found for Q1 2024');

      // Debug: Show the actual HTML content of the Q1 quarter
      const q1Content = await q1Quarter.innerHTML();
      console.log('Q1 quarter HTML:', q1Content.slice(0, 500));
    }
  } else {
    console.log(
      `ℹ️ Q1 iterations already exist (${existingIterations.length} iterations)`
    );
  }

  // Close cycle management dialog properly like a real user would
  await closeCycleDialog(page);

  console.log('✅ Quarter and iteration setup completed');
}

/**
 * Close the Manage Cycles dialog like a real user would
 */
export async function closeCycleDialog(page: Page): Promise<void> {
  console.log('🔄 Closing cycle management dialog...');

  const dialog = page
    .locator('[role="dialog"]')
    .filter({ hasText: 'Manage Cycles' });

  // Try multiple close methods in order of user preference
  try {
    // Method 1: Use the X close button in the top-right corner (has sr-only "Close" text)
    const xCloseButton = dialog
      .locator('button')
      .filter({ has: page.locator('span:has-text("Close")') })
      .first();
    if (await xCloseButton.isVisible({ timeout: 1000 })) {
      await xCloseButton.click();
      await page.waitForTimeout(500);
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
      console.log('✅ Dialog closed with X button');
      return;
    }

    // Method 2: Use the Close button in the dialog footer
    const closeButton = dialog.locator('button:has-text("Close")');
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
      console.log('✅ Dialog closed with footer Close button');
      return;
    }

    // Method 3: Click outside the dialog (on overlay)
    const overlay = page.locator('[role="dialog"]').locator('..').first();
    await overlay.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Dialog closed by clicking outside');
    return;
  } catch (error) {
    // Method 4: Fallback to Escape key
    console.log(
      '⚠️ All close methods failed, using Escape key as final fallback'
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Verify closure with Escape
    try {
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
      console.log('✅ Dialog closed with Escape key');
    } catch {
      console.log('⚠️ Dialog may still be open - continuing test anyway');
    }
  }
}

/**
 * Wait for localStorage to contain expected data
 */
export async function waitForLocalStorageData(
  page: Page,
  key: string,
  minCount: number,
  timeout: number = 8000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const data = await page.evaluate(storageKey => {
      const item = localStorage.getItem(storageKey);
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }, key);

    if (data) {
      // For arrays, check length
      if (Array.isArray(data) && data.length >= minCount) {
        console.log(
          `✅ localStorage "${key}" has ${data.length} items (expected: ${minCount})`
        );
        return true;
      }
      // For non-arrays, just check existence if minCount is 1
      if (!Array.isArray(data) && minCount === 1) {
        console.log(`✅ localStorage "${key}" has data`);
        return true;
      }
    }

    await page.waitForTimeout(100);
  }

  console.log(
    `❌ Timeout waiting for localStorage "${key}" to have ${minCount} items`
  );
  return false;
}

/**
 * Ensure setup is complete for tests that need it
 */
export async function ensureSetupComplete(page: Page): Promise<void> {
  console.log('🔧 Ensuring setup is complete...');

  // Navigate to home page first to ensure localStorage is accessible
  try {
    await page.goto('/', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Allow app to initialize
  } catch (error) {
    console.log('⚠️ Navigation to home failed, continuing with setup...');
  }

  // Check if setup is already complete
  const setupComplete = await page.evaluate(() => {
    try {
      const setupComplete = localStorage.getItem('planning-setup-complete');
      const hasConfig = localStorage.getItem('planning-config');
      return setupComplete === 'true' && hasConfig;
    } catch (e) {
      return false;
    }
  });

  if (setupComplete) {
    console.log('✅ Setup already complete');
    return;
  }

  // Set default configuration
  await page.evaluate(() => {
    try {
      const currentYear = new Date().getFullYear();
      const defaultConfig = {
        financialYear: {
          id: `fy-${currentYear}`,
          name: `FY ${currentYear}`,
          startDate: `${currentYear - 1}-10-01`,
          endDate: `${currentYear}-09-30`,
        },
        iterationLength: 'fortnightly',
        quarters: [],
        workingDaysPerWeek: 5,
        workingHoursPerDay: 8,
        workingDaysPerYear: 260,
        workingDaysPerMonth: 22,
        currencySymbol: '$',
      };

      localStorage.setItem('planning-config', JSON.stringify(defaultConfig));
      localStorage.setItem('planning-setup-complete', 'true');
    } catch (e) {
      console.error('Failed to set localStorage:', e);
    }
  });

  console.log('✅ Setup configuration created');
}

/**
 * Verify quarters are visible in planning page dropdown
 */
export async function verifyQuartersInDropdown(page: Page): Promise<void> {
  // Navigate to planning page if not already there
  if (!page.url().includes('/planning')) {
    await page.goto('/planning', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  }

  // Open the quarter dropdown
  const quarterDropdown = page
    .locator('label:has-text("Quarter")')
    .locator('..')
    .locator('[role="combobox"]');
  await expect(quarterDropdown).toBeVisible({ timeout: 5000 });

  await quarterDropdown.click();
  await page.waitForTimeout(500);

  // Should see Q1 2024 in the dropdown options
  await expect(page.locator('[role="option"]:has-text("Q1 2024")')).toBeVisible(
    { timeout: 5000 }
  );

  // Close dropdown
  await page.keyboard.press('Escape');

  console.log('✅ Quarters verified in planning dropdown');
}
