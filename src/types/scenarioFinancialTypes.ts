/**
 * Enhanced Financial Types for Scenario Planning
 * Focuses on team costs, burn rates, and budget analysis
 */

export interface TeamCostCalculation {
  teamId: string;
  teamName: string;
  totalCost: number;
  costBreakdown: {
    baseSalaries: number;
    overhead: number; // Benefits, office costs, etc.
    projectManagement: number;
    licensing: number;
    other: number;
  };
  costPerHour: number;
  costPerIteration: number;
  costPerQuarter: number;
  headcount: number;
  averageRoleRate: number;
}

export interface ProjectBurnAnalysis {
  projectId: string;
  projectName: string;
  financialYear: string;
  quarter: string;
  totalBudget: number;
  allocatedTeamCosts: number;
  burnRate: {
    perIteration: number;
    perQuarter: number;
    projected: number;
  };
  budgetUtilization: {
    percentage: number;
    remaining: number;
    overBudget: boolean;
    variance: number;
  };
  teamAllocations: {
    teamId: string;
    teamName: string;
    allocatedPercentage: number;
    allocatedCost: number;
    burnRate: number;
  }[];
}

export interface TeamCostBreakdown {
  teamId: string;
  teamName: string;
  liveHeadcount: number;
  scenarioHeadcount: number;
  headcountChange: number;
  liveCostPerPerson: number;
  scenarioCostPerPerson: number;
  costBreakdown: {
    baseSalariesDiff: number;
    overheadDiff: number;
    projectManagementDiff: number;
    licensingDiff: number;
    otherDiff: number;
  };
  annualImpact: number;
  quarterlyImpact: number;
}

export interface ScenarioFinancialComparison {
  scenarioId: string;
  comparedAt: string;
  summary: {
    totalCostDifference: number;
    totalBudgetVariance: number;
    teamCostChanges: number;
    projectBudgetChanges: number;
  };
  teamCostChanges: {
    teamId: string;
    teamName: string;
    liveCost: number;
    scenarioCost: number;
    difference: number;
    percentageChange: number;
  }[];
  projectBurnChanges: {
    projectId: string;
    projectName: string;
    liveBurnRate: number;
    scenarioBurnRate: number;
    budgetImpact: number;
    quarterlyVariance: number;
  }[];
  quarterlyAnalysis: {
    quarter: string;
    financialYear: string;
    liveTotalCost: number;
    scenarioTotalCost: number;
    variance: number;
    affectedProjects: string[];
  }[];
  detailedBreakdown?: TeamCostBreakdown[];
}

export interface RoleCostConfig {
  roleId: string;
  roleName: string;
  averageSalary: number;
  overheadMultiplier: number; // e.g., 1.4 for 40% overhead
  projectManagementRate: number; // percentage of base cost
  licensingCostPerPerson: number; // annual cost per person
}

export interface TeamCostConfig {
  teamId: string;
  customOverheadMultiplier?: number; // Override default overhead
  additionalCosts?: {
    equipment: number;
    training: number;
    other: number;
  };
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: ScenarioTemplateCategory;
  icon?: string;
  config: {
    modifications: TemplateModification[];
    parameters: TemplateParameter[];
    conditionalLogic?: ConditionalRule[]; // If-then logic
  };
  usageCount: number;
  lastUsed?: string;
}

export interface ConditionalRule {
  id: string;
  condition: {
    entityType: keyof ScenarioData;
    field: string;
    operator:
      | 'equals'
      | 'not-equals'
      | 'greater-than'
      | 'less-than'
      | 'contains'
      | 'in-range';
    value: string | number | boolean;
    secondValue?: number; // For range operations
  };
  actions: TemplateModification[];
  description: string;
}

export interface AdvancedTemplateModification extends TemplateModification {
  conditions?: {
    field: string;
    operator: 'if' | 'unless' | 'when';
    value: string | number | boolean;
  }[];
  formula?: string; // e.g., "{{baseSalary}} * {{overheadMultiplier}} + {{licensingCost}}"
}

export type ScenarioTemplateCategory =
  | 'budget'
  | 'team-changes'
  | 'project-timeline'
  | 'resource-allocation'
  | 'strategic-planning'
  | 'risk-mitigation'
  | 'cost-optimization'
  | 'capacity-planning';

// Enhanced scenario data to include financial calculations
export interface EnhancedScenarioData extends ScenarioData {
  financialAnalysis?: {
    teamCosts: TeamCostCalculation[];
    projectBurnAnalysis: ProjectBurnAnalysis[];
    quarterlyTotals: {
      quarter: string;
      financialYear: string;
      totalTeamCosts: number;
      totalProjectBudgets: number;
      utilization: number;
    }[];
    roleCostConfig: RoleCostConfig[];
    teamCostConfig: TeamCostConfig[];
  };
}

// Performance optimization for large datasets
export interface ScenarioPerformanceConfig {
  enableVirtualization: boolean;
  chunkSize: number;
  maxConcurrentCalculations: number;
  cacheResults: boolean;
  cacheDurationMs: number;
}

export const DEFAULT_PERFORMANCE_CONFIG: ScenarioPerformanceConfig = {
  enableVirtualization: true,
  chunkSize: 50, // Process 50 entities at a time
  maxConcurrentCalculations: 4,
  cacheResults: true,
  cacheDurationMs: 300000, // 5 minutes
};

// Financial calculation constants
export const FINANCIAL_CONSTANTS = {
  DEFAULT_OVERHEAD_MULTIPLIER: 1.4, // 40% overhead
  DEFAULT_PROJECT_MANAGEMENT_RATE: 0.15, // 15% for PM
  WEEKS_PER_QUARTER: 13,
  WEEKS_PER_ITERATION: 2,
  WORKING_HOURS_PER_WEEK: 40,
} as const;
