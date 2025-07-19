### Feature Description: Scenario Planning ("What-If" Analysis)

This feature will introduce a "sandbox" mode where planners can model the impact of significant changes without altering the live plan. It provides a safe environment for strategic, data-driven decision-making.

### Core User Flow

1.  **Create Scenario:** A user can duplicate the core planning data into a new, named scenario.
2.  **Switch Context:** The UI will allow the user to easily switch between the "Live Plan" and any number of created scenarios.
3.  **Model Changes:** Within a scenario's context, the user can make any changes they wish. These changes are isolated to the scenario.
4.  **Compare & Analyze:** A dedicated comparison view will provide a "Delta View" of the scenario against the live plan, highlighting the change in key metrics.

---

### UX and Design Direction

We will proceed with a **Global Header Dropdown** approach for managing scenarios:

1.  **Management via Global Header Dropdown:**
    - A dropdown menu will be added to the main application header, always displaying the current context (e.g., "Live Plan").
    - This menu will serve as the primary way to **switch** between the live plan and any created scenarios.
    - It will also contain actions to **"Create New Scenario"** and navigate to a **"Manage Scenarios"** page.

2.  **Persistent Context Indicator:**
    - When inside a scenario, a persistent, colorful banner will be displayed at the top of the page (e.g., "You are viewing the 'Q3 Budget Cuts' scenario. [Return to Live Plan]"). This ensures the user is always aware of their current context.

3.  **The "Delta View" for Comparison:**
    - The "Manage Scenarios" page will feature a powerful "Delta View."
    - This view will compare a selected scenario against the live plan, focusing on the change in key metrics (cost, capacity, timelines).
    - It will be powered by the core data concepts: planned allocations, projects, epics, milestones, teams, and associated costs.

### Scope & Priority

- **Data Scope:** When a scenario is created, it will only duplicate core **planning data** (teams, allocations, projects, epics, milestones, and associated financial data). Actual tracking data will **not** be included.
- **"Promote" Feature:** The ability to "promote" a scenario to become the new live plan is a **lower priority** for the initial implementation. The primary focus is on the analysis and comparison capabilities.

### Key Technical Considerations

- **Data Duplication:** How to efficiently clone the core planning state for a new scenario.
- **State Management:** How to manage the "active" context (Live Plan vs. a scenario) throughout the application, likely via a new `ScenarioContext`.
- **Comparison Logic:** Developing the logic to generate a meaningful "diff" between two complex plan states for the Delta View.
- **Storage:** How to store multiple scenarios in local storage without excessive performance degradation.
