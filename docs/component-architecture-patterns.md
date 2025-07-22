# Component Architecture Patterns - Plan Pulse Compass

## 🏗️ Architecture Overview

The Plan Pulse Compass application follows a **Feature-Driven Component Architecture** with clear separation between presentation, business logic, and data management layers.

### Component Hierarchy

```
src/components/
├── ui/                    # Base design system components
├── dashboard/             # Dashboard-specific components
├── planning/              # Planning workflow components
├── teams/                 # Team management components
├── projects/              # Project management components
├── allocations/           # Resource allocation components
├── tracking/              # Progress tracking components
├── financials/            # Financial analysis components
├── scenarios/             # Scenario planning components
├── goals/                 # Goal management components
├── canvas/                # Visualization components
├── ocr/                   # Document processing components
├── milestones/            # Milestone management components
├── people/                # People management components
├── skills/                # Skills management components
├── settings/              # Configuration components
├── setup/                 # Initial setup components
└── reports/               # Reporting components
```

## 🎯 Component Design Patterns

### 1. Domain-Driven Components

Each feature domain has its own component directory with specialized components:

```typescript
// Example: Planning domain
src/components/planning/
├── PlanningMatrix.tsx           # Main planning interface
├── AllocationTable.tsx          # Resource allocation table
├── CapacityWarnings.tsx         # Capacity validation alerts
├── ConflictDetection.tsx        # Resource conflict detection
├── BudgetImpactAnalyzer.tsx     # Financial impact analysis
├── ResourceOptimizationEngine.tsx # Optimization suggestions
└── __tests__/                   # Domain-specific tests
```

### 2. Layered Component Architecture

#### Presentation Layer

- **Pure UI Components**: No business logic, only presentation
- **Composite Components**: Complex UI assemblies
- **Layout Components**: Page structure and organization

#### Container Layer

- **Smart Components**: Connected to context/state
- **Workflow Orchestrators**: Manage multi-step processes
- **Data Fetchers**: Handle data loading and caching

#### Business Logic Layer

- **Custom Hooks**: Encapsulate business logic
- **Context Providers**: Global state management
- **Utility Functions**: Pure business calculations

### 3. Component Composition Strategies

#### Table Pattern

```typescript
// Flexible table composition
<DataTable>
  <DataTable.Header>
    <DataTable.Column sortable>Name</DataTable.Column>
    <DataTable.Column>Role</DataTable.Column>
    <DataTable.Actions />
  </DataTable.Header>
  <DataTable.Body>
    {data.map(item => (
      <DataTable.Row key={item.id}>
        <DataTable.Cell>{item.name}</DataTable.Cell>
        <DataTable.Cell>{item.role}</DataTable.Cell>
        <DataTable.Actions>
          <EditButton />
          <DeleteButton />
        </DataTable.Actions>
      </DataTable.Row>
    ))}
  </DataTable.Body>
</DataTable>
```

#### Dialog Pattern

```typescript
// Modal composition with context
<Dialog>
  <DialogTrigger asChild>
    <Button>Add Team Member</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Team Member</DialogTitle>
      <DialogDescription>
        Enter details for the new team member
      </DialogDescription>
    </DialogHeader>
    <PersonForm onSubmit={handleSubmit} />
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit">Add Member</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Wizard Pattern

```typescript
// Multi-step workflow
<SetupWizard>
  <SetupWizard.Step title="Configuration" icon={<SettingsIcon />}>
    <ConfigurationStep />
  </SetupWizard.Step>
  <SetupWizard.Step title="Data Import" icon={<ImportIcon />}>
    <DataImportStep />
  </SetupWizard.Step>
  <SetupWizard.Step title="Complete" icon={<CheckIcon />}>
    <CompleteStep />
  </SetupWizard.Step>
</SetupWizard>
```

## 🎨 Design System Integration

### Base Component Library

Built on **shadcn/ui** with Radix UI primitives:

- **Consistent API**: All components follow similar prop patterns
- **Accessibility First**: ARIA attributes and keyboard navigation
- **Themeable**: CSS variables for consistent styling
- **Composable**: Components work well together

### Component Variants

```typescript
// Button variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### Custom Component Extensions

```typescript
// Extended button with loading state
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}) => {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {loading ? loadingText : children}
    </Button>
  )
}
```

## 🔄 State Management Patterns

### Context-Based State

```typescript
// Domain-specific context
interface PlanningContextType {
  // State
  allocations: Allocation[];
  conflicts: Conflict[];
  loading: boolean;

  // Actions
  addAllocation: (allocation: Allocation) => void;
  removeAllocation: (id: string) => void;
  detectConflicts: () => void;
  optimizeAllocations: () => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(
  undefined
);

// Custom hook for consuming context
export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within PlanningProvider');
  }
  return context;
};
```

### Reducer Pattern for Complex State

