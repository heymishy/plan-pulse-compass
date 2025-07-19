### Feature Description: Scenario Planning ("What-If" Analysis)

This feature will introduce a "sandbox" mode where planners can model the impact of significant changes without altering the live plan. It provides a safe environment for strategic, data-driven decision-making.

### Core User Flow

1.  **Create Scenario:** A user can duplicate the entire current plan (allocations, projects, financials) into a new, named scenario (e.g., "Q3 Budget Cut Scenario").
2.  **Switch Context:** The UI will allow the user to easily switch between the "Live Plan" and any number of created scenarios.
3.  **Model Changes:** Within a scenario's context, the user can make any changes they wish—adjusting budgets, changing team allocations, delaying projects, etc. These changes are isolated to the scenario.
4.  **Compare & Analyze:** A dedicated comparison view will provide a side-by-side "diff" of the scenario against the live plan. This view will highlight the delta across key metrics like:
    - Total cost and burn rate.
    - Team capacity utilization and overallocation.
    - Projected milestone and project completion dates.
5.  **Promote or Discard:** After analysis, the user has two options:
    - **Promote:** Overwrite the "Live Plan" with the state of the scenario.
    - **Discard:** Delete the scenario entirely.

### Key Technical Considerations

- **Data Duplication:** How to efficiently clone the entire application state for a new scenario.
- **State Management:** How to manage the "active" context (Live Plan vs. a scenario) throughout the application.
- **Comparison Logic:** Developing the logic to generate a meaningful "diff" between two complex plan states.
- **Storage:** How to store multiple scenarios in local storage without excessive performance degradation.

### Clarifying Questions

- What are the most critical metrics to compare between scenarios?
- Should there be a limit on the number of scenarios a user can create?
- What should the UI for switching between and managing scenarios look like?
