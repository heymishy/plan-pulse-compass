/**
 * Design Tokens - Main Entry Point
 * Centralized design token system for Plan Pulse Compass
 */

import { colors, cssVariables as colorCssVariables } from './colors';
import { typography, typographyCssVariables } from './typography';
import { spacing, spacingCssVariables } from './spacing';
import { shadows, shadowsCssVariables } from './shadows';

export {
  colors,
  cssVariables,
  type ColorScale,
  type SemanticColor,
  type NeutralShade,
} from './colors';
export {
  typography,
  typographyCssVariables,
  type FontSize,
  type FontWeight,
  type TextStyle,
} from './typography';
export {
  spacing,
  spacingCssVariables,
  type SpacingScale,
  type SemanticSpacing,
  type GridGap,
  type ContainerSize,
} from './spacing';
export {
  shadows,
  shadowsCssVariables,
  type ElevationLevel,
  type ColoredShadow,
  type SemanticShadow,
  type InteractiveShadow,
} from './shadows';

// Combined CSS variables for global theming
export const designTokenCssVariables = {
  // Colors
  ...colorCssVariables,

  // Typography
  ...typographyCssVariables,

  // Spacing
  ...spacingCssVariables,

  // Shadows
  ...shadowsCssVariables,
} as const;

// Design token utilities
export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
} as const;

// CSS variable injection helper
export const injectDesignTokens = () => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  Object.entries(designTokenCssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Theme configuration type
export interface ThemeConfig {
  colors?: typeof colors;
  typography?: typeof typography;
  spacing?: typeof spacing;
  shadows?: typeof shadows;
}

// Design token validation helpers
export const validateDesignToken = {
  color: (token: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(|^hsl\(/.test(token);
  },

  spacing: (token: string): boolean => {
    return /^\d+(\.\d+)?(px|rem|em|%)$/.test(token);
  },

  shadow: (token: string): boolean => {
    return token === 'none' || /^\d/.test(token);
  },
};

// Design token conversion utilities
export const convertDesignToken = {
  remToPx: (rem: string): string => {
    const numValue = parseFloat(rem.replace('rem', ''));
    return `${numValue * 16}px`;
  },

  pxToRem: (px: string): string => {
    const numValue = parseFloat(px.replace('px', ''));
    return `${numValue / 16}rem`;
  },
};

export default designTokens;
