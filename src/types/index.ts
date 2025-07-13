// Core data types for the planning app
export interface Person {
  id: string;
  name: string;
  email: string;
  roleId: string;
  teamId: string;
  isActive: boolean;
  employmentType: 'permanent' | 'contractor';
  annualSalary?: number; // For permanent employees
  contractDetails?: {
    hourlyRate?: number;
    dailyRate?: number;
  }; // For contractors
  startDate: string;
  endDate?: string;
}

export interface Role {
  id: string;
  name: string;
  rateType: 'hourly' | 'daily' | 'annual';
  defaultRate: number; // Legacy field for backward compatibility
  defaultAnnualSalary?: number;
  defaultHourlyRate?: number;
  defaultDailyRate?: number;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  divisionId?: string;
  divisionName?: string;
  productOwnerId?: string;
  capacity: number; // weekly capacity in hours
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  productOwnerId?: string;
  budget?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget?: number;
  ranking?: number; // 1-1000 priority ranking
  milestones: Milestone[];
  risks?: ProjectRisk[];
  reports?: ProjectReportData[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  description?: string;
  actualCompletionDate?: string;
  isKey?: boolean; // Whether this is a key milestone for plan analysis
}

export interface Release {
  id: string;
  name: string;
  version: string;
  description?: string;
  status: 'planned' | 'in-progress' | 'released' | 'cancelled';
  targetDate?: string;
  actualDate?: string;
}

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  estimatedEffort?: number; // Made optional - story points or hours
  storyPoints?: number; // Optional story points
  status: 'not-started' | 'in-progress' | 'completed';
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  releaseId?: string; // Associated release
  deploymentDate?: string; // When epic was deployed
  mvpPriority?: number; // For MVP line ranking
  releasePriority?: number; // For release line ranking
  isDeployed?: boolean; // Whether epic is deployed
  isToggleEnabled?: boolean; // Whether feature toggle is enabled
  toggleEnabledDate?: string; // When toggle was enabled
  isKey?: boolean; // Whether this is a key epic for plan analysis
}

export interface RunWorkCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Allocation {
  id: string;
  teamId: string;
  cycleId: string;
  iterationNumber: number;
  epicId?: string;
  runWorkCategoryId?: string;
  percentage: number;
  notes?: string;
}

// NEW: Solutions for projects
export interface Solution {
  id: string;
  name: string;
  description?: string;
  category: SolutionCategory;
  skillIds: string[]; // Skills required/associated with this solution
  createdDate: string;
}

export type SolutionCategory =
  | 'platform'
  | 'framework-stack'
  | 'methodology'
  | 'architecture-pattern'
  | 'other';

// Link projects to skills (both direct and via solutions)
export interface ProjectSkill {
  id: string;
  projectId: string;
  skillId: string;
  sourceType: 'direct' | 'solution'; // How skill was added to project
  sourceSolutionId?: string; // If from solution, which solution
  importance: 'critical' | 'important' | 'nice-to-have';
}

// Link projects to solutions
export interface ProjectSolution {
  id: string;
  projectId: string;
  solutionId: string;
  isPrimary: boolean; // One primary solution per project
  notes?: string;
}

// Canvas View Types - Updated to include goal-centric views
export type CanvasViewType =
  | 'all'
  | 'teams-projects'
  | 'projects-epics'
  | 'team-allocations'
  | 'people-teams'
  | 'projects-milestones'
  | 'people-skills'
  | 'team-skills-summary'
  | 'financial-overview'
  | 'projects-solutions'
  | 'solutions-skills'
  | 'scenario-analysis'
  | 'capacity-planning'
  | 'skill-gap-analysis'
  | 'goal-journey'
  | 'goal-timeline'
  | 'goal-hierarchy';

// NEW: Tracking system types
export interface ActualAllocation {
  id: string;
  plannedAllocationId?: string; // Links to original Allocation
  teamId: string;
  cycleId: string;
  iterationNumber: number;
  actualPercentage: number;
  actualEpicId?: string;
  actualRunWorkCategoryId?: string;
  varianceReason?: string;
  enteredDate: string;
  enteredBy?: string;
}

export interface IterationReview {
  id: string;
  cycleId: string;
  iterationNumber: number;
  reviewDate: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedEpics: string[];
  completedMilestones: string[];
  notes?: string;
  completedBy?: string;
}

export interface VarianceAnalysis {
  allocationId: string;
  teamId: string;
  iterationNumber: number;
  plannedPercentage: number;
  actualPercentage: number;
  variance: number; // actual - planned
  varianceType: 'over' | 'under' | 'on-track';
  impactLevel: 'low' | 'medium' | 'high';
}

export type VarianceReasonType =
  | 'none'
  | 'production-support'
  | 'scope-change'
  | 'resource-unavailable'
  | 'technical-blocker'
  | 'priority-shift'
  | 'other';

export interface IterationActualEntry {
  id: string; // Unique ID for list rendering
  plannedAllocationId?: string;
  actualPercentage: number;
  actualEpicId?: string;
  actualRunWorkCategoryId?: string;
  varianceReason?: VarianceReasonType;
}

export interface IterationSnapshot {
  id: string;
  cycleId: string;
  iterationNumber: number;
  snapshotDate: string;
  plannedAllocations: Allocation[];
  plannedMilestones: string[];
  plannedEpics: string[];
}

export interface Cycle {
  id: string;
  type: 'annual' | 'quarterly' | 'monthly' | 'iteration';
  name: string;
  startDate: string;
  endDate: string;
  parentCycleId?: string;
  status: 'planning' | 'active' | 'completed';
}

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface AppConfig {
  financialYear: FinancialYear;
  iterationLength: 'fortnightly' | 'monthly' | '6-weekly';
  quarters: Cycle[];
}

