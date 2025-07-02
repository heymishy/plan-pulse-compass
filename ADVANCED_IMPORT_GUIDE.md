# Advanced Data Import Guide

## Overview

The Advanced Data Import feature has been enhanced to provide better field mapping, validation, and error handling. This guide explains how to use the new functionality to import data with flexible column mappings and comprehensive validation.

## Key Features

### 1. Field Mapping

- **Flexible Column Mapping**: Map any CSV column to any application field
- **Skip Fields**: Option to skip fields that aren't needed
- **Saved Mappings**: Mappings are saved and can be reused for similar imports

### 2. Real-time Validation

- **Field Validation**: Validates required fields are mapped
- **Data Type Validation**: Ensures numbers are numeric, dates are valid
- **Value Validation**: Checks values against available options (teams, quarters, etc.)
- **Preview Validation**: Validates data in the preview rows before import

### 3. Enhanced Error Handling

- **Detailed Error Messages**: Specific error messages with row numbers
- **Validation Warnings**: Shows validation issues before import
- **Import Blocking**: Prevents import when validation errors exist

### 4. Epic Type Mapping

The system supports detailed Epic Type categories that automatically map to either Change Work (Epics) or Run Work (Run Work Categories):

#### Default Epic Type Mapping

- **Feature** → Change Work (Epics)
- **Platform** → Change Work (Epics)
- **Tech Debt** → Change Work (Epics)
- **Critical Run** → Run Work (Run Work Categories)

#### Customizing Epic Type Mapping

You can customize how Epic Types are mapped using the Value Mapping step:

1. **During Import**: When you reach the Value Mapping step, you'll see all unique Epic Type values from your CSV
2. **Map Each Type**: For each Epic Type value, you can choose to:
   - Map to an existing Epic Type (Feature, Platform, Tech Debt, Critical Run)
   - Create a new Epic Type (which will follow the default mapping rules)
3. **Save Mappings**: Your Epic Type mappings are saved and can be reused for future imports

#### Example Epic Type Mapping

If your CSV contains Epic Types like "Bug Fix", "Enhancement", "Maintenance", you can map them:

- "Bug Fix" → "Tech Debt" (becomes Change Work)
- "Enhancement" → "Feature" (becomes Change Work)
- "Maintenance" → "Critical Run" (becomes Run Work)

This allows you to maintain your existing Epic Type terminology while the system automatically categorizes them as Change Work or Run Work.

## Supported Import Types

### 1. Projects, Epics & Milestones

**Fields Available:**

- Project Name (required)
- Project Description
- Project Status (planning, active, completed, cancelled)
- Project Start Date
- Project End Date
- Project Budget
- Epic Name
- Epic Description
- Epic Effort
- Epic Team
- Epic Target Date
- Milestone Name
- Milestone Due Date

### 2. Planning Allocations

**Fields Available:**

- Team Name (required) - Auto-populated from existing teams
- Quarter (required) - Auto-populated from existing quarters
- Iteration Number (required) - Options: 1, 2, 3, 4, 5, 6
- Epic/Work Name - Auto-populated from existing epics and run work categories
- Epic Type - Options: Feature, Platform, Tech Debt, Critical Run
  - **Feature, Platform, Tech Debt** → Treated as Change Work (Epics)
  - **Critical Run** → Treated as Run Work (Run Work Categories)
- Allocation Percentage (required)
- Notes

### 3. Actual Allocations

**Fields Available:**

- Team Name (required) - Auto-populated from existing teams
- Quarter (required) - Auto-populated from existing quarters
- Iteration Number (required) - Options: 1, 2, 3, 4, 5, 6
- Epic/Work Name - Auto-populated from existing epics and run work categories
- Epic Type - Options: Feature, Platform, Tech Debt, Critical Run
  - **Feature, Platform, Tech Debt** → Treated as Change Work (Epics)
  - **Critical Run** → Treated as Run Work (Run Work Categories)
- Actual Percentage (required)
- Variance Reason - Options: none, production-support, scope-change, resource-unavailable, technical-blocker, priority-shift, other
- Notes

### 4. Iteration Reviews

**Fields Available:**

- Quarter (required) - Auto-populated from existing quarters
- Iteration Number (required) - Options: 1, 2, 3, 4, 5, 6
- Review Date
- Status - Options: not-started, in-progress, completed
- Completed Epics - Auto-populated from existing epics
- Completed Milestones - Auto-populated from existing milestones
- Notes

### 5. Bulk Tracking Data (Combined)

**Fields Available:**

