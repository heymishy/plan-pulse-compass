import { test, expect } from '@playwright/test';

// Optimized responsive design tests - reduced from 60+ to 12 test combinations
test.describe('Responsive Design - Optimized Critical Tests', () => {
  // Critical resolutions only (3 instead of 6)
  const criticalResolutions = [
    { width: 375, height: 812, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1200, height: 800, name: 'Desktop' },
  ];

  // Critical pages only (4 instead of 10)
  const criticalPages = [
    { path: '/', name: 'Dashboard' },
    { path: '/projects', name: 'Projects' },
    { path: '/teams', name: 'Teams' },
    { path: '/planning', name: 'Planning' },
  ];

  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for page loads
    page.setDefaultTimeout(10000);
  });

  // Core responsive test: 4 pages × 3 resolutions = 12 tests (was 60+ tests)
  for (const pageInfo of criticalPages) {
    for (const resolution of criticalResolutions) {
      test(`${pageInfo.name} responsive at ${resolution.name} (${resolution.width}x${resolution.height})`, async ({
        page,
      }) => {
        console.log(`🔍 Testing ${pageInfo.name} at ${resolution.name}...`);

        await page.setViewportSize({
          width: resolution.width,
          height: resolution.height,
        });

        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Verify app root fills viewport
        const appRoot = page.locator('#root');
        const appBoundingBox = await appRoot.boundingBox();

        expect(
          appBoundingBox,
          `App root should exist for ${pageInfo.name}`
        ).toBeTruthy();
        expect(
          appBoundingBox!.width,
          `App width should fill viewport`
        ).toBeGreaterThan(resolution.width * 0.95);
        expect(
          appBoundingBox!.height,
          `App height should fill viewport`
        ).toBeGreaterThan(resolution.height * 0.95);

        // Verify main content utilizes space appropriately
        const mainContent = page
          .locator('main[data-testid="app-loaded"], main.flex-1, main')
          .first();
        if (await mainContent.isVisible()) {
          const mainBoundingBox = await mainContent.boundingBox();
          expect(mainBoundingBox, `Main content should exist`).toBeTruthy();

          const expectedMinWidth =
            resolution.width > 768
              ? resolution.width * 0.7
              : resolution.width * 0.9;
          expect(
            mainBoundingBox!.width,
            `Main content width should be appropriate`
          ).toBeGreaterThan(expectedMinWidth);
        }

        // Ensure no unwanted horizontal scrolling
        const hasHorizontalScrollbar = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });
        expect(
          hasHorizontalScrollbar,
          `No horizontal scrollbar should appear`
        ).toBeFalsy();

        console.log(
          `✅ ${pageInfo.name} responsive test passed at ${resolution.name}`
        );
      });
    }
  }

  // Additional focused tests for key functionality
  test('Dynamic viewport resizing should work correctly', async ({ page }) => {
    console.log('🔄 Testing dynamic viewport resizing...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Test resize sequence: Desktop → Mobile → Tablet
    const resizeSequence = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 375, height: 812, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
    ];

    for (const resolution of resizeSequence) {
      await page.setViewportSize(resolution);
      await page.waitForTimeout(300);

      const appBoundingBox = await page.locator('#root').boundingBox();
      expect(
        appBoundingBox!.width,
        `App should adapt to ${resolution.name}`
      ).toBeGreaterThan(resolution.width * 0.95);
      expect(
        appBoundingBox!.height,
        `App should adapt to ${resolution.name}`
      ).toBeGreaterThan(resolution.height * 0.95);
    }

    console.log('✅ Dynamic viewport resizing test passed');
  });

  test('Search and filter controls should remain accessible on all resolutions', async ({
    page,
  }) => {
    console.log('🔍 Testing search/filter accessibility across resolutions...');

    const pagesWithFilters = ['/teams', '/projects', '/planning'];

    for (const pagePath of pagesWithFilters) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      for (const resolution of criticalResolutions) {
        await page.setViewportSize(resolution);
        await page.waitForTimeout(300);

        // Check for search/filter controls
        const searchInputs = page.locator(
          'input[placeholder*="Filter"], input[placeholder*="Search"], input[type="search"]'
        );
        const searchCount = await searchInputs.count();

        if (searchCount > 0) {
          const searchInput = searchInputs.first();
          await expect(
            searchInput,
            `Search should be visible on ${pagePath} at ${resolution.name}`
          ).toBeVisible();

          // Test basic interaction
          await searchInput.click();
          await searchInput.fill('test');
          await searchInput.clear();
        }
      }
    }

    console.log('✅ Search/filter accessibility test passed');
  });
});
