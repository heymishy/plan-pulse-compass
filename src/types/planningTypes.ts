
import { Team } from './index';

// Advanced Planning and Budget Management Types
export interface DivisionBudget {
  id: string;
  divisionId: string;
  financialYearId: string;
  totalBudget: number;
  runWorkBudget: number; // Budget allocated for non-project work
  projectBudget: number; // Budget allocated for project work
  forecastSpend: number;
  actualSpend: number;
  variance: number;
  quarters: DivisionQuarterBudget[];
}

export interface DivisionQuarterBudget {
  quarterId: string;
  quarterName: string;
  budgetAllocation: number;
  forecastSpend: number;
  actualSpend: number;
  projectSpend: number;
  runWorkSpend: number;
}

export interface ProjectFeasibilityAnalysis {
  projectId: string;
  projectName: string;
  requiredSkills: ProjectSkillRequirement[];
  budgetRequirement: number;
  timelineRequirement: {
    startDate: string;
    endDate: string;
    durationInIterations: number;
  };
  feasibilityScore: number;
  riskFactors: FeasibilityRisk[];
  recommendedTeams: TeamRecommendation[];
  budgetImpact: BudgetImpactAnalysis;
}

export interface ProjectSkillRequirement {
  skillId: string;
  skillName: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  minimumProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredHeadcount: number;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  required: boolean;
  importance: 'critical' | 'important' | 'nice-to-have';
  availableInTeam: boolean;
  alternativeSkills: string[];
}

export interface TeamRecommendation {
  teamId: string;
  teamName: string;
  matchScore: number;
  skillMatch: number;
  availabilityMatch: number;
  costEfficiency: number;
  availabilityWindows: AvailabilityWindow[];
  currentAllocations: CurrentAllocation[];
  skillGaps: SkillGap[];
}

export interface AvailabilityWindow {
  startDate: string;
  endDate: string;
  availableCapacity: number; // percentage
  cycleId: string;
  cycleName: string;
}

export interface CurrentAllocation {
  projectId: string;
  projectName: string;
  epicId?: string;
  epicName?: string;
  percentage: number;
  endDate: string;
  cycleId: string;
}

export interface FeasibilityRisk {
  type: 'skill-gap' | 'budget-constraint' | 'timeline-conflict' | 'resource-unavailable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
  impact: number; // 0-100
}

export interface BudgetImpactAnalysis {
  totalProjectCost: number;
  quarterlyBreakdown: QuarterlyCostBreakdown[];
  divisionBudgetImpact: DivisionBudgetImpact[];
  costPerTeam: TeamCostBreakdown[];
  runWorkImpact: RunWorkCostImpact;
}

export interface QuarterlyCostBreakdown {
  quarterId: string;
  quarterName: string;
  projectCost: number;
  runWorkCost: number;
  totalCost: number;
}

export interface DivisionBudgetImpact {
  divisionId: string;
  divisionName: string;
  budgetUtilization: number; // percentage
  remainingBudget: number;
  projectedOverrun: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TeamCostBreakdown {
  teamId: string;
  teamName: string;
  currentSize: number;
  totalCost: number;
  projectAllocationCost: number;
  runWorkCost: number;
  costPerPerson: number;
}

export interface RunWorkCostImpact {
  currentRunWorkPercentage: number;
  projectedRunWorkPercentage: number;
  impactOnDivisionBudget: number;
  divisionBudgetUtilization: number;
}

export interface PlanningScenario {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
  teamChanges: TeamChange[];
  budgetImpact: BudgetImpactAnalysis;
  feasibilityScore: number;
  riskAssessment: ScenarioRisk[];
  createdDate: string;
}

export interface TeamChange {
  type: 'add-person' | 'remove-person' | 'create-team' | 'modify-allocation';
  teamId: string;
  details: {
    personId?: string;
    newTeamData?: Partial<Team>;
    allocationChanges?: AllocationChange[];
  };
  costImplication: number;
  skillsImpact: string[];
}

export interface AllocationChange {
  allocationId: string;
  currentPercentage: number;
  proposedPercentage: number;
  impact: number;
}

export interface ScenarioRisk {
  type: 'budget-overrun' | 'timeline-delay' | 'skill-shortage' | 'resource-conflict';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

// Planning Engine Configuration
export interface PlanningEngineConfig {
  skillMatchWeight: number; // 0-1
  availabilityWeight: number; // 0-1
  costWeight: number; // 0-1
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  planningHorizon: number; // quarters
  budgetConstraintStrict: boolean;
}

// Advanced Planning Dashboard State
export interface AdvancedPlanningState {
  selectedProjects: string[];
  selectedDivisions: string[];
  planningHorizon: number;
  scenarios: PlanningScenario[];
  activeScenario?: string;
  filters: PlanningFilters;
}

export interface PlanningFilters {
  projectStatus: ('planning' | 'active')[];
  divisionIds: string[];
  budgetRange?: {
    min: number;
    max: number;
  };
  timelineRange?: {
    startDate: string;
    endDate: string;
  };
  skillCategories: string[];
  riskLevels: ('low' | 'medium' | 'high')[];
}
