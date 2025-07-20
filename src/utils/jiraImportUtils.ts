import { Epic, Project, Person, Team, Cycle } from '@/types';

// Jira-specific field mappings and transformations
export interface JiraEpicData {
  epicKey?: string;
  epicName: string;
  epicSummary?: string;
  epicDescription?: string;
  epicStoryPoints?: number;
  epicAssignee?: string;
  epicReporter?: string;
  epicStatus?: string;
  epicPriority?: string;
  epicProject?: string;
  epicLabels?: string;
  epicComponents?: string;
  epicFixVersion?: string;
  epicStartDate?: string;
  epicEndDate?: string;
  epicSprint?: string;
  epicCreated?: string;
  epicUpdated?: string;
  // Story rollup fields
  totalStoryPoints?: number;
  storyCount?: number;
  completedStoryPoints?: number;
  // Custom fields
  epicType?: string;
  initiative?: string;
  businessValue?: string;
  targetQuarter?: string;
}

export interface JiraStoryData {
  storyKey?: string;
  storySummary?: string;
  storyDescription?: string;
  storyPoints?: number;
  storyAssignee?: string;
  storyReporter?: string;
  storyStatus?: string;
  storyPriority?: string;
  storyProject?: string;
  storyEpicKey?: string;
  storyEpicName?: string;
  storySprint?: string;
  storyLabels?: string;
  storyComponents?: string;
  storyType?: string;
  storyCreated?: string;
  storyUpdated?: string;
}

// Jira import configuration
export interface JiraImportConfig {
  mode: 'update-only' | 'create-only' | 'full-sync' | 'incremental';
  rollupStrategy: 'sum' | 'max' | 'average';
  createMissingPeople: boolean;
  createMissingTeams: boolean;
  mapProjectsToTeams: boolean;
  autoDetectSprints: boolean;
  defaultEpicType: 'project' | 'run-work';
  epicHierarchySupport: boolean;
}

// JQL generation utilities
export interface JQLConfig {
  projects: string[];
  issueTypes: string[];
  statuses: string[];
  assignees: string[];
  sprints: string[];
  dateRange?: {
    start?: string;
    end?: string;
    field: 'created' | 'updated' | 'resolved';
  };
  customJQL?: string;
}

// Pre-built JQL templates
export const JQL_TEMPLATES = {
  'all-epics-recent': {
    name: 'All Epics (Last 3 Months)',
    description: 'All epics created or updated in the last 3 months',
    jql: 'issuetype = Epic AND (created >= -12w OR updated >= -12w) ORDER BY created DESC',
  },
  'active-epics': {
    name: 'Active Epics',
    description: 'All epics in active development',
    jql: 'issuetype = Epic AND status in ("In Progress", "To Do", "Selected for Development") ORDER BY priority DESC',
  },
  'epics-with-stories': {
    name: 'Epics with Stories',
    description: 'Epics and their child stories for complete rollup',
    jql: 'issuetype in (Epic, Story) AND (parent is not EMPTY OR issuetype = Epic) ORDER BY parent, created',
  },
  'project-epics': {
    name: 'Project Epics by Project',
    description: 'All epics for specific projects',
    jql: 'project in ("{projects}") AND issuetype = Epic ORDER BY project, created DESC',
  },
  'sprint-epics': {
    name: 'Sprint Epics',
    description: 'Epics associated with specific sprints',
    jql: 'sprint in ("{sprints}") AND issuetype in (Epic, Story) ORDER BY sprint, parent',
  },
  'custom-range': {
    name: 'Custom Date Range',
    description: 'Epics within custom date range',
    jql: 'issuetype = Epic AND {dateField} >= "{startDate}" AND {dateField} <= "{endDate}" ORDER BY created DESC',
  },
};

export function generateJQL(config: JQLConfig): string {
  const conditions: string[] = [];

  // Issue types - prioritize epics
  if (config.issueTypes.length > 0) {
    const types = config.issueTypes.map(type => `"${type}"`).join(', ');
    conditions.push(`issuetype in (${types})`);
  } else {
    conditions.push('issuetype = Epic');
  }

  // Projects
  if (config.projects.length > 0) {
    const projects = config.projects.map(proj => `"${proj}"`).join(', ');
    conditions.push(`project in (${projects})`);
  }

  // Statuses
  if (config.statuses.length > 0) {
    const statuses = config.statuses.map(status => `"${status}"`).join(', ');
    conditions.push(`status in (${statuses})`);
  }

  // Assignees
  if (config.assignees.length > 0) {
    const assignees = config.assignees
      .map(assignee => `"${assignee}"`)
      .join(', ');
    conditions.push(`assignee in (${assignees})`);
  }

  // Sprints
  if (config.sprints.length > 0) {
    const sprints = config.sprints.map(sprint => `"${sprint}"`).join(', ');
    conditions.push(`sprint in (${sprints})`);
  }

  // Date range
  if (config.dateRange) {
    const { start, end, field } = config.dateRange;
    if (start) {
      conditions.push(`${field} >= "${start}"`);
    }
    if (end) {
      conditions.push(`${field} <= "${end}"`);
    }
  }

  // Custom JQL override
  if (config.customJQL?.trim()) {
    return config.customJQL;
  }

  const jql = conditions.join(' AND ');
  return jql + ' ORDER BY created DESC';
}

