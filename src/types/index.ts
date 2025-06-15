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
  name:string;
  divisionId?: string;
  divisionName?: string;
  managerId?: string;
  capacity: number; // weekly capacity in hours
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
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
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  description?: string;
  actualCompletionDate?: string;
}

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  estimatedEffort: number; // story points or hours
  status: 'not-started' | 'in-progress' | 'completed';
  assignedTeamId?: string; // Team responsible for this epic
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
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

// NEW: Canvas View Types
export type CanvasViewType =
  | 'all'
  | 'teams-projects'
  | 'projects-epics'
  | 'team-allocations'
  | 'people-teams'
  | 'projects-milestones'
  | 'people-skills'
  | 'team-skills-summary'
  | 'financial-overview';

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

// NEW: Project Report Types
export type ProjectHealthStatus = 'on-track' | 'at-risk' | 'off-track';

export interface ProjectReportExecutiveSummary {
  overallStatus: ProjectHealthStatus;
  commentary: string;
  keyMetrics: {
    budget: { value: number; trend: 'up' | 'down' | 'stable' };
    timeline: { value: string; trend: 'ahead' | 'behind' | 'stable' };
    scope: { completed: number; total: number; trend: 'up' | 'down' | 'stable' };
  };
}

export interface ProjectReportFinancials {
  totalCost: number;
  budget: number;
  variance: number;
  burnRate: number; // monthly
  costBreakdown: any[]; // from calculateProjectCost
  teamBreakdown: any[]; // from calculateProjectCost
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
}
