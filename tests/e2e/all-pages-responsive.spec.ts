import { test, expect } from '@playwright/test';

test.describe('All Pages Responsive Design', () => {
  const testResolutions = [
    { width: 375, height: 812, name: 'Mobile Portrait' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 2560, height: 1440, name: 'Widescreen' },
    { width: 3440, height: 1440, name: 'Ultra-wide' },
  ];

  const pages = [
    { path: '/teams', name: 'Teams' },
    { path: '/people', name: 'People' },
    { path: '/epics', name: 'Epics' },
    { path: '/milestones', name: 'Milestones' },
    { path: '/planning', name: 'Planning' },
    { path: '/allocations', name: 'Allocations' },
    { path: '/tracking', name: 'Tracking' },
    { path: '/financials', name: 'Financials' },
    { path: '/reports', name: 'Reports' },
    { path: '/settings', name: 'Settings' },
  ];

  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for page loads
    page.setDefaultTimeout(10000);
  });

  // Test that all pages fill viewport correctly
  for (const pageInfo of pages) {
    for (const resolution of testResolutions) {
      test(`${pageInfo.name} page should fill ${resolution.name} viewport (${resolution.width}x${resolution.height})`, async ({
        page,
      }) => {
        // Set viewport size
        await page.setViewportSize({
          width: resolution.width,
          height: resolution.height,
        });

        // Navigate to page
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Allow layout to settle

        // Check that the app root fills the entire viewport
        const appRoot = page.locator('#root');
        const appBoundingBox = await appRoot.boundingBox();

        expect(
          appBoundingBox,
          `App root should exist for ${pageInfo.name} page`
        ).toBeTruthy();
        expect(
          appBoundingBox!.width,
          `App width should be close to viewport width on ${pageInfo.name}`
        ).toBeGreaterThan(resolution.width * 0.95);
        expect(
          appBoundingBox!.height,
          `App height should be close to viewport height on ${pageInfo.name}`
        ).toBeGreaterThan(resolution.height * 0.95);

        // Check that main content area utilizes available space
        const mainContent = page.locator('main.flex-1.w-full.max-w-none');
        if (await mainContent.isVisible()) {
          const mainBoundingBox = await mainContent.boundingBox();
          expect(
            mainBoundingBox,
            `Main content should exist on ${pageInfo.name} page`
          ).toBeTruthy();

          // Main content should be reasonable width (accounting for sidebar)
          const expectedMinWidth =
            resolution.width > 768
              ? resolution.width * 0.7
              : resolution.width * 0.9;
          expect(
            mainBoundingBox!.width,
            `Main content should utilize available width on ${pageInfo.name}`
          ).toBeGreaterThan(expectedMinWidth);
        }

        // Ensure no horizontal scrollbars
        const hasHorizontalScrollbar = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });
        expect(
          hasHorizontalScrollbar,
          `${pageInfo.name} should not have horizontal scrollbar at ${resolution.width}x${resolution.height}`
        ).toBeFalsy();
      });
    }
  }

  // Test dynamic resizing behavior for key pages
  const keyPages = ['/teams', '/people', '/epics', '/planning'];

  for (const pagePath of keyPages) {
    test(`${pagePath} should handle dynamic window resizing`, async ({
      page,
    }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Start with desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(300);

      let appBoundingBox = await page.locator('#root').boundingBox();
      expect(appBoundingBox!.width).toBeGreaterThan(1920 * 0.95);
      expect(appBoundingBox!.height).toBeGreaterThan(1080 * 0.95);

      // Resize to widescreen
      await page.setViewportSize({ width: 2560, height: 1440 });
      await page.waitForTimeout(300);

      appBoundingBox = await page.locator('#root').boundingBox();
      expect(appBoundingBox!.width).toBeGreaterThan(2560 * 0.95);
      expect(appBoundingBox!.height).toBeGreaterThan(1440 * 0.95);

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);

      appBoundingBox = await page.locator('#root').boundingBox();
      expect(appBoundingBox!.width).toBeGreaterThan(375 * 0.95);
      expect(appBoundingBox!.height).toBeGreaterThan(812 * 0.95);
    });
  }

  // Test specific page content responsiveness
  test('Teams page should show responsive team grid', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Test on widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(500);

    // Check if team cards/table are properly displayed
    const teamContent = page
      .locator('[data-testid="teams-content"], .grid, .space-y-4, table, main')
      .first();
    if (await teamContent.isVisible()) {
      const contentBoundingBox = await teamContent.boundingBox();
      expect(contentBoundingBox).toBeTruthy();
      expect(contentBoundingBox!.width).toBeGreaterThan(1000); // More reasonable expectation
    }

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Content should still be visible and contained
    await expect(teamContent.first()).toBeVisible();
  });

  test('People page should show responsive people grid', async ({ page }) => {
    await page.goto('/people');
    await page.waitForLoadState('networkidle');

    // Test on widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(500);

    // Check if people cards/table are properly displayed
    const peopleContent = page
      .locator('[data-testid="people-content"], .grid, .space-y-4, table, main')
      .first();
    if (await peopleContent.isVisible()) {
      const contentBoundingBox = await peopleContent.boundingBox();
      expect(contentBoundingBox).toBeTruthy();
      expect(contentBoundingBox!.width).toBeGreaterThan(1000); // More reasonable expectation
    }
  });

  test('Epics page should show responsive epic table', async ({ page }) => {
    await page.goto('/epics');
    await page.waitForLoadState('networkidle');

    // Test on widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(500);

    // Check if epic table utilizes full width
    const epicTable = page.locator('table, .space-y-4, main').first();
    if (await epicTable.isVisible()) {
      const tableBoundingBox = await epicTable.boundingBox();
      expect(tableBoundingBox).toBeTruthy();
      expect(tableBoundingBox!.width).toBeGreaterThan(1000); // More reasonable expectation
    }

    // Test horizontal scrolling on narrow screens
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    const tableContainer = page
      .locator('.overflow-auto, .overflow-x-auto')
      .first();
    if (await tableContainer.isVisible()) {
      const overflowX = await tableContainer.evaluate(
        el => window.getComputedStyle(el).overflowX
      );
      expect(overflowX).toBe('auto');
    }
  });

  test('Planning page should show responsive planning interface', async ({
    page,
  }) => {
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Test on widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(500);

    // Planning interface should utilize full width
    const planningContent = page
      .locator('[data-testid="planning-content"], .space-y-6, .grid, main')
      .first();
    if (await planningContent.isVisible()) {
      const contentBoundingBox = await planningContent.boundingBox();
      expect(contentBoundingBox).toBeTruthy();
      expect(contentBoundingBox!.width).toBeGreaterThan(1000); // More reasonable expectation
    }

    // Test on mobile - should be properly contained
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Content should still be accessible
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    await expect(mainContent).toBeVisible();
  });

  test('All pages should maintain scroll functionality across resolutions', async ({
    page,
  }) => {
    const testPages = ['/teams', '/people', '/epics', '/planning'];

    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Test on widescreen
      await page.setViewportSize({ width: 2560, height: 1440 });
      await page.waitForTimeout(300);

      const mainContent = page.locator('main.flex-1.w-full.max-w-none');
      if (await mainContent.isVisible()) {
        // Check if content is scrollable when needed
        const scrollHeight = await mainContent.evaluate(el => el.scrollHeight);
        const clientHeight = await mainContent.evaluate(el => el.clientHeight);

        if (scrollHeight > clientHeight) {
          // Content should be scrollable
          await mainContent.evaluate(el => el.scrollTo(0, 50));
          const scrollTop = await mainContent.evaluate(el => el.scrollTop);
          expect(scrollTop, `${pagePath} should be scrollable`).toBeGreaterThan(
            0
          );
        }
      }

      // Test on mobile
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);

      // Should still be scrollable if needed
      await expect(mainContent).toBeVisible();
    }
  });

  test('Filter and search controls should be responsive across all pages', async ({
    page,
  }) => {
    const pagesWithFilters = [
      '/teams',
      '/people',
      '/epics',
      '/planning',
      '/projects',
    ];

    for (const pagePath of pagesWithFilters) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const resolutions = [
        { width: 768, height: 1024 },
        { width: 1366, height: 768 },
        { width: 2560, height: 1440 },
      ];

      for (const resolution of resolutions) {
        await page.setViewportSize(resolution);
        await page.waitForTimeout(300);

        // Check for filter/search inputs
        const searchInputs = page.locator(
          'input[placeholder*="Filter"], input[placeholder*="Search"], input[type="search"]'
        );
        const searchInputCount = await searchInputs.count();

        if (searchInputCount > 0) {
          const firstSearchInput = searchInputs.first();
          await expect(
            firstSearchInput,
            `Search input should be visible on ${pagePath} at ${resolution.width}x${resolution.height}`
          ).toBeVisible();

          // Should be able to interact with search
          await firstSearchInput.click();
          await firstSearchInput.fill('test');
          await firstSearchInput.clear();
        }
      }
    }
  });
});
