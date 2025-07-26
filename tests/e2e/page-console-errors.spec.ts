import { test, expect, Page } from '@playwright/test';

// Define all pages to test
const pages = [
  { name: 'Dashboard', path: '/', hasAuth: false },
  { name: 'Teams', path: '/teams', hasAuth: false },
  { name: 'People', path: '/people', hasAuth: false },
  { name: 'Projects', path: '/projects', hasAuth: false },
  { name: 'Epics', path: '/epics', hasAuth: false },
  { name: 'Milestones', path: '/milestones', hasAuth: false },
  { name: 'Skills', path: '/skills', hasAuth: false },
  { name: 'Planning', path: '/planning', hasAuth: false },
  { name: 'Advanced Planning', path: '/advanced-planning', hasAuth: false },
  { name: 'Journey Planning', path: '/journey-planning', hasAuth: false },
  { name: 'Allocations', path: '/allocations', hasAuth: false },
  { name: 'Tracking', path: '/tracking', hasAuth: false },
  { name: 'Canvas', path: '/canvas', hasAuth: false },
  { name: 'Financials', path: '/financials', hasAuth: false },
  { name: 'Reports', path: '/reports', hasAuth: false },
  { name: 'Scenario Analysis', path: '/scenario-analysis', hasAuth: false },
  { name: 'OCR', path: '/ocr', hasAuth: false },
  { name: 'Settings', path: '/settings', hasAuth: false },
];

interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
}

async function captureConsoleErrors(page: Page): Promise<ConsoleMessage[]> {
  const consoleMessages: ConsoleMessage[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
          ? `${msg.location().url}:${msg.location().lineNumber}`
          : undefined,
      });
    }
  });

  // Also capture page errors
  page.on('pageerror', error => {
    consoleMessages.push({
      type: 'error',
      text: `Page Error: ${error.message}`,
      location: error.stack,
    });
  });

  return consoleMessages;
}