export type ViewMode = 'table' | 'card' | 'canvas';
export type CycleType = 'annual' | 'quarterly' | 'monthly' | 'iteration';

// Financial calculation types
export interface PersonCost {
  personId: string;
  costPerDay: number;
  costPerWeek: number;
  costPerMonth: number;
  costPerYear: number;
}

export interface ProjectCost {
  projectId: string;
  totalCost: number;
  costBreakdown: {
    personId: string;
    personName: string;
    allocationPercentage: number;
    duration: number; // in days
    totalPersonCost: number;
  }[];
}

// Skills Management Types
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  createdDate: string;
}

export type SkillCategory =
  | 'programming-language'
  | 'framework'
  | 'platform'
  | 'domain-knowledge'
  | 'methodology'
  | 'tool'
  | 'other';

export interface PersonSkill {
  id: string;
  personId: string;
  skillId: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  lastUsed?: string;
  certifications?: string[];
  notes?: string;
}

export interface TeamSkillSummary {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  peopleCount: number;
  averageProficiency: number;
  proficiencyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
}

// NEW: Project Risk Type
export interface ProjectRisk {
  id: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  status: 'open' | 'closed' | 'mitigated';
  mitigation?: string;
  ownerId?: string; // Person responsible
  createdDate: string;
}

// NEW: Project Report Types
export type ProjectHealthStatus = 'on-track' | 'at-risk' | 'off-track';

export interface ProjectReportExecutiveSummary {
  overallStatus: ProjectHealthStatus;
  commentary: string;
  keyMetrics: {
    budget: { value: number; trend: 'up' | 'down' | 'stable' };
    timeline: { value: string; trend: 'ahead' | 'behind' | 'stable' };
    scope: {
      completed: number;
      total: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
}

export interface ProjectReportFinancials {
  totalCost: number;
  budget: number;
  variance: number;
  burnRate: number; // monthly
  costBreakdown: {
    personId: string;
    personName: string;
    allocationPercentage: number;
    duration: number;
    totalPersonCost: number;
  }[];
  teamBreakdown: {
    teamId: string;
    teamName: string;
    totalCost: number;
    allocationPercentage: number;
  }[];
}

export interface ProjectReportProgress {
  completedEpics: Epic[];
  inProgressEpics: Epic[];
  upcomingEpics: Epic[];
  completedMilestones: Milestone[];
  inProgressMilestones: Milestone[];
  upcomingMilestones: Milestone[];
}

export interface ProjectReportTeamPerformance {
  teamAllocations: {
    teamId: string;
    teamName: string;
    totalAllocation: number; // percentage
  }[];
}

export interface ProjectReportData {
  projectId: string;
  projectName: string;
  generatedDate: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: ProjectReportExecutiveSummary;
  financials: ProjectReportFinancials;
  progress: ProjectReportProgress;
  teams: ProjectReportTeamPerformance;
  risks: ProjectRisk[];
}

// Advanced Squad Management Types
export interface Squad {
  id: string;
  name: string;
  description?: string;
  type: 'project' | 'initiative' | 'workstream' | 'feature-team';
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  duration?: {
    start: string;
    end: string;
  };
  targetSkills: string[]; // Required skill IDs
  capacity: number; // people capacity
  divisionId?: string; // Optional division association
  projectIds?: string[]; // Associated projects
  createdDate: string;
  lastModified: string;
}

export interface SquadMember {
  id: string;
  squadId: string;
  personId: string;
  role: 'lead' | 'member' | 'advisor' | 'consultant';
  allocation: number; // percentage (0-100)
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface SquadSkillRequirement {
  id: string;
  squadId: string;
  skillId: string;
  requiredProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'critical' | 'important' | 'nice-to-have';
  currentCoverage: number; // percentage covered (0-100)
  requiredCount: number; // number of people needed with this skill
}

export interface SquadSkillGap {
  skillId: string;
  skillName: string;
  required: number;
  available: number;
  gap: number;
  priority: 'critical' | 'important' | 'nice-to-have';
  availablePeople: {
    personId: string;
    personName: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    currentAllocation: number;
  }[];
}

export interface UnmappedPerson {
  id: string;
  name: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  skills: {
    skillId: string;
    skillName: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }[];
  currentTeamId?: string;
  currentTeamName?: string;
  availability: number; // percentage available for new squads
  joinDate?: string;
  importedDate: string;
}

export interface SquadRecommendation {
  squadId: string;
  squadName: string;
  personId: string;
  personName: string;
  score: number; // 0-100, higher is better match
  reasons: string[];
  skillMatches: {
    skillId: string;
    skillName: string;
    personProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    requiredProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    priority: 'critical' | 'important' | 'nice-to-have';
  }[];
  conflicts: {
    type: 'over-allocation' | 'skill-mismatch' | 'timeline-conflict';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export type SquadMemberRole = 'lead' | 'member' | 'advisor' | 'consultant';
export type SquadType =
  | 'project'
  | 'initiative'
  | 'workstream'
  | 'feature-team';
export type SquadStatus = 'planning' | 'active' | 'completed' | 'on-hold';

// Squad Canvas View Types
export type SquadCanvasViewType =
  | 'squads-people'
  | 'squads-skills'
  | 'people-squads'
  | 'skill-coverage'
  | 'allocation-timeline'
  | 'squad-dependencies';

// Goal-related imports and additions
export type {
  Goal,
  GoalMetric,
  NorthStar,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
  JourneyPath,
  GoalProgress,
  JourneyCanvasConfig,
  GoalFilterType,
  CreateGoalRequest,
  UpdateGoalRequest,
} from './goalTypes';