// Parse Jira CSV export
export function parseJiraCSV(csvContent: string): JiraEpicData[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: JiraEpicData[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: JiraEpicData = { epicName: '' };

    headers.forEach((header, index) => {
      const value = values[index] || '';

      // Map common Jira fields to our structure
      switch (header.toLowerCase()) {
        case 'issue key':
        case 'key':
          row.epicKey = value;
          break;
        case 'summary':
        case 'issue summary':
          row.epicName = value;
          row.epicSummary = value;
          break;
        case 'description':
          row.epicDescription = value;
          break;
        case 'story points':
        case 'epic story points':
          row.epicStoryPoints = parseFloat(value) || 0;
          break;
        case 'assignee':
          row.epicAssignee = value;
          break;
        case 'reporter':
          row.epicReporter = value;
          break;
        case 'status':
          row.epicStatus = value;
          break;
        case 'priority':
          row.epicPriority = value;
          break;
        case 'project':
        case 'project name':
          row.epicProject = value;
          break;
        case 'labels':
          row.epicLabels = value;
          break;
        case 'components':
        case 'component/s':
          row.epicComponents = value;
          break;
        case 'fix version/s':
        case 'fix versions':
          row.epicFixVersion = value;
          break;
        case 'sprint':
          row.epicSprint = value;
          break;
        case 'created':
          row.epicCreated = value;
          break;
        case 'updated':
          row.epicUpdated = value;
          break;
        case 'epic name':
          row.epicName = value || row.epicName;
          break;
        // Story rollup fields (if exported with epics)
        case 'total story points':
          row.totalStoryPoints = parseFloat(value) || 0;
          break;
        case 'story count':
          row.storyCount = parseInt(value) || 0;
          break;
        case 'completed story points':
          row.completedStoryPoints = parseFloat(value) || 0;
          break;
      }
    });

    if (row.epicName) {
      data.push(row);
    }
  }

  return data;
}

// Smart person matching
export function matchPersonByJiraUser(
  jiraUser: string,
  existingPeople: Person[]
): Person | null {
  if (!jiraUser || jiraUser.trim() === '') return null;

  const normalized = jiraUser.toLowerCase().trim();

  // Try exact matches first
  for (const person of existingPeople) {
    // Check email match
    if (person.email?.toLowerCase() === normalized) {
      return person;
    }

    // Check name match
    if (person.name.toLowerCase() === normalized) {
      return person;
    }

    // Check if Jira username matches name parts
    const nameParts = person.name.toLowerCase().split(' ');
    if (nameParts.some(part => part === normalized)) {
      return person;
    }

    // Check if it's an email-like username
    if (normalized.includes('@')) {
      const emailParts = normalized.split('@')[0];
      if (person.email?.toLowerCase().includes(emailParts)) {
        return person;
      }
    }
  }

  return null;
}

// Auto-detect quarters from sprint names/dates
export function detectQuarterFromSprint(
  sprintName: string,
  sprintDates: string,
  availableCycles: Cycle[]
): Cycle | null {
  // Try to extract quarter info from sprint name
  const quarterMatch = sprintName.match(/Q([1-4])\s*(\d{4})/i);
  if (quarterMatch) {
    const quarter = quarterMatch[1];
    const year = quarterMatch[2];
    const quarterName = `Q${quarter} ${year}`;

    return (
      availableCycles.find(cycle =>
        cycle.name.toLowerCase().includes(quarterName.toLowerCase())
      ) || null
    );
  }

  // Try to match by date if sprint dates are available
  if (sprintDates) {
    const dateMatch = sprintDates.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const sprintDate = new Date(dateMatch[1]);

      return (
        availableCycles.find(cycle => {
          const startDate = new Date(cycle.startDate);
          const endDate = new Date(cycle.endDate);
          return sprintDate >= startDate && sprintDate <= endDate;
        }) || null
      );
    }
  }

  return null;
}

