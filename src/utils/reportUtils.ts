
import { 
  Project, Epic, Milestone, Allocation, Cycle, Person, Role, Team, AppConfig, ProjectReportData, ProjectHealthStatus 
} from '@/types';
import { calculateProjectCost } from './financialCalculations';
import { subMonths, formatISO } from 'date-fns';

interface AppData {
  epics: Epic[];
  allocations: Allocation[];
  cycles: Cycle[];
  people: Person[];
  roles: Role[];
  teams: Team[];
  config: AppConfig | null;
}

export const generateProjectReportData = (
  project: Project,
  appData: AppData
): ProjectReportData | null => {
  if (!project || !appData.config) return null;

  const { epics, allocations, cycles, people, roles, teams } = appData;

  const reportEndDate = new Date();
  const reportStartDate = subMonths(reportEndDate, 1);

  // Financials
  const financialData = calculateProjectCost(project, epics, allocations, cycles, people, roles, teams);
  const financials = {
    totalCost: financialData.totalCost,
    budget: project.budget || 0,
    variance: (project.budget || 0) - financialData.totalCost,
    burnRate: financialData.monthlyBurnRate,
    costBreakdown: financialData.breakdown,
    teamBreakdown: financialData.teamBreakdown,
  };

  // Progress
  const projectEpics = epics.filter(e => e.projectId === project.id);
  const completedEpics = projectEpics.filter(e => e.status === 'completed');
  const inProgressEpics = projectEpics.filter(e => e.status === 'in-progress');
  const upcomingEpics = projectEpics.filter(e => e.status === 'not-started');

  const projectMilestones = project.milestones;
  const completedMilestones = projectMilestones.filter(m => m.status === 'completed');
  const inProgressMilestones = projectMilestones.filter(m => m.status === 'in-progress');
  const upcomingMilestones = projectMilestones.filter(m => m.status === 'not-started');

  const progress = {
    completedEpics,
    inProgressEpics,
    upcomingEpics,
    completedMilestones,
    inProgressMilestones,
    upcomingMilestones
  };

  // Teams
  const projectAllocations = allocations.filter(alloc => 
    projectEpics.some(epic => epic.id === alloc.epicId)
  );

  const teamAllocationMap = new Map<string, { teamName: string, totalAllocation: number }>();
  projectAllocations.forEach(alloc => {
    const team = teams.find(t => t.id === alloc.teamId);
    if (team) {
      const existing = teamAllocationMap.get(team.id) || { teamName: team.name, totalAllocation: 0 };
      existing.totalAllocation += alloc.percentage;
      teamAllocationMap.set(team.id, existing);
    }
  });
  const teamPerformance = {
    teamAllocations: Array.from(teamAllocationMap.entries()).map(([teamId, data]) => ({ teamId, ...data })),
  };

  // Summary (default values)
  const summary = {
    overallStatus: 'on-track' as ProjectHealthStatus,
    commentary: '',
    keyMetrics: {
      budget: { value: financials.variance, trend: 'stable' as const },
      timeline: { value: project.endDate || 'N/A', trend: 'stable' as const },
      scope: { completed: completedEpics.length, total: projectEpics.length, trend: 'stable' as const }
    }
  };

  return {
    projectId: project.id,
    projectName: project.name,
    generatedDate: formatISO(new Date()),
    reportPeriod: {
      startDate: formatISO(reportStartDate),
      endDate: formatISO(reportEndDate),
    },
    summary,
    financials,
    progress,
    teams: teamPerformance
  };
};
