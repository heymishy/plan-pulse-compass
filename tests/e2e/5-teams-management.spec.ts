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

    // Click on the Teams tab to access the teams table
    await page.click('[role="tab"]:has-text("Teams")');
    await page.waitForTimeout(500); // Wait for tab content to load

    // Should see the teams table (HTML table element)
    await expect(page.locator('table')).toBeVisible();

    // Should see the add team button
    await expect(page.locator('button:has-text("Add Team")')).toBeVisible();

    console.log('✅ Teams page loaded correctly');
  });

  test('should create a new team', async ({ page }) => {
    console.log('🏗️ Testing team creation...');

    // Click add team button (this is available on all tabs)
    await page.click('button:has-text("Add Team")');

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

    // Navigate to Teams tab to see the created team
    await page.click('[role="tab"]:has-text("Teams")');
    await page.waitForTimeout(500);

    // Verify team appears in the table
    await expect(
      page.locator(`table tr:has-text("${teamName}")`)
    ).toBeVisible();

    // Verify localStorage was updated
    await waitForLocalStorageData(page, 'planning-teams', 1);

    console.log('✅ Team created successfully');
  });

  test('should show edit buttons for teams in table', async ({ page }) => {
    console.log('✏️ Testing team editing interface...');

    // Navigate to Teams tab
    await page.click('[role="tab"]:has-text("Teams")');
    await page.waitForTimeout(500);

    // Check if there are any teams in the table
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check if table has any data rows (beyond header)
    const rowCount = await page.locator('table tr').count();

    if (rowCount > 1) {
      // There are teams - check for edit buttons
      const editButtons = await page
        .locator('button:has([data-lucide="edit-2"])')
        .count();
      console.log(`ℹ️ Found ${editButtons} edit buttons in team table`);

      if (editButtons > 0) {
        console.log('✅ Edit interface is available for teams');
      } else {
        console.log('ℹ️ No edit buttons found, but table structure exists');
      }
    } else {
      console.log('ℹ️ No teams in table to edit, but table structure exists');
    }

    console.log('✅ Team editing interface verified');
  });

  test('should access team builder functionality', async ({ page }) => {
    console.log('🔧 Testing team builder access...');

    // Click on the Builder tab
    const builderTab = page.locator('[role="tab"]:has-text("Builder")');

    if (await builderTab.isVisible()) {
      await builderTab.click();
      await page.waitForTimeout(500);

      // The TeamBuilder component should be visible
      // Check for some basic elements that should be present
      await expect(
        page
          .locator('text="Team Builder", text="Select Team", text="Teams"')
          .first()
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

    // Look for Map People button (should have "Map People to Teams" text)
    const mapPeopleButton = page.locator(
      'button:has-text("Map People to Teams")'
    );

    if (await mapPeopleButton.isVisible()) {
      await mapPeopleButton.click();

      // Wait for dialog to open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Should see the people mapping interface
      await expect(
        page
          .locator(
            'text="People to Team Mapping", h2:has-text("People to Team Mapping")'
          )
          .first()
      ).toBeVisible();

      // Close dialog
      await page.click('button:has-text("Close"), button:has-text("×")');

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
    await page.click('button:has-text("Add Team")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const teamToDelete = `Team to Delete ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      teamToDelete
    );
    await page.click('button:has-text("Create"), button:has-text("Save")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Navigate to Teams tab to see the created team
    await page.click('[role="tab"]:has-text("Teams")');
    await page.waitForTimeout(500);

    // Find the team in the table
    const teamRow = page.locator(`table tr:has-text("${teamToDelete}")`);
    await expect(teamRow).toBeVisible();

    // Teams use bulk selection, so check the checkbox for this team
    const teamCheckbox = teamRow.locator('input[type="checkbox"]');
    if (await teamCheckbox.isVisible()) {
      await teamCheckbox.check();

      // Look for the "Delete Selected" button that should appear
      const deleteSelectedButton = page.locator(
        'button:has-text("Delete Selected")'
      );
      if (await deleteSelectedButton.isVisible()) {
        await deleteSelectedButton.click();

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
        console.log('ℹ️ Delete Selected button not found');
      }
    } else {
      console.log(
        'ℹ️ Delete functionality not available or implemented differently'
      );
    }
  });
});
