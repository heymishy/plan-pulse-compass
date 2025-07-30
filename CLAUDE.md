# Plan Pulse Compass - Claude Development Guidelines

## Project Overview

Plan Pulse Compass is a comprehensive planning and project management application built with React 18.3.1, TypeScript 5.5.3, and Vite 6.0.1. The project uses a modern tech stack with shadcn/ui components, Vitest for testing, and comprehensive CI/CD pipelines.

## Core Technologies

- **Frontend**: React 18.3.1 with TypeScript 5.5.3
- **Build Tool**: Vite 6.0.1
- **UI Library**: shadcn/ui with Radix UI primitives
- **Testing**: Vitest with Testing Library
- **Date Handling**: date-fns for date manipulation
- **Calendar**: react-day-picker for calendar functionality
- **State Management**: React Context API
- **Styling**: Tailwind CSS with CSS custom properties

## Test-Driven Development (TDD) Guidelines

### TDD-First Practice - MANDATORY

**ALWAYS** follow the TDD cycle for ALL code changes:

1. **🔴 RED**: Write a failing test first
   - Create test cases that define the expected behavior
   - Ensure tests fail initially (proving they're testing the right thing)
   - Use descriptive test names that explain the requirement

2. **🟢 GREEN**: Write minimal code to make tests pass
   - Implement only what's needed to satisfy the failing test
   - Avoid over-engineering or adding unnecessary features
   - Focus on making the test pass, not on perfect code

3. **🔵 REFACTOR**: Clean up code while keeping tests green
   - Improve code structure, readability, and performance
   - Ensure all tests continue to pass throughout refactoring
   - Remove duplication and improve design

### TDD Implementation Rules

- **Never write production code without a failing test**
- **Write only enough test code to demonstrate a failure**
- **Write only enough production code to make the failing test pass**
- **Tests must be independent and repeatable**
- **Test behavior, not implementation details**

## Testing Requirements

### Local Testing - MANDATORY BEFORE ANY COMMIT

**ALWAYS** run the complete testing suite locally before committing ANY changes:

```bash
# 1. Run core test suite (REQUIRED - must pass 100%)
npm run test:core

# 2. Run type checking (REQUIRED - must pass)
npm run type-check

# 3. Run linting (REQUIRED - must pass)
npm run lint

# 4. Run full test suite with coverage (RECOMMENDED)
npm run test:coverage

# 5. Run integration tests (if applicable)
npm run test:integration

# 6. Run E2E tests locally (for critical changes)
npm run test:e2e
```

### Test Suite Organization

The project uses a multi-tier testing approach:

#### Core Tests (`npm run test:core`)

- **Components**: Unit tests for all React components
- **Utilities**: Unit tests for helper functions and utilities
- **Context**: Tests for React Context providers and hooks
- **Types**: TypeScript interface consistency validation
- **Business Logic**: Core application logic tests

#### Integration Tests (`npm run test:integration`)

- Component integration with context providers
- API integration tests
- Complex user workflows

#### Non-Core Tests (`npm run test:non-core`)

- O365 integration tests
- OCR functionality tests
- External service integrations
- Advanced features that don't block core functionality

#### UI/Layout Tests (`npm run test:layout`)

- Visual regression tests
- Responsive design validation
- Accessibility compliance tests

#### E2E Tests (`npm run test:e2e`)

- Full user journey tests
- Cross-browser compatibility
- Performance validation

### Test Quality Standards

- **Coverage Requirements**: ≥90% line coverage, ≥85% branch coverage
- **Test Performance**: Core test suite must complete in <30 seconds
- **Test Reliability**: Zero flaky tests - all tests must be deterministic
- **Test Maintainability**: Tests should be readable and well-documented

## 🚨 CRITICAL TESTING REQUIREMENTS

**ALL CHANGES MUST RUN COMPREHENSIVE LOCAL TESTS INCLUDING E2E TESTS BEFORE ANY COMMIT, PUSH, OR DEPLOYMENT**

### Mandatory Test Execution Order

**EVERY change, no matter how small, must complete this full testing sequence:**

```bash
# 1. MANDATORY - Core functionality tests
npm run test:core

# 2. MANDATORY - TypeScript validation
npm run typecheck

# 3. MANDATORY - Code quality checks
npm run lint

# 4. MANDATORY - Production build verification
npm run build

# 5. MANDATORY - E2E console error detection
npx playwright test tests/e2e/page-console-errors.spec.ts

# 6. MANDATORY - Critical user journey E2E tests
npx playwright test tests/e2e/smoke-test-ci.spec.ts

# 7. RECOMMENDED - Full test coverage validation
npm run test:coverage
```

**⚠️ ZERO EXCEPTIONS**: No commits, pushes, or deployments are allowed without completing ALL mandatory tests above.

## Pre-Commit Checklist

**MANDATORY checklist before ANY commit (NEVER skip E2E tests):**

- [ ] ✅ **TDD Cycle Completed**: Red → Green → Refactor cycle followed
- [ ] ✅ **Core Tests Pass**: `npm run test:core` returns 100% pass rate
- [ ] ✅ **Types Valid**: `npm run typecheck` passes without errors
- [ ] ✅ **Linting Clean**: `npm run lint` passes without errors
- [ ] ✅ **Build Successful**: `npm run build` completes without errors
- [ ] ✅ **E2E Console Errors**: `npx playwright test tests/e2e/page-console-errors.spec.ts` shows NO errors
- [ ] ✅ **E2E Smoke Tests**: `npx playwright test tests/e2e/smoke-test-ci.spec.ts` passes
- [ ] ✅ **Integration Tests**: `npm run test:integration` passes (if applicable)
- [ ] ✅ **Manual Testing**: Features tested manually in development environment
- [ ] ✅ **Git Status Clean**: Only intended changes staged for commit

### Pre-Push/Deploy Checklist

**MANDATORY checklist before ANY push or deployment:**

- [ ] ✅ **Full Test Suite**: `npm run test:coverage` achieves ≥90% coverage
- [ ] ✅ **Comprehensive E2E Tests**: ALL E2E test suites pass without errors
- [ ] ✅ **Console Error Validation**: NO console errors in ANY tested pages
- [ ] ✅ **Cross-Browser Testing**: Major browsers tested (Chrome, Firefox, Safari, Edge)
- [ ] ✅ **Performance Check**: No significant performance regressions
- [ ] ✅ **Bundle Analysis**: Bundle size within acceptable limits
- [ ] ✅ **Security Audit**: `npm audit` shows no high-severity vulnerabilities
- [ ] ✅ **Production Deployment Test**: Deployed version verified to work correctly
- [ ] ✅ **Documentation**: README and docs updated for new features
- [ ] ✅ **Migration Strategy**: Database/breaking changes have migration plan

### E2E Test Requirements

**E2E tests are NOT optional - they must pass for ALL changes:**

- **Console Error Detection**: Every page must load without JavaScript console errors
- **Critical User Flows**: All primary user journeys must function correctly
- **Cross-Browser Compatibility**: Tests must pass in all supported browsers
- **Performance Validation**: Page load times and interaction responsiveness verified
- **Accessibility Compliance**: WCAG 2.1 AA standards maintained

## Code Quality Standards

### TypeScript Interface Consistency

**CRITICAL**: Ensure test mock data ALWAYS matches TypeScript interfaces:

```typescript
// ❌ WRONG - Mock data doesn't match interface
const mockAllocation = {
  id: 'alloc1',
  teamId: 'team1',
  iterationNumber: 1, // ❌ Field doesn't exist in Allocation interface
  runWorkCategoryId: '', // ❌ Field doesn't exist in Allocation interface
};

// ✅ CORRECT - Mock data matches Allocation interface exactly
const mockAllocation: Allocation = {
  id: 'alloc1',
  personId: 'person1', // ✅ Required field included
  teamId: 'team1',
  projectId: 'proj1',
  epicId: 'epic1',
  cycleId: 'iter1',
  percentage: 80,
  type: 'project', // ✅ Required field included
  startDate: '2024-01-01', // ✅ Required field included
  endDate: '2024-01-14', // ✅ Required field included
  notes: '',
};
```

### Component Testing Standards

- **Props Testing**: Test all component props and their edge cases
- **Event Handling**: Test all user interactions and event handlers
- **State Management**: Test component state changes and side effects
- **Error Boundaries**: Test error handling and graceful degradation
- **Accessibility**: Test ARIA attributes and keyboard navigation

### Performance Standards

- **Component Rendering**: <100ms for initial render
- **Test Execution**: Core test suite <30 seconds
- **Bundle Size**: <500KB initial, <2MB total
- **Memory Usage**: <100MB baseline, no memory leaks
- **API Response**: <200ms average response time

## Development Workflow

### Feature Development Process

1. **📋 Create Feature Tests**

   ```bash
   # Create test file first
   touch src/components/__tests__/NewComponent.test.tsx

   # Write comprehensive test cases
   # Tests should cover all requirements and edge cases
   ```

2. **🔴 Write Failing Tests**

   ```typescript
   describe('NewComponent', () => {
     it('should render with required props', () => {
       render(<NewComponent requiredProp="value" />);
       expect(screen.getByText('Expected Text')).toBeInTheDocument();
     });
   });
   ```

3. **🟢 Implement Component**

   ```typescript
   // Implement minimal code to make tests pass
   const NewComponent: React.FC<Props> = ({ requiredProp }) => {
     return <div>Expected Text</div>;
   };
   ```

4. **🔵 Refactor and Optimize**

   ```typescript
   // Improve implementation while keeping tests green
   // Add proper styling, error handling, accessibility
   ```

5. **✅ Validate Complete Suite**
   ```bash
   npm run test:core
   npm run type-check
   npm run lint
   npm run build
   ```

### Bug Fix Process

1. **🔍 Reproduce Bug**: Write a test that demonstrates the bug
2. **🔴 Failing Test**: Ensure test fails due to the bug
3. **🔧 Fix Implementation**: Modify code to fix the bug
4. **🟢 Validate Fix**: Ensure bug test now passes
5. **🧪 Regression Testing**: Run full test suite to prevent regressions
6. **📝 Document**: Update documentation if needed

### Refactoring Process

1. **🛡️ Safety Net**: Ensure comprehensive test coverage exists
2. **🔄 Small Steps**: Make incremental changes
3. **✅ Continuous Validation**: Run tests after each change
4. **📊 Performance Check**: Verify no performance degradation
5. **🧹 Cleanup**: Remove dead code and improve documentation

## CI/CD Pipeline Integration

### Pipeline Structure

The CI/CD pipeline uses a multi-track approach:

1. **Quick Validation Track** (Fast feedback - <10 minutes)
   - ESLint validation
   - TypeScript type checking
   - Core test suite (`npm run test:core`)
   - Quick build check

2. **Comprehensive Testing Track** (Thorough validation - <20 minutes)
   - Integration tests
   - UI/Layout tests
   - Test result artifacts

3. **Non-Core Testing Track** (Non-blocking - <15 minutes)
   - O365 integration tests
   - OCR functionality tests
   - Advanced feature tests
   - Continues on error to not block main pipeline

4. **E2E Testing Track** (Main branch only - <15 minutes)
   - Full user journey validation
   - Cross-browser testing
   - Performance monitoring

### Pipeline Quality Gates

- **Quick Validation**: MUST pass for any PR to be merged
- **Core Tests**: 100% pass rate required
- **Type Safety**: Zero TypeScript errors allowed
- **Code Quality**: Zero ESLint errors allowed
- **Build Success**: Must build successfully for production

## Testing Best Practices

### Mock Data Management

```typescript
// ✅ Use factory functions for consistent mock data
const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-id',
  name: 'Test Team',
  description: 'Test team description',
  type: 'permanent',
  status: 'active',
  divisionId: 'dev',
  capacity: 40,
  targetSkills: [],
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ✅ Validate mock data against interfaces
const mockTeam: Team = createMockTeam();
```

### Test Organization

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Happy path tests
  describe('when rendering with valid props', () => {
    it('should display component correctly', () => {
      // Test implementation
    });
  });

  // Edge case tests
  describe('when handling edge cases', () => {
    it('should handle empty data gracefully', () => {
      // Test implementation
    });
  });

  // Error case tests
  describe('when encountering errors', () => {
    it('should display error message', () => {
      // Test implementation
    });
  });

  // Interaction tests
  describe('when user interacts', () => {
    it('should respond to user actions', () => {
      // Test implementation
    });
  });
});
```

### Component Testing Patterns

```typescript
// ✅ Test component behavior, not implementation
it('should filter items when search term is entered', async () => {
  const user = userEvent.setup();
  render(<SearchableList items={mockItems} />);

  await user.type(screen.getByRole('textbox'), 'filter term');

  expect(screen.queryByText('Filtered Out Item')).not.toBeInTheDocument();
  expect(screen.getByText('Matching Item')).toBeInTheDocument();
});

