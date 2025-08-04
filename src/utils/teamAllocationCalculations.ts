import {
  Team,
  Person,
  Role,
  Allocation,
  Cycle,
  FinancialYear,
  Epic,
  Project,
  AppConfig,
} from '@/types';
import { calculatePersonCost } from '@/utils/financialCalculations';

// Data structures for team allocation analysis

export interface TeamAllocationSummary {
  teamId: string;
  teamName: string;
  allocations: AllocationPeriodSummary[];
  totalCost: number;
  totalAllocatedPercentage: number;
}

export interface AllocationPeriodSummary {
  periodId: string;
  periodName: string;
  periodType: 'financial-year' | 'quarter' | 'iteration';
  startDate: string;
  endDate: string;
  allocatedPercentage: number;
  cost: number;
  teamMembers: TeamMemberAllocation[];
}

export interface TeamMemberAllocation {
  personId: string;
  personName: string;
  allocatedPercentage: number;
  cost: number;
  skills: string[];
}

export interface TimePeriodTotals {
  periodId: string;
  periodName: string;
  periodType: 'financial-year' | 'quarter' | 'iteration';
  totalCost: number;
  totalAllocatedPercentage: number;
  teamsCount: number;
}

export interface RelatedProject {
  projectId: string;
  projectName: string;
  requiredSkills: string[];
  matchingSkills: string[];
  matchPercentage: number;
  requiredTeams: string[];
  conflictingTeams: string[];
}

/**
 * Calculate team allocation summaries for a project
 * Groups allocations by team and time period (FY, quarter, iteration)
 */
export const calculateTeamAllocations = (
  project: Project,
  epics: Epic[],
  allocations: Allocation[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  cycles: Cycle[],
  financialYears: FinancialYear[],
  config: AppConfig
): TeamAllocationSummary[] => {
  // Get project epics and related allocations
  const projectEpics = epics.filter(epic => epic.projectId === project.id);
  const projectAllocations = allocations.filter(
    allocation =>
      allocation.epicId &&
      projectEpics.some(epic => epic.id === allocation.epicId)
  );

  // Group allocations by team
  const teamAllocationsMap = new Map<string, Allocation[]>();
  projectAllocations.forEach(allocation => {
    const existing = teamAllocationsMap.get(allocation.teamId) || [];
    teamAllocationsMap.set(allocation.teamId, [...existing, allocation]);
  });

  // Calculate summaries for each team
  const teamSummaries: TeamAllocationSummary[] = [];

  teamAllocationsMap.forEach((teamAllocations, teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const periodSummaries = calculatePeriodSummaries(
      teamAllocations,
      people,
      roles,
      cycles,
      financialYears,
      config
    );

    const totalCost = periodSummaries.reduce(
      (sum, period) => sum + period.cost,
      0
    );
    const totalAllocatedPercentage = periodSummaries.reduce(
      (sum, period) => sum + period.allocatedPercentage,
      0
    );

    teamSummaries.push({
      teamId,
      teamName: team.name,
      allocations: periodSummaries,
      totalCost,
      totalAllocatedPercentage,
    });
  });

  return teamSummaries.sort((a, b) => b.totalCost - a.totalCost);
};

/**
 * Calculate period summaries (FY, quarter, iteration) for team allocations
 */
const calculatePeriodSummaries = (
  allocations: Allocation[],
  people: Person[],
  roles: Role[],
  cycles: Cycle[],
  financialYears: FinancialYear[],
  config: AppConfig
): AllocationPeriodSummary[] => {
  // Group allocations by cycle first
  const cycleAllocationsMap = new Map<string, Allocation[]>();
  allocations.forEach(allocation => {
    const existing = cycleAllocationsMap.get(allocation.cycleId) || [];
    cycleAllocationsMap.set(allocation.cycleId, [...existing, allocation]);
  });

  const periodSummaries: AllocationPeriodSummary[] = [];

  // Process each cycle
  cycleAllocationsMap.forEach((cycleAllocations, cycleId) => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;

    // Calculate team member allocations for this period
    const teamMembers = calculateTeamMemberAllocations(
      cycleAllocations,
      people,
      roles,
      config
    );

    const totalCost = teamMembers.reduce((sum, member) => sum + member.cost, 0);
    const totalAllocatedPercentage = cycleAllocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0
    );

    periodSummaries.push({
      periodId: cycle.id,
      periodName: cycle.name,
      periodType:
        cycle.type === 'quarterly'
          ? 'quarter'
          : cycle.type === 'iteration'
            ? 'iteration'
            : 'financial-year',
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      allocatedPercentage: totalAllocatedPercentage,
      cost: totalCost,
      teamMembers,
    });
  });

  return periodSummaries.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
};

/**
 * Calculate team member allocations and costs for a set of allocations
 */
