### Further Refinement: Persistent Mappings for Scale

To significantly streamline the import process for 50-60 teams, we will implement persistent mappings for key Jira entities to Plan Pulse Compass entities. This will transform a potentially tedious manual step into a one-time setup.

**1. Persistent Jira Project-to-Team Mapping:**

- **Concept:** The system will maintain a saved mapping between Jira Project Names/Keys and Plan Pulse Compass Team IDs.
- **Implementation:** During the import wizard, after the CSV is parsed, the system will identify all unique Jira Project names/keys. For each, the user will be prompted to select an existing Plan Pulse Compass Team or create a new one. This mapping will be saved persistently (leveraging `useValueMappings` and `ValueMappingStep`).
- **Benefit:** Subsequent imports will automatically apply these mappings, reducing manual effort to zero for already mapped projects.

**2. Persistent Jira Sprint-to-Iteration Mapping:**

- **Concept:** The system will maintain a saved mapping between Jira Sprint names and Plan Pulse Compass Iteration IDs (which implicitly link to Quarters and Financial Years).
- **Implementation:** Similar to project mapping, unique Jira Sprint names from the CSV will be presented. The user will map each to a specific Plan Pulse Compass Iteration. Smart suggestions based on templated Jira sprint names (e.g., "2025-Q3-Sprint-1") can be provided to simplify this. This mapping will also be saved persistently.
- **Benefit:** Ensures accurate time-based allocation and roll-ups without repeated manual mapping.

**Impact on Data Aggregation:**

These persistent mappings will provide the necessary raw data for Plan Pulse Compass to achieve the goal of aggregating imported data to show team data for given iterations, split by % for project epics or run epics, and to ensure each iteration's allocation is 100% across it. The import feature will provide:

- **Rolled-up Story Points:** Total estimated effort for each Epic (project or run).
- **Team Assignment:** Which Plan Pulse Compass Team is responsible for each Epic (derived from the Jira Project mapping).
- **Iteration Assignment:** Which Plan Pulse Compass Iteration the Epic's effort is attributed to (derived from the Jira Sprint mapping).

With this foundational data, Plan Pulse Compass can then perform the necessary calculations for capacity analysis and allocation percentages.
