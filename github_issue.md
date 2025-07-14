## Refactor: Decompose Monolithic AppContext and Enhance Financial Configuration

This issue details the refactoring efforts to break down the monolithic `AppContext` into smaller, domain-specific contexts, and the implementation of configurable financial settings.

### Motivation

The original `AppContext` had grown into a "God object," managing nearly all application state. This led to:

- **Performance Bottlenecks:** Any state change triggered widespread re-renders, impacting performance, especially in data-dense views.
- **Maintainability Issues:** The tightly coupled nature made the codebase harder to reason about, test, and maintain.
- **Limited Flexibility:** Hardcoded financial constants restricted the application's adaptability for diverse organizational needs.

### Changes Implemented

To address these issues, the following changes have been made:

1.  **Decomposition of `AppContext`:**
    - The large `AppContext` has been refactored into five smaller, domain-specific contexts:
      - `TeamContext.tsx`: Manages `people`, `roles`, `teams`, `divisions`, and `unmappedPeople`.
      - `ProjectContext.tsx`: Manages `projects`, `epics`, `releases`, `solutions`, `projectSkills`, and `projectSolutions`.
      - `PlanningContext.tsx`: Manages `allocations`, `cycles`, `runWorkCategories`, `actualAllocations`, `iterationReviews`, and `iterationSnapshots`.
      - `SettingsContext.tsx`: Manages `config` and `isSetupComplete`.
      - `GoalContext.tsx`: Manages `goals`, `northStar`, `goalEpics`, `goalMilestones`, and `goalTeams`.
    - All components previously consuming `useApp()` have been updated to use the new, more specific context hooks (e.g., `useTeams()`, `useProjects()`).
    - The main `App.tsx` file has been updated to wrap the application with these new context providers.

2.  **Configurable Financial Settings:**
    - The `AppConfig` interface in `src/types/index.ts` has been extended to include:
      - `workingDaysPerWeek`: Number of working days in a week (e.g., 5).
      - `workingHoursPerDay`: Number of working hours in a day (e.g., 8).
      - `currencySymbol`: The symbol for the currency (e.g., '$', '€').
    - The `financialCalculations.ts` utility file has been updated to utilize these new configurable values, replacing previously hardcoded "magic numbers."
    - The `FinancialSettings.tsx` component has been enhanced to provide a user interface for configuring these new financial parameters.

3.  **Improved Test Coverage and Stability:**
    - New unit tests have been added for each of the newly created context providers (`TeamContext.test.tsx`, `ProjectContext.test.tsx`, `PlanningContext.test.tsx`, `SettingsContext.test.tsx`, `GoalContext.test.tsx`).
    - The `StorageEvent` errors encountered in the test environment (due to `jsdom` limitations) have been addressed by conditionally dispatching `StorageEvent` only in a browser environment within `useLocalStorage.ts`.
    - All existing tests continue to pass after these significant refactoring changes.

### Future Work / Next Steps

- **Comprehensive Unit Tests for `financialCalculations.ts`:** While the financial settings are now configurable, dedicated unit tests for the core financial calculation logic are still a high priority to ensure accuracy and prevent regressions.
- **Implement Goal-Centric Strategic Planning:** Begin development on the UI and logic for the "Goal-Centric Strategic Planning" feature as outlined in the PRD.
- **Implement Conflict Detection and Resolution:** Start with basic resource overallocation detection.
