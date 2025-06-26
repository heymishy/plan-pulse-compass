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
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run tests in watch mode
npm run test:run:fast    # Run fast tests
npm run test:unit        # Run unit tests only
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run typecheck        # Run TypeScript type check
npm run audit            # Run security audit
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

## Project info

**URL**: https://lovable.dev/projects/4e4511be-6542-414d-b1f2-6fe1e2ff1e84

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4e4511be-6542-414d-b1f2-6fe1e2ff1e84) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4e4511be-6542-414d-b1f2-6fe1e2ff1e84) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
