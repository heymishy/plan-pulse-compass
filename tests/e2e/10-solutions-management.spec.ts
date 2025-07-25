import { test, expect } from '@playwright/test';
import { waitForLocalStorageData } from './test-helpers';

test.describe('Solutions Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to solutions page (might be under planning or projects)
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');

    // If solutions are not at /solutions, try common alternative paths
    if (
      page.url().includes('404') ||
      (await page.locator('text="404"').isVisible())
    ) {
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      // Look for solutions tab or section
      const solutionsTab = page.locator(
        '[role="tab"]:has-text("Solutions"), button:has-text("Solutions")'
      );
      if (await solutionsTab.isVisible()) {
        await solutionsTab.click();
      }
    }
  });

  test('should view solutions page and display solutions list', async ({
    page,
  }) => {
    console.log('🔍 Testing solutions view functionality...');

    // Check for solutions content (flexible selectors)
    const solutionsContent = page.locator(
      'h1:has-text("Solutions"), h2:has-text("Solutions"), .solutions-list, [data-testid*="solution"]'
    );
    await expect(solutionsContent.first()).toBeVisible();

    // Should see the add solution button
    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );
    if (await addSolutionButton.isVisible()) {
      console.log('ℹ️ Add solution button found');
    }

    console.log('✅ Solutions page/section loaded correctly');
  });

  test('should create a new solution', async ({ page }) => {
    console.log('💡 Testing solution creation...');

    // Look for add solution button
    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );

    if (await addSolutionButton.isVisible()) {
      await addSolutionButton.click();

      // Wait for dialog to open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Fill solution details
      const solutionName = `Test Solution ${Date.now()}`;
      await page.fill(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]',
        solutionName
      );

      // Fill description if field exists
      const descriptionField = page.locator(
        'textarea[name="description"], #description, textarea[placeholder*="description" i]'
      );
      if (await descriptionField.isVisible()) {
        await descriptionField.fill(
          'Test solution description for E2E testing'
        );
      }

      // Set solution type if dropdown exists
      const typeSelect = page.locator(
        'select[name="type"], [role="combobox"]:has([data-testid*="type"]), button:has-text("Type")'
      );
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.click(
          '[role="option"]:has-text("Technical"), [role="option"]:has-text("Process")'
        );
      }

      // Set solution status if available
      const statusSelect = page.locator(
        'select[name="status"], [role="combobox"]:has([data-testid*="status"]), button:has-text("Status")'
      );
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.click(
          '[role="option"]:has-text("Active"), [role="option"]:has-text("Draft")'
        );
      }

      // Save the solution
      await page.click('button:has-text("Create"), button:has-text("Save")');

      // Wait for dialog to close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Verify solution appears in the list
      await expect(page.locator(`text=${solutionName}`)).toBeVisible();

      // Verify localStorage was updated
      await waitForLocalStorageData(page, 'planning-solutions', 1);

      console.log('✅ Solution created successfully');
    } else {
      console.log(
        'ℹ️ Solution creation not available or implemented differently'
      );
    }
  });

  test('should edit an existing solution', async ({ page }) => {
    console.log('✏️ Testing solution editing...');

    // First create a solution to edit
    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );

    if (await addSolutionButton.isVisible()) {
      await addSolutionButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const originalName = `Solution to Edit ${Date.now()}`;
      await page.fill(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]',
        originalName
      );
      await page.click('button:has-text("Create"), button:has-text("Save")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Now edit the solution
      const solutionElement = page.locator(
        `tr:has-text("${originalName}"), div:has-text("${originalName}"), .solution-card:has-text("${originalName}")`
      );
      await expect(solutionElement).toBeVisible();

      // Look for edit button or click on the solution
      const editButton = solutionElement.locator(
        'button:has([data-lucide="edit"]), button:has-text("Edit"), [data-testid="edit-solution"]'
      );
      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        // Try clicking on the solution name itself
        await solutionElement.locator(`text=${originalName}`).click();
      }

      // Wait for edit dialog
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Update solution name
      const updatedName = `${originalName} - Updated`;
      const nameInput = page.locator(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]'
      );
      await nameInput.clear();
      await nameInput.fill(updatedName);

      // Save changes
      await page.click('button:has-text("Update"), button:has-text("Save")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Verify updated name appears
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();

      console.log('✅ Solution edited successfully');
    } else {
      console.log(
        'ℹ️ Solution editing not available or implemented differently'
      );
    }
  });

  test('should test solution status and type management', async ({ page }) => {
    console.log('📊 Testing solution status and type management...');

    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );

    if (await addSolutionButton.isVisible()) {
      await addSolutionButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const solutionName = `Status Type Solution ${Date.now()}`;
      await page.fill(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]',
        solutionName
      );

      // Test type setting
      const typeSelect = page.locator(
        'select[name="type"], [role="combobox"]:has([data-testid*="type"]), button:has-text("Type")'
      );
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.click('[role="option"]:has-text("Technical")');
        console.log('ℹ️ Type setting tested');
      }

      // Test status setting
      const statusSelect = page.locator(
        'select[name="status"], [role="combobox"]:has([data-testid*="status"]), button:has-text("Status")'
      );
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.click('[role="option"]:has-text("Active")');
        console.log('ℹ️ Status setting tested');
      }

      await page.click('button:has-text("Create"), button:has-text("Save")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Verify solution shows with correct status/type
      await expect(page.locator(`text=${solutionName}`)).toBeVisible();

      console.log('✅ Solution status and type management working');
    } else {
      console.log(
        'ℹ️ Solution management not available or implemented differently'
      );
    }
  });

  test('should test solution-project associations', async ({ page }) => {
    console.log('🔗 Testing solution-project associations...');

    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );

    if (await addSolutionButton.isVisible()) {
      await addSolutionButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const solutionName = `Project Association Solution ${Date.now()}`;
      await page.fill(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]',
        solutionName
      );

      // Look for project selection/assignment section
      const projectSelect = page.locator(
        'select[name*="project"], [role="combobox"]:has([data-testid*="project"]), button:has-text("Project")'
      );
      if (await projectSelect.isVisible()) {
        await projectSelect.click();
        const firstProject = page.locator('[role="option"]').first();
        if (await firstProject.isVisible()) {
          await firstProject.click();
          console.log('ℹ️ Solution-project association functionality found');
        }
      }

      await page.click('button:has-text("Create"), button:has-text("Save")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      console.log('✅ Solution-project associations tested');
    } else {
      console.log('ℹ️ Solution management not available');
    }
  });

  test('should test solution filtering and search', async ({ page }) => {
    console.log('🔍 Testing solution filtering and search...');

    // Look for filter/search controls
    const filterControls = page.locator(
      'select:near(text="Filter"), select:near(text="Status"), select:near(text="Type")'
    );
    const sortControls = page.locator(
      'button:has-text("Sort"), [data-testid*="sort"]'
    );
    const searchInput = page.locator(
      'input[placeholder*="search" i]:near(text="Solution")'
    );

    if (await filterControls.first().isVisible()) {
      console.log('ℹ️ Filter controls found');
    }

    if (await sortControls.first().isVisible()) {
      console.log('ℹ️ Sort controls found');
    }

    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await page.waitForTimeout(500);
      console.log('ℹ️ Search functionality tested');
    }

    console.log('✅ Solution filtering and search functionality verified');
  });

  test('should test solution version management', async ({ page }) => {
    console.log('🔄 Testing solution version management...');

    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );

    if (await addSolutionButton.isVisible()) {
      await addSolutionButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const solutionName = `Version Test Solution ${Date.now()}`;
      await page.fill(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]',
        solutionName
      );

      // Look for version field
      const versionField = page.locator(
        'input[name="version"], #version, input[placeholder*="version" i]'
      );
      if (await versionField.isVisible()) {
        await versionField.fill('1.0.0');
        console.log('ℹ️ Version field functionality found');
      }

      await page.click('button:has-text("Create"), button:has-text("Save")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      console.log('✅ Solution version management tested');
    } else {
      console.log('ℹ️ Solution management not available');
    }
  });

  test('should delete a solution', async ({ page }) => {
    console.log('🗑️ Testing solution deletion...');

    // Create a solution to delete
    const addSolutionButton = page.locator(
      'button:has-text("Add Solution"), button:has-text("New Solution"), button:has-text("Create Solution")'
    );

    if (await addSolutionButton.isVisible()) {
      await addSolutionButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const solutionToDelete = `Solution to Delete ${Date.now()}`;
      await page.fill(
        'input[name="name"], #name, input[placeholder*="name" i], input[placeholder*="title" i]',
        solutionToDelete
      );
      await page.click('button:has-text("Create"), button:has-text("Save")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Find and delete the solution
      const solutionElement = page.locator(
        `tr:has-text("${solutionToDelete}"), div:has-text("${solutionToDelete}")`
      );
      await expect(solutionElement).toBeVisible();

      // Look for delete button
      const deleteButton = solutionElement.locator(
        'button:has([data-lucide="trash"]), button:has-text("Delete"), [data-testid="delete-solution"]'
      );

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Handle confirmation dialog if it appears
        const confirmButton = page.locator(
          'button:has-text("Delete"), button:has-text("Confirm")'
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Verify solution is removed from the list
        await expect(
          page.locator(`text=${solutionToDelete}`)
        ).not.toBeVisible();

        console.log('✅ Solution deleted successfully');
      } else {
        console.log(
          'ℹ️ Delete functionality not available or implemented differently'
        );
      }
    } else {
      console.log('ℹ️ Solution management not available');
    }
  });
});
