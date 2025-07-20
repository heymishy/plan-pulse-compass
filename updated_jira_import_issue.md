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

---

### Clarified Design & Approach Details

Here are the refined answers to the clarifying questions, guiding the design and implementation of this feature:

1.  **Mapping Jira Issues:**
    - **Jira Epics** will map directly to **Plan Pulse Compass Epics**.
    - **Jira Stories, Tasks, and Sub-tasks** will **NOT be imported as individual entities**. Instead, their **story points/estimate units will be rolled up** to their parent Jira Epic.
    - The system will need a mechanism to identify "run stories/epics" in Jira (e.g., via specific issue types, labels, or projects) so their rolled-up story points can be attributed to the correct "run work type" in Plan Pulse Compass.

2.  **Handling Jira's Custom Fields:**
    - The approach will be a **mix of manual mapping and saved templates**.
    - The first time a user imports, they will manually map the CSV columns to Plan Pulse Compass fields.
    - This manual mapping configuration will then be **saved as a template** for future imports, allowing for quick, repeatable imports.
    - **Specific Mappings:**
      - Jira 'projects' will map to Plan Pulse Compass **Teams**.
      - Jira 'Initiatives' and 'Programmes' (as issue types) will map to Plan Pulse Compass **Projects**, with linked Jira Epics showing their relationship to these Projects.

3.  **Data Transformation:**
    - **Assignee/Reporter to Person/Team:**
      - The Jira **Assignee** will be the primary mapping to a **Person** in Plan Pulse Compass.
      - The system will then infer the **Team** based on that Person's team assignment within Plan Pulse Compass.
      - The Jira **Reporter** will serve as a fallback for the Plan Pulse Compass Person if no Assignee is present.
      - The Jira **Project** will directly map to the **Team** owning the work.
    - **Sprint to Iteration/Quarter/Financial Year:**
      - Jira **Sprint** will map to Plan Pulse Compass **Iteration**, **Quarter**, and **Financial Year** values.
      - The import wizard will require a configuration step to define how Jira Sprints correspond to these time periods in Plan Pulse Compass (e.g., a mapping table or rule set).
    - **Story Points to Effort:** The rolled-up story points from Jira will be used as the effort unit in Plan Pulse Compass. A simple transformation (e.g., `1 story point = X person-days`) can be configured if needed, but the primary focus is on using story points as the consistent unit.

4.  **What is the "Source of Truth"?**
    - The import will follow an **"Update Only" (Option B)** approach.
    - The import process will **update existing** Plan Pulse Compass Epics that match imported Jira Epics (e.g., by Jira ID).
    - It will **create new** Plan Pulse Compass Epics for any new Jira Epics found in the import.
    - **No existing Plan Pulse Compass Epics will be deleted** by the import process.
    - The ability to group or nest Plan Pulse Compass Epics (e.g., to group many Jira Epics into one overall Epic for simplicity) is considered a **separate, future feature** to enhance the Plan Pulse Compass data model and UI, not part of this import process.
