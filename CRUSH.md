# CRUSH.md - Development Guidelines for Plan Pulse Compass

## Essential Commands

### Development

```bash
npm run dev                    # Start development server on port 8080
npm run build                  # Build for production
npm run preview                # Preview production build
```

### Testing

```bash
npm run test:core              # Run core tests (MANDATORY before commit)
npm run test:run               # Run all tests once
npm run test:run:single        # Run a single test file
npm run test:run:fast          # Run tests without coverage
npm run test:watch             # Watch mode for development
npm run test:coverage          # Run tests with coverage report
npm run typecheck              # TypeScript validation
npm run lint                   # ESLint validation
npm run lint:fix               # Fix linting issues
```

### Running Specific Tests

To run a single test file:

```bash
npm run test:run:single src/components/__tests__/Navigation.test.tsx
```

To run tests matching a pattern:

```bash
npm run test:run -- Navigation
```

### End-to-End Testing

```bash
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ci            # Run critical E2E tests (console errors, smoke test)
npm run test:console-errors    # Check for console errors
npm run test:e2e:headed        # Run E2E tests with browser visible
```

## Code Style Guidelines

### Imports

- Use absolute imports when possible: `import { Button } from "src/components/ui/button"`
- Group imports in order: external libraries, internal modules, relative imports
- Use named imports over default imports when possible
- Keep imports sorted alphabetically within each group

### TypeScript

- Always use TypeScript interfaces for props and state
- Define types explicitly, avoid `any`
- Use strict typing for function parameters and return values
- Ensure mock data matches TypeScript interfaces exactly

### Naming Conventions

- Components: PascalCase (`UserProfile`)
- Functions: camelCase (`getUserData`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Files: camelCase for utils (`dateUtils.ts`), PascalCase for components (`UserProfile.tsx`)
- Test files: mirror source file with `.test` suffix (`UserProfile.test.tsx`)

### Error Handling

- Use try/catch blocks for async operations
- Provide meaningful error messages
- Handle component errors with error boundaries
- Validate props with PropTypes or TypeScript

### Component Structure

- Prefer functional components with hooks
- Use React.FC<Props> type annotation
- Destructure props in function parameters
- Keep components small and focused

### Testing

- Follow the TDD cycle: RED → GREEN → REFACTOR
- Test behavior, not implementation details
- Mock external dependencies
- Ensure 100% pass rate on test:core before commits
- Validate mock data against TypeScript interfaces

### Code Quality

- Keep functions pure when possible
- Avoid deeply nested code
- Use early returns
- Prefer const over let
- Use arrow functions for callbacks

## Mandatory Pre-Commit Checks

Before every commit, run:

```bash
npm run test:core
npm run typecheck
npm run lint
npm run build
npx playwright test tests/e2e/page-console-errors.spec.ts
npx playwright test tests/e2e/smoke-test-ci.spec.ts
```

The test:core command includes:

- Context tests
- Page tests
- Integration tests
- UI component tests
- Critical utility tests