// Transform Jira data to Plan Pulse Compass entities
export function transformJiraToEpics(
  jiraData: JiraEpicData[],
  config: JiraImportConfig,
  existingProjects: Project[],
  existingPeople: Person[],
  runWorkCategories: any[] // From app settings
): {
  epics: Partial<Epic>[];
  newPeople: Partial<Person>[];
  projectTeamMappings: { projectName: string; teamName: string }[];
} {
  const epics: Partial<Epic>[] = [];
  const newPeople: Partial<Person>[] = [];
  const projectTeamMappings: { projectName: string; teamName: string }[] = [];

  jiraData.forEach(jira => {
    // Determine epic type
    const isRunWork = runWorkCategories.some(
      cat =>
        jira.epicLabels?.toLowerCase().includes(cat.name.toLowerCase()) ||
        jira.epicComponents?.toLowerCase().includes(cat.name.toLowerCase())
    );

    // Find or create project
    let projectId = '';
    if (!isRunWork && jira.epicProject) {
      const existingProject = existingProjects.find(
        p => p.name.toLowerCase() === jira.epicProject?.toLowerCase()
      );

      if (existingProject) {
        projectId = existingProject.id;
      } else {
        // Will be created during import process
        projectId = `new-project-${jira.epicProject}`;
      }

      // Track project-team mapping
      projectTeamMappings.push({
        projectName: jira.epicProject,
        teamName: jira.epicProject, // Default: project name = team name
      });
    }

    // Handle assignee
    let assigneePerson = null;
    if (jira.epicAssignee) {
      assigneePerson = matchPersonByJiraUser(jira.epicAssignee, existingPeople);

      if (!assigneePerson && config.createMissingPeople) {
        const newPerson: Partial<Person> = {
          id: `new-person-${jira.epicAssignee}`,
          name: jira.epicAssignee,
          email: jira.epicAssignee.includes('@')
            ? jira.epicAssignee
            : undefined,
        };
        newPeople.push(newPerson);
        assigneePerson = newPerson as Person;
      }
    }

    // Create epic
    const epic: Partial<Epic> = {
      id: jira.epicKey || `jira-epic-${Date.now()}-${Math.random()}`,
      name: jira.epicName,
      description: jira.epicDescription,
      projectId: isRunWork ? undefined : projectId,
      status: mapJiraStatusToEpicStatus(jira.epicStatus),
      priority: mapJiraPriorityToEpicPriority(jira.epicPriority),
      estimatedEffort: calculateEpicEffort(jira, config),
      startDate: jira.epicStartDate,
      endDate: jira.epicEndDate,
      ranking: 0, // Will be set during import
      createdDate: jira.epicCreated || new Date().toISOString(),
      lastModified: jira.epicUpdated || new Date().toISOString(),
    };

    epics.push(epic);
  });

  return {
    epics,
    newPeople: Array.from(new Map(newPeople.map(p => [p.id, p])).values()),
    projectTeamMappings: Array.from(
      new Map(projectTeamMappings.map(m => [m.projectName, m])).values()
    ),
  };
}

// Helper functions
function mapJiraStatusToEpicStatus(
  jiraStatus?: string
): 'todo' | 'in-progress' | 'completed' {
  if (!jiraStatus) return 'todo';

  const status = jiraStatus.toLowerCase();
  if (
    status.includes('done') ||
    status.includes('complete') ||
    status.includes('closed')
  ) {
    return 'completed';
  }
  if (
    status.includes('progress') ||
    status.includes('development') ||
    status.includes('review')
  ) {
    return 'in-progress';
  }
  return 'todo';
}

function mapJiraPriorityToEpicPriority(
  jiraPriority?: string
): 'low' | 'medium' | 'high' | 'critical' {
  if (!jiraPriority) return 'medium';

  const priority = jiraPriority.toLowerCase();
  if (priority.includes('critical') || priority.includes('blocker'))
    return 'critical';
  if (priority.includes('high')) return 'high';
  if (priority.includes('low') || priority.includes('trivial')) return 'low';
  return 'medium';
}

function calculateEpicEffort(
  jira: JiraEpicData,
  config: JiraImportConfig
): number {
  // Sum story points based on rollup strategy
  let effort = 0;

  switch (config.rollupStrategy) {
    case 'sum':
      effort = (jira.totalStoryPoints || 0) + (jira.epicStoryPoints || 0);
      break;
    case 'max':
      effort = Math.max(jira.totalStoryPoints || 0, jira.epicStoryPoints || 0);
      break;
    case 'average': {
      const values = [jira.totalStoryPoints, jira.epicStoryPoints].filter(
        v => v && v > 0
      );
      effort =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
      break;
    }
  }

  return Math.round(effort);
}

// Validation utilities
export function validateJiraImportData(
  jiraData: JiraEpicData[],
  config: JiraImportConfig
): string[] {
  const errors: string[] = [];

  if (jiraData.length === 0) {
    errors.push('No valid Jira data found in CSV export.');
    return errors;
  }

  // Check required fields
  const missingNames = jiraData.filter(item => !item.epicName?.trim());
  if (missingNames.length > 0) {
    errors.push(`${missingNames.length} epics are missing names/summaries.`);
  }

  // Check for duplicate keys
  const keys = jiraData.map(item => item.epicKey).filter(Boolean);
  const duplicateKeys = keys.filter(
    (key, index) => keys.indexOf(key) !== index
  );
  if (duplicateKeys.length > 0) {
    errors.push(`Duplicate Jira keys found: ${duplicateKeys.join(', ')}`);
  }

  // Validate effort values
  const invalidEffort = jiraData.filter(
    item =>
      item.epicStoryPoints !== undefined &&
      (isNaN(item.epicStoryPoints) || item.epicStoryPoints < 0)
  );
  if (invalidEffort.length > 0) {
    errors.push(
      `${invalidEffort.length} epics have invalid story point values.`
    );
  }

  return errors;
}
