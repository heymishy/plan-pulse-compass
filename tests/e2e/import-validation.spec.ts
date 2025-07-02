import { test, expect } from '@playwright/test';

test.describe('Import Validation and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test('should validate email formats and show specific errors', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,role\n"John Doe","invalid-email","Engineer"\n"Jane Smith","jane@","Developer"\n"Bob Wilson","","Manager"\n"Alice Brown","alice@company.com","Designer"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'email-validation.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });

    // Should show validation summary
    await expect(page.getByTestId('validation-summary')).toBeVisible();
    await expect(page.getByTestId('valid-rows-count')).toContainText('1'); // Only Alice
    await expect(page.getByTestId('error-rows-count')).toContainText('3'); // John, Jane, Bob

    // Should show detailed errors
    await page.click('[data-testid="show-errors-button"]');
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText(
      'Invalid email format: invalid-email'
    );
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText(
      'Invalid email format: jane@'
    );
    await expect(page.locator('[data-testid="error-row-3"]')).toContainText(
      'Email is required'
    );
  });

  test('should validate date formats and provide format suggestions', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,start_date,end_date\n"John Doe","john@company.com","32/13/2023",""\n"Jane Smith","jane@company.com","2023-13-45","2024-02-30"\n"Bob Wilson","bob@company.com","January 15, 2023","December 31, 2024"\n"Alice Brown","alice@company.com","2023-01-15","2024-12-31"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'date-validation.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });

    await page.click('[data-testid="show-errors-button"]');

    // Should show specific date validation errors
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText(
      'Invalid date: 32/13/2023'
    );
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText(
      'Invalid date: 2023-13-45'
    );
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText(
      'Invalid date: 2024-02-30'
    );

    // Should suggest date format
    await expect(
      page.locator('[data-testid="date-format-suggestion"]')
    ).toContainText('Expected format: YYYY-MM-DD');

    // Bob's dates should be converted successfully
    await expect(page.getByTestId('valid-rows-count')).toContainText('2'); // Bob and Alice
  });

  test('should validate salary and numeric fields', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,annual_salary,hourly_rate\n"John Doe","john@company.com","not-a-number","50"\n"Jane Smith","jane@company.com","-5000","abc"\n"Bob Wilson","bob@company.com","95000.50","75.25"\n"Alice Brown","alice@company.com","150000","100"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'numeric-validation.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });

    await page.click('[data-testid="show-errors-button"]');

    // Should validate numeric fields
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText(
      'Invalid number: not-a-number'
    );
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText(
      'Salary cannot be negative'
    );
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText(
      'Invalid number: abc'
    );

    await expect(page.getByTestId('valid-rows-count')).toContainText('2'); // Bob and Alice
  });

  test('should validate business rules and relationships', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,role,team_name,start_date,end_date\n"John Doe","john@company.com","Senior Manager","NonExistent Team","2023-01-15","2022-12-31"\n"Jane Smith","jane@company.com","","Frontend Team","2023-01-15","2024-12-31"\n"Bob Wilson","bob@company.com","Developer","Frontend Team","2023-01-15",""\n"Alice Brown","alice@company.com","Designer","Frontend Team","2023-01-15","2024-12-31"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'business-validation.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });

    await page.click('[data-testid="show-errors-button"]');

    // Should validate business rules
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText(
      'Team "NonExistent Team" not found'
    );
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText(
      'End date cannot be before start date'
    );
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText(
      'Role is required'
    );

    // Should suggest corrections
    await expect(
      page.locator('[data-testid="team-suggestion-row-1"]')
    ).toContainText('Did you mean: Frontend Team?');
  });

  test('should handle duplicate detection with merge options', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // First import some data
    const initialData = `name,email,role\n"John Doe","john@company.com","Developer"`;

    let fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'initial-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(initialData),
    });

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });

    // Now try to import duplicate data with different role
    const duplicateData = `name,email,role\n"John Doe","john@company.com","Senior Developer"`;

    fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'duplicate-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(duplicateData),
    });

    // Should detect duplicate and show merge options
    await page.waitForSelector('[data-testid="duplicate-detection-dialog"]', {
      timeout: 10000,
    });

    await expect(page.locator('[data-testid="duplicate-found"]')).toContainText(
      'Duplicate person found: John Doe'
    );
    await expect(page.locator('[data-testid="existing-role"]')).toContainText(
      'Current role: Developer'
    );
    await expect(page.locator('[data-testid="new-role"]')).toContainText(
      'New role: Senior Developer'
    );

    // Should offer merge options
    await expect(
      page.locator('[data-testid="merge-option-skip"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="merge-option-update"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="merge-option-create-new"]')
    ).toBeVisible();

    // Choose to update
    await page.click('[data-testid="merge-option-update"]');
    await page.click('[data-testid="apply-merge-action"]');

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });
    await expect(page.getByTestId('updated-count')).toContainText('1');
  });

  test('should validate CSV format and encoding issues', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // Create malformed CSV
    const malformedCSV = `name,email"role\n"John Doe","john@company.com","Developer"\n"Jane Smith","jane@company.com""Product Manager"\n"Bob Wilson","bob@company.com","Designer"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'malformed.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(malformedCSV),
    });

    // Should detect CSV format issues
    await page.waitForSelector('[data-testid="csv-format-errors"]', {
      timeout: 10000,
    });

    await expect(page.locator('[data-testid="format-error"]')).toContainText(
      'CSV format error detected'
    );
    await expect(
      page.locator('[data-testid="format-error-details"]')
    ).toContainText('Unclosed quote in row 2');

    // Should suggest fixes
    await expect(
      page.locator('[data-testid="format-fix-suggestion"]')
    ).toContainText('Check for missing quotes or extra commas');

    // Should offer to auto-fix if possible
    await expect(page.locator('[data-testid="auto-fix-button"]')).toBeVisible();
  });

  test('should provide export of validation results', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name,email,role\n"John Doe","invalid-email","Engineer"\n"Jane Smith","jane@company.com","Developer"\n"Bob Wilson","","Manager"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'validation-export.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });

    // Should offer to export validation results
    await expect(
      page.locator('[data-testid="export-errors-button"]')
    ).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-errors-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/validation-results.*\.csv$/);

    // Should also offer to export corrected data
    await expect(
      page.locator('[data-testid="export-valid-data-button"]')
    ).toBeVisible();

    const validDataDownload = page.waitForEvent('download');
    await page.click('[data-testid="export-valid-data-button"]');
    const validDownload = await validDataDownload;

    expect(validDownload.suggestedFilename()).toMatch(/valid-data.*\.csv$/);
  });

  test('should handle large file validation efficiently', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // Create large CSV with mixed valid/invalid data
    const largeRows = Array.from({ length: 1000 }, (_, i) => {
      const isValid = i % 3 === 0; // Every 3rd row is valid
      const email = isValid ? `user${i}@company.com` : `invalid-email-${i}`;
      return `"User ${i}","${email}","Role ${i}"`;
    });

    const largeCsvContent = `name,email,role\n${largeRows.join('\n')}`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large-validation.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeCsvContent),
    });

    // Should show validation progress
    await expect(
      page.locator('[data-testid="validation-progress"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-progress-bar"]')
    ).toBeVisible();

    await page.waitForSelector('text=Import Completed', { timeout: 60000 });

    // Should show summary of large file validation
    await expect(page.getByTestId('total-rows-processed')).toContainText(
      '1000'
    );
    await expect(page.getByTestId('validation-time')).toBeVisible();

    // Should offer pagination for error viewing
    await page.click('[data-testid="show-errors-button"]');
    await expect(
      page.locator('[data-testid="error-pagination"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="errors-per-page-selector"]')
    ).toBeVisible();
  });
});
