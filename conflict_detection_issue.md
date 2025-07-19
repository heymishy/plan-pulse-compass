### Feature Description: Automated Conflict Detection & Resolution

This feature will act as an intelligent assistant, continuously monitoring the plan for logical inconsistencies and resource conflicts. It will proactively flag issues and suggest potential resolutions, moving the app from a passive tool to an active planning partner.

### Core User Flow

1.  **Background Monitoring:** As a user modifies the plan, a set of validation rules runs in the background to check for conflicts.
2.  **Conflict Notification:** When a conflict is detected, a notification appears in a dedicated "Conflicts" panel or sidebar. The notification is non-intrusive but clearly visible.
3.  **Clear Description:** Each conflict is described in plain language, for example:
    - "Team 'Frontend-A' is overallocated by 20% in the July iteration."
    - "Jane Doe is assigned to both 'Project X' and 'Project Y' during the same period."
    - "'Project Z' depends on a milestone that is scheduled to finish after the project's own due date."
4.  **Contextual Highlighting:** Clicking on a conflict in the panel will navigate to and highlight the problematic items in the main planning interface.
5.  **Suggested Resolutions:** Where possible, the system will offer intelligent, one-click suggestions for resolving the conflict, such as:
    - "Move 20% of the work to the next iteration."
    - "Assign 'Project X' to 'Team B', which has available capacity."

### Key Technical Considerations

- **Rule Engine:** Designing a flexible and performant rule engine that can evaluate the plan state against a set of conflict rules.
- **Performance:** Ensuring that conflict detection runs efficiently in the background without slowing down the UI, especially with large plans.
- **Suggestion Logic:** Developing the algorithms to generate meaningful and actionable resolution suggestions.
- **UI/UX:** Designing an intuitive UI for displaying, explaining, and resolving conflicts.

### Clarifying Questions

- What is the full list of initial conflict types we should detect (e.g., capacity, scheduling, dependencies)?
- How should notifications be presented to the user to be helpful but not annoying?
- How complex should the initial resolution suggestions be?
