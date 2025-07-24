import { defineConfig, devices } from '@playwright/test';

/**
 * High-performance Playwright configuration for E2E tests
 * Optimized for speed and parallel execution
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for faster feedback
  workers: process.env.CI ? 4 : '75%', // Aggressive parallelization
  reporter: process.env.CI ? ['html', 'github'] : [['html', { open: 'never' }]],

  // Aggressive timeout optimizations
  timeout: 20000, // Reduced from 30s to 20s
  expect: {
    timeout: 3000, // Reduced assertion timeout
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: process.env.CI ? 'on-first-retry' : 'off', // Reduce trace overhead
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Performance optimizations
    actionTimeout: 3000, // Reduced from 5s
    navigationTimeout: 8000, // Reduced from 10s

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
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000, // Reduced startup timeout
    stderr: 'pipe',
    stdout: 'ignore', // Reduce log noise
  },

  // Global setup for performance optimizations
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
});
