import { defineConfig, devices } from '@playwright/test';

/**
 * High-performance Playwright configuration for E2E tests
 * Optimized for speed and parallel execution
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Keep reduced retries
  workers: process.env.CI ? 2 : 1, // Reduce parallelization for stability
  reporter: process.env.CI ? ['html', 'github'] : [['html', { open: 'never' }]],

  // Balanced timeout optimizations
  timeout: 30000, // Increased for reliability
  expect: {
    timeout: 5000, // Increased assertion timeout
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: process.env.CI ? 'on-first-retry' : 'off', // Reduce trace overhead
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Performance optimizations
    actionTimeout: 8000, // Balanced timeout
    navigationTimeout: 12000, // Increased for reliability

    // Faster page interactions
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
  },

  projects: [
    {
      name: 'chromium-fast',
      use: {
        ...devices['Desktop Chrome'],
        // Disable images and CSS for faster loading
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
    },

    // Optional: Mobile testing (can be disabled for speed)
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  webServer: {
    command: 'npm run dev:e2e',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Increased startup timeout
    stderr: 'ignore', // Reduce log noise
    stdout: 'ignore', // Reduce log noise
  },

  // Global setup for performance optimizations
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
});
