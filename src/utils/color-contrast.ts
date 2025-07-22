/**
 * Color Contrast Validation Utilities
 *
 * WCAG 2.1 AA Color Contrast Compliance
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
 * - AAA compliance: 7:1 for normal, 4.5:1 for large text
 */

import { colors } from '@/design-tokens';

// WCAG contrast ratios
export const WCAG_CONTRAST_RATIOS = {
  AA: {
    normal: 4.5,
    large: 3.0,
  },
  AAA: {
    normal: 7.0,
    large: 4.5,
  },
} as const;

// Text size thresholds for WCAG large text
export const LARGE_TEXT_THRESHOLDS = {
  fontSize: 18, // 18pt = 24px at 96dpi
  fontSizeBold: 14, // 14pt = 18.67px at 96dpi (bold)
} as const;

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color provided');
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsWCAGContrast(
  foreground: string,
  background: string,
  options: {
    level: 'AA' | 'AAA';
    textSize: 'normal' | 'large';
  } = { level: 'AA', textSize: 'normal' }
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = WCAG_CONTRAST_RATIOS[options.level][options.textSize];

  return ratio >= requiredRatio;
}

/**
 * Get contrast ratio grade (AA, AAA, or Fail)
 */
export function getContrastGrade(
  foreground: string,
  background: string,
  textSize: 'normal' | 'large' = 'normal'
): 'AAA' | 'AA' | 'Fail' {
  const ratio = getContrastRatio(foreground, background);

  if (ratio >= WCAG_CONTRAST_RATIOS.AAA[textSize]) {
    return 'AAA';
  } else if (ratio >= WCAG_CONTRAST_RATIOS.AA[textSize]) {
    return 'AA';
  } else {
    return 'Fail';
  }
}

/**
 * Find the best text color for a background
 */
export function getBestTextColor(
  background: string,
  options: {
    level: 'AA' | 'AAA';
    textSize: 'normal' | 'large';
    textColors?: string[];
  } = { level: 'AA', textSize: 'normal' }
): string | null {
  const textColors = options.textColors || [
    colors.neutral[900],
    colors.neutral[0],
  ];

  const validColors = textColors.filter(color =>
    meetsWCAGContrast(color, background, options)
  );

  if (validColors.length === 0) {
    return null;
  }

  // Return the color with the highest contrast ratio
  return validColors.reduce((best, current) => {
    const bestRatio = getContrastRatio(best, background);
    const currentRatio = getContrastRatio(current, background);
    return currentRatio > bestRatio ? current : best;
  });
}

/**
 * Validate all design token color combinations
 */
