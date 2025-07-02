import { describe, it, expect } from 'vitest';

// Mock the validation logic from AdvancedDataImport
const validateCSVData = (
  mapping: Record<string, string>,
  config: { fields: any[] },
  fileContent: string
): string[] => {
  const errors: string[] = [];

  // Simulate parsing CSV
  const rows = fileContent.split('\n').map(row => row.split(','));
  const headers = rows[0];
  const dataRows = rows.slice(1);

  config.fields.forEach(field => {
    const mappedHeader = mapping[field.id];
    if (!mappedHeader || mappedHeader === '__SKIP_MAPPING__') return;

    const headerIndex = headers.findIndex(h => h === mappedHeader);
    if (headerIndex === -1) return;

    // Check each data row
    dataRows.forEach((row, rowIndex) => {
      const value = row[headerIndex];
      if (!value || value.trim() === '') {
        if (field.required) {
          errors.push(
            `Row ${rowIndex + 2}: ${field.label} is required but empty.`
          );
        }
        return;
      }

      // Type validation
      if (field.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(
            `Row ${rowIndex + 2}: ${field.label} must be a number, got "${value}".`
          );
        }
      } else if (field.type === 'date') {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(
            `Row ${rowIndex + 2}: ${field.label} must be a valid date, got "${value}".`
          );
        }
      } else if (field.type === 'select' && field.options) {
        // Case-insensitive validation for select fields
        const normalizedValue = value.toLowerCase().trim();
        const normalizedOptions = field.options.map(opt =>
          String(opt).toLowerCase().trim()
        );
        if (!normalizedOptions.includes(normalizedValue)) {
          errors.push(
            `Row ${rowIndex + 2}: ${field.label} value "${value}" is not in the allowed options: ${field.options.join(', ')}.`
          );
        }
      }
    });
  });

  return errors;
};

describe('Advanced Import Validation', () => {
  it('should handle case-insensitive validation for Project Status', () => {
    const config = {
      fields: [
        {
          id: 'project_status',
          label: 'Project Status',
          required: false,
          type: 'select',
          options: ['planning', 'active', 'completed', 'cancelled'],
        },
      ],
    };

    const mapping = {
      project_status: 'Status',
    };

    const csvContent = `Name,Status,Description
Project 1,Active,Test project
Project 2,ACTIVE,Another test
Project 3,active,Third test
Project 4,Planning,Fourth test`;

    const errors = validateCSVData(mapping, config, csvContent);

    // Should not have any validation errors for case-insensitive status values
    expect(errors).toHaveLength(0);
  });

  it('should not validate text fields against existing options', () => {
    const config = {
      fields: [
        {
          id: 'project_name',
          label: 'Project Name',
          required: true,
          type: 'text', // Text field, not select
        },
        {
          id: 'epic_name',
          label: 'Epic Name',
          required: false,
          type: 'text', // Text field, not select
        },
      ],
    };

    const mapping = {
      project_name: 'Project Name',
      epic_name: 'Epic Name',
    };

    const csvContent = `Project Name,Epic Name,Description
New Project 1,New Epic 1,Test project
Q4 2024 S4 - Mobile App Redesign Complete,New Epic 2,Another test
Q4 2024 S1 - Data Pipeline Optimization,Security,Third test`;

    const errors = validateCSVData(mapping, config, csvContent);

    // Should not have any validation errors for text fields with new values
    expect(errors).toHaveLength(0);
  });

  it('should handle milestone field as optional', () => {
    const config = {
      fields: [
        {
          id: 'milestone_name',
          label: 'Milestone Name',
          required: false, // Optional field
          type: 'text',
        },
      ],
    };

    const mapping = {
      milestone_name: 'Milestone Name',
    };

    const csvContent = `Project Name,Milestone Name,Description
Project 1,,Test project without milestone
Project 2,Q4 2024 S1 - Digital Mortgage Launch,Test project with milestone`;

    const errors = validateCSVData(mapping, config, csvContent);

    // Should not have any validation errors for optional milestone field
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields properly', () => {
    const config = {
      fields: [
        {
          id: 'project_name',
          label: 'Project Name',
          required: true,
          type: 'text',
        },
      ],
    };

    const mapping = {
      project_name: 'Project Name',
    };

    const csvContent = `Project Name,Description
,Test project without name
Project 2,Test project with name`;

    const errors = validateCSVData(mapping, config, csvContent);

    // Should have validation error for empty required field
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Project Name is required but empty');
  });

  it('should handle mixed field types correctly', () => {
    const config = {
      fields: [
        {
          id: 'project_name',
          label: 'Project Name',
          required: true,
          type: 'text',
        },
        {
          id: 'project_status',
          label: 'Project Status',
          required: false,
          type: 'select',
          options: ['planning', 'active', 'completed', 'cancelled'],
        },
        {
          id: 'project_budget',
          label: 'Project Budget',
          required: false,
          type: 'number',
        },
      ],
    };

    const mapping = {
      project_name: 'Project Name',
      project_status: 'Status',
      project_budget: 'Budget',
    };

    const csvContent = `Project Name,Status,Budget
New Project 1,Active,1000000
New Project 2,PLANNING,2000000
New Project 3,completed,invalid`;

    const errors = validateCSVData(mapping, config, csvContent);

    // Should have validation error for invalid number
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Project Budget must be a number');
  });
});
