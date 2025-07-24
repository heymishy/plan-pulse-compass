# Test Pyramid Implementation Guide

## Overview

This project implements a comprehensive test pyramid strategy optimized for performance and maintainability. The test suite is structured to follow the 70/20/10 rule of the test pyramid.

## Test Pyramid Structure

```
           /\
          /  \
         / E2E \ (5% - 5 tests)
        /______\
       /        \
      /Integration\ (25% - 21 tests)
     /____________\
    /              \
   /   Unit Tests   \ (70% - 58 tests)
  /__________________\
```

### 1. Unit Tests (70% - 58 tests)

- **Purpose**: Test individual components and functions in isolation
- **Location**: `src/**/__tests__/*.test.{ts,tsx}`
- **Config**: `vitest.config.unit.ts`
- **Setup**: `src/test/setup.unit.ts`
- **Command**: `npm run test:unit`

**Characteristics**:

- Fast execution (< 3s timeout)
- Full isolation between tests
- Minimal mocking
- High test coverage (80%+ target)

### 2. Integration Tests (25% - 21 tests)

- **Purpose**: Test component interactions and data flow
- **Location**: `src/__tests__/**/*.test.{ts,tsx}`, `src/context/__tests__/*.test.{ts,tsx}`
- **Config**: `vitest.config.integration.ts`
- **Setup**: `src/test/setup.integration.ts`
- **Command**: `npm run test:integration`

**Characteristics**:

- Moderate execution time (< 8s timeout)
- Tests multi-component interactions
- Realistic mocking with state persistence
- Cross-component communication testing

### 3. E2E Tests (5% - 5 tests)

- **Purpose**: Test complete user workflows
- **Location**: `tests/e2e/*.spec.ts`
- **Config**: `playwright.config.ts` / `playwright.config.performance.ts`
- **Command**: `npm run test:e2e`

**Characteristics**:

- Full browser automation
- Real user interactions
- End-to-end workflows
- Performance monitoring

## Performance Optimizations

### Test Execution Times

| Test Type   | Before    | After    | Improvement    |
| ----------- | --------- | -------- | -------------- |
| Unit Tests  | ~8s       | ~3s      | 62% faster     |
| Integration | ~15s      | ~6s      | 60% faster     |
| E2E Tests   | ~120s     | ~45s     | 62% faster     |
| **Total**   | **~143s** | **~54s** | **62% faster** |

### Key Optimizations

1. **Parallel Execution**
   - Unit tests: 4 parallel threads
   - Integration tests: 2 parallel threads
   - E2E tests: 75% CPU utilization

2. **Optimized Timeouts**
   - Unit: 3s (reduced from 5s)
   - Integration: 8s (focused on realistic scenarios)
   - E2E: 20s (reduced from 60s)

3. **Minimal Setup**
   - Performance setup: 50% fewer mocks
   - Unit setup: Essential mocks only
   - Integration setup: Realistic but lightweight

4. **Smart Configurations**
   - Separate configs for each test type
   - Optimized reporters and coverage
   - Efficient resource allocation

## Usage Commands

### Basic Testing

```bash
# Run all tests in pyramid order
npm run test:pyramid

# Run tests in parallel
npm run test:parallel

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Performance Testing

```bash
# High-performance configuration
npm run test:performance

# Benchmark test execution
npm run test:benchmark

# Advanced test runner
npm run test:runner [mode]
```

### Development Commands

```bash
# Watch mode for active development
npm run test:unit:watch
npm run test:integration:watch

# Coverage reports
npm run test:coverage
```

## Test Runner Modes

The advanced test runner (`scripts/test-runner.js`) supports multiple execution modes:

- `pyramid` (default): Sequential execution following test pyramid
- `parallel`: Maximum parallelization for speed
- `performance`: Optimized for fastest execution
- `unit`: Unit tests only
- `integration`: Integration tests only
- `e2e`: E2E tests only

## Configuration Files

### Vitest Configurations

- `vitest.config.ts` - Default configuration (legacy)
- `vitest.config.unit.ts` - Unit test optimization
- `vitest.config.integration.ts` - Integration test setup
- `vitest.config.performance.ts` - Maximum speed optimization
- `vitest.config.minimal.ts` - Lightweight for specific scenarios

### Playwright Configurations

- `playwright.config.ts` - Standard E2E configuration
- `playwright.config.performance.ts` - Speed-optimized E2E testing

### Setup Files

- `src/test/setup.ts` - Original comprehensive setup
- `src/test/setup.unit.ts` - Minimal unit test setup
- `src/test/setup.integration.ts` - Realistic integration setup
- `src/test/setup.performance.ts` - Ultra-fast performance setup

## Best Practices

### Unit Tests

```typescript
// ✅ Good: Fast, isolated, focused
describe('UserCard Component', () => {
  it('renders user name correctly', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });
});

// ❌ Avoid: External dependencies, slow operations
```

### Integration Tests

```typescript
// ✅ Good: Tests component interaction
describe('User Management Flow', () => {
  it('creates and displays new user', async () => {
    render(<UserManagement />);

    // Test the full flow
    await userEvent.click(screen.getByRole('button', { name: /add user/i }));
    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// ✅ Good: Complete user journey
test('user can complete planning workflow', async ({ page }) => {
  await navigateWithPerformance(page, '/dashboard');
  await setupTestData(page, 'minimal');

  // Test critical user path
  await page.click('[data-testid="create-plan"]');
  await fillFormFast(page, planData);
  await page.click('[data-testid="submit-plan"]');

  await expect(page.locator('[data-testid="plan-created"]')).toBeVisible();
});
```

## Monitoring and Metrics

### Performance Targets

- Unit tests: < 3s per test
- Integration tests: < 8s per test
- E2E tests: < 20s per test
- Total suite: < 60s execution time

### Coverage Targets

- Unit tests: 80%+ line coverage
- Integration tests: 70%+ interaction coverage
- E2E tests: 100% critical path coverage

### Quality Gates

- All tests must pass before deployment
- Performance regression alerts if > 20% slower
- Coverage cannot decrease below thresholds

## Troubleshooting

### Common Issues

1. **Slow test execution**
   - Use `npm run test:performance` for fastest execution
   - Check if mocks are properly configured
   - Consider using `--parallel` flag

2. **Test isolation issues**
   - Use unit test configuration for pure isolation
   - Check cleanup in `afterEach` hooks
   - Verify mock resets

3. **E2E test flakiness**
   - Use performance helpers for reliable waiting
   - Implement proper test data setup/cleanup
   - Monitor network conditions

### Debug Commands

```bash
# Debug specific test type
npm run test:unit -- --reporter=verbose
npm run test:integration -- --ui
npm run test:e2e -- --debug

# Performance analysis
npm run test:benchmark
```

## Migration Guide

### From Legacy Setup

1. Update test commands to use new configurations
2. Migrate existing tests to appropriate pyramid level
3. Update CI/CD pipelines to use `npm run test:pyramid`
4. Monitor performance improvements

### Best Migration Strategy

1. Start with unit tests (lowest risk)
2. Migrate integration tests gradually
3. Optimize E2E tests last (highest impact)
4. Use parallel execution in CI for maximum speed

This implementation provides a robust, scalable, and performant testing strategy that grows with your application while maintaining fast feedback loops for developers.
