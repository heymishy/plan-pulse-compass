# CI/CD Pipeline Setup Guide

## Overview

This project includes a comprehensive CI/CD pipeline using GitHub Actions that handles testing, building, security auditing, and deployment to Vercel.

## Pipeline Stages

### 1. **Lint and Type Check** (5-10 minutes)
- Runs ESLint for code quality
- Performs TypeScript type checking
- Ensures code follows project standards

### 2. **Unit Tests** (10-15 minutes)
- Runs fast unit tests for UI components
- Uses optimized test configuration for speed
- Uploads test results as artifacts

### 3. **Integration Tests** (15-20 minutes)
- Runs integration tests for app-level functionality
- Tests with full AppProvider context
- Separate from unit tests for better resource management

### 4. **Full Test Suite** (20-25 minutes)
- Runs complete test suite with coverage
- Generates coverage reports
- Uploads to Codecov for tracking

### 5. **Build** (10-15 minutes)
- Builds the application for production
- Creates optimized bundle
- Uploads build artifacts

### 6. **Security Audit** (5-10 minutes)
- Runs npm audit for security vulnerabilities
- Fails on moderate or higher severity issues
- Ensures dependency security

### 7. **Bundle Analysis** (Main branch only)
- Analyzes bundle size and composition
- Helps identify optimization opportunities
- Runs only on main branch to save resources

### 8. **Deployment**
- **Preview Deployments**: Automatic on pull requests
- **Production Deployments**: Automatic on main branch merges

## Required GitHub Secrets

To enable deployment, you need to set up the following secrets in your GitHub repository:

### Vercel Deployment Secrets
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### How to Get Vercel Credentials

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Get your token**:
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token
   - Copy the token value

4. **Get Org and Project IDs**:
   ```bash
   vercel projects ls
   ```
   This will show your project ID and org ID.

## Local Development Setup

### Pre-commit Hooks
The project uses Husky and lint-staged for pre-commit hooks:

```bash
# Install dependencies
npm install

# Setup Husky (runs automatically on npm install)
npm run prepare

# The pre-commit hook will now run automatically on every commit
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run build:analyze    # Build with bundle analysis
npm run preview          # Preview production build

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage    # Run tests with coverage
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run typecheck        # Run TypeScript type check
npm run audit            # Run security audit
npm run audit:fix        # Fix security issues

# Formatting
npx prettier --write .   # Format all files
```

## Pipeline Optimization Features

### Resource Management
- **Single fork pool**: Reduces memory usage in tests
- **Separate test stages**: Unit and integration tests run in parallel
- **Conditional jobs**: Bundle analysis only runs on main branch
- **Timeout limits**: Prevents hanging jobs

### Caching
- **npm cache**: Dependencies are cached between runs
- **Test artifacts**: Results are uploaded and can be downloaded
- **Build artifacts**: Production builds are preserved

### Security
- **Security audit**: Runs on every build
- **Dependency scanning**: Identifies vulnerable packages
- **Environment protection**: Production deployment requires approval

## Monitoring and Notifications

### Test Results
- Test results are uploaded as artifacts
- Coverage reports are generated and uploaded
- Codecov integration for coverage tracking

### Deployment Status
- Preview deployments for pull requests
- Production deployments for main branch
- Automatic rollback on deployment failure

### Failure Notifications
- Pipeline failure notifications (customizable)
- Can be extended to Slack, Discord, or email

## Troubleshooting

### Common Issues

1. **Tests Hanging**
   - Check resource usage in dev container
   - Use `npm run test:run:single` for minimal resource usage
   - Ensure proper mocking of heavy dependencies

2. **Build Failures**
   - Check TypeScript errors: `npm run typecheck`
   - Fix linting issues: `npm run lint:fix`
   - Verify all dependencies are installed

3. **Deployment Failures**
   - Verify Vercel secrets are set correctly
   - Check Vercel project configuration
   - Ensure build artifacts are generated

### Performance Optimization

1. **Faster Tests**
   - Use `npm run test:unit` for quick feedback
   - Run integration tests separately
   - Use `npm run test:run:fast` for CI

2. **Faster Builds**
   - Enable dependency caching
   - Use parallel job execution
   - Optimize bundle size

## Best Practices

1. **Commit Messages**
   - Use conventional commit format
   - Include issue references
   - Keep commits atomic

2. **Branch Strategy**
   - Use feature branches for development
   - Create pull requests for review
   - Merge to main for production deployment

3. **Testing**
   - Write tests for new features
   - Maintain good test coverage
   - Use appropriate test types (unit vs integration)

4. **Security**
   - Regularly update dependencies
   - Address security audit findings
   - Use environment variables for secrets

## Support

For issues with the CI/CD pipeline:
1. Check the GitHub Actions logs
2. Verify all secrets are configured
3. Ensure local tests pass before pushing
4. Review the troubleshooting section above 