// ✅ Test accessibility
it('should be accessible via keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<NavigableComponent />);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button'));
});

// ✅ Test error boundaries
it('should handle component errors gracefully', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(<ComponentWithError shouldError={true} />);

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  consoleSpy.mockRestore();
});
```

## Deployment Standards

### Pre-Deployment Validation

- **Full Test Suite**: 100% pass rate on all core tests
- **Performance Benchmarks**: No degradation in key metrics
- **Security Scan**: Clean security audit results
- **Browser Compatibility**: Tested on all supported browsers
- **Accessibility**: WCAG 2.1 AA compliance verified

### Deployment Pipeline

1. **Feature Branch**: Development and initial testing
2. **Pull Request**: Code review and automated testing
3. **Staging**: Full integration testing and user acceptance
4. **Production**: Monitored rollout with rollback capability

## Documentation Standards

### Code Documentation

```typescript
/**
 * TimelineGanttView displays project timelines in a Gantt chart format
 *
 * @param teams - Array of team data for team view mode
 * @param allocations - Array of resource allocations to display
 * @param iterations - Array of iteration/cycle data for timeline range
 * @param selectedCycleId - ID of the currently selected cycle
 * @param viewMode - Display mode: 'teams' | 'epics' | 'projects'
 * @param onAllocationClick - Callback when allocation bar is clicked
 */
