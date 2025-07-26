import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel execution to fix EPIPE errors
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduce retries for faster feedback
  workers: process.env.CI ? 1 : 1, // Use single worker to prevent race conditions
  reporter: process.env.CI
    ? [['html'], ['github']]
    : [['html', { open: 'never' }]],
  timeout: 45000, // Increased timeout for stability
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // Increased for reliability
    navigationTimeout: 15000, // Increased for complex page loads
    expect: {
      timeout: 8000, // Increased assertion timeout
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
