import { Page, expect } from '@playwright/test';

/**
 * Performance utilities for E2E tests
 * Provides optimized waiting and interaction patterns
 */

/**
 * Fast navigation with performance monitoring
 */
export async function navigateWithPerformance(page: Page, url: string) {
  const startTime = Date.now();

  await page.goto(url, {
    waitUntil: 'domcontentloaded', // Faster than 'load'
    timeout: 15000,
  });

  // Wait for app to be interactive
  await page.waitForSelector('[data-testid="app"]', {
    state: 'attached',
    timeout: 5000,
  });

  const endTime = Date.now();
  const loadTime = endTime - startTime;

  // Performance assertion - fail if too slow
  expect(loadTime).toBeLessThan(10000); // 10s max

  return loadTime;
}

/**
 * Fast form filling with batch operations
 */
export async function fillFormFast(
  page: Page,
  formData: Record<string, string>
) {
  const promises = Object.entries(formData).map(async ([selector, value]) => {
    await page.fill(selector, value);
  });

  await Promise.all(promises);
}

/**
 * Optimized waiting for multiple elements
 */
export async function waitForElements(
  page: Page,
  selectors: string[],
  timeout = 5000
) {
  const promises = selectors.map(selector =>
    page.waitForSelector(selector, {
      state: 'visible',
      timeout,
    })
  );

  await Promise.all(promises);
}

/**
 * Fast table data verification
 */
export async function verifyTableData(
  page: Page,
  tableSelector: string,
  expectedRows: number
) {
  // Wait for table to load
  await page.waitForSelector(tableSelector, { timeout: 5000 });

  // Count rows efficiently
  const rowCount = await page.locator(`${tableSelector} tbody tr`).count();
  expect(rowCount).toBe(expectedRows);

  return rowCount;
}

/**
 * Batch click operations
 */
export async function clickSequence(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    await page.click(selector, { timeout: 3000 });
    // Small delay to allow UI to update
    await page.waitForTimeout(100);
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private startTime: number;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.startTime = Date.now();
  }

  start() {
    this.startTime = Date.now();
  }

  async measure(action: string) {
    const duration = Date.now() - this.startTime;
    console.log(`⏱️  ${action}: ${duration}ms`);

    // Fail test if action takes too long
    expect(duration).toBeLessThan(30000); // 30s max for any action

    return duration;
  }

  async measurePageLoad() {
    const [loadTime] = await Promise.all([
      this.page.evaluate(() => {
        return (
          window.performance.timing.loadEventEnd -
          window.performance.timing.navigationStart
        );
      }),
    ]);

    console.log(`📄 Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5s max page load

    return loadTime;
  }
}

/**
 * Optimized test data setup
 */
export async function setupTestData(
  page: Page,
  dataType: 'minimal' | 'full' = 'minimal'
) {
  const monitor = new PerformanceMonitor(page);

  // Navigate to setup page
  await navigateWithPerformance(page, '/setup');

  if (dataType === 'minimal') {
    // Create minimal test data for faster tests
    await page.click('[data-testid="quick-setup"]');
    await page.waitForSelector('[data-testid="setup-complete"]', {
      timeout: 10000,
    });
  } else {
    // Full setup for comprehensive tests
    await page.click('[data-testid="full-setup"]');
    await page.waitForSelector('[data-testid="setup-complete"]', {
      timeout: 30000,
    });
  }

  await monitor.measure('Test data setup');
}

/**
 * Clean test data efficiently
 */
export async function cleanupTestData(page: Page) {
  try {
    // Navigate to cleanup endpoint if available
    await page.goto('/test-cleanup', {
      waitUntil: 'domcontentloaded',
      timeout: 5000,
    });
  } catch {
    // Fallback: clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}
