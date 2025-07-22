/**
 * Design Tokens - Spacing
 * Centralized spacing system for Plan Pulse Compass
 */

export const spacing = {
  // Base spacing scale (rem units)
  0: '0rem', // 0px
  px: '0.0625rem', // 1px
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px

  // Semantic spacing (component-specific)
  semantic: {
    // Container spacing
    containerPadding: {
      mobile: '1rem', // 16px
      tablet: '1.5rem', // 24px
      desktop: '2rem', // 32px
    },

    // Component spacing
    component: {
      xs: '0.25rem', // 4px
      sm: '0.5rem', // 8px
      md: '1rem', // 16px
      lg: '1.5rem', // 24px
      xl: '2rem', // 32px
      '2xl': '3rem', // 48px
      '3xl': '4rem', // 64px
    },

    // Layout spacing
    layout: {
      sectionGap: '3rem', // 48px
      cardGap: '1.5rem', // 24px
      contentGap: '1rem', // 16px
      elementGap: '0.5rem', // 8px
    },

    // Form spacing
    form: {
      fieldGap: '1rem', // 16px
      labelGap: '0.25rem', // 4px
      buttonGap: '0.75rem', // 12px
      sectionGap: '1.5rem', // 24px
    },

    // Navigation spacing
    navigation: {
      itemPadding: '0.75rem', // 12px
      itemGap: '0.25rem', // 4px
      groupGap: '1rem', // 16px
      sidebarWidth: '16rem', // 256px
    },

    // Table spacing
    table: {
      cellPadding: '0.75rem', // 12px
      rowGap: '0.5rem', // 8px
      headerPadding: '1rem', // 16px
    },
  },

  // Grid spacing
  grid: {
    gap: {
      xs: '0.5rem', // 8px
      sm: '0.75rem', // 12px
      md: '1rem', // 16px
      lg: '1.5rem', // 24px
      xl: '2rem', // 32px
      '2xl': '3rem', // 48px
    },

    // Container max widths
    container: {
      sm: '36rem', // 576px
      md: '48rem', // 768px
      lg: '64rem', // 1024px
      xl: '80rem', // 1280px
      '2xl': '96rem', // 1536px
      full: '100%',
    },
  },
} as const;

// CSS Custom Properties for spacing
export const spacingCssVariables = {
  // Base spacing
  '--spacing-xs': spacing.semantic.component.xs,
  '--spacing-sm': spacing.semantic.component.sm,
  '--spacing-md': spacing.semantic.component.md,
  '--spacing-lg': spacing.semantic.component.lg,
  '--spacing-xl': spacing.semantic.component.xl,
  '--spacing-2xl': spacing.semantic.component['2xl'],
  '--spacing-3xl': spacing.semantic.component['3xl'],

  // Container spacing
  '--container-padding-mobile': spacing.semantic.containerPadding.mobile,
  '--container-padding-tablet': spacing.semantic.containerPadding.tablet,
  '--container-padding-desktop': spacing.semantic.containerPadding.desktop,

  // Layout spacing
  '--layout-section-gap': spacing.semantic.layout.sectionGap,
  '--layout-card-gap': spacing.semantic.layout.cardGap,
  '--layout-content-gap': spacing.semantic.layout.contentGap,

  // Navigation
  '--nav-sidebar-width': spacing.semantic.navigation.sidebarWidth,
  '--nav-item-padding': spacing.semantic.navigation.itemPadding,
} as const;

// Type helpers
export type SpacingScale = keyof typeof spacing;
export type SemanticSpacing = keyof typeof spacing.semantic.component;
export type GridGap = keyof typeof spacing.grid.gap;
export type ContainerSize = keyof typeof spacing.grid.container;
