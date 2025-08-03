export interface PriorityLevel {
  id: number;
  label: string;
  description: string;
  color: string;
}

export interface AppConfig {
  financialYear: FinancialYear;
  iterationLength: 'fortnightly' | 'monthly' | '6-weekly';
  quarters: Cycle[];
  workingDaysPerWeek: number; // e.g., 5 for a standard work week
  workingHoursPerDay: number; // e.g., 8 for a standard workday
  workingDaysPerYear: number; // e.g., 260 for typical business year
  workingDaysPerMonth: number; // e.g., 22 for typical business month
  currencySymbol: string; // e.g., '$', '€', '£'
  priorityLevels?: PriorityLevel[]; // Configurable priority levels
  integrations?: {
    o365?: {
      clientId?: string;
      tenantId?: string;
      redirectUri?: string;
      enabled?: boolean;
    };
  };
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

export interface SkillProficiency {
  skillId: string;
  skillName: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  certifications?: string[];
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

export interface ProductivityMetric {
  date: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CostMetric {
  date: string;
  totalCost: number;
  costPerPerson: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TeamAnalytics {
  teamHealthScore: number; // Composite metric 0-100
  knowledgeDistribution: Record<string, number>; // Skill coverage percentages
  busFactor: number; // Single points of failure count
  onboardingEfficiency: number; // Time to productivity in days
  retentionRate: number; // 12-month rolling percentage
  productivityTrends: ProductivityMetric[];
  costTrends: CostMetric[];
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
  availability: number; // percentage available for new teams
  joinDate?: string;
  importedDate: string;
}

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

// Core Entity Types
export interface Person {
  id: string;
  name: string;
  email: string;
  roleId: string;
  teamId: string;
  isActive: boolean;
  employmentType: 'permanent' | 'contractor' | 'temporary';
  annualSalary?: number;
  startDate: string;
  endDate?: string;
  skills?: string[];
  // Enhanced analytics fields
  seniorityLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  skillProficiencies?: SkillProficiency[];
  performanceRating?: number; // 1-5 scale
  retentionRisk?: 'low' | 'medium' | 'high';
  careerProgressionPath?: string;
  mentorshipCapacity?: number;
  crossTrainingAreas?: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  type: 'permanent' | 'project' | 'initiative' | 'workstream' | 'feature-team';
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  divisionId?: string;
  divisionName?: string;
  productOwnerId?: string;
  capacity: number;
  targetSkills: string[];
  projectIds?: string[];
  duration?: { start: string; end: string };
  createdDate: string;
  lastModified: string;
}

// Division Leadership Roles
export interface DivisionLeadershipRole {
  id: string;
  personId: string;
  divisionId: string;
  roleType:
    | 'technical-delivery-lead'
    | 'people-leader'
    | 'solution-architect'
    | 'engineering-manager'
    | 'principal-engineer'
    | 'product-lead'
    | 'operations-lead';
  title: string;
  scope?: string; // Description of scope/responsibility
  startDate: string;
  endDate?: string;
  isActive: boolean;
  supportsTeams?: string[]; // Team IDs this leader supports
  notes?: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  personId: string;
  role: 'lead' | 'member' | 'advisor' | 'consultant' | 'product-owner';
  allocation: number; // percentage (0-100)
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface Division {
  id: string;
  name: string;
  description: string;
  budget: number;
}

export interface Role {
  id: string;
  name: string;
  rateType: 'annual' | 'daily' | 'hourly';
  defaultAnnualSalary: number;
  description?: string;
}

export interface ProjectFinancialYearBudget {
  financialYearId: string;
  amount: number;
}

export interface Project {
  id: string;
  name: string;
  shortname?: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget?: number; // Legacy field - maintained for backward compatibility
  financialYearBudgets?: ProjectFinancialYearBudget[]; // New per-financial-year budget system
  milestones: string[];
  priority: number;
  ranking: number;
  priorityOrder?: number; // Enhanced priority ordering (defaults to priority if not set)
  createdDate: string;
  lastModified: string;
}

export interface Epic {
  id: string;
  name: string;
  shortname?: string;
  description?: string;
  projectId: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  estimatedEffort?: number;
  ranking: number;
  createdDate: string;
  lastModified: string;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  isCompleted: boolean;
  createdDate: string;
  lastModified: string;
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

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'quarterly' | 'monthly' | 'iteration';
  financialYearId: string;
}

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  quarters: string[];
}

export interface Solution {
  id: string;
  name: string;
  description: string;
  category: string;
  skills: string[];
  createdDate: string;
}

export interface Release {
  id: string;
  name: string;
  description?: string;
  version: string;
  releaseDate: string;
  status: 'planned' | 'in-progress' | 'released' | 'cancelled';
  epics: string[];
  createdDate: string;
}

export interface ProjectSolution {
  id: string;
  projectId: string;
  solutionId: string;
  importance: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ProjectSkill {
  id: string;
  projectId: string;
  skillId: string;
  importance: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface RunWorkCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export interface ActualAllocation {
  id: string;
  personId: string;
  teamId: string;
  projectId?: string;
  epicId?: string;
  cycleId: string;
  percentage: number;
  type: 'project' | 'run-work';
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface IterationReview {
  id: string;
  cycleId: string;
  teamId: string;
  status: 'draft' | 'submitted' | 'approved';
  notes?: string;
  createdDate: string;
  submittedDate?: string;
  approvedDate?: string;
}

export interface IterationSnapshot {
  id: string;
  cycleId: string;
  teamId: string;
  plannedAllocations: Allocation[];
  actualAllocations: ActualAllocation[];
  variance: number;
  createdDate: string;
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
  availability: number;
  joinDate?: string;
  importedDate: string;
}

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

// Calendar-related imports and additions
export type {
  CalendarEvent,
  CalendarEventType,
  CalendarFilters,
  CalendarViewConfig,
  DerivedCalendarEvent,
} from './calendarTypes';

// Canvas View Types
export type CanvasViewType =
  | 'all'
  | 'financial-overview'
  | 'teams-projects'
  | 'projects-epics'
  | 'team-allocations'
  | 'people-teams'
  | 'projects-milestones'
  | 'people-skills'
  | 'team-skills-summary'
  | 'projects-solutions'
  | 'solutions-skills'
  | 'scenario-analysis'
  | 'capacity-planning'
  | 'skill-gap-analysis'
  | 'division-sizing'
  | 'financial-impact-analysis';