```typescript
interface PlanningState {
  allocations: Allocation[];
  selectedAllocation: Allocation | null;
  filters: FilterState;
  view: ViewMode;
}

type PlanningAction =
  | { type: 'ADD_ALLOCATION'; payload: Allocation }
  | { type: 'SELECT_ALLOCATION'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'SET_VIEW'; payload: ViewMode };

const planningReducer = (
  state: PlanningState,
  action: PlanningAction
): PlanningState => {
  switch (action.type) {
    case 'ADD_ALLOCATION':
      return { ...state, allocations: [...state.allocations, action.payload] };
    case 'SELECT_ALLOCATION':
      return {
        ...state,
        selectedAllocation:
          state.allocations.find(a => a.id === action.payload) || null,
      };
    default:
      return state;
  }
};
```

## 🎯 Performance Optimization Patterns

### Lazy Loading Components

```typescript
// Heavy components loaded on demand
const AdvancedPlanningDashboard = lazy(() => import('./AdvancedPlanningDashboard'))
const CanvasVisualization = lazy(() => import('./CanvasVisualization'))
const ReportGenerator = lazy(() => import('./ReportGenerator'))

// Usage with Suspense
<Suspense fallback={<ComponentSkeleton />}>
  <AdvancedPlanningDashboard />
</Suspense>
```

### Memoization Strategies

```typescript
// Expensive calculations
const PlanningMatrix: React.FC<Props> = ({ allocations, teams, projects }) => {
  const matrixData = useMemo(() => {
    return calculatePlanningMatrix(allocations, teams, projects)
  }, [allocations, teams, projects])

  const handleCellUpdate = useCallback((cellId: string, value: number) => {
    updateAllocation(cellId, value)
  }, [updateAllocation])

  return <Matrix data={matrixData} onCellUpdate={handleCellUpdate} />
}

// Component memoization
export default React.memo(PlanningMatrix, (prevProps, nextProps) => {
  return (
    prevProps.allocations === nextProps.allocations &&
    prevProps.teams === nextProps.teams &&
    prevProps.projects === nextProps.projects
  )
})
```

### Virtual Scrolling for Large Lists

```typescript
// Large dataset handling
const PeopleTable: React.FC<Props> = ({ people }) => {
  const virtualizer = useVirtualizer({
    count: people.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Row height
    overscan: 10
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <PersonRow
            key={virtualItem.key}
            person={people[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

## 🧪 Testing Patterns

### Component Testing Strategy

```typescript
// Unit testing with React Testing Library
describe('AllocationTable', () => {
  const mockAllocations = [
    { id: '1', personId: '1', projectId: '1', percentage: 50 },
    { id: '2', personId: '2', projectId: '1', percentage: 100 }
  ]

  it('renders allocation data correctly', () => {
    render(<AllocationTable allocations={mockAllocations} />)

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('handles allocation updates', async () => {
    const onUpdate = vi.fn()
    render(<AllocationTable allocations={mockAllocations} onUpdate={onUpdate} />)

    const input = screen.getByDisplayValue('50')
    await user.type(input, '{selectall}75')
    await user.tab()

    expect(onUpdate).toHaveBeenCalledWith('1', 75)
  })
})
```

### Integration Testing

```typescript
// Testing component interactions
describe('Planning Workflow', () => {
  it('creates allocation and updates capacity warnings', async () => {
    render(
      <PlanningProvider>
        <PlanningDashboard />
      </PlanningProvider>
    )

    // Add allocation
    const addButton = screen.getByRole('button', { name: /add allocation/i })
    await user.click(addButton)

    // Fill form
    await user.type(screen.getByLabelText(/person/i), 'John Doe')
    await user.type(screen.getByLabelText(/percentage/i), '120')

    // Submit
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Check warning appears
    expect(await screen.findByText(/over capacity/i)).toBeInTheDocument()
  })
})
```

## 📚 Documentation Standards

### Component Documentation

````typescript
/**
 * AllocationTable displays and manages resource allocations in a tabular format.
 *
 * Features:
 * - Inline editing of allocation percentages
 * - Capacity validation with warnings
 * - Sorting and filtering capabilities
 * - Bulk operations support
 *
 * @example
 * ```tsx
 * <AllocationTable
 *   allocations={allocations}
 *   onUpdate={handleUpdate}
 *   onDelete={handleDelete}
 *   showCapacityWarnings
 * />
 * ```
 */
interface AllocationTableProps {
  /** Array of allocations to display */
  allocations: Allocation[];
  /** Callback fired when allocation is updated */
  onUpdate?: (id: string, percentage: number) => void;
  /** Callback fired when allocation is deleted */
  onDelete?: (id: string) => void;
  /** Show capacity warning indicators */
  showCapacityWarnings?: boolean;
}
````

### Storybook Integration

```typescript
// Component stories for documentation and testing
export default {
  title: 'Planning/AllocationTable',
  component: AllocationTable,
  parameters: {
    docs: {
      description: {
        component:
          'Table for managing resource allocations with inline editing capabilities.',
      },
    },
  },
} as Meta<typeof AllocationTable>;

export const Default: Story = {
  args: {
    allocations: mockAllocations,
    showCapacityWarnings: true,
  },
};

export const WithOverCapacity: Story = {
  args: {
    allocations: overCapacityAllocations,
    showCapacityWarnings: true,
  },
};
```

This architecture provides a scalable, maintainable foundation for the complex enterprise planning application while maintaining performance and usability standards.
