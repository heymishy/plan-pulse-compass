# Plan Pulse Compass

[![Quick Check](https://github.com/your-username/plan-pulse-compass/workflows/Quick%20Check/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/quick-check.yml)
[![Essential Checks](https://github.com/your-username/plan-pulse-compass/workflows/Essential%20Checks/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/essential.yml)
[![CI/CD Pipeline](https://github.com/your-username/plan-pulse-compass/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/ci.yml)

**Plan Pulse Compass** is a comprehensive team planning and resource management application that enables organizations to manage complex project portfolios, team allocations, and financial tracking across multiple quarters and iterations. The app provides strategic planning tools for resource allocation, real-time progress tracking with variance analysis, and sophisticated financial modeling that supports both permanent employees and contractors with different rate structures. Built with a focus on data privacy and local-first architecture, it offers interactive visualizations, comprehensive reporting, and automated CI/CD deployment for modern development teams.

A comprehensive team planning and resource management application designed for organizations that need to manage complex project portfolios, team allocations, and financial tracking.

## 🎯 Features

- **Team Management**: Create and manage development teams with capacity tracking
- **Project Planning**: Define projects, epics, and user stories with comprehensive requirements
- **Resource Allocation**: Allocate team members to projects with percentage-based capacity
- **Timeline Visualization**: Interactive Gantt charts and timeline views for project tracking
- **🆕 Skills-Based Planning**: Advanced team-project matching using AI-powered skill compatibility
- **🆕 Intelligent Recommendations**: Get ranked team suggestions based on skill requirements
- **🆕 Skill Gap Analysis**: Identify missing skills and training needs across your organization
- **🆕 Coverage Assessment**: Monitor skill distribution and risk levels across teams
- **Iteration Planning**: Sprint/iteration management with capacity planning
- **Reporting & Analytics**: Comprehensive insights into team utilization and project progress

## 🚀 Skills-Based Planning

Plan Pulse Compass now includes powerful skills-based planning features:

- **Smart Team Matching**: Find optimal teams for projects based on skill requirements
- **Compatibility Scoring**: 0-100% match percentages with detailed breakdowns
- **Gap Analysis**: Identify missing skills and training opportunities
- **Risk Assessment**: Monitor skills coverage across your organization
- **Intelligent Filtering**: Advanced team filtering with skill-based criteria

### Quick Start with Skills

- **📖 [5-Minute Quick Start](docs/QUICK_START_SKILLS.md)** - Get started immediately
- **📚 [Complete User Guide](docs/USER_GUIDE_SKILLS.md)** - Comprehensive features guide
- **🔧 [Implementation Guide](SKILLS_IMPLEMENTATION_GUIDE.md)** - Technical documentation

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

### Skills-Based Planning

- **📖 [5-Minute Quick Start](docs/QUICK_START_SKILLS.md)** - Get started with skills features immediately
- **📚 [Complete User Guide](docs/USER_GUIDE_SKILLS.md)** - Comprehensive skills planning guide
- **🔧 [Implementation Guide](SKILLS_IMPLEMENTATION_GUIDE.md)** - Technical documentation and API reference

### Development & Operations

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
