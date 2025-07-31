import { test, expect } from '@playwright/test';

test.describe('Responsive Design - Dynamic Window Sizing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page for testing
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should stretch to fill widescreen resolution (2560x1440)', async ({
    page,
  }) => {
    // Set viewport to widescreen resolution
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(500); // Allow layout to adjust

    // Check that the app fills the entire viewport
    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(2560, 10);
    expect(appBoundingBox!.height).toBeCloseTo(1440, 10);

    // Check that main content area utilizes full width (use the inner main element)
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    const mainBoundingBox = await mainContent.boundingBox();

    expect(mainBoundingBox).toBeTruthy();
    // Should be close to full width minus sidebar width (~250px)
    expect(mainBoundingBox!.width).toBeGreaterThan(2200);

    // Verify table stretches across available width
    const projectTable = page
      .locator('[data-testid="project-table"], .space-y-4')
      .first();
    if (await projectTable.isVisible()) {
      const tableBoundingBox = await projectTable.boundingBox();
      expect(tableBoundingBox).toBeTruthy();
      expect(tableBoundingBox!.width).toBeGreaterThan(2000);
    }
  });

  test('should adapt to ultra-wide resolution (3440x1440)', async ({
    page,
  }) => {
    // Set viewport to ultra-wide resolution
    await page.setViewportSize({ width: 3440, height: 1440 });
    await page.waitForTimeout(500);

    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(3440, 10);
    expect(appBoundingBox!.height).toBeCloseTo(1440, 10);

    // Main content should utilize the full ultra-wide space
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    const mainBoundingBox = await mainContent.boundingBox();
    expect(mainBoundingBox!.width).toBeGreaterThan(3100);
  });

  test('should work on standard desktop resolution (1920x1080)', async ({
    page,
  }) => {
    // Set viewport to standard desktop resolution
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(1920, 10);
    expect(appBoundingBox!.height).toBeCloseTo(1080, 10);

    // Content should fill available space appropriately
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    const mainBoundingBox = await mainContent.boundingBox();
    expect(mainBoundingBox!.width).toBeGreaterThan(1600);
  });

  test('should handle laptop resolution (1366x768)', async ({ page }) => {
    // Set viewport to laptop resolution
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(500);

    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(1366, 10);
    expect(appBoundingBox!.height).toBeCloseTo(768, 10);

    // Ensure content is properly contained and scrollable
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    const mainBoundingBox = await mainContent.boundingBox();
    expect(mainBoundingBox!.width).toBeGreaterThan(1000);
    expect(mainBoundingBox!.width).toBeLessThan(1366);
  });

  test('should maintain responsive behavior on tablet (768x1024)', async ({
    page,
  }) => {
    // Set viewport to tablet resolution
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(768, 10);
    expect(appBoundingBox!.height).toBeCloseTo(1024, 10);

    // Should handle narrower width gracefully
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    await expect(mainContent).toBeVisible();
  });

  test('should handle mobile portrait (375x812)', async ({ page }) => {
    // Set viewport to mobile resolution
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(375, 10);
    expect(appBoundingBox!.height).toBeCloseTo(812, 10);

    // Should maintain usability on small screens
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    await expect(mainContent).toBeVisible();
  });

  test('should dynamically adjust when window is resized', async ({ page }) => {
    // Start with a standard size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    let appBoundingBox = await page.locator('#root').boundingBox();
    expect(appBoundingBox!.width).toBeCloseTo(1920, 10);

    // Resize to widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(300);

    appBoundingBox = await page.locator('#root').boundingBox();
    expect(appBoundingBox!.width).toBeCloseTo(2560, 10);
    expect(appBoundingBox!.height).toBeCloseTo(1440, 10);

    // Resize to smaller
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(300);

    appBoundingBox = await page.locator('#root').boundingBox();
    expect(appBoundingBox!.width).toBeCloseTo(1366, 10);
    expect(appBoundingBox!.height).toBeCloseTo(768, 10);
  });

  test('should handle extreme aspect ratios', async ({ page }) => {
    // Test very wide but short screen
    await page.setViewportSize({ width: 2560, height: 600 });
    await page.waitForTimeout(500);

    const appRoot = page.locator('#root');
    const appBoundingBox = await appRoot.boundingBox();

    expect(appBoundingBox).toBeTruthy();
    expect(appBoundingBox!.width).toBeCloseTo(2560, 10);
    expect(appBoundingBox!.height).toBeCloseTo(600, 10);

    // Content should still be accessible
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    await expect(mainContent).toBeVisible();
  });

  test('should maintain scroll functionality across different sizes', async ({
    page,
  }) => {
    // Test on widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(300);

    const mainContent = page.locator('main.flex-1.w-full.max-w-none');

    // Check if content is scrollable when needed
    const scrollHeight = await mainContent.evaluate(el => el.scrollHeight);
    const clientHeight = await mainContent.evaluate(el => el.clientHeight);

    if (scrollHeight > clientHeight) {
      // Content should be scrollable
      await mainContent.evaluate(el => el.scrollTo(0, 100));
      const scrollTop = await mainContent.evaluate(el => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    }

    // Test scroll on smaller resolution
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(300);

    // Should still be able to scroll if needed
    await expect(mainContent).toBeVisible();
  });

  test('should not cause horizontal scrollbars on any resolution', async ({
    page,
  }) => {
    const resolutions = [
      { width: 375, height: 812 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1366, height: 768 }, // Laptop
      { width: 1920, height: 1080 }, // Desktop
      { width: 2560, height: 1440 }, // Widescreen
      { width: 3440, height: 1440 }, // Ultra-wide
    ];

    for (const resolution of resolutions) {
      await page.setViewportSize(resolution);
      await page.waitForTimeout(300);

      // Check that body doesn't have horizontal overflow
      const bodyOverflowX = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflowX;
      });

      const rootOverflowX = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? window.getComputedStyle(root).overflowX : 'visible';
      });

      // Should not have visible horizontal overflow
      expect(bodyOverflowX).not.toBe('scroll');
      expect(rootOverflowX).not.toBe('scroll');

      // Check for horizontal scrollbar
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        );
      });

      expect(hasHorizontalScrollbar).toBeFalsy();
    }
  });

  test('should maintain proper sidebar behavior across resolutions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(300);

    // Sidebar should be visible and properly sized
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    const sidebarBoundingBox = await sidebar.boundingBox();
    expect(sidebarBoundingBox).toBeTruthy();
    expect(sidebarBoundingBox!.width).toBeGreaterThan(200);
    expect(sidebarBoundingBox!.width).toBeLessThan(400);

    // Main content should fill remaining space
    const mainContent = page.locator('main.flex-1.w-full.max-w-none');
    const mainBoundingBox = await mainContent.boundingBox();

    expect(mainBoundingBox).toBeTruthy();
    expect(mainBoundingBox!.width).toBeGreaterThan(2000);
  });
});

