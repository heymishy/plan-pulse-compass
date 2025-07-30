import type {
  Person,
  Team,
  TeamMember,
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
  DivisionLeadershipRole,
  UnmappedPerson,
  ActualAllocation,
  IterationSnapshot,
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

  // Team-related entities (from TeamContext)
  teamMembers: TeamMember[];
  divisionLeadershipRoles: DivisionLeadershipRole[];
  unmappedPeople: UnmappedPerson[];

  // Planning entities (from PlanningContext)
  actualAllocations: ActualAllocation[];
  iterationSnapshots: IterationSnapshot[];

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
    oldValue: unknown;
    newValue: unknown;
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
  expiresAt?: string;
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
  {
    id: 'team-restructure',
    name: 'Team Restructuring',
    description: 'Restructure teams by moving people between teams',
    category: 'team-changes',
    icon: 'Users',
    config: {
      modifications: [
        {
          entityType: 'teamMembers',
          operation: 'bulk-update',
          filter: {
            field: 'teamId',
            operator: 'equals',
            value: '{{sourceTeamId}}',
          },
          changes: [
            {
              field: 'teamId',
              operation: 'set',
              value: '{{targetTeamId}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'sourceTeamId',
          name: 'Source Team',
          description: 'Team to move people from',
          type: 'select',
          required: true,
          options: [], // Will be populated dynamically
        },
        {
          id: 'targetTeamId',
          name: 'Target Team',
          description: 'Team to move people to',
          type: 'select',
          required: true,
          options: [], // Will be populated dynamically
        },
      ],
    },
  },
  {
    id: 'capacity-increase',
    name: 'Team Capacity Increase',
    description:
      'Increase team capacity by adding hours or extending work days',
    category: 'resource-allocation',
    icon: 'TrendingUp',
    config: {
      modifications: [
        {
          entityType: 'teams',
          operation: 'bulk-update',
          changes: [
            {
              field: 'capacity',
              operation: 'multiply',
              value: '{{capacityMultiplier}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'capacityIncrease',
          name: 'Capacity Increase %',
          description: 'Percentage to increase team capacity',
          type: 'percentage',
          required: true,
          defaultValue: 20,
          min: 5,
          max: 100,
        },
        {
          id: 'capacityMultiplier',
          name: 'Capacity Multiplier',
          description: 'Calculated from capacity increase',
          type: 'number',
          required: false,
          defaultValue: 1.2, // Will be calculated as (100 + capacityIncrease) / 100
        },
      ],
    },
  },
  {
    id: 'project-scope-reduction',
    name: 'Project Scope Reduction',
    description:
      'Reduce project scope by removing features or reducing budgets',
    category: 'strategic-planning',
    icon: 'Scissors',
    config: {
      modifications: [
        {
          entityType: 'epics',
          operation: 'bulk-update',
          filter: {
            field: 'projectId',
            operator: 'equals',
            value: '{{targetProjectId}}',
          },
          changes: [
            {
              field: 'status',
              operation: 'set',
              value: 'cancelled',
            },
          ],
        },
        {
          entityType: 'projects',
          operation: 'update',
          filter: {
            field: 'id',
            operator: 'equals',
            value: '{{targetProjectId}}',
          },
          changes: [
            {
              field: 'budget',
              operation: 'multiply',
              value: '{{budgetReductionMultiplier}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'targetProjectId',
          name: 'Target Project',
          description: 'Project to reduce scope for',
          type: 'select',
          required: true,
          options: [], // Will be populated dynamically
        },
        {
          id: 'scopeReduction',
          name: 'Scope Reduction %',
          description: 'Percentage of epics to cancel',
          type: 'percentage',
          required: true,
          defaultValue: 30,
          min: 10,
          max: 80,
        },
        {
          id: 'budgetReductionMultiplier',
          name: 'Budget Reduction Multiplier',
          description: 'Calculated from scope reduction',
          type: 'number',
          required: false,
          defaultValue: 0.7,
        },
      ],
    },
  },
  {
    id: 'risk-mitigation',
    name: 'Risk Mitigation Plan',
    description:
      'Add buffer capacity and extend timelines for high-risk projects',
    category: 'risk-mitigation',
    icon: 'Shield',
    config: {
      modifications: [
        {
          entityType: 'projects',
          operation: 'bulk-update',
          filter: {
            field: 'riskLevel',
            operator: 'equals',
            value: 'high',
          },
          changes: [
            {
              field: 'endDate',
              operation: 'add',
              value: '{{bufferWeeks}}',
            },
            {
              field: 'budget',
              operation: 'multiply',
              value: '{{riskBufferMultiplier}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'bufferWeeks',
          name: 'Buffer Time (weeks)',
          description: 'Additional weeks for high-risk projects',
          type: 'number',
          required: true,
          defaultValue: 4,
          min: 1,
          max: 12,
        },
        {
          id: 'riskBuffer',
          name: 'Risk Buffer %',
          description: 'Additional budget for risk mitigation',
          type: 'percentage',
          required: true,
          defaultValue: 15,
          min: 5,
          max: 50,
        },
        {
          id: 'riskBufferMultiplier',
          name: 'Risk Buffer Multiplier',
          description: 'Calculated from risk buffer',
          type: 'number',
          required: false,
          defaultValue: 1.15,
        },
      ],
    },
  },
  {
    id: 'remote-transition',
    name: 'Remote Work Transition',
    description: 'Adjust team capacity for remote work productivity changes',
    category: 'organizational',
    icon: 'Wifi',
    config: {
      modifications: [
        {
          entityType: 'teams',
          operation: 'bulk-update',
          changes: [
            {
              field: 'capacity',
              operation: 'multiply',
              value: '{{remoteProductivityMultiplier}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'productivityChange',
          name: 'Productivity Change %',
          description: 'Productivity change when moving to remote work',
          type: 'percentage',
          required: true,
          defaultValue: -10, // Default assumption of 10% decrease
          min: -50,
          max: 50,
        },
        {
          id: 'remoteProductivityMultiplier',
          name: 'Remote Productivity Multiplier',
          description: 'Calculated from productivity change',
          type: 'number',
          required: false,
          defaultValue: 0.9,
        },
      ],
    },
  },
  {
    id: 'new-technology-adoption',
    name: 'New Technology Adoption',
    description: 'Account for learning curve when adopting new technology',
    category: 'strategic-planning',
    icon: 'Zap',
    config: {
      modifications: [
        {
          entityType: 'allocations',
          operation: 'bulk-update',
          filter: {
            field: 'projectId',
            operator: 'equals',
            value: '{{technologyProjectId}}',
          },
          changes: [
            {
              field: 'percentage',
              operation: 'multiply',
              value: '{{learningCurveMultiplier}}',
            },
          ],
        },
      ],
      parameters: [
        {
          id: 'technologyProjectId',
          name: 'Technology Project',
          description: 'Project involving new technology adoption',
          type: 'select',
          required: true,
          options: [], // Will be populated dynamically
        },
        {
          id: 'learningCurveImpact',
          name: 'Learning Curve Impact %',
          description: 'Productivity reduction during learning phase',
          type: 'percentage',
          required: true,
          defaultValue: 25,
          min: 10,
          max: 60,
        },
        {
          id: 'rampUpWeeks',
          name: 'Ramp-up Period (weeks)',
          description: 'Weeks needed to reach full productivity',
          type: 'number',
          required: true,
          defaultValue: 8,
          min: 2,
          max: 24,
        },
        {
          id: 'learningCurveMultiplier',
          name: 'Learning Curve Multiplier',
          description: 'Calculated from learning curve impact',
          type: 'number',
          required: false,
          defaultValue: 0.75,
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
