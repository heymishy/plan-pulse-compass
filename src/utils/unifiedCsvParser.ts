import {
  Person,
  Role,
  Team,
  Division,
  Project,
  Epic,
  Milestone,
  Allocation,
  ActualAllocation,
  Cycle,
  RunWorkCategory,
  Skill,
  Solution,
} from '@/types';

export interface CsvParseResult<T> {
  data: T[];
  errors: CsvParseError[];
  warnings: CsvParseWarning[];
  summary: CsvParseSummary;
}

export interface CsvParseError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
  data?: string[];
}

export interface CsvParseWarning {
  row: number;
  column: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface CsvParseSummary {
  totalRows: number;
  successfulRows: number;
  errorRows: number;
  warningRows: number;
  processingTime: number;
  fileSize: number;
}

export interface CsvParseOptions {
  maxRows?: number;
  skipEmptyRows?: boolean;
  allowPartialImports?: boolean;
  strictValidation?: boolean;
  onProgress?: (progress: { current: number; total: number }) => void;
}

export class UnifiedCsvParser {
  private static readonly CHUNK_SIZE = 1000; // Process 1000 rows at a time
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

  /**
   * Parse CSV content with streaming support for large files
   */
  static async parseCsv<T>(
    content: string,
    parser: (row: string[], headers: string[], rowIndex: number) => T | null,
    options: CsvParseOptions = {}
  ): Promise<CsvParseResult<T>> {
    const startTime = Date.now();
    const fileSize = new Blob([content]).size;

    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (50MB)`
      );
    }

    const lines = content.trim().split('\n');
    const headers = this.parseHeaders(lines[0]);
    const dataRows = lines.slice(1);

    const result: CsvParseResult<T> = {
      data: [],
      errors: [],
      warnings: [],
      summary: {
        totalRows: dataRows.length,
        successfulRows: 0,
        errorRows: 0,
        warningRows: 0,
        processingTime: 0,
        fileSize,
      },
    };

    // Process in chunks for better performance
    for (let i = 0; i < dataRows.length; i += this.CHUNK_SIZE) {
      const chunk = dataRows.slice(i, i + this.CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const rowIndex = i + j + 2; // +2 for header and 0-based index
        const row = this.parseRow(chunk[j]);

        try {
          const parsed = parser(row, headers, rowIndex);
          if (parsed !== null) {
            result.data.push(parsed);
            result.summary.successfulRows++;
          } else if (options.skipEmptyRows) {
            // Skip empty rows
            continue;
          } else {
            result.errors.push({
              row: rowIndex,
              column: 'general',
              message: 'Row could not be parsed',
              severity: 'error',
              data: row,
            });
            result.summary.errorRows++;
          }
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            column: 'general',
            message:
              error instanceof Error ? error.message : 'Unknown parsing error',
            severity: 'error',
            data: row,
          });
          result.summary.errorRows++;

          if (!options.allowPartialImports) {
            throw new Error(
              `Import failed at row ${rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Report progress
        if (options.onProgress && (i + j) % 100 === 0) {
          options.onProgress({
            current: i + j,
            total: dataRows.length,
          });
        }

        // Check max rows limit
        if (options.maxRows && result.data.length >= options.maxRows) {
          result.warnings.push({
            row: rowIndex,
            column: 'general',
            message: `Import limited to ${options.maxRows} rows due to configuration`,
            data: { maxRows: options.maxRows },
          });
          break;
        }
      }
    }

    result.summary.processingTime = Date.now() - startTime;
    result.summary.warningRows = result.warnings.length;

    return result;
  }

  /**
   * Parse CSV headers with proper handling of quoted values
   */
  private static parseHeaders(headerLine: string): string[] {
    return this.parseRow(headerLine).map(h =>
      h.toLowerCase().replace(/\s+/g, '_')
    );
  }

  /**
   * Parse a single CSV row with proper handling of quoted values and commas
   */
  private static parseRow(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
        continue;
      }

