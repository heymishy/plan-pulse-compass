### Review of Current Implementation & Suggested Enhancements

The current implementation of the Jira import feature largely aligns with the refined plan in this issue, providing a robust multi-step wizard for guided CSV import and mapping.

**How the User Performs the Import:**

1.  **Select Import Type:** User navigates to "Advanced Data Import" and selects "Jira Import (Epics)".
2.  **Generate JQL:** User builds a JQL query using the provided UI, then clicks "Next".
3.  **Upload Jira CSV Export:** User is instructed to export data from Jira using the generated JQL and uploads the CSV file.
4.  **Map Columns:** User maps CSV column headers to Plan Pulse Compass fields. Saved field mappings are automatically applied for future imports.
5.  **Smart Value Mapping:** For unmapped values (e.g., new team names, assignees), user maps them to existing Plan Pulse Compass entities or chooses to create new ones. Batch operations and smart suggestions are available. Value mappings can also be saved.
6.  **Import & Confirmation:** The system processes the data, transforms it into Plan Pulse Compass Epics, and updates the application state. A success message is displayed.

---

**Suggested Enhancements:**

While the foundation is strong, here are key areas for improvement to fully realize the feature's potential and align with the "Update Only" strategy:

1.  **Robust "Update Only" Logic for Epics:**
    - **Current:** `transformJiraToEpics` creates new `Partial<Epic>` objects, and `setEpics` appends them. This can lead to duplication or incorrect updates for existing epics.
    - **Enhancement:** Implement a clear merge strategy within `performImport` for `jira-import`. When `transformResult.epics` is returned, iterate through them:
      - If an imported epic's Jira ID (`epicKey`) matches an existing Plan Pulse Compass epic's ID, **update** the existing epic's properties (name, description, effort, status, etc.).
      - If no match is found, then **add** it as a new epic. This is crucial for the "Update Only" behavior.

2.  **Comprehensive Person and Team Creation/Update:**
    - **Current:** `transformJiraToEpics` identifies `newPeople` and `projectTeamMappings` but doesn't fully integrate them into the application's state.
    - **Enhancement:**
      - **People:** Implement logic to actually add `newPeople` to the `people` context (similar to how epics are handled).
      - **Teams:** Implement logic to create new teams based on the `projectTeamMappings` (where Jira projects map to Plan Pulse Compass Teams) if they don't already exist, and update existing teams as needed. This is vital for the "Jira projects map to Teams" requirement.

3.  **Refined Sprint to Iteration/Quarter/FY Mapping:**
    - **Current:** `detectQuarterFromSprint` exists, but the explicit mapping from Jira Sprint names/IDs to specific Plan Pulse Compass `Cycle` (Iteration, Quarter, FY) objects isn't fully integrated into the import flow.
    - **Enhancement:** In the `ValueMappingStep` or a dedicated "Jira Configuration" step, allow users to explicitly map detected Jira Sprints to existing Plan Pulse Compass Iterations/Quarters. This could involve a dropdown for each unique Jira Sprint value found in the CSV, letting the user pick the corresponding PPC Cycle.

4.  **Improved Error Handling & User Feedback:**
    - **Current:** Errors are displayed as a single string.
    - **Enhancement:** For validation errors (e.g., from `validateJiraImportData`), display them in a more user-friendly, itemized list. Consider allowing the user to download an error log for large imports.

5.  **Progress Tracking for Large Imports:**
    - **Current:** The import happens in one go.
    - **Enhancement:** For very large Jira CSVs, consider adding a progress bar or spinner during the `performImport` step to give the user feedback that the process is ongoing.

6.  **Pre-computation/Pre-analysis of CSV Data:**
    - **Current:** The `ValueMappingStep` computes unique CSV values on the fly.
    - **Enhancement:** For very large CSVs, consider pre-computing unique values and potential mappings in a web worker or during the initial file parsing to prevent UI freezes and improve responsiveness.
