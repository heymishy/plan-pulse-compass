/**
 * Design Tokens Tests
 * Validates design token structure and consistency
 */

import { describe, test, expect } from 'vitest';
import {
  colors,
  typography,
  spacing,
  shadows,
  designTokens,
  validateDesignToken,
  convertDesignToken,
} from '@/design-tokens';

describe('Design Tokens', () => {
  describe('Color System', () => {
    test('should have consistent color scales', () => {
      // Primary colors should have all required shades
      const requiredShades = [
        50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
      ];
      requiredShades.forEach(shade => {
        expect(colors.primary).toHaveProperty(shade.toString());
        expect(colors.primary[shade as keyof typeof colors.primary]).toMatch(
          /^#[0-9a-f]{6}$/i
        );
      });
    });

    test('should have semantic colors', () => {
      expect(colors.semantic).toHaveProperty('success');
      expect(colors.semantic).toHaveProperty('warning');
      expect(colors.semantic).toHaveProperty('error');
      expect(colors.semantic).toHaveProperty('info');
    });

    test('should have planning-specific colors', () => {
      expect(colors.planning).toHaveProperty('allocated');
      expect(colors.planning).toHaveProperty('overAllocated');
      expect(colors.planning).toHaveProperty('underAllocated');
      expect(colors.planning).toHaveProperty('unallocated');
    });

    test('should have status colors', () => {
      expect(colors.status).toHaveProperty('onTrack');
      expect(colors.status).toHaveProperty('atRisk');
      expect(colors.status).toHaveProperty('offTrack');
      expect(colors.status).toHaveProperty('notStarted');
      expect(colors.status).toHaveProperty('completed');
    });

    test('should validate color tokens', () => {
      expect(validateDesignToken.color('#ffffff')).toBe(true);
      expect(validateDesignToken.color('#fff')).toBe(true);
      expect(validateDesignToken.color('rgb(255, 255, 255)')).toBe(true);
      expect(validateDesignToken.color('hsl(0, 0%, 100%)')).toBe(true);
      expect(validateDesignToken.color('invalid')).toBe(false);
    });
  });

  describe('Typography System', () => {
    test('should have font families', () => {
      expect(typography.fontFamily).toHaveProperty('sans');
      expect(typography.fontFamily).toHaveProperty('mono');
      expect(typography.fontFamily).toHaveProperty('display');

      expect(Array.isArray(typography.fontFamily.sans)).toBe(true);
      expect(typography.fontFamily.sans).toContain('Inter');
    });

    test('should have consistent font sizes', () => {
      const requiredSizes = [
        'xs',
        'sm',
        'base',
        'lg',
        'xl',
        '2xl',
        '3xl',
        '4xl',
        '5xl',
        '6xl',
        '7xl',
      ];
      requiredSizes.forEach(size => {
        expect(typography.fontSize).toHaveProperty(size);
        expect(
          typography.fontSize[size as keyof typeof typography.fontSize]
        ).toHaveProperty('fontSize');
        expect(
          typography.fontSize[size as keyof typeof typography.fontSize]
        ).toHaveProperty('lineHeight');
      });
    });

    test('should have text styles', () => {
      expect(typography.textStyles).toHaveProperty('display-2xl');
      expect(typography.textStyles).toHaveProperty('heading-xl');
      expect(typography.textStyles).toHaveProperty('body-md');
      expect(typography.textStyles).toHaveProperty('label-md');
      expect(typography.textStyles).toHaveProperty('code-md');
    });

    test('should have consistent font weights', () => {
      const weights = [
        'thin',
        'extralight',
        'light',
        'normal',
        'medium',
        'semibold',
        'bold',
        'extrabold',
        'black',
      ];
      weights.forEach(weight => {
        expect(typography.fontWeight).toHaveProperty(weight);
        expect(
          parseInt(
            typography.fontWeight[weight as keyof typeof typography.fontWeight]
          )
        ).toBeGreaterThanOrEqual(100);
        expect(
          parseInt(
            typography.fontWeight[weight as keyof typeof typography.fontWeight]
          )
        ).toBeLessThanOrEqual(900);
      });
    });
  });

  describe('Spacing System', () => {
    test('should have base spacing scale', () => {
      expect(spacing).toHaveProperty('0');
      expect(spacing).toHaveProperty('px');
      expect(spacing).toHaveProperty('1');
      expect(spacing).toHaveProperty('4');
      expect(spacing).toHaveProperty('8');
      expect(spacing).toHaveProperty('16');
    });

    test('should have semantic spacing', () => {
      expect(spacing.semantic).toHaveProperty('component');
      expect(spacing.semantic).toHaveProperty('layout');
      expect(spacing.semantic).toHaveProperty('form');
      expect(spacing.semantic).toHaveProperty('navigation');
      expect(spacing.semantic).toHaveProperty('table');
    });

    test('should have grid spacing', () => {
      expect(spacing.grid).toHaveProperty('gap');
      expect(spacing.grid).toHaveProperty('container');

      expect(spacing.grid.gap).toHaveProperty('xs');
      expect(spacing.grid.gap).toHaveProperty('sm');
      expect(spacing.grid.gap).toHaveProperty('md');
      expect(spacing.grid.gap).toHaveProperty('lg');
    });

    test('should validate spacing tokens', () => {
      expect(validateDesignToken.spacing('1rem')).toBe(true);
      expect(validateDesignToken.spacing('16px')).toBe(true);
      expect(validateDesignToken.spacing('2em')).toBe(true);
      expect(validateDesignToken.spacing('100%')).toBe(true);
      expect(validateDesignToken.spacing('invalid')).toBe(false);
    });
  });

  describe('Shadow System', () => {
    test('should have elevation shadows', () => {
      expect(shadows.elevation).toHaveProperty('1');
      expect(shadows.elevation).toHaveProperty('2');
      expect(shadows.elevation).toHaveProperty('3');
      expect(shadows.elevation).toHaveProperty('4');
      expect(shadows.elevation).toHaveProperty('5');
      expect(shadows.elevation).toHaveProperty('6');
    });

    test('should have semantic shadows', () => {
      expect(shadows.semantic).toHaveProperty('card');
      expect(shadows.semantic).toHaveProperty('button');
      expect(shadows.semantic).toHaveProperty('modal');
      expect(shadows.semantic).toHaveProperty('dropdown');
      expect(shadows.semantic).toHaveProperty('input');
      expect(shadows.semantic).toHaveProperty('navigation');
    });

    test('should have colored shadows', () => {
      expect(shadows.colored).toHaveProperty('primary');
      expect(shadows.colored).toHaveProperty('success');
      expect(shadows.colored).toHaveProperty('warning');
      expect(shadows.colored).toHaveProperty('error');
    });

    test('should validate shadow tokens', () => {
      expect(validateDesignToken.shadow('none')).toBe(true);
      expect(validateDesignToken.shadow('0 1px 2px 0 rgb(0 0 0 / 0.05)')).toBe(
        true
      );
      expect(validateDesignToken.shadow('invalid shadow')).toBe(false);
    });
  });

  describe('Design Token Utilities', () => {
    test('should convert rem to px', () => {
      expect(convertDesignToken.remToPx('1rem')).toBe('16px');
      expect(convertDesignToken.remToPx('2.5rem')).toBe('40px');
      expect(convertDesignToken.remToPx('0.25rem')).toBe('4px');
    });

    test('should convert px to rem', () => {
      expect(convertDesignToken.pxToRem('16px')).toBe('1rem');
      expect(convertDesignToken.pxToRem('40px')).toBe('2.5rem');
      expect(convertDesignToken.pxToRem('4px')).toBe('0.25rem');
    });
  });

  describe('Token Export Structure', () => {
    test('should export all design tokens', () => {
      expect(designTokens).toHaveProperty('colors');
      expect(designTokens).toHaveProperty('typography');
      expect(designTokens).toHaveProperty('spacing');
      expect(designTokens).toHaveProperty('shadows');
    });

    test('should maintain token immutability', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        designTokens.colors.primary['500'] = '#changed';
      }).toThrow();
    });
  });
});