test.describe('Project Table Responsive Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should show more table columns on widescreen', async ({ page }) => {
    // Test on widescreen
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(500);

    // All table columns should be visible
    const tableHeaders = page.locator('th');
    const headerCount = await tableHeaders.count();

    // Should have all columns visible on widescreen
    expect(headerCount).toBeGreaterThan(5);

    // Check specific headers are visible
    await expect(page.locator('th:has-text("Project Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Budget")')).toBeVisible();
    await expect(page.locator('th:has-text("Start Date")')).toBeVisible();
  });

  test('should handle table overflow on narrow screens', async ({ page }) => {
    // Test on narrow screen
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Table container should be scrollable
    const tableContainer = page.locator('.overflow-auto').first();

    if (await tableContainer.isVisible()) {
      const overflowX = await tableContainer.evaluate(
        el => window.getComputedStyle(el).overflowX
      );
      expect(overflowX).toBe('auto');
    }
  });

  test('should maintain filter controls responsiveness', async ({ page }) => {
    const resolutions = [
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
    ];

    for (const resolution of resolutions) {
      await page.setViewportSize(resolution);
      await page.waitForTimeout(300);

      // Filter controls should be visible and accessible
      const searchFilter = page.locator('input[placeholder*="Filter"]');
      if (await searchFilter.isVisible()) {
        await expect(searchFilter).toBeVisible();

        // Should be able to interact with filter
        await searchFilter.click();
        await searchFilter.fill('test');
        await searchFilter.clear();
      }
    }
  });
});
