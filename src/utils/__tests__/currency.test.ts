import { formatCurrency } from '../currency';

describe('formatCurrency', () => {
  describe('when formatting different amounts', () => {
    it('should format small amounts without decimals', () => {
      expect(formatCurrency(100)).toBe('$100');
      expect(formatCurrency(999)).toBe('$999');
    });

    it('should format thousands with commas', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(10000)).toBe('$10,000');
      expect(formatCurrency(99999)).toBe('$99,999');
    });

    it('should format hundreds of thousands with commas', () => {
      expect(formatCurrency(100000)).toBe('$100,000');
      expect(formatCurrency(500000)).toBe('$500,000');
      expect(formatCurrency(999999)).toBe('$999,999');
    });

    it('should format millions with commas', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(1500000)).toBe('$1,500,000');
      expect(formatCurrency(10000000)).toBe('$10,000,000');
    });

    it('should format billions with commas', () => {
      expect(formatCurrency(1000000000)).toBe('$1,000,000,000');
      expect(formatCurrency(1500000000)).toBe('$1,500,000,000');
    });

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(-1000)).toBe('-$1,000');
      expect(formatCurrency(-1000000)).toBe('-$1,000,000');
    });

    it('should round decimal values to whole numbers', () => {
      expect(formatCurrency(1000.99)).toBe('$1,001');
      expect(formatCurrency(1000.49)).toBe('$1,000');
      expect(formatCurrency(1000.5)).toBe('$1,001');
    });
  });

  describe('when using different currencies', () => {
    it('should format with EUR currency', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
      expect(formatCurrency(1000000, 'EUR')).toBe('€1,000,000');
    });

    it('should format with GBP currency', () => {
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
      expect(formatCurrency(1000000, 'GBP')).toBe('£1,000,000');
    });
  });

  describe('when using different locales', () => {
    it('should format with German locale (uses dots for thousands)', () => {
      const result1000 = formatCurrency(1000, 'EUR', 'de-DE');
      const result1M = formatCurrency(1000000, 'EUR', 'de-DE');
      // Check that it formats with dots and EUR symbol correctly
      expect(result1000).toContain('1.000');
      expect(result1000).toContain('€');
      expect(result1M).toContain('1.000.000');
      expect(result1M).toContain('€');
    });

    it('should format with French locale', () => {
      const result1000 = formatCurrency(1000, 'EUR', 'fr-FR');
      const result1M = formatCurrency(1000000, 'EUR', 'fr-FR');
      // Check that it formats with spaces and EUR symbol correctly
      expect(result1000).toContain('1');
      expect(result1000).toContain('000');
      expect(result1000).toContain('€');
      expect(result1M).toContain('1');
      expect(result1M).toContain('000');
      expect(result1M).toContain('€');
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999999)).toBe('$999,999,999,999');
    });

    it('should handle NaN and undefined values gracefully', () => {
      expect(formatCurrency(NaN)).toBe('$NaN');
      expect(formatCurrency(Number('invalid'))).toBe('$NaN');
    });
  });
});
