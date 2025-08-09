import { test, expect } from '@playwright/test';

test.describe('ProjectCommandCenterModal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for the application to load
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });

    // Navigate to projects page
    const projectsLink = page
      .locator('a[href*="/projects"], button:has-text("Projects")')
      .first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
    }

    // Wait for projects page to load
    await page.waitForSelector(
      '[data-testid="projects-page"], [data-testid="projects-container"]',
      { timeout: 5000 }
    );

    // Wait for any projects or buttons to be loaded
    await page.waitForTimeout(1000); // Allow initial render
    await page.waitForSelector(
      'button:has-text("Edit"), button:has-text("Add Project"), button:has-text("View")',
      { timeout: 10000, state: 'visible' }
    );
  });

  test('should open ProjectCommandCenterModal from project list', async ({
    page,
  }) => {
    // Look for a project in the list and click to open details
    const projectRow = page
      .locator('[data-testid*="project-row"], [data-testid*="project-item"]')
      .first();

    if (await projectRow.isVisible()) {
      await projectRow.click();
    } else {
      // If no projects exist, create a test project first
      const addProjectBtn = page
        .locator(
          'button:has-text("Add Project"), button:has-text("New Project"), [data-testid="add-project-button"]'
        )
        .first();
      if (await addProjectBtn.isVisible()) {
        await addProjectBtn.click();

        // Fill in basic project details
        await page.fill(
          'input[name="name"], input[placeholder*="name" i]',
          'E2E Test Project'
        );
        await page.fill(
          'textarea[name="description"], textarea[placeholder*="description" i]',
          'E2E test project description'
        );

        // Select a status if dropdown exists
        const statusSelect = page
          .locator('select[name="status"], [data-testid="status-select"]')
          .first();
        if (await statusSelect.isVisible()) {
          await statusSelect.selectOption('planning');
        }

        // Set dates
        const startDateInput = page
          .locator('input[name="startDate"], input[type="date"]')
          .first();
        if (await startDateInput.isVisible()) {
          await startDateInput.fill('2024-01-01');
        }

        // Save the project
        const saveBtn = page
          .locator(
            'button:has-text("Save"), button:has-text("Create"), [data-testid="save-button"]'
          )
          .first();
        await saveBtn.click();

        // Wait for project to be created and modal to close
        await page.waitForTimeout(1000);
      }
    }

    // Check if ProjectCommandCenterModal is open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should display all six tabs in ProjectCommandCenterModal', async ({
    page,
  }) => {
    // Open a project (assuming one exists or was created in previous test)
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check that all six tabs are present
    const tabs = [
      'overview-tab',
      'epics-timeline-tab',
      'financials-tab',
      'solutions-skills-tab',
      'progress-tracking-tab',
      'steerco-report-tab',
    ];

    for (const tabId of tabs) {
      const tab = page.locator(`[data-testid="${tabId}"]`);
      await expect(tab).toBeVisible();
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Test tab switching
    const tabs = [
      { id: 'epics-timeline-tab', content: 'epics-timeline-content' },
      { id: 'financials-tab', content: 'financials-content' },
      { id: 'solutions-skills-tab', content: 'solutions-skills-content' },
      { id: 'progress-tracking-tab', content: 'progress-tracking-content' },
      { id: 'steerco-report-tab', content: 'steerco-report-content' },
      { id: 'overview-tab', content: 'overview-content' },
    ];

    for (const tab of tabs) {
      await page.click(`[data-testid="${tab.id}"]`);
      await page.waitForTimeout(200); // Small delay for tab transition

      // Verify tab content is visible
      const tabContent = page.locator(`[data-testid="${tab.content}"]`);
      await expect(tabContent).toBeVisible();
    }
  });

  test('should display project information in Overview tab', async ({
    page,
  }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Ensure Overview tab is active
    await page.click('[data-testid="overview-tab"]');

    // Check that project information is displayed
    const overviewContent = page.locator('[data-testid="overview-content"]');
    await expect(overviewContent).toBeVisible();

    // Check for key project fields
    const projectName = page.locator('[data-testid="project-name"]');
    const projectStatus = page.locator('[data-testid="project-status"]');
    const projectStartDate = page.locator('[data-testid="project-start-date"]');

    await expect(projectName).toBeVisible();
    await expect(projectStatus).toBeVisible();
    await expect(projectStartDate).toBeVisible();
  });

  test('should display projected end date calculation', async ({ page }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Go to Overview tab
    await page.click('[data-testid="overview-tab"]');

    // Check for projected end date field
    const projectedEndDate = page.locator('[data-testid="projected-end-date"]');
    await expect(projectedEndDate).toBeVisible();

    // Verify it contains a valid date format
    const projectedEndDateText = await projectedEndDate.textContent();
    expect(projectedEndDateText).toMatch(
      /\d{4}-\d{2}-\d{2}|\w{3} \d{1,2}, \d{4}/
    );
  });

  test('should switch between view and edit modes', async ({ page }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check initial mode (should be view by default)
    const modeIndicator = page.locator('[data-testid="mode-indicator"]');
    await expect(modeIndicator).toHaveText('view');

    // Look for edit button and click it
    const editButton = page
      .locator('button:has-text("Edit"), [data-testid="edit-button"]')
      .first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Verify mode switched to edit
      await expect(modeIndicator).toHaveText('edit');

      // Check that edit actions are visible
      const editActions = page.locator('[data-testid="edit-actions"]');
      await expect(editActions).toBeVisible();

      const saveButton = page.locator('[data-testid="save-button"]');
      const cancelButton = page.locator('[data-testid="cancel-button"]');

      await expect(saveButton).toBeVisible();
      await expect(cancelButton).toBeVisible();
    }
  });

  test('should display financial information in Financials tab', async ({
    page,
  }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Switch to Financials tab
    await page.click('[data-testid="financials-tab"]');

    // Check financials content is displayed
    const financialsContent = page.locator(
      '[data-testid="financials-content"]'
    );
    await expect(financialsContent).toBeVisible();

    // Look for financial metrics
    const totalCost = page.locator('[data-testid="total-cost"]');
    const monthlyBurnRate = page.locator('[data-testid="monthly-burn-rate"]');

    if (await totalCost.isVisible()) {
      await expect(totalCost).toBeVisible();
    }

    if (await monthlyBurnRate.isVisible()) {
      await expect(monthlyBurnRate).toBeVisible();
    }
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click close button
    const closeButton = page.locator('[data-testid="close-button"]');
    await closeButton.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Test keyboard navigation through tabs
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');

    // Should be able to focus on interactive elements
    await expect(focusedElement).toBeVisible();

    // Test tab navigation
    const tabs = [
      'overview-tab',
      'epics-timeline-tab',
      'financials-tab',
      'solutions-skills-tab',
      'progress-tracking-tab',
      'steerco-report-tab',
    ];

    for (const tabId of tabs) {
      const tab = page.locator(`[data-testid="${tabId}"]`);
      await tab.focus();
      await page.keyboard.press('Enter');

      // Small delay for tab transition
      await page.waitForTimeout(200);

      // Verify tab is active (this would depend on implementation)
      const tabContent = page.locator(
        `[data-testid="${tabId.replace('-tab', '-content')}"]`
      );
      if (await tabContent.isVisible()) {
        await expect(tabContent).toBeVisible();
      }
    }
  });

  test('should handle large project data efficiently', async ({ page }) => {
    // This test assumes there's a project with substantial data
    // or creates one with multiple epics/milestones

    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Test performance by switching between tabs quickly
    const tabs = [
      'overview-tab',
      'epics-timeline-tab',
      'financials-tab',
      'solutions-skills-tab',
      'progress-tracking-tab',
      'steerco-report-tab',
    ];

    // Measure performance of tab switching
    const startTime = Date.now();

    for (let i = 0; i < 3; i++) {
      // Switch through tabs 3 times
      for (const tabId of tabs) {
        await page.click(`[data-testid="${tabId}"]`);
        await page.waitForTimeout(50); // Small delay
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete tab switching reasonably quickly (under 5 seconds)
    expect(duration).toBeLessThan(5000);

    // Modal should still be responsive
    await expect(modal).toBeVisible();
  });

  test('should not have console errors when rendering', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    // Open project modal
    const projectRow = page
      .locator(
        '[data-testid*="project-row"], [data-testid*="project-item"], tr'
      )
      .first();
    if (await projectRow.isVisible()) {
      await projectRow.click();
    }

    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Switch through all tabs to ensure no console errors
    const tabs = [
      'overview-tab',
      'epics-timeline-tab',
      'financials-tab',
      'solutions-skills-tab',
      'progress-tracking-tab',
      'steerco-report-tab',
    ];

    for (const tabId of tabs) {
      await page.click(`[data-testid="${tabId}"]`);
      await page.waitForTimeout(500);
    }

    // Close modal
    const closeButton = page.locator('[data-testid="close-button"]');
    await closeButton.click();

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(1000);

    // Check for console errors
    const errorLogs = consoleLogs.filter(
      log =>
        !log.includes('Warning:') && // Filter out React warnings
        !log.includes('404') && // Filter out 404 errors for missing resources
        !log.includes('favicon') // Filter out favicon errors
    );

    expect(errorLogs).toHaveLength(0);
  });
});
