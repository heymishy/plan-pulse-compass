# Plan Pulse Compass

[![Quick Check](https://github.com/your-username/plan-pulse-compass/workflows/Quick%20Check/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/quick-check.yml)
[![Essential Checks](https://github.com/your-username/plan-pulse-compass/workflows/Essential%20Checks/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/essential.yml)
[![CI/CD Pipeline](https://github.com/your-username/plan-pulse-compass/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/ci.yml)

**Plan Pulse Compass** is a comprehensive team planning and resource management application that enables organizations to manage complex project portfolios, team allocations, and financial tracking across multiple quarters and iterations. The app provides strategic planning tools for resource allocation, real-time progress tracking with variance analysis, and sophisticated financial modeling that supports both permanent employees and contractors with different rate structures. Built with a focus on data privacy and local-first architecture, it offers interactive visualizations, comprehensive reporting, and automated CI/CD deployment for modern development teams.

A comprehensive team planning and resource management application designed for organizations that need to manage complex project portfolios, team allocations, and financial tracking.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:run:fast

# Build for production
npm run build
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Quick Check**: Fast feedback (8 min) - lint, type check, unit tests, build
- **Essential Checks**: Balanced coverage (15 min) - + integration tests, security audit
- **Full Pipeline**: Complete testing (25 min) - + coverage, bundle analysis, deployment

### Pipeline Stages

1. **Lint & Type Check** - Code quality and type safety
2. **Unit Tests** - Fast component testing
3. **Integration Tests** - App-level functionality testing
4. **Build** - Production build verification
5. **Security Audit** - Dependency vulnerability scanning
6. **Deployment** - Automatic deployment to Vercel

## Development

### Prerequisites

- Node.js 18+
- npm or bun

### Available Scripts

```bash

# Development

npm run dev # Start development server
npm run build # Build for production
npm run preview # Preview production build

# Testing

npm run test # Run tests in watch mode
npm run test:run:fast # Run fast tests
npm run test:unit # Run unit tests only
npm run test:coverage # Run tests with coverage

# Code Quality

npm run lint # Run ESLint
npm run lint:fix # Fix ESLint issues
npm run typecheck # Run TypeScript type check
npm run audit # Run security audit

```

## Documentation

- [CI/CD Setup Guide](CI_CD_SETUP.md) - Complete pipeline documentation
- [Testing Guide](TESTING.md) - Testing strategy and best practices
- [Product Requirements](PRD-spec.md) - Detailed product specifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests locally: `npm run test:run:fast`
5. Push and create a pull request
6. CI will automatically run and provide feedback

## License

MIT License - see LICENSE file for details.

# Test commit

```

```
