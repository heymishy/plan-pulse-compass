### Feature Description: Goal-Centric Strategic Planning

This feature will connect high-level company objectives directly to the projects and work being planned. It provides a clear, visual link between strategy and execution, helping everyone in the organization understand how their work contributes to the bigger picture.

### Core User Flow

1.  **Define Goals:** A new top-level section in the application, "Goals," will allow users to define, edit, and organize strategic objectives. Goals can be hierarchical (e.g., a "North Star" goal with several supporting sub-goals).
2.  **Link Work to Goals:** When creating or editing a project or epic, the user will be able to link it to one or more of these strategic goals.
3.  **Visualize Connections:** New visualization modes on the Canvas page will be created to illustrate these relationships. For example:
    - A "Goal Journey" view could show a top-level goal branching out into the various projects and epics that support it.
    - Project and epic nodes on existing canvas views could be badged with the icon of the goal they support.
4.  **Track Goal Progress:** Dashboards will be enhanced with new widgets that show the progress towards a goal. This progress would be calculated based on the completion status of its linked work items.

### Key Technical Considerations

- **Data Model:** Introducing a new `Goal` data type and establishing the relationships between Goals, Projects, and Epics.
- **UI for Goal Management:** Creating the interface for defining and organizing hierarchical goals.
- **Canvas Visualizations:** Implementing the new graph layouts for visualizing goal journeys and relationships.
- **Progress Calculation:** Developing the logic to accurately roll up the progress of multiple projects into a single goal-progress metric.

### Clarifying Questions

- What attributes should a "Goal" have (e.g., owner, timeframe, measurable target)?
- Should the linking be at the project level, epic level, or both?
- How should progress be calculated? (e.g., simple average of linked project completion, or weighted by project size/importance?).
