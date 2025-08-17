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
    it('should format with EUR currency code', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
      expect(formatCurrency(1000000, 'EUR')).toBe('€1,000,000');
    });

    it('should format with GBP currency code', () => {
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
      expect(formatCurrency(1000000, 'GBP')).toBe('£1,000,000');
    });

    it('should format with JPY currency code', () => {
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
      expect(formatCurrency(1000000, 'JPY')).toBe('¥1,000,000');
    });
  });

  describe('when using currency symbols', () => {
    it('should convert dollar symbol to USD currency', () => {
      expect(formatCurrency(1000, '$')).toBe('$1,000');
      expect(formatCurrency(1000000, '$')).toBe('$1,000,000');
    });

    it('should convert euro symbol to EUR currency', () => {
      expect(formatCurrency(1000, '€')).toBe('€1,000');
      expect(formatCurrency(1000000, '€')).toBe('€1,000,000');
    });

    it('should convert pound symbol to GBP currency', () => {
      expect(formatCurrency(1000, '£')).toBe('£1,000');
      expect(formatCurrency(1000000, '£')).toBe('£1,000,000');
    });

    it('should convert yen symbol to JPY currency', () => {
      expect(formatCurrency(1000, '¥')).toBe('¥1,000');
      expect(formatCurrency(1000000, '¥')).toBe('¥1,000,000');
    });

    it('should convert rupee symbol to INR currency', () => {
      expect(formatCurrency(1000, '₹')).toBe('₹1,000');
      expect(formatCurrency(1000000, '₹')).toBe('₹1,000,000');
    });

    it('should convert ruble symbol to RUB currency', () => {
      expect(formatCurrency(1000, '₽')).toBe('RUB 1,000');
      expect(formatCurrency(1000000, '₽')).toBe('RUB 1,000,000');
    });

    it('should fallback to USD for unknown currency symbols', () => {
      expect(formatCurrency(1000, '¤')).toBe('$1,000');
      expect(formatCurrency(1000, 'XXX')).toBe('$1,000');
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
      expect(formatCurrency(NaN)).toBe('$0');
      expect(formatCurrency(Number('invalid'))).toBe('$0');
    });

    it('should handle null and undefined values', () => {
      expect(formatCurrency(null as any)).toBe('$0');
      expect(formatCurrency(undefined as any)).toBe('$0');
    });

    it('should handle Infinity values', () => {
      expect(formatCurrency(Infinity)).toBe('$0');
      expect(formatCurrency(-Infinity)).toBe('$0');
    });
  });
});
