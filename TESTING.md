# Testing Guide

## Test Structure

- **Unit Tests**: `src/**/*.test.ts` - Component and utility tests
- **Integration Tests**: `src/test/integration/**/*.test.ts` - Full app integration tests
- **E2E Tests**: `tests/e2e/**/*.spec.ts` - Playwright end-to-end tests

## Running Tests

```bash
# Fast unit tests
npm run test:run:fast

# All unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## Playwright File Management

### Files to Keep in Repository:

- `playwright.config.ts` - Playwright configuration
- `tests/e2e/**/*.spec.ts` - Test files
- `package.json` - Dependencies and scripts

### Files Automatically Ignored (in .gitignore):

- `test-results/` - Test run artifacts, screenshots, videos, traces
- `playwright-report/` - HTML test reports
- `playwright/.auth/` - Authentication state files
- `*.sample.csv` - Sample data files
- `test-*.csv` - Test data files
- `test-*.js` - Temporary test scripts
- `vitest-profile.log` - Performance profiling data

### Cleaning Up After Tests:

```bash
# Remove test artifacts (optional - they're gitignored)
rm -rf test-results/ playwright-report/

# Remove temporary files
rm -f test-*.csv *.sample.csv test-*.js
```

## CI/CD Pipeline

Tests run automatically in GitHub Actions:

- **Quick Check**: Lint, type check, unit tests, build (8 min)
- **Essential Checks**: + integration tests, security audit (15 min)
- **Full Pipeline**: + coverage, bundle analysis, E2E tests, deployment (25 min)

E2E tests are optimized for CI:

- Chrome-only for speed
- 3 parallel workers
- 10-minute timeout
- Automatic retry on failure
