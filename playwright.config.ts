import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true, // Enable parallel execution for better performance
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : '50%', // Use more workers for parallel execution
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  timeout: 30000, // Reduced from 60s to 30s for faster feedback
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: process.env.CI ? 'only-on-failure' : 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'retain-on-failure',
    actionTimeout: 5000, // Reduced to 5s for faster failure feedback
    navigationTimeout: 10000, // 10s for page navigation
    expect: {
      timeout: 5000, // 5s for assertions
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stderr: 'pipe',
    stdout: 'pipe',
  },
});