export function validateDesignTokenContrast(): Array<{
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  grade: string;
  passes: boolean;
}> {
  const results: Array<{
    name: string;
    foreground: string;
    background: string;
    ratio: number;
    grade: string;
    passes: boolean;
  }> = [];

  // Common color combinations to validate
  const combinations = [
    // Primary combinations
    {
      name: 'Primary on White',
      fg: colors.primary[500],
      bg: colors.neutral[0],
    },
    {
      name: 'Primary on Light',
      fg: colors.primary[500],
      bg: colors.neutral[50],
    },
    {
      name: 'White on Primary',
      fg: colors.neutral[0],
      bg: colors.primary[500],
    },

    // Semantic color combinations
    {
      name: 'Success on White',
      fg: colors.semantic.success[500],
      bg: colors.neutral[0],
    },
    {
      name: 'White on Success',
      fg: colors.neutral[0],
      bg: colors.semantic.success[500],
    },
    {
      name: 'Error on White',
      fg: colors.semantic.error[500],
      bg: colors.neutral[0],
    },
    {
      name: 'White on Error',
      fg: colors.neutral[0],
      bg: colors.semantic.error[500],
    },
    {
      name: 'Warning on White',
      fg: colors.semantic.warning[500],
      bg: colors.neutral[0],
    },
    {
      name: 'White on Warning',
      fg: colors.neutral[0],
      bg: colors.semantic.warning[500],
    },
    {
      name: 'Info on White',
      fg: colors.semantic.info[500],
      bg: colors.neutral[0],
    },
    {
      name: 'White on Info',
      fg: colors.neutral[0],
      bg: colors.semantic.info[500],
    },

    // Neutral combinations
    { name: 'Dark on White', fg: colors.neutral[900], bg: colors.neutral[0] },
    {
      name: 'Dark on Light Gray',
      fg: colors.neutral[900],
      bg: colors.neutral[100],
    },
    { name: 'Medium on White', fg: colors.neutral[500], bg: colors.neutral[0] },
    {
      name: 'Medium on Light Gray',
      fg: colors.neutral[500],
      bg: colors.neutral[100],
    },
    { name: 'Light on Dark', fg: colors.neutral[300], bg: colors.neutral[900] },
    { name: 'White on Dark', fg: colors.neutral[0], bg: colors.neutral[900] },

    // Planning-specific combinations
    {
      name: 'Allocated on White',
      fg: colors.planning.allocated,
      bg: colors.neutral[0],
    },
    {
      name: 'Over Allocated on White',
      fg: colors.planning.overAllocated,
      bg: colors.neutral[0],
    },
    {
      name: 'Under Allocated on White',
      fg: colors.planning.underAllocated,
      bg: colors.neutral[0],
    },
    {
      name: 'Unallocated on White',
      fg: colors.planning.unallocated,
      bg: colors.neutral[0],
    },

    // Status combinations
    {
      name: 'On Track on White',
      fg: colors.status.onTrack,
      bg: colors.neutral[0],
    },
    {
      name: 'At Risk on White',
      fg: colors.status.atRisk,
      bg: colors.neutral[0],
    },
    {
      name: 'Off Track on White',
      fg: colors.status.offTrack,
      bg: colors.neutral[0],
    },
    {
      name: 'Not Started on White',
      fg: colors.status.notStarted,
      bg: colors.neutral[0],
    },
    {
      name: 'Completed on White',
      fg: colors.status.completed,
      bg: colors.neutral[0],
    },
  ];

  for (const combination of combinations) {
    const ratio = getContrastRatio(combination.fg, combination.bg);
    const grade = getContrastGrade(combination.fg, combination.bg, 'normal');
    const passes = meetsWCAGContrast(combination.fg, combination.bg, {
      level: 'AA',
      textSize: 'normal',
    });

    results.push({
      name: combination.name,
      foreground: combination.fg,
      background: combination.bg,
      ratio: Math.round(ratio * 100) / 100,
      grade,
      passes,
    });
  }

  return results;
}

/**
 * Generate contrast report for design tokens
 */
export function generateContrastReport(): {
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  details: ReturnType<typeof validateDesignTokenContrast>;
} {
  const details = validateDesignTokenContrast();
  const passed = details.filter(item => item.passes).length;
  const failed = details.length - passed;

  return {
    summary: {
      total: details.length,
      passed,
      failed,
      passRate: Math.round((passed / details.length) * 100),
    },
    details,
  };
}

/**
 * Get recommendations for improving contrast
 */
export function getContrastRecommendations(
  foreground: string,
  background: string,
  targetLevel: 'AA' | 'AAA' = 'AA',
  textSize: 'normal' | 'large' = 'normal'
): {
  current: number;
  required: number;
  passes: boolean;
  recommendations: string[];
} {
  const currentRatio = getContrastRatio(foreground, background);
  const requiredRatio = WCAG_CONTRAST_RATIOS[targetLevel][textSize];
  const passes = currentRatio >= requiredRatio;

  const recommendations: string[] = [];

  if (!passes) {
    const deficit = requiredRatio - currentRatio;
    recommendations.push(
      `Current ratio ${currentRatio.toFixed(2)} is below required ${requiredRatio}:1`
    );
    recommendations.push(
      `Need to increase contrast by ${deficit.toFixed(2)} points`
    );

    // Suggest alternatives
    recommendations.push('Consider using:');

    // Suggest darker foreground on light background
    if (background === colors.neutral[0] || background === colors.neutral[50]) {
      recommendations.push('- Darker text color (neutral-700 or neutral-900)');
    }

    // Suggest lighter foreground on dark background
    if (
      background === colors.neutral[900] ||
      background === colors.neutral[800]
    ) {
      recommendations.push('- Lighter text color (neutral-100 or neutral-0)');
    }

    // Suggest background alternatives
    recommendations.push('- Different background color with better contrast');

    // For large text, mention lower requirements
    if (textSize === 'normal') {
      recommendations.push(
        '- Use larger text size (reduces contrast requirement to 3:1)'
      );
    }
  }

  return {
    current: Math.round(currentRatio * 100) / 100,
    required: requiredRatio,
    passes,
    recommendations,
  };
}

export default {
  getContrastRatio,
  meetsWCAGContrast,
  getContrastGrade,
  getBestTextColor,
  validateDesignTokenContrast,
  generateContrastReport,
  getContrastRecommendations,
};
