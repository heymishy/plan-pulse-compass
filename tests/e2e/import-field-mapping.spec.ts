import { test, expect } from '@playwright/test';

test.describe('Import Field Mapping Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  });

  test('should allow custom field mapping for CSV import', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // Create CSV with non-standard headers
    const csvContent = `Full Name,Email Address,Job Title,Team,Salary\n"John Doe","john@example.com","Software Engineer","Frontend Team","95000"\n"Jane Smith","jane@example.com","Product Manager","Backend Team","120000"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'custom-headers.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Should show field mapping interface
    await page.waitForSelector('[data-testid="field-mapping-container"]', {
      timeout: 10000,
    });

    // Map custom headers to standard fields
    await page.selectOption('[data-testid="field-mapping-Full Name"]', 'name');
    await page.selectOption(
      '[data-testid="field-mapping-Email Address"]',
      'email'
    );
    await page.selectOption('[data-testid="field-mapping-Job Title"]', 'role');
    await page.selectOption('[data-testid="field-mapping-Team"]', 'team_name');
    await page.selectOption(
      '[data-testid="field-mapping-Salary"]',
      'annual_salary'
    );

    // Continue with import
    await page.click('button:has-text("Continue Import")');

    await page.waitForSelector('text=Import Completed', { timeout: 30000 });
    await expect(page.getByTestId('inserted-count')).toContainText('2');
  });

  test('should save and load field mappings for reuse', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `Employee_Name,Email_Address,Position\n"John Doe","john@example.com","Engineer"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'save-mapping.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('[data-testid="field-mapping-container"]', {
      timeout: 10000,
    });

    // Create custom mapping
    await page.selectOption(
      '[data-testid="field-mapping-Employee_Name"]',
      'name'
    );
    await page.selectOption(
      '[data-testid="field-mapping-Email_Address"]',
      'email'
    );
    await page.selectOption('[data-testid="field-mapping-Position"]', 'role');

    // Save mapping with a name
    await page.fill('[data-testid="mapping-name-input"]', 'HR Export Format');
    await page.click('[data-testid="save-mapping-button"]');

    await expect(page.locator('text=Mapping saved successfully')).toBeVisible();

    // Upload same format again
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'reuse-mapping.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Should show saved mapping option
    await page.waitForSelector('[data-testid="saved-mappings-dropdown"]', {
      timeout: 10000,
    });
    await page.selectOption(
      '[data-testid="saved-mappings-dropdown"]',
      'HR Export Format'
    );

    // Mappings should be pre-filled
    await expect(
      page.locator('[data-testid="field-mapping-Employee_Name"]')
    ).toHaveValue('name');
    await expect(
      page.locator('[data-testid="field-mapping-Email_Address"]')
    ).toHaveValue('email');
    await expect(
      page.locator('[data-testid="field-mapping-Position"]')
    ).toHaveValue('role');
  });

  test('should provide field mapping suggestions based on similarity', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    // CSV with similar but not exact header names
    const csvContent = `person_name,email_addr,job_role,team_assignment\n"John Doe","john@example.com","Developer","Engineering"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'similar-headers.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('[data-testid="field-mapping-container"]', {
      timeout: 10000,
    });

    // Should show auto-suggested mappings
    await expect(
      page.locator('[data-testid="field-mapping-person_name"]')
    ).toHaveValue('name');
    await expect(
      page.locator('[data-testid="field-mapping-email_addr"]')
    ).toHaveValue('email');
    await expect(
      page.locator('[data-testid="field-mapping-job_role"]')
    ).toHaveValue('role');
    await expect(
      page.locator('[data-testid="field-mapping-team_assignment"]')
    ).toHaveValue('team_name');

    // Should show confidence indicators
    await expect(
      page.locator('[data-testid="confidence-person_name"]')
    ).toContainText('High confidence');
    await expect(
      page.locator('[data-testid="confidence-email_addr"]')
    ).toContainText('Medium confidence');
  });

  test('should handle required field validation in mapping', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `description,notes,optional_field\n"Some description","Some notes","Optional value"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'missing-required.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('[data-testid="field-mapping-container"]', {
      timeout: 10000,
    });

    // Try to continue without mapping required fields
    await page.click('button:has-text("Continue Import")');

    // Should show validation errors
    await expect(
      page.locator('[data-testid="mapping-error-name"]')
    ).toContainText('Name is required');
    await expect(
      page.locator('[data-testid="mapping-error-email"]')
    ).toContainText('Email is required');

    // Import button should be disabled
    await expect(
      page.locator('button:has-text("Continue Import")')
    ).toBeDisabled();
  });

  test('should preview data before import with field mapping applied', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `emp_name,emp_email,position,team_name\n"John Doe","john@example.com","Senior Developer","Frontend"\n"Jane Smith","jane@example.com","Product Manager","Product"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'preview-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('[data-testid="field-mapping-container"]', {
      timeout: 10000,
    });

    // Map fields
    await page.selectOption('[data-testid="field-mapping-emp_name"]', 'name');
    await page.selectOption('[data-testid="field-mapping-emp_email"]', 'email');
    await page.selectOption('[data-testid="field-mapping-position"]', 'role');
    await page.selectOption(
      '[data-testid="field-mapping-team_name"]',
      'team_name'
    );

    // Show preview
    await page.click('[data-testid="preview-data-button"]');

    await page.waitForSelector('[data-testid="data-preview-table"]', {
      timeout: 10000,
    });

    // Should show mapped data with correct headers
    await expect(
      page.locator('[data-testid="preview-header-name"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preview-header-email"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preview-row-0-name"]')
    ).toContainText('John Doe');
    await expect(
      page.locator('[data-testid="preview-row-0-email"]')
    ).toContainText('john@example.com');
    await expect(
      page.locator('[data-testid="preview-row-1-name"]')
    ).toContainText('Jane Smith');
  });

  test('should handle duplicate field mappings gracefully', async ({
    page,
  }) => {
    await page.click('text=Settings');
    await page.click('text=Import/Export');
    await page.waitForSelector('[data-testid="people-tab"]', {
      timeout: 10000,
    });

    const csvContent = `name1,name2,email\n"John","Johnny","john@example.com"`;

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'duplicate-mapping.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForSelector('[data-testid="field-mapping-container"]', {
      timeout: 10000,
    });

    // Map both fields to the same target
    await page.selectOption('[data-testid="field-mapping-name1"]', 'name');
    await page.selectOption('[data-testid="field-mapping-name2"]', 'name');

    // Should show warning about duplicate mapping
    await expect(
      page.locator('[data-testid="duplicate-mapping-warning"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="duplicate-mapping-warning"]')
    ).toContainText('Multiple fields mapped to "name"');

    // Should suggest resolution
    await expect(
      page.locator('[data-testid="duplicate-resolution-suggestion"]')
    ).toContainText('Consider combining fields or skipping one');
  });
});
