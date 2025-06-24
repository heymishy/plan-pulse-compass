
// Goal-Centric Journey Planning Types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk' | 'cancelled';
  confidence: number; // 0-1 scale
  metric: GoalMetric;
  timeFrame: string; // references Cycle.id for quarters/timeframes
  ownerId?: string; // Person responsible
  dependencies: string[]; // Other Goal IDs this depends on
  createdDate: string;
  updatedDate: string;
  notes?: string;
}

export interface GoalMetric {
  type: 'percentage' | 'number' | 'currency' | 'boolean';
  target: number;
  current: number;
  unit?: string; // e.g., '%', '$', 'users'
  direction: 'increase' | 'decrease'; // whether higher is better
}

export interface NorthStar {
  id: string;
  title: string;
  description?: string;
  vision: string; // Long-term vision statement
  timeHorizon: string; // e.g., "2024", "12 months"
  metric: GoalMetric;
  isActive: boolean;
  createdDate: string;
}

// Linking interfaces for goals
export interface GoalEpic {
  id: string;
  goalId: string;
  epicId: string;
  contribution: number; // 0-1, how much this epic contributes to goal
  createdDate: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  milestoneId: string;
  contribution: number; // 0-1, how much this milestone contributes to goal
  createdDate: string;
}

export interface GoalTeam {
  id: string;
  goalId: string;
  teamId: string;
  responsibility: 'primary' | 'supporting' | 'consulted';
  allocation: number; // 0-1, what percentage of team effort goes to this goal
  createdDate: string;
}

// Journey visualization types
export interface JourneyPath {
  id: string;
  teamId: string;
  projectId?: string;
  goalIds: string[]; // Goals along this path
  pathType: 'primary' | 'supporting' | 'dependency';
  color: string;
}

export interface GoalProgress {
  goalId: string;
  completionPercentage: number; // calculated from linked epics/milestones
  confidenceTrend: number; // -1 to 1, how confidence is changing
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

// Journey canvas view configuration
export interface JourneyCanvasConfig {
  northStarId?: string;
  timeFrameFilter: string[]; // Cycle IDs to show
  teamFilter: string[]; // Team IDs to show
  projectFilter: string[]; // Project IDs to show
  showDependencies: boolean;
  showMetrics: boolean;
  viewMode: 'journey' | 'timeline' | 'hierarchy';
}

export type GoalFilterType = 'all' | 'by-team' | 'by-project' | 'by-timeframe' | 'by-status';

// Goal creation and editing
export interface CreateGoalRequest {
  title: string;
  description?: string;
  timeFrame: string;
  metric: Omit<GoalMetric, 'current'>; // current starts at 0
  ownerId?: string;
  linkedEpicIds?: string[];
  linkedMilestoneIds?: string[];
  assignedTeamIds?: string[];
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  id: string;
  confidence?: number;
  status?: Goal['status'];
  currentMetricValue?: number;
  notes?: string;
}
