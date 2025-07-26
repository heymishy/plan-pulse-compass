import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel execution to fix EPIPE errors
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduce retries for faster feedback
  workers: process.env.CI ? 1 : 1, // Use single worker to prevent race conditions
  reporter: process.env.CI
    ? [['html'], ['github']]
    : [
        ['html', { open: 'never' }],
        ['list', { printSteps: false }],
      ], // Reduced output to prevent EPIPE
  timeout: 60000, // Increased timeout for comprehensive tests
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // Increased for reliability
    navigationTimeout: 20000, // Increased for complex page loads
    expect: {
      timeout: 10000, // Increased assertion timeout
    },
    // Additional browser args for stability
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-background-timer-throttling',
        '--force-color-profile=srgb',
        '--disable-logging',
        '--silent',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev:e2e',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stderr: 'ignore', // Reduce log noise that causes EPIPE
    stdout: 'ignore', // Reduce log noise that causes EPIPE
  },
});
