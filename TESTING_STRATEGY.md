# Plan Pulse Compass - Testing Strategy & CI/CD Pipeline ✅ **IMPLEMENTED**

> **Status**: Production-ready with 347+ tests and 3-tier CI/CD pipeline fully operational

This document outlines the comprehensive testing strategy and the 3-tier Continuous Integration (CI) pipeline for the Plan Pulse Compass application. The goal is to ensure high code quality, prevent regressions, and provide a balance between rapid feedback and thorough validation.

## Testing Philosophy

Our testing strategy is based on the **Test Pyramid**, emphasizing a strong foundation of fast, isolated unit tests, a smaller layer of integration tests to verify component interactions, and a select few end-to-end (E2E) tests to validate critical user journeys.

- **Core vs. Non-Core:** We make a clear distinction between "core" application functionality (planning, data management, financials) and "non-core" features (advanced visualizations, specific integrations). Core features are tested rigorously on every change, while non-core features undergo testing at later stages of the CI process.
- **TDD-First:** All new features and bug fixes should follow a Test-Driven Development (TDD) approach: write a failing test, write the code to make it pass, and then refactor.
- **Local Validation:** Developers are required to run the core test suite locally before committing changes to ensure that the main pipeline is not broken.

---

## CI/CD Pipeline Overview

The CI pipeline is a 3-tier system designed to optimize for speed and resource usage, especially within the constraints of the GitHub Actions free tier. It runs on every push and pull request to the `main` branch.

### Tier 1: ⚡ Lightning Validation

**Purpose:** To provide immediate, essential quality feedback on every commit. This tier is designed to run in under 4 minutes and acts as the first line of defense against bugs.

**Triggers:** Runs on every commit within a Pull Request and on every push to `main`.

**Key Scripts:**

- `npm run test:core`
- `npm run lint`
- `npm run type-check`

| Tests Performed        | Corresponding PRD Features & User Flows                        | Rationale                                                                                                            |
| :--------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Context Tests**      | All Core Features (People, Projects, Planning, etc.)           | Validates the application's central state management. A failure here indicates a fundamental break in data handling. |
| **Utility Tests**      | Advanced Financial Management, Strategic Planning, Data Import | Checks the core business logic (cost calculations, allocation logic, CSV parsing) that powers most features.         |
| **UI Component Tests** | User Experience Design                                         | Ensures the foundational UI building blocks (buttons, dialogs, layout) render correctly and are functional.          |
| **Page Render Tests**  | All Core Features                                              | Acts as a crucial smoke test to ensure all primary application pages can render without crashing.                    |

---

### Tier 2: 🔍 Comprehensive Testing

**Purpose:** To validate that the core components and logic, verified in Tier 1, work together correctly in key user workflows. This stage focuses on integration.

**Triggers:** Runs on Pull Requests and merges to `main`, after Tier 1 succeeds.

**Key Scripts:**

- `npm run test:integration`
- `npx playwright test tests/e2e/smoke-test-ci.spec.ts`

| Tests Performed       | Corresponding PRD Features & User Flows | Rationale                                                                                                                                                                  |
| :-------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Integration Tests** | End-to-End Workflows                    | Verifies that different parts of the application (e.g., TeamContext and PlanningContext) interact as expected. Tests the full lifecycle of creating and managing entities. |
| **E2E Smoke Tests**   | Critical User Journeys                  | Validates the most critical "happy path" user flows in a real browser, such as initial setup, basic data import, and creating a project/allocation.                        |

---

### Tier 3: 🏆 Quality Assurance

**Purpose:** To perform a final, exhaustive quality check on the `main` branch before any potential deployment. This is the most comprehensive stage.

**Triggers:** Runs only on merges to the `main` branch, after Tier 2 succeeds.

**Key Scripts:**

- `npm run test:coverage` (includes `test:non-core`)
- `npm audit`
- `npm run build`

| Tests Performed            | Corresponding PRD Features & User Flows                                | Rationale                                                                                                                         |
| :------------------------- | :--------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Non-Core Feature Tests** | Advanced Canvas Visualization, Scenario Planning, OCR/O365 Integration | Tests advanced, non-essential features that are less likely to be impacted by daily changes. Running them here is more efficient. |
| **Full Test Coverage**     | All Features                                                           | Ensures that the entire application, including edge cases, is tested, preventing regressions in less-used parts of the codebase.  |
| **Security Audit**         | Security & Privacy                                                     | Checks for known vulnerabilities in third-party dependencies, a critical step before production.                                  |
| **Production Build**       | Deployment & Distribution                                              | Confirms that the application can be successfully bundled and optimized for a production environment.                             |
