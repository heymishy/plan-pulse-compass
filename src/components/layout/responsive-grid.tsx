/**
 * Responsive Grid System
 * Mobile-first responsive grid with semantic breakpoints
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { spacing } from '@/design-tokens';

// Grid column configurations
type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Gap sizes using design tokens
type GridGap = keyof typeof spacing.grid.gap;

export interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Grid columns configuration */
  cols?: {
    /** Default columns (mobile-first) */
    default?: GridCols;
    /** Small screens (640px+) */
    sm?: GridCols;
    /** Medium screens (768px+) */
    md?: GridCols;
    /** Large screens (1024px+) */
    lg?: GridCols;
    /** Extra large screens (1280px+) */
    xl?: GridCols;
    /** 2XL screens (1536px+) */
    '2xl'?: GridCols;
  };
  /** Grid gap size */
  gap?: GridGap;
  /** Custom className */
  className?: string;
  /** Auto-fit columns (responsive without explicit breakpoints) */
  autoFit?: {
    /** Minimum column width */
    minWidth?: string;
    /** Maximum column width */
    maxWidth?: string;
  };
  /** Dense packing (fill gaps) */
  dense?: boolean;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1 },
  gap = 'md',
  className,
  autoFit,
  dense = false,
}) => {
  // Build responsive grid classes
  const gridClasses = cn(
    'grid',
    // Auto-fit vs explicit columns
    autoFit
      ? `grid-cols-[repeat(auto-fit,minmax(${autoFit.minWidth || '250px'},${autoFit.maxWidth || '1fr'}))]`
      : [
          // Explicit column configurations
          cols.default && `grid-cols-${cols.default}`,
          cols.sm && `sm:grid-cols-${cols.sm}`,
          cols.md && `md:grid-cols-${cols.md}`,
          cols.lg && `lg:grid-cols-${cols.lg}`,
          cols.xl && `xl:grid-cols-${cols.xl}`,
          cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
        ].filter(Boolean),
    // Gap using design tokens
    `gap-${gap}`,
    // Dense auto-placement
    dense && 'grid-flow-dense',
    className
  );

  return <div className={gridClasses}>{children}</div>;
};

// Specialized grid layouts
export interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

// Dashboard-specific grid (common pattern in the app)
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  className,
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      md: 2,
      lg: 3,
      xl: 4,
    }}
    gap="lg"
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

// Card grid for equal-height cards
export const CardGrid: React.FC<DashboardGridProps> = ({
  children,
  className,
}) => (
  <ResponsiveGrid
    autoFit={{
      minWidth: '280px',
      maxWidth: '1fr',
    }}
    gap="md"
    className={cn('items-start', className)}
  >
    {children}
  </ResponsiveGrid>
);

// Form grid for structured layouts
export interface FormGridProps {
  children: React.ReactNode;
  fields?: 'single' | 'double' | 'triple';
  className?: string;
}

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  fields = 'single',
  className,
}) => {
  const fieldConfigs = {
    single: { default: 1 },
    double: { default: 1, sm: 2 },
    triple: { default: 1, sm: 2, lg: 3 },
  };

  return (
    <ResponsiveGrid cols={fieldConfigs[fields]} gap="md" className={className}>
      {children}
    </ResponsiveGrid>
  );
};

// List grid for data display
export const ListGrid: React.FC<DashboardGridProps> = ({
  children,
  className,
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      lg: 2,
    }}
    gap="sm"
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

// Masonry-style grid (for varied content heights)
export const MasonryGrid: React.FC<DashboardGridProps> = ({
  children,
  className,
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      sm: 2,
      lg: 3,
      xl: 4,
    }}
    gap="md"
    dense
    className={cn('[&>*]:break-inside-avoid', className)}
  >
    {children}
  </ResponsiveGrid>
);

// Grid item with span controls
export interface GridItemProps {
  children: React.ReactNode;
  /** Column span configuration */
  colSpan?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  /** Row span configuration */
  rowSpan?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  colSpan,
  rowSpan,
  className,
}) => {
  const spanClasses = cn(
    // Column spans
    colSpan?.default && `col-span-${colSpan.default}`,
    colSpan?.sm && `sm:col-span-${colSpan.sm}`,
    colSpan?.md && `md:col-span-${colSpan.md}`,
    colSpan?.lg && `lg:col-span-${colSpan.lg}`,
    colSpan?.xl && `xl:col-span-${colSpan.xl}`,
    colSpan?.['2xl'] && `2xl:col-span-${colSpan['2xl']}`,

    // Row spans
    rowSpan?.default && `row-span-${rowSpan.default}`,
    rowSpan?.sm && `sm:row-span-${rowSpan.sm}`,
    rowSpan?.md && `md:row-span-${rowSpan.md}`,
    rowSpan?.lg && `lg:row-span-${rowSpan.lg}`,
    rowSpan?.xl && `xl:row-span-${rowSpan.xl}`,
    rowSpan?.['2xl'] && `2xl:row-span-${rowSpan['2xl']}`,

    className
  );

  return <div className={spanClasses}>{children}</div>;
};

export { ResponsiveGrid };
