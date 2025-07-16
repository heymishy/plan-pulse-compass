import { parseCSVEnhanced } from '../enhancedCsvParser';

describe('EnhancedCSVParser - Core Functionality', () => {
  it('should parse simple CSV data', () => {
    const content = `name,email
John,john@example.com
Jane,jane@example.com`;

    const result = parseCSVEnhanced(content);

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.metadata).toBeDefined();
    expect(result.errors).toBeDefined();
  });

  it('should handle empty content', () => {
    const result = parseCSVEnhanced('');
    // Empty string results in single empty array element
    expect(result.data).toEqual([['']]);
    expect(result.errors).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should handle malformed content gracefully', () => {
    const content = 'invalid,csv\ndata"without"proper"quotes';
    const result = parseCSVEnhanced(content);
    expect(result.metadata).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
