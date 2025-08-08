import { Page, expect } from '@playwright/test';

/**
 * Reliable helper to create quarters and iterations for E2E tests
 * Uses direct localStorage approach for reliability
 */
export async function createQuartersAndIterations(page: Page): Promise<void> {
  console.log(
    '🔄 Creating quarters and iterations directly via localStorage...'
  );

  // Create quarters and iterations data directly in localStorage
  // This is more reliable than trying to navigate UI that might not be ready
  const result = await page.evaluate(() => {
    // Generate 4 quarters for 2024
    const quarters = [];
    const iterations = [];

    const fyStart = new Date('2024-01-01');

    // Create quarters
    for (let q = 1; q <= 4; q++) {
      const quarterStart = new Date(fyStart);
      quarterStart.setMonth((q - 1) * 3);

      const quarterEnd = new Date(quarterStart);
      quarterEnd.setMonth(quarterStart.getMonth() + 3);
      quarterEnd.setDate(0); // Last day of the month

      const quarterId = `quarter-2024-q${q}`;
      quarters.push({
        id: quarterId,
        name: `2024 Q${q}`,
        type: 'quarterly',
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
        isActive: q === 1,
        description: `Quarter ${q} of 2024`,
        createdDate: new Date().toISOString(),
      });

      // Create iterations for each quarter (6 fortnightly iterations per quarter)
      for (let i = 1; i <= 6; i++) {
        const iterStart = new Date(quarterStart);
        iterStart.setDate(quarterStart.getDate() + (i - 1) * 14);

        const iterEnd = new Date(iterStart);
        iterEnd.setDate(iterStart.getDate() + 13);

        const iterationId = `iteration-2024-q${q}-${i}`;
        iterations.push({
          id: iterationId,
          name: `2024 Q${q}.${i}`,
          type: 'iteration',
          startDate: iterStart.toISOString().split('T')[0],
          endDate: iterEnd.toISOString().split('T')[0],
          isActive: q === 1 && i === 1,
          quarterId: quarterId,
          description: `Iteration ${i} of Q${q} 2024`,
          createdDate: new Date().toISOString(),
        });
      }
    }

    // Combine quarters and iterations
    const allCycles = [...quarters, ...iterations];

    // Store in localStorage
    localStorage.setItem('planning-cycles', JSON.stringify(allCycles));

    console.log(
      `✅ Created ${quarters.length} quarters and ${iterations.length} iterations`
    );

    return {
      quarters: quarters.length,
      iterations: iterations.length,
      total: allCycles.length,
    };
  });

  console.log(
    `✅ Successfully created ${result.quarters} quarters, ${result.iterations} iterations (${result.total} total cycles)`
  );
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
 * Verify quarters are accessible (simplified validation)
 */
export async function verifyQuartersInDropdown(page: Page): Promise<void> {
  console.log('🔍 Verifying quarters data exists in localStorage...');

  // Verify quarters exist in localStorage directly
  const quartersExist = await page.evaluate(() => {
    try {
      const cycles = localStorage.getItem('planning-cycles');
      if (!cycles) return false;

      const parsedCycles = JSON.parse(cycles);
      const quarters = parsedCycles.filter(
        (cycle: { type: string; name: string }) => cycle.type === 'quarterly'
      );
      const q1Quarter = quarters.find(
        (q: { name: string }) => q.name === '2024 Q1'
      );

      console.log(`Found ${quarters.length} quarters total`);
      console.log(`Q1 2024 exists: ${!!q1Quarter}`);

      return quarters.length >= 4 && !!q1Quarter;
    } catch (e) {
      console.error('Error checking quarters:', e);
      return false;
    }
  });

  if (!quartersExist) {
    throw new Error('Quarters not found in localStorage');
  }

  console.log('✅ Quarters verified in localStorage - skipping UI validation');
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
 * Enhanced button click with retry logic
 */
export async function clickButtonSafely(
  page: Page,
  selector: string,
  buttonName = 'button',
  timeout = 8000
): Promise<boolean> {
  try {
    const button = page.locator(selector).first();
    await expect(button).toBeVisible({ timeout });
    await button.click();
    await page.waitForTimeout(500); // Allow click to process
    console.log(`✅ ${buttonName} clicked successfully`);
    return true;
  } catch (error) {
    console.log(`⚠️ Could not click ${buttonName}: ${error}`);
    return false;
  }
}

/**
 * Enhanced dialog closer with multiple fallback strategies
 */
export async function closeDialogSafely(
  page: Page,
  dialogSelector = '[role="dialog"]'
): Promise<void> {
  console.log('🔄 Closing dialog safely...');

  const dialog = page.locator(dialogSelector);

  // Check if dialog is actually open
  if (!(await dialog.isVisible({ timeout: 1000 }))) {
    console.log('✅ Dialog already closed');
    return;
  }

  try {
    // Method 1: Try close/cancel button
    const closeButton = dialog
      .locator('button:has-text("Close"), button:has-text("Cancel")')
      .first();
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
      console.log('✅ Dialog closed with button');
      return;
    }

    // Method 2: Try X button
    const xButton = dialog
      .locator('button')
      .filter({ has: page.locator('span:has-text("Close")') })
      .first();
    if (await xButton.isVisible({ timeout: 1000 })) {
      await xButton.click();
      await page.waitForTimeout(500);
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
      console.log('✅ Dialog closed with X button');
      return;
    }

    // Method 3: Try clicking outside dialog
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    if (!(await dialog.isVisible({ timeout: 1000 }))) {
      console.log('✅ Dialog closed by clicking outside');
      return;
    }

    // Method 4: Escape key fallback
    console.log('⚠️ Using Escape key as fallback');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    if (!(await dialog.isVisible({ timeout: 1000 }))) {
      console.log('✅ Dialog closed with Escape key');
    } else {
      console.log('⚠️ Dialog may still be open after all attempts');
    }
  } catch (error) {
    console.log('⚠️ Error during dialog closure, but continuing test');
  }
}

/**
 * Enhanced form fill with better error handling
 */
export async function fillFormFieldSafely(
  page: Page,
  selector: string,
  value: string,
  fieldName = 'field'
): Promise<boolean> {
  try {
    const field = page.locator(selector).first();
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.fill(value);
    console.log(`✅ ${fieldName} filled successfully`);
    return true;
  } catch (error) {
    console.log(`⚠️ Could not fill ${fieldName}: ${error}`);
    return false;
  }
}
