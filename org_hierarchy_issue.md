### Feature: Configurable Organizational Hierarchy & Financial Roll-up

**Vision:** To provide highly flexible and configurable budget management and financial roll-up capabilities across a user-defined organizational hierarchy. This feature will allow users to define their own custom organizational structure, assign existing entities (Teams, Projects, People) to nodes within this hierarchy, and then track and roll up financial data (planned and actual) through this custom structure.

**Core Idea:** Introduce a generic "Organizational Unit" concept that users can define and nest, moving beyond rigid, pre-defined structures like "Divisions" or "Departments."

### Codebase Integration Plan (Initial Thoughts)

This will be a significant architectural change, introducing a new, highly flexible data structure that existing entities will need to reference.

1.  **New `OrganizationalUnit` Type:**
    - Define a new `OrganizationalUnit` type in `src/types/index.ts` with fields such as `id`, `name`, `type` (user-defined, e.g., "Division", "Department"), `parentId` (for arbitrary nesting), `budget`, and `description`.
    - This would be managed by a new `OrganizationalUnitContext` and persisted to local storage.

2.  **Linking Existing Entities:**
    - **Teams:** The `Team` type will need a new field, `organizationalUnitId: string | null`, to link a team to its parent unit.
    - **Projects/Epics:** `Project` and `Epic` types will also need `organizationalUnitId: string | null` to associate them with a specific part of the hierarchy.
    - **People:** The `Person` type could also gain `organizationalUnitId: string | null` for direct reporting line or cost center association.

3.  **Financial Roll-up Logic:**
    - The application would need to traverse the custom hierarchy, aggregating costs (from allocations, project budgets, team salaries) from the lowest assigned units up to their parents.
    - This aggregation would need to happen for both planned and actual costs, enabling variance analysis at any level of the custom hierarchy.

4.  **UI for Hierarchy Management:**
    - A new dedicated section (e.g., `/organization-structure`) would be needed for users to define their unit types, create instances of these units, and build the nested structure.
    - This would likely involve a tree-view component with drag-and-drop functionality for re-parenting units.

### Clarifying Questions for Design, UX, and Approach

This feature introduces a high degree of configurability, which can be powerful but also complex. We need to ensure the UX remains intuitive.

1.  **Defining Hierarchy Levels (Meta-Model):**
    - How granular should the user's control be over defining the _types_ of organizational units? Should they be able to define arbitrary types like "Division," "Department," "Squad," "Tribe," "Cost Center," etc.?
    - Is there a maximum recommended depth for the hierarchy? (e.g., "We support up to 5 levels of nesting").

2.  **Assigning Entities to Units (UX):**
    - When a user creates a new Team, Project, or Person, how should they assign it to an `OrganizationalUnit`? Is a simple dropdown selection sufficient, or do we need a more visual "assign to hierarchy" picker?
    - Can an entity (e.g., a Project) belong to _multiple_ organizational units simultaneously? (e.g., a project that is part of both the "Product Division" and the "Innovation Initiative" cost center). If so, how do we handle cost attribution? (This significantly increases complexity).

3.  **Visualizing and Navigating the Hierarchy:**
    - What is the primary way users will interact with this hierarchy?
      - A dedicated "Org Structure" page with a tree view?
      - Filtering options on existing dashboards/planning views that allow users to "drill down" into a specific part of the hierarchy?
    - How should the financial roll-up be displayed? A summary table for each unit showing its budget, actuals, and variance, with the ability to expand/collapse child units?

4.  **Budget Allocation & Flow:**
    - Can budgets be set at _any_ level of the hierarchy, or only at the top-most units?
    - How does a budget "flow" down the hierarchy? Is it a hard allocation (e.g., "Division A gets $X, and its children must stay within that") or more of a reporting structure?
    - If a project spans multiple teams, and those teams belong to different organizational units, how is the project's cost attributed and rolled up? (e.g., based on the project's assigned unit, or split proportionally among the teams' units?).

5.  **Impact on Existing Features:**
    - How will this configurable hierarchy impact existing features like "People & Workforce Management" (especially skills and capacity planning) and "Team Portfolio Insights"?
    - Will the "Executive Dashboard & Analytics" need to be refactored to allow filtering and aggregation by these new custom organizational units?
