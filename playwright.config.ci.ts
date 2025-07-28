import { defineConfig, devices } from '@playwright/test';

// Ultra-lightweight CI configuration to prevent memory issues and EPIPE errors
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0, // No retries to save time and memory
  workers: 1, // Single worker only
  reporter: [['github']], // Minimal reporting to prevent EPIPE
  timeout: 15000, // Aggressive timeout for CI memory constraints
  globalTimeout: 300000, // 5 minute global timeout
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'off', // No trace collection
    screenshot: 'off', // No screenshots
    video: 'off', // No video recording
    actionTimeout: 8000,
    navigationTimeout: 10000,
    expect: {
      timeout: 5000,
    },
    // Ultra-minimal browser args for CI memory constraints
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=TranslateUI,VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-background-timer-throttling',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--disable-logging',
        '--silent',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--disable-gpu',
        '--disable-gpu-sandbox',
        '--max_old_space_size=256', // Minimal memory to prevent OOM
        '--memory-pressure-off',
        '--single-process', // Use single process for maximum memory efficiency
        '--no-zygote', // Disable zygote process forking
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
    reuseExistingServer: !process.env.CI, // Reuse existing server in development, fresh in CI
    timeout: 120000, // Allow more time for server startup
    stderr: 'ignore', // Silence all output to prevent EPIPE
    stdout: 'ignore',
  },
});
