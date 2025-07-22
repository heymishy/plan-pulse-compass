/**
 * Page Layout Templates
 * Standardized page layouts with responsive containers
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing } from '@/design-tokens';

// Container component with responsive sizing
export interface ContainerProps {
  children: React.ReactNode;
  /** Container size variant */
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl' | 'full';
  /** Center the container */
  center?: boolean;
  /** Custom padding */
  padding?: keyof typeof spacing.semantic.containerPadding | 'none';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'default',
  center = true,
  padding,
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl', // 672px
    default: 'max-w-6xl', // 1152px
    lg: 'max-w-7xl', // 1280px
    xl: 'max-w-screen-xl', // 1280px
    '2xl': 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',
  };

  const paddingClasses = {
    mobile: 'px-4',
    tablet: 'px-6',
    desktop: 'px-8',
    none: '',
  };

  return (
    <div
      className={cn(
        'w-full',
        sizeClasses[size],
        center && 'mx-auto',
        padding
          ? paddingClasses[padding as keyof typeof paddingClasses]
          : 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
};

// Breadcrumb navigation
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
}) => (
  <nav aria-label="Breadcrumb" className={cn('flex', className)}>
    <ol className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <li key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
          )}
          {item.href && !item.current ? (
            <a
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span
              className={cn(
                item.current
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

// Page header component
export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Action buttons/components */
  actions?: React.ReactNode;
  /** Breadcrumb navigation */
  breadcrumbs?: BreadcrumbItem[];
  /** Custom className */
  className?: string;
  /** Hide bottom border */
  noBorder?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  noBorder = false,
}) => (
  <div
    className={cn(
      'bg-background',
      !noBorder && 'border-b border-border',
      className
    )}
  >
    <Container className="py-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-4" />}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-3 items-start shrink-0">{actions}</div>
        )}
      </div>
    </Container>
  </div>
);

// Standard page template
export interface StandardPageProps {
  /** Page header configuration */
  header: PageHeaderProps;
  /** Main page content */
  children: React.ReactNode;
  /** Optional sidebar content */
  sidebar?: React.ReactNode;
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  /** Custom className for main container */
  className?: string;
  /** Full height layout */
  fullHeight?: boolean;
}

export const StandardPage: React.FC<StandardPageProps> = ({
  header,
  children,
  sidebar,
  sidebarPosition = 'right',
  className,
  fullHeight = false,
}) => (
  <div className={cn('bg-background', fullHeight && 'min-h-screen')}>
    <PageHeader {...header} />
    <Container className={cn('py-8', className)}>
      <div
        className={cn(
          'flex gap-8',
          sidebar
            ? sidebarPosition === 'left'
              ? 'lg:flex-row-reverse'
              : 'lg:flex-row'
            : 'flex-col',
          sidebar && 'lg:grid lg:grid-cols-4'
        )}
      >
        <main className={cn('flex-1', sidebar ? 'lg:col-span-3' : 'w-full')}>
          {children}
        </main>
        {sidebar && (
          <aside className="lg:col-span-1">
            <div className="sticky top-8">{sidebar}</div>
          </aside>
        )}
      </div>
    </Container>
  </div>
);

// Dashboard page template (common in the app)
export interface DashboardPageProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Dashboard content */
  children: React.ReactNode;
  /** Header tabs or navigation */
  tabs?: React.ReactNode;
  className?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  title,
  description,
  actions,
  children,
  tabs,
  className,
}) => (
  <div className="min-h-screen bg-background">
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
        {tabs && <div className="mt-4">{tabs}</div>}
      </Container>
    </div>
    <Container className={cn('py-6', className)}>{children}</Container>
  </div>
);

// Split layout (common for detail views)
export interface SplitLayoutProps {
  /** Left panel content */
  left: React.ReactNode;
  /** Right panel content */
  right: React.ReactNode;
  /** Left panel width (grid columns) */
  leftWidth?: 1 | 2 | 3 | 4 | 5;
  /** Right panel width (grid columns) */
  rightWidth?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Gap between panels */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  left,
  right,
  leftWidth = 2,
  rightWidth = 4,
  gap = 'lg',
  className,
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-6',
        gapClasses[gap],
        className
      )}
    >
      <div className={`lg:col-span-${leftWidth}`}>{left}</div>
      <div className={`lg:col-span-${rightWidth}`}>{right}</div>
    </div>
  );
};

// Export all components
export {
  Container,
  Breadcrumbs,
  PageHeader,
  StandardPage,
  DashboardPage,
  SplitLayout,
};
