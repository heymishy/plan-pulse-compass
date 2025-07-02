import { test, expect } from '@playwright/test';

test.describe('Multi-Step Import Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Settings', {
      timeout: 10000,
    });
  });

  test('should complete full multi-step import workflow', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `employee_name,email_address,job_title,department\n"John Doe","john@company.com","Software Engineer","Engineering"\n"Jane Smith","jane@company.com","Product Manager","Product"`;

    // Step 1: File Upload
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'multi-step.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Should show upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Step 2: Field Mapping
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="step-indicator-2"]')).toHaveClass(
      /active/
    );

    // Map fields
    await page.selectOption(
      '[data-testid="field-mapping-employee_name"]',
      'name'
    );
    await page.selectOption(
      '[data-testid="field-mapping-email_address"]',
      'email'
    );
    await page.selectOption('[data-testid="field-mapping-job_title"]', 'role');
    await page.selectOption(
      '[data-testid="field-mapping-department"]',
      'team_name'
    );

    await page.click('[data-testid="next-step-button"]');

    // Step 3: Data Preview and Validation
    await page.waitForSelector('[data-testid="preview-step"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="step-indicator-3"]')).toHaveClass(
      /active/
    );

    // Should show preview table
    await expect(page.locator('[data-testid="preview-table"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="preview-row-count"]')
    ).toContainText('2 rows');

    // Should show validation summary
    await expect(
      page.locator('[data-testid="validation-summary"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="valid-rows"]')).toContainText('2');
    await expect(page.locator('[data-testid="error-rows"]')).toContainText('0');

    await page.click('[data-testid="next-step-button"]');

    // Step 4: Import Configuration
    await page.waitForSelector('[data-testid="config-step"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="step-indicator-4"]')).toHaveClass(
      /active/
    );

    // Should show import options
    await expect(
      page.locator('[data-testid="import-mode-selector"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="duplicate-handling-selector"]')
    ).toBeVisible();

    // Select import options
    await page.selectOption('[data-testid="import-mode-selector"]', 'insert');
    await page.selectOption(
      '[data-testid="duplicate-handling-selector"]',
      'skip'
    );

    await page.click('[data-testid="start-import-button"]');

    // Step 5: Import Execution
    await page.waitForSelector('[data-testid="import-step"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="step-indicator-5"]')).toHaveClass(
      /active/
    );

    // Should show import progress
    await expect(
      page.locator('[data-testid="import-progress-bar"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Processing'
    );

    // Should show row processing progress
    await expect(page.locator('[data-testid="rows-processed"]')).toBeVisible();

    // Step 6: Completion
    await page.waitForSelector('[data-testid="completion-step"]', {
      timeout: 30000,
    });
    await expect(page.locator('[data-testid="step-indicator-6"]')).toHaveClass(
      /active/
    );

    // Should show success summary
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="imported-count"]')).toContainText(
      '2'
    );
    await expect(page.locator('[data-testid="import-time"]')).toBeVisible();
  });

  test('should allow navigation between steps with data persistence', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,role\n"John Doe","john@company.com","Engineer"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'navigation-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Go to field mapping step
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });

    // Configure mapping
    await page.selectOption('[data-testid="field-mapping-name"]', 'name');
    await page.selectOption('[data-testid="field-mapping-email"]', 'email');

    // Go to preview step
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="preview-step"]', {
      timeout: 10000,
    });

    // Navigate back to mapping step
    await page.click('[data-testid="back-step-button"]');
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });

    // Should preserve mapping selections
    await expect(
      page.locator('[data-testid="field-mapping-name"]')
    ).toHaveValue('name');
    await expect(
      page.locator('[data-testid="field-mapping-email"]')
    ).toHaveValue('email');

    // Navigate forward again
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="preview-step"]', {
      timeout: 10000,
    });

    // Should show same preview data
    await expect(page.locator('[data-testid="preview-table"]')).toBeVisible();
  });

  test('should handle errors in different steps appropriately', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // Step 1: Upload invalid file
    const invalidCsvContent = `name,email\n"John Doe","invalid-email"\n"Jane Smith"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCsvContent),
    });

    // Should detect CSV parsing issues
    await page.waitForSelector('[data-testid="parsing-error"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="parsing-error-message"]')
    ).toContainText('CSV format error');

    // Should offer to fix or continue
    await expect(
      page.locator('[data-testid="continue-with-errors-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="fix-errors-button"]')
    ).toBeVisible();

    await page.click('[data-testid="continue-with-errors-button"]');

    // Step 2: Field mapping with missing required fields
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });

    // Try to proceed without mapping required fields
    await page.click('[data-testid="next-step-button"]');

    // Should show validation errors
    await expect(
      page.locator('[data-testid="mapping-validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="required-field-error"]')
    ).toContainText('Required fields must be mapped');

    // Next button should be disabled
    await expect(
      page.locator('[data-testid="next-step-button"]')
    ).toBeDisabled();

    // Map required fields
    await page.selectOption('[data-testid="field-mapping-name"]', 'name');
    await page.selectOption('[data-testid="field-mapping-email"]', 'email');

    // Should enable next button
    await expect(
      page.locator('[data-testid="next-step-button"]')
    ).toBeEnabled();

    await page.click('[data-testid="next-step-button"]');

    // Step 3: Preview with validation errors
    await page.waitForSelector('[data-testid="preview-step"]', {
      timeout: 10000,
    });

    // Should show validation errors in preview
    await expect(
      page.locator('[data-testid="validation-error-count"]')
    ).toContainText('1');
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText(
      'Invalid email format'
    );

    // Should allow proceeding with partial data
    await expect(
      page.locator('[data-testid="proceed-with-valid-data"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="fix-errors-first"]')
    ).toBeVisible();
  });

  test('should support import cancellation at any step', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // Create large CSV for longer processing time
    const largeRows = Array.from(
      { length: 1000 },
      (_, i) => `"User ${i}","user${i}@company.com","Role ${i}"`
    );
    const largeCsvContent = `name,email,role\n${largeRows.join('\n')}`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large-file.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeCsvContent),
    });

    // Should show cancel button during upload
    await expect(
      page.locator('[data-testid="cancel-upload-button"]')
    ).toBeVisible();

    // Wait for field mapping step
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });

    // Should show cancel button in each step
    await expect(
      page.locator('[data-testid="cancel-import-button"]')
    ).toBeVisible();

    // Proceed to import execution
    await page.click('[data-testid="next-step-button"]'); // to preview
    await page.waitForSelector('[data-testid="preview-step"]', {
      timeout: 10000,
    });

    await page.click('[data-testid="next-step-button"]'); // to config
    await page.waitForSelector('[data-testid="config-step"]', {
      timeout: 10000,
    });

    await page.click('[data-testid="start-import-button"]'); // to execution
    await page.waitForSelector('[data-testid="import-step"]', {
      timeout: 10000,
    });

    // Should show cancel button during import
    await expect(
      page.locator('[data-testid="cancel-import-button"]')
    ).toBeVisible();

    // Cancel the import
    await page.click('[data-testid="cancel-import-button"]');

    // Should show cancellation confirmation
    await page.waitForSelector('[data-testid="cancel-confirmation-dialog"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="cancel-message"]')).toContainText(
      'Are you sure you want to cancel?'
    );

    await page.click('[data-testid="confirm-cancel-button"]');

    // Should return to initial state
    await page.waitForSelector('[data-testid="import-cancelled"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="cancel-status"]')).toContainText(
      'Import cancelled'
    );

    // Should offer to start over
    await expect(
      page.locator('[data-testid="start-over-button"]')
    ).toBeVisible();
  });

  test('should provide step-by-step help and guidance', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // Should show help button in each step
    await expect(page.locator('[data-testid="help-button"]')).toBeVisible();

    // Click help for initial step
    await page.click('[data-testid="help-button"]');
    await page.waitForSelector('[data-testid="help-panel"]', {
      timeout: 10000,
    });

    await expect(page.locator('[data-testid="help-title"]')).toContainText(
      'File Upload'
    );
    await expect(page.locator('[data-testid="help-content"]')).toContainText(
      'Select a CSV file'
    );

    // Should show format requirements
    await expect(
      page.locator('[data-testid="format-requirements"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="sample-format"]')).toBeVisible();

    // Close help and proceed
    await page.click('[data-testid="close-help-button"]');

    const csvContent = `name,email,role\n"John Doe","john@company.com","Engineer"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'help-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Field mapping step help
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });

    await page.click('[data-testid="help-button"]');
    await page.waitForSelector('[data-testid="help-panel"]', {
      timeout: 10000,
    });

    await expect(page.locator('[data-testid="help-title"]')).toContainText(
      'Field Mapping'
    );
    await expect(page.locator('[data-testid="help-content"]')).toContainText(
      'Map CSV columns to data fields'
    );

    // Should show tooltips for each field
    await page.hover('[data-testid="field-mapping-name"]');
    await expect(page.locator('[data-testid="field-tooltip"]')).toBeVisible();

    // Should show auto-mapping suggestions
    await expect(
      page.locator('[data-testid="auto-map-suggestion"]')
    ).toBeVisible();
    await page.click('[data-testid="apply-auto-mapping"]');

    // Should auto-map obvious fields
    await expect(
      page.locator('[data-testid="field-mapping-name"]')
    ).toHaveValue('name');
    await expect(
      page.locator('[data-testid="field-mapping-email"]')
    ).toHaveValue('email');
  });

  test('should handle browser refresh and session recovery', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,role\n"John Doe","john@company.com","Engineer"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'session-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Go to field mapping step
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });

    // Configure mapping
    await page.selectOption('[data-testid="field-mapping-name"]', 'name');
    await page.selectOption('[data-testid="field-mapping-email"]', 'email');

    // Refresh the page
    await page.reload();

    // Should detect interrupted import session
    await page.waitForSelector('[data-testid="session-recovery-dialog"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="recovery-message"]')
    ).toContainText('Incomplete import session detected');

    // Should offer to resume or start over
    await expect(
      page.locator('[data-testid="resume-session-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="start-new-session-button"]')
    ).toBeVisible();

    // Resume session
    await page.click('[data-testid="resume-session-button"]');

    // Should restore to the same step with preserved data
    await page.waitForSelector('[data-testid="field-mapping-step"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="field-mapping-name"]')
    ).toHaveValue('name');
    await expect(
      page.locator('[data-testid="field-mapping-email"]')
    ).toHaveValue('email');
  });
});
