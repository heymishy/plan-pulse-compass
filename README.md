# Plan Pulse Compass

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.3-blue.svg?cacheSeconds=2592000)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.5.3-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-347%20passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

[![CI/CD Pipeline](https://github.com/your-username/plan-pulse-compass/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions)
[![Quick Check](https://github.com/your-username/plan-pulse-compass/workflows/Quick%20Check/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/quick-check.yml)
[![Essential Checks](https://github.com/your-username/plan-pulse-compass/workflows/Essential%20Checks/badge.svg)](https://github.com/your-username/plan-pulse-compass/actions/workflows/essential.yml)

![Vite](https://img.shields.io/badge/vite-5.4.1-646cff.svg)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-3.4.11-38bdf8.svg)
![Playwright](https://img.shields.io/badge/playwright-1.53.2-45ba4b.svg)
![Vitest](https://img.shields.io/badge/vitest-3.2.4-6e9f18.svg)

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Contributions](https://img.shields.io/badge/contributions-welcome-orange.svg)
![Maintenance](https://img.shields.io/badge/maintained-actively-brightgreen.svg)
![Production Ready](https://img.shields.io/badge/production-ready-success.svg)

</div>

**Plan Pulse Compass** is a production-ready, enterprise-grade team planning and resource management application that enables organizations to manage complex project portfolios, team allocations, and financial tracking across multiple quarters and iterations. The app provides strategic planning tools for resource allocation, real-time progress tracking with variance analysis, and sophisticated financial modeling that supports both permanent employees and contractors with different rate structures. Built with a focus on data privacy and local-first architecture, it offers interactive visualizations, comprehensive reporting, and automated CI/CD deployment for modern development teams.

> **🎉 Current Status**: Production-ready with 90%+ feature completion, 580+ React components, 347+ tests, and comprehensive enterprise functionality.

## 🎯 Core Features ✅ **IMPLEMENTED**

### 📊 **Executive Dashboard & Analytics**

- Real-time organizational metrics and KPI tracking
- Quarterly progress visualization with trend analysis
- Attention items management and risk monitoring
- Team portfolio insights with performance metrics

### 👥 **People & Workforce Management**

- Advanced person management with employment tracking
- Hierarchical team organization with division support
- Comprehensive skills framework with proficiency levels
- Role management with sophisticated rate structures

### 📋 **Project Portfolio & Epic Management**

- Full project lifecycle management with status tracking
- Epic breakdown with priority management and ranking
- Advanced milestone tracking with risk assessment
- Release planning with comprehensive reporting

### 💰 **Advanced Financial Management**

- Multi-tier cost calculation engine with employment type support
- Project and team financial analysis with variance tracking
- Burn rate monitoring and budget management
- Currency-configurable financial reporting

### 🎯 **Strategic Planning & Resource Allocation**

- Multi-level planning (annual/quarterly/monthly/iteration)
- Interactive allocation matrix with capacity optimization
- Bulk allocation management with conflict detection
- Scenario analysis and comparison tools

### 📈 **Execution Tracking & Variance Analysis**

- Actual vs. planned allocation tracking
- Advanced variance analysis with categorization
- Structured iteration reviews with approval workflows
- Progress monitoring with predictive analytics

### 🖼️ **Advanced Canvas Visualization**

- 15+ interactive visualization types
- Node-based relationship mapping with drag-and-drop
- Division-based filtering and real-time updates
- Export capabilities for reporting

### 🤖 **Skills-Based Planning System**

- AI-powered team-project matching with compatibility scoring
- Intelligent team recommendations ranked by skill fit
- Skill gap analysis and training opportunity identification
- Risk assessment for skills coverage monitoring

### 📄 **OCR Document Processing**

- Multi-format support (PDF, PowerPoint, images)
- Automated entity extraction from steering committee documents
- Smart mapping to existing projects and tracking data
- Accuracy measurement and performance monitoring

### 🔄 **Scenario Analysis & Management**

- Create and manage multiple planning scenarios
- Side-by-side scenario comparison with visual diff
- Impact analysis for scenario changes
- Export/import capabilities for team collaboration

## 📚 **Documentation & Guides**

- **📖 [Complete PRD Specification](PRD-spec.md)** - Full product requirements and implementation status
- **📚 [Skills Quick Start Guide](docs/QUICK_START_SKILLS.md)** - 5-minute skills system setup
- **📖 [Skills User Guide](docs/USER_GUIDE_SKILLS.md)** - Comprehensive skills features guide
- **🔧 [Skills Implementation Guide](SKILLS_IMPLEMENTATION_GUIDE.md)** - Technical documentation
- **🧪 [Testing Strategy](TESTING_STRATEGY.md)** - Comprehensive testing approach
- **⚙️ [CI/CD Setup](CI_CD_SETUP.md)** - Deployment and automation guide

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

## 🛠️ Tech Stack ✅ **PRODUCTION-READY**

### **Core Framework**

- **Frontend**: React 18.3.1 with TypeScript 5.5.3 (strict mode)
- **Build Tool**: Vite 5.4.1 with optimized HMR and code splitting
- **UI Framework**: shadcn/ui with Radix UI primitives + Tailwind CSS 3.4.11
- **State Management**: React Context API with 8+ specialized providers

### **Data & Visualization**

- **Visualization**: React Flow (@xyflow/react) + Recharts 2.12.7
- **Forms**: React Hook Form 7.53.0 + Zod 3.23.8 validation
- **Routing**: React Router DOM 6.26.2 with lazy loading
- **OCR Processing**: Tesseract.js + PDF.js for document analysis

### **Quality & Testing**

- **Testing**: Vitest + Playwright + Testing Library (347+ tests)
- **Code Quality**: ESLint + Prettier + Husky + TypeScript strict mode
- **Performance**: React.memo, useMemo, virtual scrolling, lazy loading
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation

### **Security & Privacy**

- **Architecture**: Local-first with AES encryption for sensitive data
- **Privacy**: Zero telemetry, complete user data control
- **Storage**: Encrypted browser storage with automatic cleanup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests locally: `npm run test:run:fast`
5. Push and create a pull request
6. CI will automatically run and provide feedback

## License

MIT License - see LICENSE file for details.