- Data Type (required) - Options: allocation, review
- Team Name - Auto-populated from existing teams
- Quarter (required) - Auto-populated from existing quarters
- Iteration Number (required) - Options: 1, 2, 3, 4, 5, 6
- Epic/Work Name - Auto-populated from existing epics and run work categories
- Actual Percentage
- Variance Reason - Options: none, production-support, scope-change, resource-unavailable, technical-blocker, priority-shift, other
- Review Date
- Status - Options: not-started, in-progress, completed
- Completed Epics - Auto-populated from existing epics
- Completed Milestones - Auto-populated from existing milestones
- Notes

## How to Use

### Step 1: Select Import Type

1. Choose the type of data you want to import
2. The system will show the available fields for that import type

### Step 2: Upload CSV File

1. Upload your CSV file
2. The system will parse the file and show a preview of the data
3. You'll see the column headers from your file

### Step 3: Map Fields

1. For each application field, select the corresponding column from your CSV
2. Use "Skip this field" if a field isn't needed
3. Required fields are marked with a red asterisk (\*)
4. For select fields, you'll see available options displayed below the mapping

### Step 4: Validation

1. The system will validate your mappings in real-time
2. Validation errors will be shown in a yellow warning box
3. The import button will be disabled until all validation errors are resolved

### Step 5: Import

1. Click "Import Data" to proceed with the import
2. The system will process the data and show success/error messages
3. Successfully imported data will be added to your application

## Field Mapping Examples

### Example 1: Actual Allocations with Custom Column Names

**CSV Headers:**

```
Team,Quarter,Iteration,Epic/Work,Epic Type,Actual %,Variance Reason,Notes
```

**Mapping:**

- Team Name → Team
- Quarter → Quarter
- Iteration Number → Iteration
- Epic/Work Name → Epic/Work
- Epic Type → Epic Type
- Actual Percentage → Actual %
- Variance Reason → Variance Reason
- Notes → Notes

### Example 2: Projects with Different Column Names

**CSV Headers:**

```
Project,Description,Status,Start,End,Budget,Epic,Epic Description
```

**Mapping:**

- Project Name → Project
- Project Description → Description
- Project Status → Status
- Project Start Date → Start
- Project End Date → End
- Project Budget → Budget
- Epic Name → Epic
- Epic Description → Epic Description

## Validation Rules

### Required Fields

- Required fields must be mapped to a CSV column
- Required fields cannot be empty in the CSV data

### Data Type Validation

- **Number fields**: Must contain valid numeric values
- **Date fields**: Must contain valid date strings
- **Select fields**: Values must match available options

### Value Validation

- **Team names**: Must exist in the application
- **Quarter names**: Must exist as quarterly cycles
- **Epic names**: Must exist as epics or run work categories
- **Iteration numbers**: Must be 1-6

## Error Messages

### Common Error Messages

- `"Team Name is required but not mapped."` - Required field not mapped
- `"Row 3: Team Name is required but empty."` - Required field empty in CSV
- `"Row 4: Actual Percentage must be a number, got 'abc'."` - Invalid data type
- `"Row 5: Team Name value 'Unknown Team' not found in available options."` - Invalid value
- `"Mapped header 'Team' for Team Name not found in CSV."` - Mapped column missing

## Tips for Successful Imports

1. **Check Your Data**: Ensure your CSV data matches the expected format
2. **Use Sample Files**: Reference the sample CSV files for correct formatting
3. **Validate First**: Use the preview to check your data before importing
4. **Save Mappings**: Save successful mappings for future use
5. **Check Options**: Review available options for select fields before importing

## Troubleshooting

### "Invalid iteration number: undefined"

This error occurs when the iteration number field is not properly mapped or contains invalid data. Ensure:

1. The iteration number column is mapped correctly
2. The column contains valid numbers (1-6)
3. The column is not empty for required rows

### "Team not found" errors

This error occurs when team names in your CSV don't match existing teams. Ensure:

1. Team names match exactly (case-sensitive)
2. Teams exist in the application before importing
3. No extra spaces in team names

### "Quarter not found" errors

This error occurs when quarter names don't match existing quarterly cycles. Ensure:

1. Quarter names match exactly (e.g., "Q1 2024")
2. Quarterly cycles exist in the application
3. Quarter names are in the correct format

## Sample Files

- `sample-people-teams-import.csv` - People and teams import
- `sample-allocation-import.csv` - Basic allocation import
- `sample-planning-allocation-import.csv` - Planning allocation import
- `sample-advanced-allocation-with-mapping.csv` - Advanced allocation with custom column names

## Technical Details

### Field Mapping Storage

- Mappings are stored in browser localStorage
- Mappings are saved per import type
- Mappings persist between browser sessions

### Validation Process

1. **Mapping Validation**: Checks required fields are mapped
2. **Header Validation**: Ensures mapped columns exist in CSV
3. **Data Validation**: Validates data types and values in preview rows
4. **Import Validation**: Final validation during import process

### Error Handling

- Errors are collected and displayed with row numbers
- Import is blocked if validation errors exist
- Detailed error messages help identify and fix issues
