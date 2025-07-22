/**
 * Design Tokens - Shadows
 * Centralized shadow system for Plan Pulse Compass
 */

export const shadows = {
  // Base shadow system
  none: 'none',

  // Elevation shadows (Material Design inspired)
  elevation: {
    1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    6: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
    lg: 'inset 0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },

  // Colored shadows (for interactive elements)
  colored: {
    primary: {
      sm: '0 1px 2px 0 rgb(14 165 233 / 0.15)',
      md: '0 4px 6px -1px rgb(14 165 233 / 0.15), 0 2px 4px -2px rgb(14 165 233 / 0.15)',
      lg: '0 10px 15px -3px rgb(14 165 233 / 0.15), 0 4px 6px -4px rgb(14 165 233 / 0.15)',
    },
    success: {
      sm: '0 1px 2px 0 rgb(34 197 94 / 0.15)',
      md: '0 4px 6px -1px rgb(34 197 94 / 0.15), 0 2px 4px -2px rgb(34 197 94 / 0.15)',
      lg: '0 10px 15px -3px rgb(34 197 94 / 0.15), 0 4px 6px -4px rgb(34 197 94 / 0.15)',
    },
    warning: {
      sm: '0 1px 2px 0 rgb(245 158 11 / 0.15)',
      md: '0 4px 6px -1px rgb(245 158 11 / 0.15), 0 2px 4px -2px rgb(245 158 11 / 0.15)',
      lg: '0 10px 15px -3px rgb(245 158 11 / 0.15), 0 4px 6px -4px rgb(245 158 11 / 0.15)',
    },
    error: {
      sm: '0 1px 2px 0 rgb(239 68 68 / 0.15)',
      md: '0 4px 6px -1px rgb(239 68 68 / 0.15), 0 2px 4px -2px rgb(239 68 68 / 0.15)',
      lg: '0 10px 15px -3px rgb(239 68 68 / 0.15), 0 4px 6px -4px rgb(239 68 68 / 0.15)',
    },
  },

  // Semantic shadows (component-specific)
  semantic: {
    // Card shadows
    card: {
      default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      active: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },

    // Button shadows
    button: {
      default: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      hover: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
      pressed: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.1)',
      focus: '0 0 0 3px rgb(14 165 233 / 0.15)',
    },

    // Modal/Dialog shadows
    modal: {
      backdrop: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      content:
        '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },

    // Dropdown/Popover shadows
    dropdown: {
      default:
        '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      large:
        '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },

    // Input shadows
    input: {
      default: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      focus:
        '0 0 0 3px rgb(14 165 233 / 0.1), inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      error:
        '0 0 0 3px rgb(239 68 68 / 0.1), inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },

    // Navigation shadows
    navigation: {
      header: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      sidebar: '4px 0 6px -1px rgb(0 0 0 / 0.1)',
      floating:
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },

    // Data visualization shadows
    chart: {
      tooltip:
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      element: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      container:
        '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },

    // Status shadows (for alerts, notifications)
    status: {
      info: '0 2px 4px 0 rgb(59 130 246 / 0.1)',
      success: '0 2px 4px 0 rgb(34 197 94 / 0.1)',
      warning: '0 2px 4px 0 rgb(245 158 11 / 0.1)',
      error: '0 2px 4px 0 rgb(239 68 68 / 0.1)',
    },
  },

  // Interactive state shadows
  interactive: {
    // Focus rings
    focus: {
      primary: '0 0 0 3px rgb(14 165 233 / 0.15)',
      secondary: '0 0 0 3px rgb(100 116 139 / 0.15)',
      success: '0 0 0 3px rgb(34 197 94 / 0.15)',
      warning: '0 0 0 3px rgb(245 158 11 / 0.15)',
      error: '0 0 0 3px rgb(239 68 68 / 0.15)',
    },

    // Hover effects
    hover: {
      subtle: '0 2px 4px 0 rgb(0 0 0 / 0.05)',
      moderate:
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      strong:
        '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },

    // Active/pressed states
    active: {
      inset: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.1)',
      shallow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
  },
} as const;

// CSS Custom Properties for shadows
export const shadowsCssVariables = {
  // Base elevation shadows
  '--shadow-sm': shadows.elevation[1],
  '--shadow-md': shadows.elevation[2],
  '--shadow-lg': shadows.elevation[3],
  '--shadow-xl': shadows.elevation[4],
  '--shadow-2xl': shadows.elevation[5],

  // Semantic shadows
  '--shadow-card': shadows.semantic.card.default,
  '--shadow-card-hover': shadows.semantic.card.hover,
  '--shadow-button': shadows.semantic.button.default,
  '--shadow-button-hover': shadows.semantic.button.hover,
  '--shadow-modal': shadows.semantic.modal.content,
  '--shadow-dropdown': shadows.semantic.dropdown.default,
  '--shadow-input': shadows.semantic.input.default,
  '--shadow-input-focus': shadows.semantic.input.focus,
  '--shadow-header': shadows.semantic.navigation.header,

  // Focus rings
  '--shadow-focus-primary': shadows.interactive.focus.primary,
  '--shadow-focus-error': shadows.interactive.focus.error,
} as const;

// Type helpers
export type ElevationLevel = keyof typeof shadows.elevation;
export type ColoredShadow = keyof typeof shadows.colored;
export type SemanticShadow = keyof typeof shadows.semantic;
export type InteractiveShadow = keyof typeof shadows.interactive;
