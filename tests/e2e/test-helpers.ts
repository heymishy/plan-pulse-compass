import { Page, expect } from '@playwright/test';

/**
 * Reliable helper to create quarters and iterations for E2E tests
 */
export async function createQuartersAndIterations(page: Page): Promise<void> {
  console.log('🔄 Creating quarters and iterations...');

  // Navigate to planning page
  await page.goto('/planning');
  await page.waitForLoadState('networkidle');

  // Open cycle management dialog
  await page.click('button:has-text("Manage Cycles")');
  await page.waitForTimeout(1000);

  // Generate quarters if they don't exist
  const quarterButton = page.locator(
    'button:has-text("Generate Standard Quarters")'
  );
  if (await quarterButton.isVisible()) {
    await quarterButton.click();
    await page.waitForTimeout(2000);

    // Verify quarters were created
    await expect(
      page.locator('div.font-medium:has-text("Q1 2024")')
    ).toBeVisible({ timeout: 5000 });
    console.log('✅ Quarters created successfully');
  } else {
    console.log('ℹ️ Quarters already exist');
  }

  // Generate iterations for Q1
  const q1Row = page.locator('div:has(div.font-medium:text("Q1 2024"))');
  await expect(q1Row).toBeVisible({ timeout: 5000 });

  const generateButton = q1Row.locator(
    'button:has-text("Generate Iterations")'
  );
  if (await generateButton.isVisible()) {
    await generateButton.click();
    await page.waitForTimeout(1500);
    console.log('✅ Q1 iterations created successfully');
  } else {
    console.log('ℹ️ Q1 iterations already exist');
  }

  // Close cycle management dialog
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('✅ Quarter and iteration setup completed');
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
 * Verify quarters are visible in planning page dropdown
 */
export async function verifyQuartersInDropdown(page: Page): Promise<void> {
  // Navigate to planning page if not already there
  if (!page.url().includes('/planning')) {
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');
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
