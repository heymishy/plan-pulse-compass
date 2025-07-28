import { test, expect } from '@playwright/test';

// Minimal smoke test for CI to ensure basic functionality
test.describe('Smoke Test - CI', () => {
  test.setTimeout(15000); // Reduced timeout for memory efficiency

  test('application loads successfully', async ({ page }) => {
    // Navigate to the application with minimal waiting
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Wait for basic HTML structure only
    await page.waitForSelector('body', { timeout: 5000 });

    // Minimal check that page loaded
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Success - keep it minimal for CI memory constraints
    console.log('✅ Basic smoke test passed');
  });
});
