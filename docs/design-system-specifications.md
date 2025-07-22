# Plan Pulse Compass - Design System Specifications

## 🎨 Design System Architecture

### Design Tokens

#### Color System

```typescript
// Brand Colors
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    900: '#0c4a6e',
  },
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    900: '#0f172a',
  },
};
```

#### Typography Scale

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
};
```

#### Spacing System

```typescript
const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
};
```

### Component Architecture Patterns

#### 1. Composite Components

```typescript
// Complex components with multiple parts
interface CompositeComponent {
  Root: React.FC<RootProps>;
  Header: React.FC<HeaderProps>;
  Content: React.FC<ContentProps>;
  Footer: React.FC<FooterProps>;
}

// Usage: <DataTable.Root><DataTable.Header>...</DataTable.Root>
```

#### 2. Compound Components

```typescript
// Components that work together
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogDescription>Content</DialogDescription>
    <DialogFooter>
      <DialogActions />
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 3. Render Props Pattern

```typescript
interface RenderProps<T> {
  children: (data: T, actions: Actions) => React.ReactNode
  data: T[]
  loading: boolean
}

// Usage: Flexible data presentation
<DataProvider>
  {({ data, loading, error }) => (
    loading ? <Skeleton /> : <DataTable data={data} />
  )}
</DataProvider>
```

### Advanced Component Patterns

#### Smart/Dumb Component Separation

```typescript
// Smart Component (Connected)
const PlanningDashboardContainer: React.FC = () => {
  const { data, actions } = usePlanning()
  return <PlanningDashboard data={data} actions={actions} />
}

// Dumb Component (Presentational)
interface PlanningDashboardProps {
  data: PlanningData
  actions: PlanningActions
}
const PlanningDashboard: React.FC<PlanningDashboardProps> = ({ data, actions }) => {
  // Pure presentation logic
}
```

#### Higher-Order Components for Cross-Cutting Concerns

```typescript
// Loading state wrapper
const withLoading = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P & { loading: boolean }) => {
    if (props.loading) return <LoadingSpinner />
    return <Component {...props} />
  }
}

// Error boundary wrapper
const withErrorBoundary = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Component {...props} />
    </ErrorBoundary>
  )
}
```

### Layout System

#### Grid System

```typescript
interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

const Grid: React.FC<GridProps> = ({ cols = 1, gap = 'md', children }) => {
  const gridCols = `grid-cols-${cols}`
  const gridGap = `gap-${gap}`

  return (
    <div className={cn('grid', gridCols, gridGap)}>
      {children}
    </div>
  )
}
```

#### Responsive Container

```typescript
const Container: React.FC<ContainerProps> = ({
  size = 'default',
  center = true,
  children
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    default: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'w-full px-4 sm:px-6 lg:px-8',
      sizes[size],
      center && 'mx-auto'
    )}>
      {children}
    </div>
  )
}
```

## 🎯 Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast

- Text: 4.5:1 minimum ratio
- Large text: 3:1 minimum ratio
- Non-text elements: 3:1 minimum

#### Keyboard Navigation

```typescript
const FocusableComponent: React.FC = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        // Activate functionality
        break
      case 'Escape':
        // Close/cancel
        break
      case 'ArrowUp':
      case 'ArrowDown':
        // Navigate items
        break
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Descriptive label"
    >
      {children}
    </div>
  )
}
```

#### ARIA Labels

```typescript
// Complex interactive elements
<div
  role="tabpanel"
  aria-labelledby="tab-1"
  aria-describedby="tab-1-desc"
  tabIndex={0}
>
  <h3 id="tab-1">Tab Title</h3>
  <p id="tab-1-desc">Tab description</p>
  {content}
</div>
```

## 📱 Responsive Design Framework

### Breakpoint System

```typescript
const breakpoints = {
  sm: '640px', // Mobile landscape
  md: '768px', // Tablet portrait
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
  '2xl': '1536px', // Extra large
};
```

### Mobile-First Components

```typescript
const ResponsiveCard: React.FC = ({ children }) => {
  return (
    <Card className={cn(
      // Mobile first (default)
      'p-4 text-sm',
      // Tablet
      'md:p-6 md:text-base',
      // Desktop
      'lg:p-8 lg:text-lg'
    )}>
      {children}
    </Card>
  )
}
```

## 🎨 Animation & Micro-interactions

### Transition Standards

```typescript
const transitions = {
  fast: '150ms ease-out',
  default: '250ms ease-out',
  slow: '350ms ease-out',
  bounce: '400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
```

### Loading States

```typescript
const LoadingStates = {
  skeleton: 'animate-pulse bg-gray-200 rounded',
  spinner:
    'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
  shimmer:
    'animate-shimmer bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300',
};
```

## 🚀 Performance Optimization

### Bundle Splitting Strategy

- Core UI components: Immediate load
- Feature-specific components: Lazy loaded
- Heavy visualizations: Dynamic imports
- Third-party libraries: Separate chunks

### Optimization Techniques

- React.memo for expensive renders
- useMemo for complex calculations
- useCallback for stable references
- Virtualization for large lists

## 🔧 Development Guidelines

### Component Development Checklist

- [ ] TypeScript interfaces defined
- [ ] Accessibility attributes added
- [ ] Responsive design implemented
- [ ] Loading states handled
- [ ] Error boundaries included
- [ ] Unit tests written
- [ ] Storybook documentation
- [ ] Performance optimized

### Code Review Standards

- Consistent naming conventions
- Proper TypeScript usage
- Accessibility compliance
- Performance considerations
- Test coverage requirements
- Documentation completeness
