import {
  test,
  expect,
  Page,
  ConsoleMessage as PlaywrightConsoleMessage,
} from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
}

async function captureConsoleErrors(page: Page): Promise<ConsoleMessage[]> {
  const consoleMessages: ConsoleMessage[] = [];

  page.on('console', (msg: PlaywrightConsoleMessage) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
          ? `${msg.location().url}:${msg.location().lineNumber}`
          : undefined,
      });
    }
  });

  page.on('pageerror', (error: Error) => {
    consoleMessages.push({
      type: 'error',
      text: `Page Error: ${error.message}`,
      location: error.stack,
    });
  });

  return consoleMessages;
}

test.describe('Project Modal Tabs Console Error Testing', () => {
  test('Project edit modal tabs should load without console errors', async ({
    page,
  }) => {
    const consoleMessages = await captureConsoleErrors(page);

    console.log('🧪 Testing Project Edit Modal Tabs');

    // Navigate to projects page
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('   Navigated to Projects page');

    // Look for any project row to click (or create a test project if none exist)
    const projectRows = page.locator(
      '[data-testid*="project"], .project-row, tbody tr, [role="row"]'
    );
    const rowCount = await projectRows.count();

    console.log(`   Found ${rowCount} project rows`);

    if (rowCount === 0) {
      console.log('   No projects found - creating test project first');

      // Look for Add Project button
      const addButton = page.locator(
        'button:has-text("Add Project"), button:has-text("New Project"), [data-testid="add-project"]'
      );
      if ((await addButton.count()) > 0) {
        await addButton.first().click();
        await page.waitForTimeout(1000);

        // Fill in minimal project data
        await page.fill(
          'input[name="name"], input[placeholder*="name"]',
          'Test Project for Console Testing'
        );
        await page.fill(
          'textarea[name="description"], textarea[placeholder*="description"]',
          'Test project for E2E console error testing'
        );

        // Save the project
        const saveButton = page.locator(
          'button:has-text("Save"), button:has-text("Create"), button[type="submit"]'
        );
        if ((await saveButton.count()) > 0) {
          await saveButton.first().click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Now try to open a project for editing
    const updatedRows = page.locator(
      '[data-testid*="project"], .project-row, tbody tr, [role="row"]'
    );
    const updatedRowCount = await updatedRows.count();

    if (updatedRowCount > 0) {
      console.log('   Opening project edit modal');

      // Try different ways to open the edit modal
      const editButton = page.locator(
        'button:has-text("Edit"), [data-testid*="edit"], [aria-label*="edit"]'
      );
      if ((await editButton.count()) > 0) {
        await editButton.first().click();
      } else {
        // Click on the first project row
        await updatedRows.first().click();
      }

      await page.waitForTimeout(2000);

      // Look for modal tabs - targeting the Solutions & Skills tab specifically
      const modalTabs = page.locator(
        '.modal [role="tablist"] button, .dialog [role="tablist"] button, [data-testid*="tab"]'
      );
      const tabCount = await modalTabs.count();

      console.log(`   Found ${tabCount} tabs in project modal`);

      if (tabCount > 0) {
        // Test each tab, especially Solutions & Skills
        for (let i = 0; i < tabCount; i++) {
          try {
            const tab = modalTabs.nth(i);
            const tabText = await tab.textContent();
            console.log(`   Testing tab: ${tabText}`);

            await tab.click();
            await page.waitForTimeout(1500); // Extra wait for Solutions & Skills tab to load

            // Special check for Solutions & Skills tab
            if (
              tabText &&
              (tabText.includes('Solutions') || tabText.includes('Skills'))
            ) {
              console.log(
                '   ⭐ Testing Solutions & Skills tab (previously had forEach error)'
              );

              // Wait longer for this tab to fully load
              await page.waitForTimeout(3000);

              // Check if the tab content loaded properly
              const tabContent = page.locator(
                '.tab-content, [role="tabpanel"], .modal [role="tabpanel"]'
              );
              await expect(tabContent).toBeVisible({ timeout: 5000 });
            }
          } catch (error) {
            console.warn(`   Could not click tab ${i}: ${error}`);
          }
        }
      }

      // Close the modal
      const closeButton = page.locator(
        'button:has-text("Close"), button:has-text("Cancel"), [aria-label*="close"], .modal-close'
      );
      if ((await closeButton.count()) > 0) {
        await closeButton.first().click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('   ⚠️  No projects available to test modal tabs');
    }

    // Check for console errors
    if (consoleMessages.length > 0) {
      console.log(`❌ Found ${consoleMessages.length} console messages:`);
      consoleMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
        if (msg.location) {
          console.log(`      Location: ${msg.location}`);
        }
      });

      // Filter out non-critical errors
      const criticalErrors = consoleMessages.filter(
        msg =>
          msg.type === 'error' &&
          !msg.text.includes('favicon') &&
          !msg.text.includes('DevTools') &&
          !msg.text.includes('Extension')
      );

      if (criticalErrors.length > 0) {
        throw new Error(
          `Found ${criticalErrors.length} critical console errors in project modal tabs`
        );
      }
    } else {
      console.log('✅ No console errors found in project modal tabs');
    }
  });
});
