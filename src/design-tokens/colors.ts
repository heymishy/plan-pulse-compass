/**
 * Design Tokens - Colors
 * Centralized color system for Plan Pulse Compass
 */

export const colors = {
  // Brand Colors (WCAG AA compliant)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0369a1', // Darker blue for AA compliance (was #0ea5e9, then #0284c7)
    600: '#075985',
    700: '#075985',
    800: '#0c4a6e',
    900: '#082f49',
    950: '#041f2e',
  },

  // Semantic Colors (WCAG AA compliant)
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#15803d', // Darker green for AA compliance (was #22c55e, then #16a34a)
      600: '#166534',
      700: '#166534',
      800: '#14532d',
      900: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#b45309', // Darker orange for AA compliance (was #f59e0b, then #d97706)
      600: '#92400e',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#dc2626', // Darker red for better contrast (was #ef4444)
      600: '#b91c1c',
      700: '#991b1b',
      800: '#7f1d1d',
      900: '#450a0a',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563eb', // Darker blue for better contrast (was #3b82f6)
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e1b4b',
    },
  },

  // Neutral Colors
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    1000: '#000000',
  },

  // Planning-specific colors (WCAG AA compliant)
  planning: {
    allocated: '#15803d', // Darker green for AA compliance
    overAllocated: '#dc2626', // Darker red (was #ef4444)
    underAllocated: '#b45309', // Darker orange for AA compliance
    unallocated: '#64748b', // Darker gray (was #94a3b8)
  },

  // Status colors (WCAG AA compliant)
  status: {
    onTrack: '#15803d', // Darker green for AA compliance
    atRisk: '#b45309', // Darker orange for AA compliance
    offTrack: '#dc2626', // Darker red (was #ef4444)
    notStarted: '#64748b', // Darker gray (was #94a3b8)
    completed: '#4338ca', // Darker purple for better contrast (was #6366f1)
  },

  // Chart colors (WCAG AA compliant)
  chart: {
    primary: '#0369a1', // Darker blue for AA compliance
    secondary: '#4338ca', // Darker purple (was #6366f1)
    tertiary: '#15803d', // Darker green for AA compliance
    quaternary: '#b45309', // Darker orange for AA compliance
    quinary: '#dc2626', // Darker red (was #ef4444)
    background: '#f8fafc',
    gridLines: '#e2e8f0',
  },
} as const;

// CSS Custom Properties for runtime theming
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-foreground': colors.neutral[0],
  '--color-secondary': colors.neutral[100],
  '--color-secondary-foreground': colors.neutral[900],
  '--color-muted': colors.neutral[100],
  '--color-muted-foreground': colors.neutral[500],
  '--color-accent': colors.neutral[100],
  '--color-accent-foreground': colors.neutral[900],
  '--color-destructive': colors.semantic.error[500],
  '--color-destructive-foreground': colors.neutral[0],
  '--color-border': colors.neutral[200],
  '--color-input': colors.neutral[200],
  '--color-ring': colors.primary[500],
  '--color-background': colors.neutral[0],
  '--color-foreground': colors.neutral[900],
  '--color-card': colors.neutral[0],
  '--color-card-foreground': colors.neutral[900],
  '--color-popover': colors.neutral[0],
  '--color-popover-foreground': colors.neutral[900],
} as const;

// Type helpers
export type ColorScale = keyof typeof colors.primary;
export type SemanticColor = keyof typeof colors.semantic;
export type NeutralShade = keyof typeof colors.neutral;
