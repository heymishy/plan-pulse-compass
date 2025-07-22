/**
 * Design Tokens - Colors
 * Centralized color system for Plan Pulse Compass
 */

export const colors = {
  // Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Semantic Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    info: {
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

  // Planning-specific colors
  planning: {
    allocated: '#22c55e',
    overAllocated: '#ef4444',
    underAllocated: '#f59e0b',
    unallocated: '#94a3b8',
  },

  // Status colors
  status: {
    onTrack: '#22c55e',
    atRisk: '#f59e0b',
    offTrack: '#ef4444',
    notStarted: '#94a3b8',
    completed: '#6366f1',
  },

  // Chart colors
  chart: {
    primary: '#0ea5e9',
    secondary: '#6366f1',
    tertiary: '#22c55e',
    quaternary: '#f59e0b',
    quinary: '#ef4444',
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
