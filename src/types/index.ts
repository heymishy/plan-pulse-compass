// Core data types for the planning app
export interface Person {
  id: string;
  name: string;
  email: string;
  roleId: string;
  teamId: string;
  isActive: boolean;
  salary?: number; // Individual salary override
}

export interface Role {
  id: string;
  name: string;
  defaultRate: number;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  divisionId?: string;
  managerId?: string;
  capacity: number; // weekly capacity in hours
}

export interface Division {
  id: string;
  name: string;
  description?: string;
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