interface TimelineGanttViewProps {
  teams: Team[];
  allocations: Allocation[];
  iterations: Cycle[];
  selectedCycleId: string;
  viewMode?: TimelineViewMode;
  onAllocationClick?: (allocation: Allocation) => void;
}
```

### Test Documentation

```typescript
/**
 * Tests for TimelineGanttView component
 *
 * Covers:
 * - Basic rendering with all view modes
 * - Allocation bar display and interaction
 * - Timeline navigation and zoom controls
 * - Filtering and team selection
 * - Error handling for edge cases
 *
 * Mock data structure matches production TypeScript interfaces
 */
describe('TimelineGanttView', () => {
  // Test implementations
});
```

## Troubleshooting Guide

### Common Issues

1. **Test Failures After Interface Changes**
   - **Cause**: Mock data doesn't match updated TypeScript interfaces
   - **Solution**: Update all mock data to include required fields
   - **Prevention**: Use factory functions and interface validation

2. **Type Errors in Tests**
   - **Cause**: Test setup doesn't match component prop requirements
   - **Solution**: Ensure test props match component interface exactly
   - **Prevention**: Use TypeScript in test files and strict type checking

3. **Flaky Tests**
   - **Cause**: Async operations or timing issues
   - **Solution**: Use proper async/await patterns and user-event setup
   - **Prevention**: Avoid setTimeout, use waitFor and proper event handling

4. **Build Failures in CI**
   - **Cause**: Environment differences or missing dependencies
   - **Solution**: Ensure package-lock.json is committed and up to date
   - **Prevention**: Test locally in clean environment before push

5. **CI Memory Issues (Exit Code 137)**
   - **Cause**: Playwright tests consuming too much memory in constrained CI environment
   - **Solution**: Increase Node.js memory limits, reduce parallel workers, optimize test configurations
   - **Prevention**: Use memory-efficient test configurations, limit test scope in CI

### Performance Issues

1. **Slow Test Execution**
   - **Cause**: Inefficient test setup or too many DOM operations
   - **Solution**: Optimize test setup, use screen queries efficiently
   - **Prevention**: Keep tests focused and minimize DOM complexity

2. **Memory Leaks in Tests**
   - **Cause**: Event listeners or timers not cleaned up
   - **Solution**: Use cleanup functions and proper test teardown
   - **Prevention**: Always clean up side effects in beforeEach/afterEach

## Version Control Guidelines

### Commit Message Format

```
type(scope): brief description

