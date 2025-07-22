/**
 * Design Tokens - Typography
 * Centralized typography system for Plan Pulse Compass
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'SF Mono',
      'Monaco',
      'Inconsolata',
      'Roboto Mono',
      'source-code-pro',
      'Menlo',
      'monospace',
    ],
    display: ['Inter Display', 'Inter', 'system-ui', 'sans-serif'],
  },

  // Font Sizes with line heights
  fontSize: {
    xs: {
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
    },
    sm: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
    },
    base: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
    },
    lg: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.75rem', // 28px
    },
    xl: {
      fontSize: '1.25rem', // 20px
      lineHeight: '1.75rem', // 28px
    },
    '2xl': {
      fontSize: '1.5rem', // 24px
      lineHeight: '2rem', // 32px
    },
    '3xl': {
      fontSize: '1.875rem', // 30px
      lineHeight: '2.25rem', // 36px
    },
    '4xl': {
      fontSize: '2.25rem', // 36px
      lineHeight: '2.5rem', // 40px
    },
    '5xl': {
      fontSize: '3rem', // 48px
      lineHeight: '1', // 48px
    },
    '6xl': {
      fontSize: '3.75rem', // 60px
      lineHeight: '1', // 60px
    },
    '7xl': {
      fontSize: '4.5rem', // 72px
      lineHeight: '1', // 72px
    },
  },

  // Font Weights
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

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles (Semantic)
  textStyles: {
    // Display text
    'display-2xl': {
      fontFamily: 'display',
      fontSize: '4.5rem',
      fontWeight: 'bold',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    'display-xl': {
      fontFamily: 'display',
      fontSize: '3.75rem',
      fontWeight: 'bold',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    'display-lg': {
      fontFamily: 'display',
      fontSize: '3rem',
      fontWeight: 'bold',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    'display-md': {
      fontFamily: 'display',
      fontSize: '2.25rem',
      fontWeight: 'bold',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
    'display-sm': {
      fontFamily: 'display',
      fontSize: '1.875rem',
      fontWeight: 'bold',
      lineHeight: '1.2',
    },
    'display-xs': {
      fontFamily: 'display',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      lineHeight: '1.3',
    },

    // Heading text
    'heading-xl': {
      fontFamily: 'sans',
      fontSize: '1.25rem',
      fontWeight: 'semibold',
      lineHeight: '1.4',
    },
    'heading-lg': {
      fontFamily: 'sans',
      fontSize: '1.125rem',
      fontWeight: 'semibold',
      lineHeight: '1.4',
    },
    'heading-md': {
      fontFamily: 'sans',
      fontSize: '1rem',
      fontWeight: 'semibold',
      lineHeight: '1.5',
    },
    'heading-sm': {
      fontFamily: 'sans',
      fontSize: '0.875rem',
      fontWeight: 'semibold',
      lineHeight: '1.4',
    },
    'heading-xs': {
      fontFamily: 'sans',
      fontSize: '0.75rem',
      fontWeight: 'semibold',
      lineHeight: '1.3',
    },

    // Body text
    'body-xl': {
      fontFamily: 'sans',
      fontSize: '1.25rem',
      fontWeight: 'normal',
      lineHeight: '1.5',
    },
    'body-lg': {
      fontFamily: 'sans',
      fontSize: '1.125rem',
      fontWeight: 'normal',
      lineHeight: '1.6',
    },
    'body-md': {
      fontFamily: 'sans',
      fontSize: '1rem',
      fontWeight: 'normal',
      lineHeight: '1.5',
    },
    'body-sm': {
      fontFamily: 'sans',
      fontSize: '0.875rem',
      fontWeight: 'normal',
      lineHeight: '1.4',
    },
    'body-xs': {
      fontFamily: 'sans',
      fontSize: '0.75rem',
      fontWeight: 'normal',
      lineHeight: '1.3',
    },

    // Label text
    'label-lg': {
      fontFamily: 'sans',
      fontSize: '1rem',
      fontWeight: 'medium',
      lineHeight: '1.5',
    },
    'label-md': {
      fontFamily: 'sans',
      fontSize: '0.875rem',
      fontWeight: 'medium',
      lineHeight: '1.4',
    },
    'label-sm': {
      fontFamily: 'sans',
      fontSize: '0.75rem',
      fontWeight: 'medium',
      lineHeight: '1.3',
    },

    // Code text
    'code-lg': {
      fontFamily: 'mono',
      fontSize: '1rem',
      fontWeight: 'normal',
      lineHeight: '1.5',
    },
    'code-md': {
      fontFamily: 'mono',
      fontSize: '0.875rem',
      fontWeight: 'normal',
      lineHeight: '1.4',
    },
    'code-sm': {
      fontFamily: 'mono',
      fontSize: '0.75rem',
      fontWeight: 'normal',
      lineHeight: '1.3',
    },
  },
} as const;

// CSS Custom Properties for typography
export const typographyCssVariables = {
  '--font-sans': typography.fontFamily.sans.join(', '),
  '--font-mono': typography.fontFamily.mono.join(', '),
  '--font-display': typography.fontFamily.display.join(', '),
} as const;

// Type helpers
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;
