import type {
  Person,
  Team,
  Project,
  Epic,
  Allocation,
  Cycle,
  Division,
  Role,
  Release,
  ProjectSolution,
  ProjectSkill,
  RunWorkCategory,
  Goal,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
  AppConfig,
} from './index';

/**
 * Core Scenario Types for Strategic Planning
 *
 * Scenarios are temporary "what-if" analysis tools that allow users to:
 * - Duplicate current planning state
 * - Make isolated changes without affecting live data
 * - Compare scenarios against live state
 * - Analyze impact of potential changes
 */

// Core scenario data structure
export interface ScenarioData {
  // Core planning entities (from various contexts)
  people: Person[];
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  allocations: Allocation[];
  divisions: Division[];
  roles: Role[];
  releases: Release[];
  projectSolutions: ProjectSolution[];
  projectSkills: ProjectSkill[];
  runWorkCategories: RunWorkCategory[];

  // Goals and strategic planning
  goals: Goal[];
  goalEpics: GoalEpic[];
  goalMilestones: GoalMilestone[];
  goalTeams: GoalTeam[];

  // Configuration (cycles are inherited from live, not duplicated)
  config: AppConfig;
}

// Main scenario interface
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdDate: string;
  lastModified: string;
  expiresAt: string; // Auto-cleanup after 60 days

  // Template information if created from template
  templateId?: string;
  templateName?: string;

  // Snapshot of planning state when scenario was created
  data: ScenarioData;

  // Track what's been modified in this scenario
  modifications: ScenarioModification[];

  // Metadata for analysis
  metadata: {
    createdFromLiveState: boolean;
    liveStateSnapshotDate: string;
    totalModifications: number;
    lastAccessDate: string;
  };
}

// Track changes made within a scenario
export interface ScenarioModification {
  id: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete';
  entityType: keyof ScenarioData;
  entityId: string;
  entityName?: string;
  description: string;

  // Store the change details for delta view
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * Scenario Templates
 * Predefined scenarios for common planning situations
 */
export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: ScenarioTemplateCategory;
  icon?: string;

  // Template configuration
  config: {
    // What changes should this template apply?
    modifications: TemplateModification[];

    // What user inputs are needed?
    parameters: TemplateParameter[];
  };

  // Usage tracking
  usageCount: number;
  lastUsed?: string;
}

export type ScenarioTemplateCategory =
  | 'budget'
  | 'team-changes'
  | 'project-timeline'
  | 'resource-allocation'
  | 'strategic-planning'
  | 'risk-mitigation';

export interface TemplateModification {
  entityType: keyof ScenarioData;
  operation: 'create' | 'update' | 'delete' | 'bulk-update';

  // For bulk operations (e.g., "reduce all project budgets by X%")
  filter?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater-than' | 'less-than';
    value: any;
  };

  // What to change
  changes: {
    field: string;
    operation: 'set' | 'add' | 'subtract' | 'multiply';
    value: any; // Can be a parameter placeholder like "{{budgetReduction}}"
  }[];
}

export interface TemplateParameter {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'percentage' | 'text' | 'date' | 'select';
  required: boolean;
  defaultValue?: any;

  // For select type
  options?: { value: any; label: string }[];

  // Validation
  min?: number;
  max?: number;
  pattern?: string;
}

/**
 * Scenario Comparison and Analysis
 */
export interface ScenarioComparison {
  scenarioId: string;
  scenarioName: string;
  comparedAt: string;

  // High-level summary
  summary: {
    totalChanges: number;
    categorizedChanges: {
      [category in ScenarioChangeCategory]: number;
    };
    impactLevel: 'low' | 'medium' | 'high';
  };

  // Detailed changes by category
  changes: ScenarioChange[];

  // Financial impact
  financialImpact: {
    totalCostDifference: number;
    budgetVariance: number;
    projectCostChanges: {
      projectId: string;
      projectName: string;
      costDifference: number;
      percentageChange: number;
    }[];
  };

  // Resource impact
  resourceImpact: {
    teamCapacityChanges: {
      teamId: string;
      teamName: string;
      capacityDifference: number;
      allocationChanges: number;
    }[];

    peopleChanges: {
      added: number;
      removed: number;
      reallocated: number;
    };
  };

  // Timeline impact
  timelineImpact: {
    projectDateChanges: {
      projectId: string;
      projectName: string;
      startDateChange?: number; // days difference
      endDateChange?: number;
    }[];
  };
}

export type ScenarioChangeCategory =
  | 'financial'
  | 'resources'
  | 'timeline'
  | 'scope'
  | 'organizational';

export interface ScenarioChange {
  id: string;
  category: ScenarioChangeCategory;
  entityType: keyof ScenarioData;
  entityId: string;
  entityName: string;

  changeType: 'added' | 'removed' | 'modified';
  description: string;
  impact: 'low' | 'medium' | 'high';

