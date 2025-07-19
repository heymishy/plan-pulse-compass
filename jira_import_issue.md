### Feature: One-Way Data Import from Jira (Guided JQL Export/Import)

**Vision:** To enable users to efficiently import relevant planning and tracking data from their on-premise Jira Server instances into Plan Pulse Compass, respecting local-first architecture and user-level access permissions.

**Constraint:** Due to the inability to obtain Jira administrator changes (e.g., CORS whitelisting) and no appetite for browser extensions, direct API integration from the browser is not feasible. Therefore, this feature will focus on a highly guided manual export/import process.

### Core User Flow: Guided JQL Export/Import

This approach empowers the user with a wizard-like experience to perform a manual but highly effective export/import.

1.  **Generate JQL:**
    - The application provides a dedicated "Import from Jira" page.
    - This page helps the user construct the exact Jira Query Language (JQL) query needed to get the right data (e.g., by providing UI elements to select projects, issue types, statuses, etc.).
    - The application will display the generated JQL query clearly.

2.  **Guided Export from Jira:**
    - The UI provides clear, step-by-step instructions for the user to follow within their Jira instance:
      - "1. Log in to your Jira instance."
      - "2. Navigate to 'Issues' and select 'Advanced search'."
      - "3. Paste the following JQL query into the search bar: `[Generated JQL is here]`"
      - "4. Click the 'Export' button and select 'Export Excel CSV (all fields)'."

3.  **Local Import & Mapping:**
    - The user saves the exported CSV file to their local machine.
    - The user then drags-and-drops or uploads this CSV file into our application's import page.
    - The application parses the CSV file locally in the browser.
    - A powerful mapping UI appears, asking the user to map the CSV columns (e.g., "Summary," "Story Points," "Assignee") to the corresponding fields in Plan Pulse Compass (e.g., "Epic Name," "Effort," "Person").

### Key Technical Considerations

- **JQL Generation:** Logic to construct robust JQL queries based on user selections.
- **CSV Parsing:** Robust client-side CSV parsing with error handling.
- **Mapping UI:** A flexible and intuitive UI for mapping Jira fields to Plan Pulse Compass fields, including handling custom fields.
- **Data Transformation:** Potential for simple, user-defined transformations during mapping (e.g., converting Story Points to Person-Days).

### Clarifying Questions (Still Highly Relevant)

1.  **Mapping Jira Issues:** Jira issues can be of many types (Epics, Stories, Tasks, Bugs). How should we map these?
    - Should a Jira "Epic" automatically become a Plan Pulse Compass "Project" or "Epic"?
    - Should Jira "Stories" and "Tasks" be imported as "Epics" in our app, or a different concept? Or should they be ignored entirely?

2.  **Handling Jira's Custom Fields:** This is a critical aspect of any Jira integration. How do we handle custom fields that are essential for planning (e.g., a custom "Team" field, or a "T-Shirt Size" for effort)?
    - **Option A (Manual Mapping):** In the mapping UI, we would need to display a list of _all_ columns from the CSV and have the user manually map them to our fields.
    - **Option B (Saved Templates):** Could a user save their mapping configuration as a "template" for future imports?

3.  **Data Transformation:** What if the data doesn't align perfectly?
    - For example, Jira might have a "Reporter" and an "Assignee." Which one should map to the "Owner" in our app?
    - Jira uses "Story Points" for effort, while our app might use person-days. Do we need a simple transformation step in the import wizard (e.g., `1 story point = 2 person-days`)?

4.  **What is the "Source of Truth"?** When a user imports data from Jira, what happens if that data already exists in Plan Pulse Compass?
    - **Option A (Overwrite):** The imported data completely overwrites any existing data for that project/epic.
    - **Option B (Update Only):** The import only updates existing items and adds new ones, but never deletes anything.
    - **Option C (Manual Diff/Merge):** The app presents a "diff" view, showing what has changed, and the user can choose which changes to accept. (This is the most powerful but also the most complex to build).
