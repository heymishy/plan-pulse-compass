import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Pre-warms browser and performs common setup operations
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Pre-warm browser instance
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
    ],
  });

  const context = await browser.newContext({
    // Pre-configure context for better performance
    viewport: { width: 1280, height: 720 },
    reducedMotion: 'reduce',
    // Enable images for proper UI testing
  });

  const page = await context.newPage();

  try {
    // Pre-warm the application
    console.log(`🔥 Pre-warming application at ${baseURL}`);
    await page.goto(baseURL!, {
      waitUntil: 'domcontentloaded', // Faster than 'load'
      timeout: 30000,
    });

    // Wait for critical resources to load - use more generic selector
    await page.waitForSelector('body', {
      timeout: 15000,
      state: 'attached',
    });

    // Additional wait for React to initialize
    await page.waitForTimeout(2000);

    console.log('✅ Application pre-warmed successfully');
  } catch (error) {
    console.log(`⚠️  Pre-warming failed: ${error}`);
    // Don't fail setup if pre-warming fails
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
