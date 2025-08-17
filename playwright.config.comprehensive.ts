import { defineConfig, devices } from '@playwright/test';

// Auto-generated Playwright configuration for comprehensive tests
// Do not edit manually - regenerate using npm run generate:ci

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 10000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: true,
  },
});
