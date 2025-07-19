### Feature Vision (Revised): A Fluid, Team-Centric Planning Tool

This feature introduces "Goals" as a parallel, more fluid way for teams to plan and visualize their strategic intent. It moves beyond rigid project tracking to support a more iterative and adaptive planning method. The core relationship is between **Goals, Teams, and Time (Iterations)**, not necessarily between Goals and Projects.

### Revised Core Concepts

1.  **Goals as a Nested Hierarchy:** Goals are the primary planning entity. They can be nested arbitrarily to represent everything from a high-level company objective down to a small, iterative step. A goal is primarily defined by its `name`, `description`, and its relationship to other goals (`parentId`).

2.  **Team-Centric Ownership:** Goals are assigned directly to one or more **Teams** (or potentially larger **Divisions**). This makes it clear who is responsible for moving a goal forward.

3.  **The "Goal Journey" Canvas:** The centerpiece of this feature is a new canvas visualization. It is a hybrid view:
    - **Vertical Axis:** A top-down, branching tree showing the nested goal hierarchy.
    - **Horizontal Axis:** A timeline of planning iterations (e.g., monthly or fortnightly cycles).
    - **Interaction:** This canvas will act as an interactive planning board where teams can place goals into specific iterations, creating a visual roadmap of when they intend to work on them.

4.  **Fluid Progress Tracking:** Progress is not tracked with a simple "% complete." Instead, it's about capturing the journey. Teams can add status updates or notes to a goal _within a specific iteration_, creating a running commentary on their progress.

---

### Open Questions for Design, UX, and Approach

_This new direction is powerful and innovative. The following questions will help us define the exact interaction model:_

1.  **Hierarchy Management (UX):** What is the most intuitive way for users to build and manage the nested goal structure?
    - **Option A (Visual/Canvas):** Build the tree directly on the canvas by dragging and dropping goals?
    - **Option B (Structured/List):** Use a more traditional tree-view list on a dedicated `/goals` management page?

2.  **The Canvas as a Planning Board:** Is the "Goal Journey" view an interactive planning board?
    - Should users be able to drag a goal and drop it into an "iteration column" to schedule it?
    - What does this action signify? Does it simply create a visual roadmap, or does it have deeper implications, like consuming team capacity?

3.  **Capturing Progress in a Fluid Way:** How should teams communicate their status on a goal within an iteration?
    - **Option A (Status Tags):** Apply a simple status (e.g., "In Progress," "Blocked") to a goal for a specific iteration?
    - **Option B (Iteration Notes):** Allow teams to add unstructured "updates" or "notes" to a goal for a given iteration to create a running commentary?

4.  **Team Assignment Flexibility:** How should ownership be handled for large, cross-functional goals?
    - Does the model need to support assigning goals to both individual **Teams** and larger **Divisions**?
    - Can a single goal be assigned to multiple teams simultaneously?