      current += char;
    }

    // Add the last value
    values.push(current.trim().replace(/^"|"$/g, ''));

    return values;
  }

  /**
   * Validate CSV structure and provide early feedback
   */
  static validateCsvStructure(
    content: string,
    expectedColumns: string[]
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    detectedColumns: string[];
  } {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      return {
        isValid: false,
        errors: ['CSV file must have at least a header row and one data row'],
        warnings: [],
        detectedColumns: [],
      };
    }

    const headers = this.parseHeaders(lines[0]);
    const detectedColumns = headers.map(h =>
      h.toLowerCase().replace(/\s+/g, '_')
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required columns
    const missingColumns = expectedColumns.filter(
      col => !detectedColumns.includes(col)
    );
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Check for unexpected columns
    const unexpectedColumns = detectedColumns.filter(
      col => !expectedColumns.includes(col)
    );
    if (unexpectedColumns.length > 0) {
      warnings.push(
        `Unexpected columns detected: ${unexpectedColumns.join(', ')}`
      );
    }

    // Check for empty rows
    const emptyRows = lines.slice(1).filter(line => line.trim() === '').length;
    if (emptyRows > 0) {
      warnings.push(`${emptyRows} empty rows detected`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      detectedColumns,
    };
  }

  /**
   * Estimate processing time based on file size and content
   */
  static estimateProcessingTime(content: string): number {
    const lines = content.trim().split('\n');
    const rows = lines.length - 1; // Exclude header

    // Rough estimate: 1ms per 100 rows
    return Math.max(100, Math.ceil(rows / 100));
  }

  /**
   * Get memory usage estimate for processing
   */
  static estimateMemoryUsage(content: string): number {
    const fileSize = new Blob([content]).size;
    // Rough estimate: 3x file size for processing overhead
    return fileSize * 3;
  }
}

/**
 * Utility functions for common CSV parsing patterns
 */
export class CsvParseUtils {
  /**
   * Extract value from row using header mapping
   */
  static getValue(row: string[], headers: string[], fieldName: string): string {
    const index = headers.findIndex(h => h === fieldName);
    return index !== -1 ? (row[index] || '').trim() : '';
  }

  /**
   * Extract multiple values from row using header mapping
   */
  static getValues(
    row: string[],
    headers: string[],
    fieldNames: string[]
  ): Record<string, string> {
    const result: Record<string, string> = {};
    fieldNames.forEach(fieldName => {
      result[fieldName] = this.getValue(row, headers, fieldName);
    });
    return result;
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(
    values: Record<string, string>,
    requiredFields: string[],
    rowIndex: number
  ): CsvParseError[] {
    const errors: CsvParseError[] = [];

    requiredFields.forEach(field => {
      if (!values[field] || values[field].trim() === '') {
        errors.push({
          row: rowIndex,
          column: field,
          message: `Required field '${field}' is missing or empty`,
          severity: 'error',
        });
      }
    });

    return errors;
  }

  /**
   * Parse numeric value with validation
   */
  static parseNumber(
    value: string,
    fieldName: string,
    rowIndex: number
  ): { value: number; error?: CsvParseError } {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return {
        value: 0,
        error: {
          row: rowIndex,
          column: fieldName,
          message: `Invalid number format: '${value}'`,
          severity: 'error',
        },
      };
    }
    return { value: num };
  }

  /**
   * Parse date value with validation
   */
  static parseDate(
    value: string,
    fieldName: string,
    rowIndex: number
  ): { value: string; error?: CsvParseError } {
    if (!value || value.trim() === '') {
      return { value: '' };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        value: '',
        error: {
          row: rowIndex,
          column: fieldName,
          message: `Invalid date format: '${value}'. Expected YYYY-MM-DD`,
          severity: 'error',
        },
      };
    }

    return { value: date.toISOString().split('T')[0] };
  }

  /**
   * Parse boolean value with validation
   */
  static parseBoolean(
    value: string,
    fieldName: string,
    rowIndex: number
  ): { value: boolean; error?: CsvParseError } {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return { value: true };
    }
    if (
      lowerValue === 'false' ||
      lowerValue === '0' ||
      lowerValue === 'no' ||
      lowerValue === ''
    ) {
      return { value: false };
    }

    return {
      value: false,
      error: {
        row: rowIndex,
        column: fieldName,
        message: `Invalid boolean format: '${value}'. Expected true/false, 1/0, or yes/no`,
        severity: 'error',
      },
    };
  }

  /**
   * Generate unique ID with prefix
   */
  static generateId(prefix: string, existingIds: Set<string>): string {
    let id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let counter = 1;

    while (existingIds.has(id)) {
      id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${counter}`;
      counter++;
    }

    return id;
  }
}