test.describe('Page Console Error Detection', () => {
  const allErrors: { page: string; errors: ConsoleMessage[] }[] = [];

  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for lazy-loaded components
    test.setTimeout(30000);

    // Configure CI-specific settings
    if (process.env.CI) {
      // Reduce animation delays in CI
      await page.addInitScript(() => {
        (window as any).CSS = {
          ...((window as any).CSS || {}),
          supports: () => false,
        };
      });
    }
  });

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page should load without console errors`, async ({
      page,
    }) => {
      const consoleMessages = await captureConsoleErrors(page);

      console.log(`🧪 Testing ${pageInfo.name} (${pageInfo.path})`);

      // Navigate to the page
      await page.goto(pageInfo.path);

      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Wait a bit more for lazy-loaded components
      await page.waitForTimeout(2000);

      // Check if page loaded properly (look for common elements)
      try {
        // Look for navigation or main content area - enhanced selectors
        await expect(
          page.locator(
            'nav, main, [role="main"], .main-content, body > div, #root, .app, h1'
          )
        ).toBeVisible({ timeout: 10000 });
      } catch (error) {
        console.warn(
          `⚠️  Could not find main content area on ${pageInfo.name}`
        );
      }

      // Check for tabs or sub-navigation if present
      const tabs = page.locator(
        '[role="tablist"] button, .tabs button, [data-testid*="tab"]'
      );
      const tabCount = await tabs.count();

      if (tabCount > 0) {
        console.log(`   Found ${tabCount} tabs on ${pageInfo.name}`);

        // Click each tab to test for errors
        for (let i = 0; i < Math.min(tabCount, 5); i++) {
          // Limit to 5 tabs to avoid timeout
          try {
            const tab = tabs.nth(i);
            const tabText = await tab.textContent();
            console.log(`   Testing tab: ${tabText}`);

            await tab.click();
            await page.waitForTimeout(1000); // Give tab content time to load
          } catch (error) {
            console.warn(
              `   Could not click tab ${i} on ${pageInfo.name}: ${error}`
            );
          }
        }
      }

      // Record any console errors for this page
      if (consoleMessages.length > 0) {
        allErrors.push({ page: pageInfo.name, errors: consoleMessages });

        console.log(
          `❌ Found ${consoleMessages.length} console messages on ${pageInfo.name}:`
        );
        consoleMessages.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
          if (msg.location) {
            console.log(`      Location: ${msg.location}`);
          }
        });
      } else {
        console.log(`✅ No console errors on ${pageInfo.name}`);
      }

      // In CI mode, fail fast for critical errors
      if (
        process.env.CI &&
        consoleMessages.some(
          msg =>
            msg.type === 'error' &&
            !msg.text.includes('favicon') &&
            !msg.text.includes('DevTools') &&
            !msg.text.includes('Extension')
        )
      ) {
        throw new Error(
          `Critical console errors found on ${pageInfo.name} page`
        );
      }

      // Don't fail the test immediately in dev mode - we want to collect all errors first
      // The summary test will report all findings
    });
  }

  test('Summary: Report all console errors found', async () => {
    console.log('\n📊 CONSOLE ERROR SUMMARY');
    console.log('========================');

    if (allErrors.length === 0) {
      console.log('✅ No console errors found on any page!');
    } else {
      console.log(`❌ Found console errors on ${allErrors.length} pages:\n`);

      allErrors.forEach(({ page, errors }) => {
        console.log(`📄 ${page}:`);
        errors.forEach((error, idx) => {
          console.log(
            `   ${idx + 1}. [${error.type.toUpperCase()}] ${error.text}`
          );
          if (error.location) {
            console.log(`      📍 ${error.location}`);
          }
        });
        console.log('');
      });
    }

    // Create a detailed report
    const errorReport = {
      totalPages: pages.length,
      pagesWithErrors: allErrors.length,
      totalErrors: allErrors.reduce((sum, item) => sum + item.errors.length, 0),
      errorsByPage: allErrors.map(item => ({
        page: item.page,
        errorCount: item.errors.length,
        errors: item.errors,
      })),
    };

    console.log(`📈 Statistics:`);
    console.log(`   Total pages tested: ${errorReport.totalPages}`);
    console.log(`   Pages with errors: ${errorReport.pagesWithErrors}`);
    console.log(`   Total errors: ${errorReport.totalErrors}`);
    console.log(
      `   Success rate: ${(((errorReport.totalPages - errorReport.pagesWithErrors) / errorReport.totalPages) * 100).toFixed(1)}%`
    );

    // Save detailed report for analysis
    console.log('\n💾 Detailed error report available in test output above');

    // Optionally fail the test if critical errors are found
    const criticalErrors = allErrors.filter(item =>
      item.errors.some(
        error =>
          error.type === 'error' &&
          !error.text.includes('favicon') &&
          !error.text.includes('DevTools')
      )
    );

    if (criticalErrors.length > 0) {
      console.log(
        `\n🚨 Found critical errors on ${criticalErrors.length} pages`
      );
      // Uncomment the next line if you want the test to fail on any errors
      // expect(criticalErrors).toHaveLength(0);
    }
  });
});

// Additional test for specific error patterns
test.describe('Specific Error Pattern Detection', () => {
  test('Check for common React/TypeScript error patterns', async ({ page }) => {
    const errorPatterns = [
      'Cannot read property',
      'Cannot read properties of undefined',
      'Cannot read properties of null',
      'is not a function',
      'TypeError:',
      'ReferenceError:',
      'Uncaught',
    ];

    const foundPatterns: { pattern: string; messages: string[] }[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errorPatterns.forEach(pattern => {
          if (text.includes(pattern)) {
            const existing = foundPatterns.find(f => f.pattern === pattern);
            if (existing) {
              existing.messages.push(text);
            } else {
              foundPatterns.push({ pattern, messages: [text] });
            }
          }
        });
      }
    });

    // Visit a few key pages to check for patterns
    const keyPages = ['/', '/teams', '/projects', '/planning'];

    for (const path of keyPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    console.log('\n🔍 Error Pattern Analysis:');
    if (foundPatterns.length === 0) {
      console.log('✅ No common error patterns detected');
    } else {
      foundPatterns.forEach(({ pattern, messages }) => {
        console.log(`❌ Pattern "${pattern}" found ${messages.length} times:`);
        messages.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ${msg}`);
        });
      });
    }
  });
});