const calculateTeamMemberAllocations = (
  allocations: Allocation[],
  people: Person[],
  roles: Role[],
  config: AppConfig
): TeamMemberAllocation[] => {
  // Group allocations by person (in case same person has multiple allocations in period)
  const personAllocationsMap = new Map<string, Allocation[]>();

  allocations.forEach(allocation => {
    // Find team members for this allocation
    const team = people.filter(person => person.teamId === allocation.teamId);
    team.forEach(person => {
      const existing = personAllocationsMap.get(person.id) || [];
      personAllocationsMap.set(person.id, [...existing, allocation]);
    });
  });

  const teamMemberAllocations: TeamMemberAllocation[] = [];

  personAllocationsMap.forEach((personAllocations, personId) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    const role = roles.find(r => r.id === person.roleId);
    if (!role) return;

    // Calculate person's cost using existing function
    const personCost = calculatePersonCost(person, role, config);

    // Sum up allocation percentages for this person in this period
    const totalAllocatedPercentage = personAllocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0
    );

    // Calculate cost based on allocation percentage
    // Use monthly cost as a reasonable period basis
    const allocationCost =
      (personCost.costPerMonth * totalAllocatedPercentage) / 100;

    teamMemberAllocations.push({
      personId,
      personName: person.name,
      allocatedPercentage: totalAllocatedPercentage,
      cost: allocationCost,
      skills: person.skills || [],
    });
  });

  return teamMemberAllocations.sort((a, b) => b.cost - a.cost);
};

/**
 * Calculate totals by time period across all teams
 */
export const calculateTimePeriodTotals = (
  teamSummaries: TeamAllocationSummary[]
): TimePeriodTotals[] => {
  const periodTotalsMap = new Map<string, TimePeriodTotals>();

  teamSummaries.forEach(team => {
    team.allocations.forEach(period => {
      const existing = periodTotalsMap.get(period.periodId);

      if (existing) {
        existing.totalCost += period.cost;
        existing.totalAllocatedPercentage += period.allocatedPercentage;
        existing.teamsCount += 1;
      } else {
        periodTotalsMap.set(period.periodId, {
          periodId: period.periodId,
          periodName: period.periodName,
          periodType: period.periodType,
          totalCost: period.cost,
          totalAllocatedPercentage: period.allocatedPercentage,
          teamsCount: 1,
        });
      }
    });
  });

  return Array.from(periodTotalsMap.values()).sort((a, b) => {
    // Sort by period type priority, then by period name
    const typePriority = { 'financial-year': 1, quarter: 2, iteration: 3 };
    const aPriority = typePriority[a.periodType];
    const bPriority = typePriority[b.periodType];

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return a.periodName.localeCompare(b.periodName);
  });
};

/**
 * Find related projects that need similar team skills
 */
export const findRelatedProjects = (
  currentProject: Project,
  allProjects: Project[],
  projectSkills: Array<{
    projectId: string;
    skillId: string;
    skillName: string;
  }>,
  teamSummaries: TeamAllocationSummary[]
): RelatedProject[] => {
  // Get skills required by current project
  const currentProjectSkills = projectSkills
    .filter(ps => ps.projectId === currentProject.id)
    .map(ps => ps.skillName);

  if (currentProjectSkills.length === 0) {
    return [];
  }

  // Get teams allocated to current project
  const allocatedTeamIds = teamSummaries.map(ts => ts.teamId);

  const relatedProjects: RelatedProject[] = [];

  allProjects
    .filter(
      project =>
        project.id !== currentProject.id && project.status !== 'completed'
    )
    .forEach(project => {
      const projectRequiredSkills = projectSkills
        .filter(ps => ps.projectId === project.id)
        .map(ps => ps.skillName);

      if (projectRequiredSkills.length === 0) {
        return;
      }

      // Calculate skill overlap
      const matchingSkills = currentProjectSkills.filter(skill =>
        projectRequiredSkills.includes(skill)
      );

      if (matchingSkills.length === 0) {
        return;
      }

      const matchPercentage =
        (matchingSkills.length /
          Math.max(currentProjectSkills.length, projectRequiredSkills.length)) *
        100;

      // For now, we'll use a simplified approach for required/conflicting teams
      // In a real implementation, you'd analyze actual team allocations across projects
      const requiredTeams = allocatedTeamIds.filter(() => Math.random() > 0.7); // Placeholder logic
      const conflictingTeams = allocatedTeamIds.filter(teamId =>
        requiredTeams.includes(teamId)
      );

      relatedProjects.push({
        projectId: project.id,
        projectName: project.name,
        requiredSkills: projectRequiredSkills,
        matchingSkills,
        matchPercentage: Math.round(matchPercentage),
        requiredTeams,
        conflictingTeams,
      });
    });

  return relatedProjects
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 10); // Return top 10 most related projects
};
