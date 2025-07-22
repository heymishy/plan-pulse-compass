/**
 * Design Tokens System
 * Centralized design tokens for colors, typography, spacing, and shadows
 */

// Color system with comprehensive shades
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0ea5e9',
  },
  planning: {
    allocated: '#10b981',
    overAllocated: '#ef4444',
    underAllocated: '#f59e0b',
    unallocated: '#6b7280',
  },
  status: {
    onTrack: '#10b981',
    atRisk: '#f59e0b',
    offTrack: '#ef4444',
    notStarted: '#6b7280',
    completed: '#059669',
  },
} as const;

// Typography system
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    display: ['Inter Display', 'Inter', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: { fontSize: '0.75rem', lineHeight: '1rem' },
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    base: { fontSize: '1rem', lineHeight: '1.5rem' },
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
    '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },
    '5xl': { fontSize: '3rem', lineHeight: '1' },
    '6xl': { fontSize: '3.75rem', lineHeight: '1' },
    '7xl': { fontSize: '4.5rem', lineHeight: '1' },
  },
  textStyles: {
    'display-2xl': {
      fontSize: '4.5rem',
      lineHeight: '1',
      fontWeight: '800',
      letterSpacing: '-0.02em',
    },
    'heading-xl': {
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontWeight: '700',
    },
    'heading-lg': {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: '600',
    },
    'heading-md': {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
    },
    'heading-sm': {
      fontSize: '1.125rem',
      lineHeight: '1.5rem',
      fontWeight: '600',
    },
    'body-lg': {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '400',
    },
    'body-md': {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '400',
    },
    'body-sm': {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '400',
    },
    'body-xs': {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '400',
    },
    'label-md': {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '500',
    },
    'label-sm': {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '500',
    },
    'code-md': {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontFamily: 'mono',
    },
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// Spacing system with semantic tokens
export const spacing = {
  0: '0',
  px: '1px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',

  semantic: {
    component: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    layout: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
    },
    form: {
      field: '0.75rem',
      group: '1.5rem',
      section: '2rem',
    },
    navigation: {
      item: '0.5rem',
      group: '1rem',
      section: '1.5rem',
    },
    table: {
      cell: '0.75rem',
      row: '0.5rem',
      header: '1rem',
    },
  },

  grid: {
    gap: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
} as const;

// Shadow system
export const shadows = {
  elevation: {
    1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    6: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  semantic: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    button: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    dropdown:
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    input: '0 0 0 1px rgb(0 0 0 / 0.05)',
    navigation: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  colored: {
    primary: '0 4px 6px -1px rgb(59 130 246 / 0.2)',
    success: '0 4px 6px -1px rgb(16 185 129 / 0.2)',
    warning: '0 4px 6px -1px rgb(245 158 11 / 0.2)',
    error: '0 4px 6px -1px rgb(239 68 68 / 0.2)',
  },
} as const;

// Deep freeze helper function
const deepFreeze = <T>(obj: T): T => {
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null && typeof obj[prop] === 'object') {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

// Combined design tokens export (frozen for immutability)
export const designTokens = deepFreeze({
  colors,
  typography,
  spacing,
  shadows,
}) as const;

// Validation utilities
export const validateDesignToken = {
  color: (value: string): boolean => {
    // Validate hex, rgb, hsl color formats
    const patterns = [
      /^#([0-9a-f]{3}|[0-9a-f]{6})$/i, // hex
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i, // rgb
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i, // hsl
    ];
    return patterns.some(pattern => pattern.test(value));
  },

  spacing: (value: string): boolean => {
    // Validate rem, px, em, % units
    const pattern = /^(\d+(\.\d+)?(rem|px|em|%)|0)$/;
    return pattern.test(value);
  },

  shadow: (value: string): boolean => {
    // Validate shadow syntax (simplified)
    return value === 'none' || value.includes('rgb') || value.includes('rgba');
  },
};

// Conversion utilities
export const convertDesignToken = {
  remToPx: (rem: string): string => {
    const value = parseFloat(rem.replace('rem', ''));
    return `${value * 16}px`;
  },

  pxToRem: (px: string): string => {
    const value = parseFloat(px.replace('px', ''));
    return `${value / 16}rem`;
  },
};

// CSS Custom Properties injection
export const injectDesignTokens = (): void => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    // Inject color variables
    root.style.setProperty('--color-primary', colors.primary[500]);
    root.style.setProperty(
      '--font-sans',
      typography.fontFamily.sans.join(', ')
    );

    // Add other critical variables as needed
  }
};

export default designTokens;
