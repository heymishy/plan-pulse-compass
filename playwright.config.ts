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
  timeout: process.env.CI ? 15000 : 45000, // Aggressive timeout for CI memory constraints
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: process.env.CI ? 'off' : 'retain-on-failure', // Disable trace in CI to save memory
    screenshot: process.env.CI ? 'off' : 'only-on-failure', // Disable screenshots in CI
    video: process.env.CI ? 'off' : 'retain-on-failure', // Disable video in CI
    actionTimeout: process.env.CI ? 5000 : 12000, // Aggressive reduction for CI
    navigationTimeout: process.env.CI ? 8000 : 15000, // Aggressive reduction for CI
    expect: {
      timeout: process.env.CI ? 3000 : 10000, // Aggressive reduction for CI
    },
    // Memory-optimized browser args for CI
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
        // Additional memory optimization for CI
        ...(process.env.CI
          ? [
              '--memory-pressure-off',
              '--disable-background-networking',
              '--disable-default-apps',
              '--disable-extensions',
              '--disable-sync',
              '--disable-translate',
              '--hide-scrollbars',
              '--mute-audio',
              '--no-first-run',
              '--disable-gpu',
              '--disable-gpu-sandbox',
              '--single-process', // Use single process to reduce memory
              '--max_old_space_size=512', // Limit Node.js memory usage
              '--disable-features=VizDisplayCompositor', // Reduce memory usage
            ]
          : []),
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