  // Detailed change information
  details: {
    field: string;
    fieldDisplayName: string;
    oldValue: any;
    newValue: any;
    formattedOldValue?: string;
    formattedNewValue?: string;
  }[];
}

/**
 * Scenario Context Interface
 */
export interface ScenarioContextType {
  // Current state
  scenarios: Scenario[];
  activeScenarioId: string | null;
  isInScenarioMode: boolean;

  // Available templates
  templates: ScenarioTemplate[];

  // Actions
  createScenario: (params: CreateScenarioParams) => Promise<string>;
  createScenarioFromTemplate: (
    templateId: string,
    parameters: Record<string, any>
  ) => Promise<string>;
  switchToScenario: (scenarioId: string) => Promise<void>;
  switchToLive: () => void;
  updateScenario: (
    scenarioId: string,
    updates: Partial<Scenario>
  ) => Promise<void>;
  deleteScenario: (scenarioId: string) => Promise<void>;

  // Analysis
  getScenarioComparison: (scenarioId: string) => Promise<ScenarioComparison>;

  // Data access (proxies to scenario data when in scenario mode)
  getCurrentData: () => ScenarioData;

  // Lifecycle management
  cleanupExpiredScenarios: () => Promise<void>;
  refreshTemplates: () => Promise<void>;

  // Unsaved changes management
  hasUnsavedChanges: boolean;
  saveCurrentScenario: () => Promise<void>;
  discardChanges: () => void;
}

export interface CreateScenarioParams {
  name: string;
  description?: string;
  templateId?: string;
  templateParameters?: Record<string, any>;
}

/**
 * Built-in Template Definitions
 */
export const BUILTIN_SCENARIO_TEMPLATES: Omit<
  ScenarioTemplate,
  'usageCount' | 'lastUsed'
>[] = [
  {
    id: 'budget-cut-10',
    name: 'Budget Reduction',
    description: 'Reduce project budgets by a specified percentage',
    category: 'budget',
    icon: 'TrendingDown',
    config: {
      modifications: [
        {
          entityType: 'projects',
          operation: 'bulk-update',
          filter: {
            field: 'budget',
            operator: 'greater-than',
            value: 0,
          },
          changes: [
            {
              field: 'budget',
              operation: 'multiply',
              value: '{{budgetMultiplier}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'budgetReduction',
          name: 'Budget Reduction %',
          description: 'Percentage to reduce budgets by',
          type: 'percentage',
          required: true,
          defaultValue: 10,
          min: 0,
          max: 50,
        },
        {
          id: 'budgetMultiplier',
          name: 'Budget Multiplier',
          description: 'Calculated from budget reduction',
          type: 'number',
          required: false,
          defaultValue: 0.9, // Will be calculated as (100 - budgetReduction) / 100
        },
      ],
    },
  },
  {
    id: 'team-expansion',
    name: 'Team Expansion',
    description: 'Add new team members to specific teams',
    category: 'team-changes',
    icon: 'UserPlus',
    config: {
      modifications: [
        {
          entityType: 'people',
          operation: 'create',
          changes: [
            {
              field: 'name',
              operation: 'set',
              value: '{{newPersonName}}',
            },
            {
              field: 'teamId',
              operation: 'set',
              value: '{{targetTeamId}}',
            },
            {
              field: 'roleId',
              operation: 'set',
              value: '{{roleId}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'targetTeamId',
          name: 'Target Team',
          description: 'Which team to add the person to',
          type: 'select',
          required: true,
          options: [], // Will be populated dynamically
        },
        {
          id: 'roleId',
          name: 'Role',
          description: 'Role for the new team member',
          type: 'select',
          required: true,
          options: [], // Will be populated dynamically
        },
        {
          id: 'newPersonName',
          name: 'New Person Name',
          description: 'Name for the new team member',
          type: 'text',
          required: true,
          defaultValue: 'New Team Member',
        },
      ],
    },
  },
  {
    id: 'project-delay',
    name: 'Project Timeline Delay',
    description: 'Delay project timelines by a specified number of weeks',
    category: 'project-timeline',
    icon: 'Clock',
    config: {
      modifications: [
        {
          entityType: 'projects',
          operation: 'bulk-update',
          changes: [
            {
              field: 'startDate',
              operation: 'add',
              value: '{{delayWeeks}}',
            },
            {
              field: 'endDate',
              operation: 'add',
              value: '{{delayWeeks}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'delayWeeks',
          name: 'Delay (weeks)',
          description: 'Number of weeks to delay projects',
          type: 'number',
          required: true,
          defaultValue: 2,
          min: 1,
          max: 26,
        },
      ],
    },
  },
];

/**
 * Storage Keys
 */
export const SCENARIO_STORAGE_KEYS = {
  SCENARIOS: 'planning-scenarios',
  ACTIVE_SCENARIO: 'planning-active-scenario',
  SCENARIO_TEMPLATES: 'planning-scenario-templates',
  LIVE_DATA_BACKUP: 'planning-live-data-backup',
} as const;
