### Feature: Dedicated 'Run Work' Planning & Capacity Allocation

**Vision:** To provide a structured and transparent way for engineering teams to plan, allocate capacity to, and track their recurring operational commitments ('run work'). This ensures that capital project planning is based on realistic available capacity, explicitly accounting for ongoing maintenance, support, and other non-project activities.

### Core User Flow

1.  **Team-Level Default:** Each team will have a configurable default percentage for their overall run work commitment (e.g., 30-40%). This serves as a guide.

2.  **Iteration/Quarter Planning:** In the planning views, teams can refine and allocate their capacity to specific run work categories (e.g., 'Production Support', 'Internal Tooling', 'Tech Debt') for each iteration or quarter. This allocation will be expressed as a percentage of the team's total capacity.

3.  **Capacity Consumption:** The allocated run work capacity will be visibly consumed, leaving a clear remaining capacity for capital projects within the planning views.

4.  **Actuals Tracking (via Jira):** Actual effort spent on run work will be tracked via stories/points in Jira. This data will be imported into Plan Pulse Compass (leveraging the 'Guided JQL Export/Import' feature) and attributed to the relevant run work categories.

5.  **Variance Analysis:** The system will enable comparison of planned run work allocations against actuals, providing insights into how much capacity was truly consumed by operational activities.

### Key Technical Considerations

- **Enhance `Team` Data Model:** Add a `defaultRunWorkPercentage` field to the `Team` type.
- **New `PlannedRunWorkAllocation` Model:** Define a new data structure to store per-iteration/quarter run work allocations by team and category (e.g., `teamId`, `iterationId`, `runWorkCategoryId`, `allocatedPercentage`).
- **Extend `ActualAllocation`:** Modify the `ActualAllocation` type to allow actual effort to be attributed to `runWorkCategoryId` (instead of `projectId`/`epicId`).
- **Capacity Calculation Logic:** Update existing capacity calculation logic to subtract planned run work from total team capacity to derive available capacity for capital projects.
- **UI for Run Work Planning:** Develop a dedicated UI within planning views (e.g., a grid or table) for inputting per-iteration run work percentages.
- **Dependency on Jira Import:** This feature's actuals tracking relies on the 'One-Way Data Import from Jira' feature to bring in relevant Jira stories/points.

### Clarifying Questions (Answered)

- **Default vs. Iteration-Specific Allocation:** Default configured per team, updated in planning.
- **Granularity of Allocation:** Percentage capacity of the team.
- **Tracking Actuals for Run Work:** Tracked via stories/points in Jira.
- **Visualization:** Integrate into existing planning views.

### Remaining Questions

- How should the UI handle the relationship between the overall team default and the detailed per-iteration allocations? (e.g., a visual indicator if the sum of per-iteration allocations deviates significantly from the default).
- What level of detail is needed for actuals? Just a total percentage, or a breakdown by category?
- Are there any scenarios where a 'run work' item might need to be linked to a specific project or application (e.g., 'Maintenance for Application X')?
