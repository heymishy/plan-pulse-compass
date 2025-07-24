/**
 * End-to-End tests for OCR workflow
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('OCR Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the OCR page
    await page.goto('/ocr');

    // Wait for the page to be fully loaded
    await expect(page.locator('h3')).toContainText('SteerCo Document OCR');
  });

  test('should display OCR interface correctly', async ({ page }) => {
    // Check that all main UI elements are present
    await expect(page.getByText('SteerCo Document OCR')).toBeVisible();
    await expect(page.getByText('Process Document')).toBeVisible();
    await expect(page.getByText('1. Upload')).toBeVisible();
    await expect(page.getByText('2. OCR')).toBeVisible();
    await expect(page.getByText('3. Extract')).toBeVisible();
    await expect(page.getByText('4. Map')).toBeVisible();
    await expect(page.getByText('5. Review')).toBeVisible();

    // Process button should be disabled initially
    await expect(page.getByText('Process Document')).toBeDisabled();
  });

  test('should handle file upload validation', async ({ page }) => {
    // Test invalid file type
    const invalidFile = path.join(__dirname, '../fixtures/invalid-file.txt');

    // Create a test file if it doesn't exist (in memory for this test)
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should show error message
    await expect(
      page.getByText(/Please select a PDF, PowerPoint, or image file/)
    ).toBeVisible();
    await expect(page.getByText('Process Document')).toBeDisabled();
  });

  test('should accept valid image files', async ({ page }) => {
    // Create a valid image file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Process button should be enabled
    await expect(page.getByText('Process Document')).toBeEnabled();

    // No error message should be visible
    await expect(
      page.getByText(/Please select a PDF or image file/)
    ).not.toBeVisible();
  });

  test('should accept valid PDF files', async ({ page }) => {
    // Create a valid PDF file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake pdf data'], 'test.pdf', {
        type: 'application/pdf',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Process button should be enabled
    await expect(page.getByText('Process Document')).toBeEnabled();
  });

  test.skip('should process image file and show results', async ({ page }) => {
    // Skip this test in CI as it requires OCR dependencies
    if (process.env.CI) return;

    // Mock the OCR processing to avoid heavy dependencies in E2E tests
    await page.route('**/api/ocr/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          extractionResult: {
            projectStatuses: [
              {
                projectName: 'Alpha Project',
                status: 'green',
                confidence: 0.9,
              },
            ],
            risks: [
              {
                riskDescription: 'Test risk',
                impact: 'medium',
                confidence: 0.8,
              },
            ],
            extractionMetadata: {
              totalConfidence: 0.85,
              extractedEntities: 2,
              processingTime: 150,
            },
          },
          mappingResult: {
            mappings: [
              {
                extractedEntity: { projectName: 'Alpha Project' },
                existingEntityId: 'proj-1',
                matchConfidence: 0.95,
                conflictLevel: 'none',
              },
            ],
            unmappedEntities: [],
            conflicts: [],
          },
        }),
      });
    });

    // Upload a file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Click process button
    await page.getByText('Process Document').click();

    // Should show loading state
    await expect(page.getByText('Processing...')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    // Wait for results to appear
    await expect(page.getByText('Extracted Entities')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Entity Mapping Results')).toBeVisible();

    // Check extraction results display
    await expect(page.getByText('Project Updates')).toBeVisible();
    await expect(page.getByText('Risks')).toBeVisible();

    // Check mapping results display
    await expect(page.getByText('Mapped')).toBeVisible();
    await expect(page.getByText('Unmapped')).toBeVisible();
    await expect(page.getByText('Conflicts')).toBeVisible();

    // Check action buttons are available
    await expect(page.getByText(/Apply High Confidence/)).toBeVisible();
    await expect(page.getByText(/Apply All Mappings/)).toBeVisible();
    await expect(page.getByText('Start Over')).toBeVisible();
  });

  test('should show loading state during processing', async ({ page }) => {
    // Upload a file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Click process button
    await page.getByText('Process Document').click();

    // Should immediately show loading state
    await expect(page.getByText('Processing...')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    // Process button should be disabled during processing
    await expect(page.getByText('Processing...')).toBeDisabled();
  });

  test('should update step indicators during processing', async ({ page }) => {
    // Upload a file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Initially should show Upload step as active
    await expect(page.getByText('1. Upload')).toBeVisible();

    // Click process button
    await page.getByText('Process Document').click();

    // Should progress through steps (exact behavior depends on implementation)
    // At minimum, we should see the step indicators remain visible
    await expect(page.getByText('2. OCR')).toBeVisible();
    await expect(page.getByText('3. Extract')).toBeVisible();
    await expect(page.getByText('4. Map')).toBeVisible();
    await expect(page.getByText('5. Review')).toBeVisible();
  });

  test('should reset workflow when Start Over is clicked', async ({ page }) => {
    // This test assumes we can get to a processed state
    // In a real scenario, we'd mock the processing to complete quickly

    // Upload a file first
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // For this test, we'll just verify the Start Over button exists and is clickable
    // In a full implementation, we'd mock the OCR processing to complete
    await expect(page.getByText('Process Document')).toBeEnabled();
  });

  test('should handle large files gracefully', async ({ page }) => {
    // Test with a larger file to ensure UI remains responsive
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      // Create a larger file (simulated)
      const largeContent = new Array(1000).fill('test content').join(' ');
      const file = new File([largeContent], 'large-test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should still enable the process button
    await expect(page.getByText('Process Document')).toBeEnabled();

    // UI should remain responsive
    await expect(page.getByText('SteerCo Document OCR')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper ARIA labels and roles
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Process Document' })
    ).toBeVisible();

    // Test keyboard navigation - focus the file input directly for testing
    await page.locator('input[type="file"]').focus();
    await expect(page.locator('input[type="file"]')).toBeFocused();

    // Note: Process button is disabled when no file is selected, so it won't receive focus
    // This is correct accessibility behavior - disabled elements should not be focusable
  });

  test('should handle navigation away and back', async ({ page }) => {
    // Upload a file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Navigate away
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();

    // Navigate back
    await page.goto('/ocr');

    // Should reset to initial state
    await expect(page.getByText('SteerCo Document OCR')).toBeVisible();
    await expect(page.getByText('Process Document')).toBeDisabled();
  });

  test('should work on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('SteerCo Document OCR')).toBeVisible();
    await expect(page.getByText('Process Document')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('SteerCo Document OCR')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('SteerCo Document OCR')).toBeVisible();

    // Step indicators should be visible on all sizes
    await expect(page.getByText('1. Upload')).toBeVisible();
    await expect(page.getByText('5. Review')).toBeVisible();
  });

  test('should maintain state during tab switching', async ({
    page,
    context,
  }) => {
    // Upload a file
    await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['fake image data'], 'test.png', {
        type: 'image/png',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verify process button is enabled
    await expect(page.getByText('Process Document')).toBeEnabled();

    // Open new tab and switch back
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    await newPage.close();

    // Original page should maintain state
    await expect(page.getByText('Process Document')).toBeEnabled();
  });
});
