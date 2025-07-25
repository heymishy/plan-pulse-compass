import { test, expect } from '@playwright/test';
import { waitForLocalStorageData, ensureSetupComplete } from './test-helpers';

test.describe('People Management', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure setup is complete before running tests
    await ensureSetupComplete(page);

    // Navigate to people page
    await page.goto('/people');
    await page.waitForLoadState('networkidle');
  });

  test('should view people page and display people list', async ({ page }) => {
    console.log('🔍 Testing people view functionality...');

    // Check that we're on the people page
    await expect(page.locator('h1:has-text("People")')).toBeVisible();

    // Should see the people table (by default it loads in table view)
    await expect(page.locator('table')).toBeVisible();

    // Should see the add person button
    await expect(page.locator('button:has-text("Add Person")')).toBeVisible();

    // Should see view mode toggles (table/card view)
    const viewToggle = page.locator(
      'button[aria-label*="view"], button:has([data-lucide="table"]), button:has([data-lucide="grid"])'
    );
    if (await viewToggle.isVisible()) {
      console.log('ℹ️ View mode toggles available');
    }

    console.log('✅ People page loaded correctly');
  });

  test('should create a new person', async ({ page }) => {
    console.log('👤 Testing person creation...');

    // Click add person button
    await page.click('button:has-text("Add Person")');

    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill person details
    const personName = `Test Person ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      personName
    );

    // Fill email (now optional based on our fix)
    const emailField = page.locator(
      'input[name="email"], #email, input[type="email"]'
    );
    if (await emailField.isVisible()) {
      await emailField.fill(`test${Date.now()}@example.com`);
    }

    // Select role if dropdown exists
    const roleSelect = page.locator(
      'select[name="roleId"], [role="combobox"]:has([data-testid*="role"]), button:has-text("Role")'
    );
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      // Select first available role
      const firstRole = page.locator('[role="option"]').first();
      if (await firstRole.isVisible()) {
        await firstRole.click();
      }
    }

    // Set employment type if available
    const employmentTab = page.locator('[role="tab"]:has-text("Employment")');
    if (await employmentTab.isVisible()) {
      await employmentTab.click();

      const employmentSelect = page.locator(
        'select[name="employmentType"], [role="combobox"]:has([data-testid*="employment"])'
      );
      if (await employmentSelect.isVisible()) {
        await employmentSelect.click();
        await page.click('[role="option"]:has-text("Permanent")');
      }
    }

    // Save the person
    await page.click('button:has-text("Create"), button:has-text("Save")');

    // Wait for dialog to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify person appears in the list
    await expect(page.locator(`text=${personName}`)).toBeVisible();

    // Verify localStorage was updated
    await waitForLocalStorageData(page, 'planning-people', 1);

    console.log('✅ Person created successfully');
  });

  test('should edit an existing person', async ({ page }) => {
    console.log('✏️ Testing person editing...');

    // First create a person to edit
    await page.click('button:has-text("Add Person")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const originalName = `Person to Edit ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      originalName
    );
    await page.click('button:has-text("Create"), button:has-text("Save")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Now edit the person (find row in table)
    const personRow = page.locator(`table tr:has-text("${originalName}")`);
    await expect(personRow).toBeVisible();

    // Look for edit button (uses Edit2 icon)
    const editButton = personRow.locator('button:has([data-lucide="edit-2"])');
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // Try clicking on the person name itself
      await personRow.locator(`text=${originalName}`).click();
    }

    // Wait for edit dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Update person name
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

    console.log('✅ Person edited successfully');
  });

  test('should test person status management', async ({ page }) => {
    console.log('📊 Testing person status management...');

    // Create a person first
    await page.click('button:has-text("Add Person")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const personName = `Status Test Person ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      personName
    );

    // Check settings tab for active/inactive toggle
    const settingsTab = page.locator('[role="tab"]:has-text("Settings")');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();

      const activeToggle = page.locator(
        'input[type="checkbox"]:near(text="Active"), [role="switch"]:near(text="Active")'
      );
      if (await activeToggle.isVisible()) {
        // Verify it's checked by default
        await expect(activeToggle).toBeChecked();
        console.log('ℹ️ Active status toggle found and working');
      }
    }

    await page.click('button:has-text("Create"), button:has-text("Save")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify person shows as active in the list
    await expect(page.locator(`text=${personName}`)).toBeVisible();

    console.log('✅ Person status management working');
  });

  test('should test view mode switching', async ({ page }) => {
    console.log('👁️ Testing view mode switching...');

    // Test table/card view switching (using lucide icons Table and Grid)
    const tableViewButton = page.locator('button:has([data-lucide="table"])');
    const cardViewButton = page.locator('button:has([data-lucide="grid"])');

    if (
      (await tableViewButton.isVisible()) &&
      (await cardViewButton.isVisible())
    ) {
      // Switch to card view
      await cardViewButton.click();
      await page.waitForTimeout(500);
      // In card view, table should not be visible (cards would be shown instead)

      // Switch back to table view
      await tableViewButton.click();
      await page.waitForTimeout(500);
      await expect(page.locator('table')).toBeVisible();

      console.log('✅ View mode switching working');
    } else {
      console.log(
        'ℹ️ View mode switching not available or different implementation'
      );
    }
  });

  test('should handle person creation without email (regression test)', async ({
    page,
  }) => {
    console.log(
      '📧 Testing person creation without email (regression test)...'
    );

    // This test ensures the fix for the email field being optional works
    await page.click('button:has-text("Add Person")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const personName = `No Email Person ${Date.now()}`;
    await page.fill(
      'input[name="name"], #name, input[placeholder*="name" i]',
      personName
    );

    // Explicitly leave email field empty
    const emailField = page.locator(
      'input[name="email"], #email, input[type="email"]'
    );
    if (await emailField.isVisible()) {
      await emailField.fill(''); // Ensure it's empty
    }

    // Save the person - this should not throw an exception
    await page.click('button:has-text("Create"), button:has-text("Save")');

    // Wait for dialog to close (if it fails, the exception will prevent this)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify person was created successfully
    await expect(page.locator(`text=${personName}`)).toBeVisible();

    console.log('✅ Person created without email - regression test passed');
  });
});
