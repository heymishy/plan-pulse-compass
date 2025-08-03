import { test, expect } from '@playwright/test';
import {
  mockPeople,
  mockTeams,
  mockAllocations,
} from '../../src/test/mock-data';

test.describe('Financial Impact Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/people', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(mockPeople),
      });
    });
    await page.route('**/api/teams', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(mockTeams),
      });
    });
    await page.route('**/api/allocations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(mockAllocations),
      });
    });
  });

  test('should display the financial impact analysis tab and its content on the Canvas page', async ({
    page,
  }) => {
    await page.goto('/canvas');
    await page.click('text=Financial Impact');
    await expect(page.getByText('Financial Impact Analysis')).toBeVisible();
    await expect(page.getByText('$120,000')).toBeVisible();
  });

  test('should display the financial impact analysis tab and its content on the Projects page', async ({
    page,
  }) => {
    await page.goto('/projects');
    await page.click('text=Financial Impact');
    await expect(page.getByText('Financial Impact Analysis')).toBeVisible();
    await expect(page.getByText('$120,000')).toBeVisible();
  });

  test('should display the financial impact analysis tab and its content on the Teams page', async ({
    page,
  }) => {
    await page.goto('/teams');
    await page.click('text=Financial Impact');
    await expect(page.getByText('Financial Impact Analysis')).toBeVisible();
    await expect(page.getByText('$120,000')).toBeVisible();
  });
});