Detailed explanation of changes made and why.

- Specific change 1
- Specific change 2

Fixes #issue-number
```

### Commit Types

- **feat**: New feature implementation
- **fix**: Bug fix
- **test**: Adding or updating tests
- **refactor**: Code refactoring without behavior change
- **perf**: Performance improvements
- **docs**: Documentation updates
- **style**: Code style changes (formatting, etc.)
- **ci**: CI/CD pipeline changes

### Branch Naming

- **feature/feature-name**: New feature development
- **fix/bug-description**: Bug fixes
- **test/test-description**: Test improvements
- **refactor/refactor-description**: Code refactoring
- **docs/documentation-update**: Documentation changes

## Security Guidelines

### Code Security

- **Input Validation**: Validate all user inputs and API responses
- **XSS Prevention**: Use proper escaping and sanitization
- **CSRF Protection**: Implement proper CSRF tokens for forms
- **Dependency Security**: Regular security audits of dependencies

### Testing Security

- **No Secrets in Tests**: Never commit API keys or credentials
- **Mock External Services**: Don't test against production services
- **Sanitize Test Data**: Ensure test data doesn't contain sensitive information

---

## Quick Reference Commands

```bash
# Development workflow
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing (MANDATORY before commits)
npm run test:core              # Core test suite (REQUIRED)
npm run test:coverage          # Full test suite with coverage
npm run test:integration       # Integration tests
npm run test:e2e               # End-to-end tests
npm run test:watch             # Watch mode for development

# Quality checks (MANDATORY before commits)
npm run lint                   # ESLint validation
npm run type-check             # TypeScript type checking
npm run format                 # Code formatting

# CI/CD simulation
npm run ci:quick               # Simulate quick validation track
npm run ci:full                # Simulate full CI pipeline
```

**Remember: Quality is not negotiable. Always follow TDD, test locally, and validate completely before any commit or push.**
