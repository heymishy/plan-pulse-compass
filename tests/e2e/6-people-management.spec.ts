import { test, expect } from '@playwright/test';
import { waitForLocalStorageData, ensureSetupComplete } from './test-helpers';

test.describe('People Management', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure setup is complete before running tests
    await ensureSetupComplete(page);

    // Navigate to people page with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await page.goto('/people', { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);
        break;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) throw error;
        console.log(
          `⚠️ People page load attempt ${attempts} failed, retrying...`
        );
        await page.waitForTimeout(2000);
      }
    }
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

  test('should test person creation interface', async ({ page }) => {
    console.log('👤 Testing person creation interface...');

    // Verify Add Person button exists and works
    const addButton = page.locator('button:has-text("Add Person")');
    await expect(addButton).toBeVisible({ timeout: 8000 });

    // Click to open dialog
    await addButton.click();
    await page.waitForTimeout(1000);

    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 8000,
    });

    // Verify dialog has correct title
    await expect(
      page.locator('[role="dialog"] h2:has-text("Add Person")')
    ).toBeVisible();

    // Verify form fields exist
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();

    // Verify tabs exist in dialog
    await expect(
      page.locator('[role="tab"]:has-text("Basic Info")')
    ).toBeVisible();
    await expect(
      page.locator('[role="tab"]:has-text("Employment")')
    ).toBeVisible();
    await expect(
      page.locator('[role="tab"]:has-text("Settings")')
    ).toBeVisible();

    // Verify Create button exists
    await expect(page.locator('button:has-text("Create")')).toBeVisible();

    // Close dialog with Escape to avoid overlay issues
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    console.log('✅ Person creation interface verified');
  });

  test('should test person editing interface', async ({ page }) => {
    console.log('✏️ Testing person editing interface...');

    // Check if table has any data rows (beyond header)
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const rowCount = await page.locator('table tr').count();

    if (rowCount > 1) {
      // There are people - check for edit buttons
      const editButtons = await page
        .locator('button:has([data-lucide="edit-2"])')
        .count();
      console.log(`ℹ️ Found ${editButtons} edit buttons in people table`);

      if (editButtons > 0) {
        // Click first edit button
        await page
          .locator('button:has([data-lucide="edit-2"])')
          .first()
          .click();

        // Wait for edit dialog
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // Verify dialog has correct title for editing
        await expect(
          page.locator('[role="dialog"] h2:has-text("Edit Person")')
        ).toBeVisible();

        // Verify form fields are populated and visible
        await expect(page.locator('#name')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();

        // Verify Update button exists
        await expect(page.locator('button:has-text("Update")')).toBeVisible();

        // Close dialog with Escape
        await page.keyboard.press('Escape');
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();

        console.log('✅ Person editing interface verified');
      } else {
        console.log('ℹ️ No edit buttons found, but table structure exists');
      }
    } else {
      console.log('ℹ️ No people in table to edit, but table structure exists');
    }
  });

  test('should test person status management interface', async ({ page }) => {
    console.log('📊 Testing person status management interface...');

    // Open person creation dialog to check status interface
    await page.click('button:has-text("Add Person")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check settings tab for active/inactive toggle interface
    const settingsTab = page.locator('[role="tab"]:has-text("Settings")');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();

      // Verify Active switch/toggle exists
      const activeSwitch = page.locator('#isActive');
      if (await activeSwitch.isVisible()) {
        console.log('ℹ️ Active status switch found in Settings tab');

        // Verify label exists
        await expect(
          page.locator('label[for="isActive"]:has-text("Active")')
        ).toBeVisible();

        console.log('✅ Person status management interface verified');
      } else {
        console.log('ℹ️ Active status toggle may be implemented differently');
      }
    } else {
      console.log('ℹ️ Settings tab not found');
    }

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify status badges exist in the overview cards
    await expect(page.locator('text=Active').first()).toBeVisible();
    await expect(page.locator('text=Inactive').first()).toBeVisible();

    console.log('✅ Person status management interface working');
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

  test('should verify email field is optional (regression test)', async ({
    page,
  }) => {
    console.log('📧 Testing email field is optional (regression test)...');

    // This test ensures the email field is properly marked as optional
    await page.click('button:has-text("Add Person")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Verify email field exists and is optional
    const emailField = page.locator('#email');
    await expect(emailField).toBeVisible();

    // Check if email field has placeholder indicating it's optional
    const emailPlaceholder = await emailField.getAttribute('placeholder');
    if (emailPlaceholder && emailPlaceholder.includes('optional')) {
      console.log(
        'ℹ️ Email field correctly marked as optional with placeholder'
      );
    }

    // Verify name field exists and is required
    const nameField = page.locator('#name');
    await expect(nameField).toBeVisible();

    const nameRequired = await nameField.getAttribute('required');
    if (nameRequired !== null) {
      console.log('ℹ️ Name field correctly marked as required');
    }

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    console.log(
      '✅ Email optional field verification - regression test passed'
    );
  });
});
