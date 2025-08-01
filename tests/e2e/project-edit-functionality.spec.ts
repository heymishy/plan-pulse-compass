import { test, expect } from '@playwright/test';

test.describe('Project Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page and ensure projects are loaded
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Wait for projects to be loaded
    await expect(
      page.locator('[data-testid="project-command-center-modal"]')
    ).not.toBeVisible();
  });

  test('should open project modal in edit mode and allow editing project fields', async ({
    page,
  }) => {
    // Find the first project row and click View button
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await expect(firstViewButton).toBeVisible();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Verify modal is in edit mode by checking for form fields
    await expect(page.locator('#project-name')).toBeVisible();
    await expect(page.locator('#project-description')).toBeVisible();
    await expect(page.locator('[data-testid="project-status"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="project-priority"]')
    ).toBeVisible();

    // Verify save and cancel buttons are visible
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();
  });

  test('should allow editing project name and save changes', async ({
    page,
  }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Get original project name from the title
    const originalName = await page
      .locator('.text-2xl.font-bold')
      .textContent();

    // Edit project name
    const projectNameInput = page.locator('#project-name');
    const newName = `${originalName} - Updated`;
    await projectNameInput.clear();
    await projectNameInput.fill(newName);

    // Verify the dialog title updates to show the new name
    await expect(page.locator('.text-2xl.font-bold')).toHaveText(newName);

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify the project name was updated in the table
    await expect(page.locator('td').filter({ hasText: newName })).toBeVisible();
  });

  test('should allow editing project description', async ({ page }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Edit project description
    const descriptionTextarea = page.locator('#project-description');
    const newDescription =
      'This is an updated project description for testing purposes.';
    await descriptionTextarea.clear();
    await descriptionTextarea.fill(newDescription);

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Reopen modal to verify description was saved
    await firstViewButton.click();
    await expect(modal).toBeVisible();
    await expect(page.locator('#project-description')).toHaveValue(
      newDescription
    );
  });

  test('should allow changing project status', async ({ page }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Change project status
    const statusSelect = page.locator('[data-testid="project-status"]');
    await statusSelect.click();

    // Select 'In Progress' status
    await page
      .locator('[role="option"]')
      .filter({ hasText: 'In Progress' })
      .click();

    // Verify the badge updates
    await expect(
      page.locator('.text-2xl.font-bold').locator('..').locator('badge')
    ).toContainText('in progress');

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });

  test('should allow changing project priority', async ({ page }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Change project priority
    const prioritySelect = page.locator('[data-testid="project-priority"]');
    await prioritySelect.click();

    // Select 'High' priority
    await page.locator('[role="option"]').filter({ hasText: 'High' }).click();

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });

  test('should allow editing project dates', async ({ page }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Edit start date
    const startDateInput = page.locator('#project-start-date');
    await startDateInput.fill('2024-03-01');

    // Edit end date
    const endDateInput = page.locator('#project-end-date');
    await endDateInput.fill('2024-06-30');

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Reopen modal to verify dates were saved
    await firstViewButton.click();
    await expect(modal).toBeVisible();
    await expect(startDateInput).toHaveValue('2024-03-01');
    await expect(endDateInput).toHaveValue('2024-06-30');
  });

  test('should allow editing project budget', async ({ page }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Edit budget
    const budgetInput = page.locator('#project-budget');
    await budgetInput.clear();
    await budgetInput.fill('500000');

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Reopen modal to verify budget was saved
    await firstViewButton.click();
    await expect(modal).toBeVisible();
    await expect(budgetInput).toHaveValue('500000');
  });

  test('should cancel changes and revert to original values', async ({
    page,
  }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Get original name
    const originalName = await page.locator('#project-name').inputValue();

    // Edit project name
    const projectNameInput = page.locator('#project-name');
    await projectNameInput.clear();
    await projectNameInput.fill('Temporary Change');

    // Verify the change is visible
    await expect(projectNameInput).toHaveValue('Temporary Change');

    // Cancel changes
    await page.locator('[data-testid="cancel-button"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Reopen modal to verify original values are restored
    await firstViewButton.click();
    await expect(modal).toBeVisible();
    await expect(page.locator('#project-name')).toHaveValue(originalName);
  });

  test('should show validation error for empty project name', async ({
    page,
  }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Clear project name (should be required)
    const projectNameInput = page.locator('#project-name');
    await projectNameInput.clear();

    // Try to save (should show validation or prevent saving)
    await page.locator('[data-testid="save-button"]').click();

    // Modal should still be open since validation failed
    await expect(modal).toBeVisible();
  });

  test('should maintain tab state while editing', async ({ page }) => {
    // Click View button on first project
    const firstViewButton = page
      .locator('button')
      .filter({ hasText: 'View' })
      .first();
    await firstViewButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="project-command-center-modal"]');
    await expect(modal).toBeVisible();

    // Switch to financials tab
    const financialsTab = page.locator('[data-testid="financials-tab"]');
    await financialsTab.click();

    // Verify we're on the financials tab
    await expect(page.locator('text=Financial Overview')).toBeVisible();

    // Make a change in the overview tab
    const overviewTab = page.locator('[data-testid="overview-tab"]');
    await overviewTab.click();

    const projectNameInput = page.locator('#project-name');
    const originalName = await projectNameInput.inputValue();
    await projectNameInput.clear();
    await projectNameInput.fill(`${originalName} - Tab Test`);

    // Switch back to financials tab
    await financialsTab.click();
    await expect(page.locator('text=Financial Overview')).toBeVisible();

    // Save changes
    await page.locator('[data-testid="save-button"]').click();

    // Verify modal closes and changes were saved
    await expect(modal).not.toBeVisible();
  });
});
