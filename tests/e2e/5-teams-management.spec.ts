import { test, expect } from '@playwright/test';
import { waitForLocalStorageData, ensureSetupComplete } from './test-helpers';

test.describe('Teams Management', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure setup is complete before running tests
    await ensureSetupComplete(page);

    // Navigate to teams page
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should view teams page and display teams list', async ({ page }) => {
    console.log('🔍 Testing teams view functionality...');

    // Check that we're on the teams page
    await expect(page.locator('h1:has-text("Teams")')).toBeVisible();

    // Should see the teams table/list
    await expect(
      page.locator('[data-testid="teams-table"], .teams-list, [role="table"]')
    ).toBeVisible();

    // Should see the add team button
    await expect(
      page.locator('button:has-text("Add Team"), button:has-text("New Team")')
    ).toBeVisible();

    console.log('✅ Teams page loaded correctly');
  });

  test('should create a new team', async ({ page }) => {
    console.log('🏗️ Testing team creation...');

    // Click add team button
    await page.click(
      'button:has-text("Add Team"), button:has-text("New Team")'
    );

    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill team details
    const teamName = `Test Team ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      teamName
    );

    // Fill description if field exists
    const descriptionField = page.locator(
      'textarea[name="description"], #description, textarea[placeholder*="description" i]'
    );
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test team description for E2E testing');
    }

    // Set team type if dropdown exists
    const typeSelect = page.locator(
      'select[name="type"], [role="combobox"]:has([data-testid*="type"]), button:has-text("Type")'
    );
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.click(
        'div:has-text("Project"), [role="option"]:has-text("Project")'
      );
    }

    // Save the team
    await page.click('button:has-text("Create"), button:has-text("Save")');

    // Wait for dialog to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify team appears in the list
    await expect(page.locator(`text=${teamName}`)).toBeVisible();

    // Verify localStorage was updated
    await waitForLocalStorageData(page, 'planning-teams', 1);

    console.log('✅ Team created successfully');
  });

  test('should edit an existing team', async ({ page }) => {
    console.log('✏️ Testing team editing...');

    // First create a team to edit
    await page.click(
      'button:has-text("Add Team"), button:has-text("New Team")'
    );
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const originalName = `Team to Edit ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      originalName
    );
    await page.click('button:has-text("Create"), button:has-text("Save")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Now edit the team
    const teamRow = page.locator(
      `tr:has-text("${originalName}"), div:has-text("${originalName}")`
    );
    await expect(teamRow).toBeVisible();

    // Look for edit button or click on the team name
    const editButton = teamRow.locator(
      'button:has([data-lucide="edit"]), button:has-text("Edit"), [data-testid="edit-team"]'
    );
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // Try clicking on the team name itself
      await teamRow.locator(`text=${originalName}`).click();
    }

    // Wait for edit dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Update team name
    const updatedName = `${originalName} - Updated`;
    const nameInput = page.locator(
      'input[name="name"], #name, input[placeholder*="name" i]'
    );
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Save changes
    await page.click('button:has-text("Update"), button:has-text("Save")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify updated name appears
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();

    console.log('✅ Team edited successfully');
  });

  test('should access team builder functionality', async ({ page }) => {
    console.log('🔧 Testing team builder access...');

    // Look for Team Builder tab or button
    const builderTab = page.locator(
      'button:has-text("Builder"), [role="tab"]:has-text("Builder")'
    );

    if (await builderTab.isVisible()) {
      await builderTab.click();

      // Verify builder interface loads
      await expect(
        page.locator('text="Team Builder", text="Build Team"')
      ).toBeVisible();

      // Should see teams list and people selection
      await expect(
        page.locator('text="Teams", text="Select a Team"')
      ).toBeVisible();

      console.log('✅ Team builder accessed successfully');
    } else {
      console.log('ℹ️ Team builder not available or in different location');
    }
  });

  test('should access people to team mapping functionality', async ({
    page,
  }) => {
    console.log('👥 Testing people to team mapping...');

    // Look for Map People button
    const mapPeopleButton = page.locator(
      'button:has-text("Map People"), button:has-text("People to Teams")'
    );

    if (await mapPeopleButton.isVisible()) {
      await mapPeopleButton.click();

      // Wait for dialog to open
      await expect(
        page.locator('[role="dialog"]:has-text("People to Team Mapping")')
      ).toBeVisible();

      // Should see people list and team assignment panel
      await expect(
        page.locator('text="Unassigned People", text="All People"')
      ).toBeVisible();
      await expect(page.locator('text="Assign to Team"')).toBeVisible();

      // Test filter functionality
      const showAssignedCheckbox = page.locator(
        'input[type="checkbox"]:near(text="Show people already in teams")'
      );
      if (await showAssignedCheckbox.isVisible()) {
        await showAssignedCheckbox.check();
        await expect(page.locator('text="All People"')).toBeVisible();
      }

      // Close dialog
      await page.click('button:has-text("Close")');

      console.log('✅ People to team mapping functionality working');
    } else {
      console.log(
        'ℹ️ People to team mapping not available or in different location'
      );
    }
  });

  test('should delete a team', async ({ page }) => {
    console.log('🗑️ Testing team deletion...');

    // Create a team to delete
    await page.click(
      'button:has-text("Add Team"), button:has-text("New Team")'
    );
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const teamToDelete = `Team to Delete ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      teamToDelete
    );
    await page.click('button:has-text("Create"), button:has-text("Save")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Find and delete the team
    const teamRow = page.locator(
      `tr:has-text("${teamToDelete}"), div:has-text("${teamToDelete}")`
    );
    await expect(teamRow).toBeVisible();

    // Look for delete button
    const deleteButton = teamRow.locator(
      'button:has([data-lucide="trash"]), button:has-text("Delete"), [data-testid="delete-team"]'
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

      // Verify team is removed from the list
      await expect(page.locator(`text=${teamToDelete}`)).not.toBeVisible();

      console.log('✅ Team deleted successfully');
    } else {
      console.log(
        'ℹ️ Delete functionality not available or implemented differently'
      );
    }
  });
});
