import { test, expect } from '@playwright/test';

test.describe('Mobile PWA Features', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display mobile dashboard on mobile viewport', async ({
    page,
  }) => {
    // Check for mobile-specific elements
    await expect(
      page.locator('[data-testid="mobile-dashboard"]')
    ).toBeVisible();

    // Check stats cards are mobile-optimized (2-column grid)
    const statsGrid = page.locator('.grid-cols-2').first();
    await expect(statsGrid).toBeVisible();

    // Verify quick actions are present
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByRole('link', { name: /teams/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i })).toBeVisible();
  });

  test('should show mobile navigation at bottom', async ({ page }) => {
    // Check bottom navigation is visible
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible();

    // Check navigation items
    await expect(bottomNav.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /teams/i })).toBeVisible();
    await expect(
      bottomNav.getByRole('link', { name: /projects/i })
    ).toBeVisible();
    await expect(
      bottomNav.getByRole('link', { name: /planning/i })
    ).toBeVisible();
    await expect(
      bottomNav.getByRole('link', { name: /canvas/i })
    ).toBeVisible();
  });

  test('should hide desktop sidebar on mobile', async ({ page }) => {
    // Desktop sidebar should not be visible
    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(sidebar).toBeHidden();

    // Sidebar trigger should not be visible
    const sidebarTrigger = page.locator(
      'button[data-testid="sidebar-trigger"]'
    );
    await expect(sidebarTrigger).toBeHidden();
  });

  test('should show PWA install banner when applicable', async ({
    page,
    context,
  }) => {
    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.platforms = ['web'];
      event.userChoice = Promise.resolve({
        outcome: 'accepted',
        platform: 'web',
      });
      event.prompt = () => Promise.resolve();
      window.dispatchEvent(event);
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for install banner
    await expect(page.getByText('Install App')).toBeVisible();
    await expect(
      page.getByText('Get faster access and offline support')
    ).toBeVisible();

    // Check install button
    const installButton = page.getByRole('button', { name: /install/i });
    await expect(installButton).toBeVisible();
  });

  test('should show offline indicator when offline', async ({
    page,
    context,
  }) => {
    // Go offline
    await context.setOffline(true);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check offline indicator
    await expect(page.getByText('Offline Mode')).toBeVisible();
    await expect(page.getByText("You're offline")).toBeVisible();

    // Check retry button
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('should navigate between pages using mobile navigation', async ({
    page,
  }) => {
    // Start on home page
    await expect(page.locator('.text-blue-600')).toContainText('Home');

    // Navigate to teams
    await page.getByRole('link', { name: /teams/i }).click();
    await page.waitForURL(/.*\/teams.*/);
    await expect(page.locator('.text-blue-600')).toContainText('Teams');

    // Navigate to projects
    await page.getByRole('link', { name: /projects/i }).click();
    await page.waitForURL(/.*\/projects.*/);
    await expect(page.locator('.text-blue-600')).toContainText('Projects');

    // Navigate to planning
    await page.getByRole('link', { name: /planning/i }).click();
    await page.waitForURL(/.*\/planning.*/);
    await expect(page.locator('.text-blue-600')).toContainText('Planning');
  });

  test('should show attention badge on navigation when items present', async ({
    page,
  }) => {
    // Navigate to a page that might have attention items
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if attention badge appears (this depends on app state)
    const badge = page
      .locator('nav')
      .last()
      .locator('[data-testid="attention-badge"]');

    // If badge exists, verify it shows a number
    if (await badge.isVisible()) {
      const badgeText = await badge.textContent();
      expect(badgeText).toMatch(/^\d+\+?$/);
    }
  });

  test('should handle quick actions in mobile dashboard', async ({ page }) => {
    // Click on Teams quick action
    const teamsAction = page.getByRole('link', { name: /teams/i }).first();
    await expect(teamsAction).toBeVisible();
    await teamsAction.click();

    await page.waitForURL(/.*\/teams.*/);
    expect(page.url()).toContain('/teams');

    // Go back to home
    await page.getByRole('link', { name: /home/i }).click();
    await page.waitForURL('/');

    // Click on Projects quick action
    const projectsAction = page
      .getByRole('link', { name: /projects/i })
      .first();
    await expect(projectsAction).toBeVisible();
    await projectsAction.click();

    await page.waitForURL(/.*\/projects.*/);
    expect(page.url()).toContain('/projects');
  });

  test('should display stats in mobile-friendly format', async ({ page }) => {
    // Check stats are displayed in 2x2 grid
    const statsCards = page.locator('.grid-cols-2 > *');
    await expect(statsCards).toHaveCount(4);

    // Verify stat cards contain numbers and labels
    await expect(page.getByText('People')).toBeVisible();
    await expect(page.getByText('Teams')).toBeVisible();
    await expect(page.getByText('Projects')).toBeVisible();
    await expect(page.getByText('Quarter')).toBeVisible();
  });

  test('should show current status information', async ({ page }) => {
    await expect(page.getByText('Current Status')).toBeVisible();

    // Check for iteration info
    await expect(page.getByText('Iteration')).toBeVisible();
    await expect(page.getByText('Quarter Progress')).toBeVisible();
  });

  test('should work offline with service worker', async ({ page, context }) => {
    // First, load the page to register service worker
    await page.waitForLoadState('networkidle');

    // Wait for service worker registration
    await page.waitForFunction(() => {
      return navigator.serviceWorker.ready;
    });

    // Go offline
    await context.setOffline(true);

    // Navigate to a new page
    await page.getByRole('link', { name: /teams/i }).click();

    // Page should still load (from cache)
    await expect(page.getByText('Teams')).toBeVisible();

    // Offline indicator should be shown
    await expect(page.getByText('Offline Mode')).toBeVisible();
  });

  test('should maintain responsive design across different mobile sizes', async ({
    page,
  }) => {
    const mobileSizes = [
      { width: 375, height: 812, name: 'iPhone X' },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
      { width: 360, height: 640, name: 'Galaxy S5' },
      { width: 375, height: 667, name: 'iPhone 6/7/8' },
    ];

    for (const size of mobileSizes) {
      console.log(`Testing ${size.name} (${size.width}x${size.height})`);

      await page.setViewportSize({ width: size.width, height: size.height });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check mobile dashboard is still visible
      await expect(
        page.locator('[data-testid="mobile-dashboard"]')
      ).toBeVisible();

      // Check bottom navigation is still accessible
      const bottomNav = page.locator('nav').last();
      await expect(bottomNav).toBeVisible();

      // Check no horizontal scrolling
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        );
      });
      expect(hasHorizontalScrollbar).toBeFalsy();
    }
  });

  test('should handle PWA manifest correctly', async ({ page }) => {
    // Check manifest link is present
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // Check theme color meta tag
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    await expect(themeColorMeta).toHaveAttribute('content', '#0ea5e9');
  });

  test('should show connection status indicator', async ({ page, context }) => {
    // Check online status
    await expect(page.getByText('Connected')).toBeVisible();

    // Go offline
    await context.setOffline(true);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check offline status
    await expect(page.getByText('Offline Mode')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Click retry button
    const retryButton = page.getByRole('button', { name: /retry/i });
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }

    await page.waitForTimeout(1000);
    await expect(page.getByText('Connected')).toBeVisible();
  });
});
