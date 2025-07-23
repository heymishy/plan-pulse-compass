/**
 * Tests for Color Contrast Validation Utilities
 *
 * Test Coverage:
 * - Hex to RGB conversion
 * - Relative luminance calculation
 * - Contrast ratio calculation
 * - WCAG compliance checking
 * - Contrast grading
 * - Best text color selection
 * - Design token validation
 * - Contrast recommendations
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGContrast,
  getContrastGrade,
  getBestTextColor,
  validateDesignTokenContrast,
  generateContrastReport,
  getContrastRecommendations,
  WCAG_CONTRAST_RATIOS,
} from '@/utils/color-contrast';
import { colors } from '@/design-tokens';

describe('Color Contrast Utilities', () => {
  describe('hexToRgb', () => {
    it('converts hex colors to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff5733')).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('handles hex colors with hash prefix', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles hex colors without hash prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns null for invalid hex colors', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gggggg')).toBeNull();
      expect(hexToRgb('#12345')).toBeNull();
    });
  });

  describe('getRelativeLuminance', () => {
    it('calculates luminance for white', () => {
      const luminance = getRelativeLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 3);
    });

    it('calculates luminance for black', () => {
      const luminance = getRelativeLuminance(0, 0, 0);
      expect(luminance).toBeCloseTo(0, 3);
    });

    it('calculates luminance for middle gray', () => {
      const luminance = getRelativeLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('calculates maximum contrast for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calculates minimum contrast for identical colors', () => {
      const ratio = getContrastRatio('#ff0000', '#ff0000');
      expect(ratio).toBeCloseTo(1, 3);
    });

    it('calculates contrast for design token colors', () => {
      const ratio = getContrastRatio(colors.primary[500], colors.neutral[0]);
      expect(ratio).toBeGreaterThan(1);
    });

    it('throws error for invalid hex colors', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow();
      expect(() => getContrastRatio('#ffffff', 'invalid')).toThrow();
    });
  });

  describe('meetsWCAGContrast', () => {
    it('validates AA normal text contrast', () => {
      // Black on white should pass AA
      expect(
        meetsWCAGContrast('#000000', '#ffffff', {
          level: 'AA',
          textSize: 'normal',
        })
      ).toBe(true);

      // Light gray on white should fail AA
      expect(
        meetsWCAGContrast('#cccccc', '#ffffff', {
          level: 'AA',
          textSize: 'normal',
        })
      ).toBe(false);
    });

    it('validates AA large text contrast', () => {
      // Colors that fail normal text but pass large text
      const ratio = getContrastRatio('#777777', '#ffffff');
      expect(ratio).toBeLessThan(WCAG_CONTRAST_RATIOS.AA.normal);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_CONTRAST_RATIOS.AA.large);

      expect(
        meetsWCAGContrast('#777777', '#ffffff', {
          level: 'AA',
          textSize: 'large',
        })
      ).toBe(true);
    });

    it('validates AAA contrast standards', () => {
      expect(
        meetsWCAGContrast('#000000', '#ffffff', {
          level: 'AAA',
          textSize: 'normal',
        })
      ).toBe(true);

      // Medium gray may pass AA but fail AAA
      expect(
        meetsWCAGContrast('#666666', '#ffffff', {
          level: 'AAA',
          textSize: 'normal',
        })
      ).toBe(false);
    });

    it('uses default AA normal text when no options provided', () => {
      const withDefaults = meetsWCAGContrast('#000000', '#ffffff');
      const withExplicit = meetsWCAGContrast('#000000', '#ffffff', {
        level: 'AA',
        textSize: 'normal',
      });
      expect(withDefaults).toBe(withExplicit);
    });
  });

  describe('getContrastGrade', () => {
    it('returns AAA for excellent contrast', () => {
      expect(getContrastGrade('#000000', '#ffffff')).toBe('AAA');
    });

    it('returns AA for good contrast', () => {
      // Find a color that passes AA but not AAA (contrast ratio around 4.5-6.9)
      expect(getContrastGrade('#767676', '#ffffff')).toBe('AA');
    });

    it('returns Fail for poor contrast', () => {
      expect(getContrastGrade('#cccccc', '#ffffff')).toBe('Fail');
    });

    it('considers large text requirements', () => {
      // A color that fails normal but passes large (contrast ratio around 3.0-4.4)
      expect(getContrastGrade('#888888', '#ffffff', 'normal')).toBe('Fail');
      expect(getContrastGrade('#888888', '#ffffff', 'large')).toBe('AA');
    });
  });

  describe('getBestTextColor', () => {
    it('finds best text color for light backgrounds', () => {
      const bestColor = getBestTextColor(colors.neutral[0]);
      expect(bestColor).toBe(colors.neutral[900]); // Dark text on light background
    });

    it('finds best text color for dark backgrounds', () => {
      const bestColor = getBestTextColor(colors.neutral[900]);
      expect(bestColor).toBe(colors.neutral[0]); // Light text on dark background
    });

    it('returns null when no valid colors meet requirements', () => {
      const bestColor = getBestTextColor('#888888', {
        level: 'AAA',
        textSize: 'normal',
        textColors: ['#999999', '#777777'], // Poor contrast colors
      });
      expect(bestColor).toBeNull();
    });

    it('uses provided text colors', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff'];
      const bestColor = getBestTextColor('#ffffff', {
        level: 'AA',
        textSize: 'normal',
        textColors: customColors,
      });
      expect(customColors).toContain(bestColor);
    });
  });

  describe('validateDesignTokenContrast', () => {
    it('validates all design token combinations', () => {
      const results = validateDesignTokenContrast();

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);

      results.forEach(result => {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('foreground');
        expect(result).toHaveProperty('background');
        expect(result).toHaveProperty('ratio');
        expect(result).toHaveProperty('grade');
        expect(result).toHaveProperty('passes');

        expect(typeof result.name).toBe('string');
        expect(typeof result.foreground).toBe('string');
        expect(typeof result.background).toBe('string');
        expect(typeof result.ratio).toBe('number');
        expect(['AAA', 'AA', 'Fail']).toContain(result.grade);
        expect(typeof result.passes).toBe('boolean');
      });
    });

    it('includes primary color combinations', () => {
      const results = validateDesignTokenContrast();

      const primaryOnWhite = results.find(r => r.name === 'Primary on White');
      expect(primaryOnWhite).toBeDefined();
      expect(primaryOnWhite?.foreground).toBe(colors.primary[500]);
      expect(primaryOnWhite?.background).toBe(colors.neutral[0]);
    });

    it('includes semantic color combinations', () => {
      const results = validateDesignTokenContrast();

      const successOnWhite = results.find(r => r.name === 'Success on White');
      expect(successOnWhite).toBeDefined();
      expect(successOnWhite?.foreground).toBe(colors.semantic.success[500]);

      const errorOnWhite = results.find(r => r.name === 'Error on White');
      expect(errorOnWhite).toBeDefined();
      expect(errorOnWhite?.foreground).toBe(colors.semantic.error[500]);
    });
  });

  describe('generateContrastReport', () => {
    it('generates comprehensive contrast report', () => {
      const report = generateContrastReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');

      expect(report.summary).toHaveProperty('total');
      expect(report.summary).toHaveProperty('passed');
      expect(report.summary).toHaveProperty('failed');
      expect(report.summary).toHaveProperty('passRate');

      expect(report.summary.total).toBe(
        report.summary.passed + report.summary.failed
      );
      expect(report.summary.passRate).toBe(
        Math.round((report.summary.passed / report.summary.total) * 100)
      );

      expect(report.details).toBeInstanceOf(Array);
      expect(report.details.length).toBe(report.summary.total);
    });

    it('calculates correct pass rate', () => {
      const report = generateContrastReport();
      const expectedPassRate = Math.round(
        (report.summary.passed / report.summary.total) * 100
      );
      expect(report.summary.passRate).toBe(expectedPassRate);
    });
  });

  describe('getContrastRecommendations', () => {
    it('provides recommendations for failing combinations', () => {
      const recommendations = getContrastRecommendations('#cccccc', '#ffffff');

      expect(recommendations).toHaveProperty('current');
      expect(recommendations).toHaveProperty('required');
      expect(recommendations).toHaveProperty('passes');
      expect(recommendations).toHaveProperty('recommendations');

      expect(recommendations.passes).toBe(false);
      expect(recommendations.current).toBeLessThan(recommendations.required);
      expect(recommendations.recommendations).toBeInstanceOf(Array);
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
    });

    it('indicates passing combinations', () => {
      const recommendations = getContrastRecommendations('#000000', '#ffffff');

      expect(recommendations.passes).toBe(true);
      expect(recommendations.current).toBeGreaterThanOrEqual(
        recommendations.required
      );
    });

    it('adjusts requirements for large text', () => {
      const normalReq = getContrastRecommendations(
        '#777777',
        '#ffffff',
        'AA',
        'normal'
      );
      const largeReq = getContrastRecommendations(
        '#777777',
        '#ffffff',
        'AA',
        'large'
      );

      expect(normalReq.required).toBeGreaterThan(largeReq.required);
      expect(normalReq.current).toBe(largeReq.current);
    });

    it('adjusts requirements for AAA level', () => {
      const aaReq = getContrastRecommendations('#666666', '#ffffff', 'AA');
      const aaaReq = getContrastRecommendations('#666666', '#ffffff', 'AAA');

      expect(aaaReq.required).toBeGreaterThan(aaReq.required);
      expect(aaReq.current).toBe(aaaReq.current);
    });

    it('includes specific recommendations in messages', () => {
      const recommendations = getContrastRecommendations('#cccccc', '#ffffff');

      const messages = recommendations.recommendations.join(' ');
      expect(messages.toLowerCase()).toContain('contrast');
      expect(messages.toLowerCase()).toContain('consider');
    });
  });

  describe('Real-world Design Token Validation', () => {
    it('validates primary color contrast ratio', () => {
      const primaryRatio = getContrastRatio(
        colors.primary[500],
        colors.neutral[0]
      );
      // Primary color has a contrast ratio of ~3.68, which fails AA (4.5) but passes large text (3.0)
      expect(primaryRatio).toBeGreaterThan(3.0);
      expect(primaryRatio).toBeLessThan(4.5);
    });

    it('validates semantic colors have reasonable contrast', () => {
      // These colors may not meet AA standards but should have some contrast
      const successRatio = getContrastRatio(
        colors.semantic.success[500],
        colors.neutral[0]
      );
      const errorRatio = getContrastRatio(
        colors.semantic.error[500],
        colors.neutral[0]
      );
      const warningRatio = getContrastRatio(
        colors.semantic.warning[500],
        colors.neutral[0]
      );

      expect(successRatio).toBeGreaterThan(2.0);
      expect(errorRatio).toBeGreaterThan(3.0);
      expect(warningRatio).toBeGreaterThan(2.0);
    });

    it('validates neutral color combinations', () => {
      expect(meetsWCAGContrast(colors.neutral[900], colors.neutral[0])).toBe(
        true
      );
      expect(meetsWCAGContrast(colors.neutral[0], colors.neutral[900])).toBe(
        true
      );
    });

    it('identifies problematic combinations', () => {
      // Light colors on light backgrounds should fail
      expect(meetsWCAGContrast(colors.neutral[400], colors.neutral[0])).toBe(
        false
      );
    });
  });
});
