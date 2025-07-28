import { defineConfig, devices } from '@playwright/test';

// Ultra-lightweight CI configuration to prevent memory issues and EPIPE errors
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0, // No retries to save time and memory
  workers: 1, // Single worker only
  reporter: [['github']], // Minimal reporting to prevent EPIPE
  timeout: 10000, // Ultra-aggressive timeout for free GitHub plan
  globalTimeout: 180000, // 3 minute global timeout for free tier
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'off', // No trace collection
    screenshot: 'off', // No screenshots
    video: 'off', // No video recording
    actionTimeout: 5000,
    navigationTimeout: 8000,
    expect: {
      timeout: 3000,
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
        '--max_old_space_size=128', // Ultra-minimal memory for free GitHub plan
        '--memory-pressure-off',
        '--single-process', // Use single process for maximum memory efficiency
        '--no-zygote', // Disable zygote process forking
        '--disable-background-mode',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess,VizDisplayCompositor',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-crash-upload',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-field-trial-config',
        '--disable-shared-workers',
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
    timeout: 60000, // Reduced timeout for free GitHub plan
    stderr: 'ignore', // Silence all output to prevent EPIPE
    stdout: 'ignore',
    env: {
      NODE_OPTIONS: '--max-old-space-size=512', // Limit dev server memory
    },
  },
});
