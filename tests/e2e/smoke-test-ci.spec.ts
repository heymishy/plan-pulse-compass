import { test, expect } from '@playwright/test';

// Ultra-minimal smoke test for free GitHub Actions plan
test.describe('Smoke Test - CI', () => {
  test.setTimeout(10000); // Ultra-aggressive timeout for free tier

  test('application loads successfully', async ({ page }) => {
    // Navigate with minimal resources - don't wait for everything to load
    await page.goto('/', { waitUntil: 'commit', timeout: 8000 });

    // Just check that we got a response - no complex DOM waiting
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Log success and exit quickly
    console.log('✅ Basic smoke test passed');
  });
});
