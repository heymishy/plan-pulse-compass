import {
  Person,
  Team,
  Role,
  AppConfig,
  TeamMoveImpact,
  Allocation,
  Cycle,
  Project,
  Epic,
} from '../types';
import { calculatePersonCost } from './financialCalculations';

/**
 * Calculates the total cost of a team based on its members' salaries.
 * @param team - The team to calculate the cost for.
 * @param people - A list of all people in the organization.
 * @param roles - A list of all roles in the organization.
 * @param config - The application configuration.
 * @returns The total annual cost of the team.
 */
export const calculateTeamCost = (
  team: Team,
  people: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  const teamMembers = people.filter(p => p.teamId === team.id);
  const totalCost = teamMembers.reduce((acc, member) => {
    const role = roles.find(r => r.id === member.roleId);
    if (!role) return acc;
    const personCost = calculatePersonCost(member, role, config);
    return acc + personCost.costPerYear;
  }, 0);
  return totalCost;
};

/**
 * Calculates the financial impact of moving a person to a different team.
 * @param person - The person being moved.
 * @param newTeam - The team the person is moving to.
 * @param people - A list of all people in the organization.
 * @param roles - A list of all roles in the organization.
 * @param teams - A list of all teams in the organization.
 * @param config - The application configuration.
 * @returns An object detailing the financial impact.
 */
export const analyzeTeamMoveImpact = (
  person: Person,
  newTeam: Team,
  people: Person[],
  roles: Role[],
  teams: Team[],
  config: AppConfig
): TeamMoveImpact => {
  const originalTeamId = person.teamId;
  const originalTeam = teams.find(t => t.id === originalTeamId);

  if (!originalTeam) {
    throw new Error('Original team not found');
  }

  const originalTeamCost = calculateTeamCost(
    originalTeam,
    people,
    roles,
    config
  );
  const newTeamCost = calculateTeamCost(newTeam, people, roles, config);

  const personRole = roles.find(r => r.id === person.roleId);
  if (!personRole) {
    throw new Error('Person role not found');
  }
  const personCost = calculatePersonCost(
    person,
    personRole,
    config
  ).costPerYear;

  return {
    personName: person.name,
    originalTeamId,
    newTeamId: newTeam.id,
    impactOnOriginalTeam: -personCost,
    impactOnNewTeam: +personCost,
    newCostOfOriginalTeam: originalTeamCost - personCost,
    newCostOfNewTeam: newTeamCost + personCost,
  };
};

/**
 * Enhanced Financial Impact Analysis for Allocation Planning
 */

export interface TeamCostBreakdown {
  teamId: string;
  teamName: string;
  totalWeeklyCost: number;
  totalMonthlyCost: number;
  totalQuarterlyCost: number;
  memberCosts: {
    personId: string;
    personName: string;
    weeklyCost: number;
    monthlyCost: number;
    quarterlyCost: number;
  }[];
}

export interface AllocationCostImpact {
  allocationId: string;
  teamId: string;
  teamName: string;
  projectId?: string;
  projectName?: string;
  epicId?: string;
  epicName?: string;
  percentage: number;
  weeklyCost: number;
  monthlyCost: number;
  cycleCost: number;
  cycleLength: number; // in weeks
}

export interface QuarterlyFinancialSummary {
  quarterId: string;
  quarterName: string;
  totalBudget: number;
  allocatedCost: number;
  remainingBudget: number;
  utilizationPercentage: number;
  projectBreakdown: {
    projectId: string;
    projectName: string;
    totalCost: number;
    percentage: number;
  }[];
  teamBreakdown: {
    teamId: string;
    teamName: string;
    totalCost: number;
    percentage: number;
  }[];
}

export interface ProjectFinancialImpact {
  projectId: string;
  projectName: string;
  totalCost: number;
  quarterlyBreakdown: {
    quarterId: string;
    quarterName: string;
    cost: number;
    teamAllocations: {
      teamId: string;
      teamName: string;
      cost: number;
      percentage: number;
    }[];
  }[];
}

/**
 * Calculate the weekly cost for a person based on their role
 */
export const calculatePersonWeeklyCost = (
  person: Person,
  roles: Role[],
  config: AppConfig
): number => {
  const role = roles.find(r => r.id === person.roleId);
  if (!role) return 0;

  try {
    const personCost = calculatePersonCost(person, role, config);
    return personCost?.costPerWeek || 0;
  } catch (error) {
    console.warn('Error calculating person cost:', error);
    return 0;
  }
};

/**
 * Calculate team cost breakdown for financial analysis
 */
export const calculateTeamCostBreakdown = (
  team: Team,
  people: Person[],
  roles: Role[],
  config: AppConfig
): TeamCostBreakdown => {
  if (!team || !people || !roles || !config) {
    return {
      teamId: team?.id || '',
      teamName: team?.name || 'Unknown Team',
      totalWeeklyCost: 0,
      totalMonthlyCost: 0,
      totalQuarterlyCost: 0,
      memberCosts: [],
    };
  }

  const activeMembers = people.filter(p => p.teamId === team.id && p.isActive);

  const memberCosts = activeMembers.map(person => {
    let weeklyCost = calculatePersonWeeklyCost(person, roles, config);

    // If calculatePersonWeeklyCost returns 0, try to use fallback estimates
    if (weeklyCost <= 0) {
      const role = roles.find(r => r.id === person.roleId);
      if (role) {
        // Fallback: use role default rate or estimate based on typical salaries
        if (role.defaultRate && role.defaultRate > 0) {
          // If defaultRate is hourly, calculate weekly cost
          weeklyCost =
            role.defaultRate *
            (config.workingHoursPerDay || 8) *
            (config.workingDaysPerWeek || 5);
        } else if (role.defaultAnnualSalary && role.defaultAnnualSalary > 0) {
          // If defaultAnnualSalary is available, calculate weekly cost
          const workingWeeksPerYear =
            (config.workingDaysPerYear || 260) /
            (config.workingDaysPerWeek || 5);
          weeklyCost = role.defaultAnnualSalary / workingWeeksPerYear;
        } else {
          // Final fallback: estimate based on role type (very rough estimates for demo purposes)
          const roleBasedEstimates: Record<string, number> = {
            'Senior Engineer': 120000,
            Engineer: 90000,
            'Junior Engineer': 65000,
            'Principal Engineer': 150000,
            'Staff Engineer': 135000,
            'Product Manager': 110000,
            'Senior Product Manager': 130000,
            Designer: 85000,
            'Senior Designer': 105000,
            'QA Engineer': 75000,
            'DevOps Engineer': 100000,
            'Data Analyst': 80000,
            'Technical Lead': 140000,
          };

          const estimatedAnnual = roleBasedEstimates[role.name] || 80000; // Default to 80k
          const workingWeeksPerYear =
            (config.workingDaysPerYear || 260) /
            (config.workingDaysPerWeek || 5);
          weeklyCost = estimatedAnnual / workingWeeksPerYear;
        }
      }
    }

    const validWeeklyCost =
      isNaN(weeklyCost) || !isFinite(weeklyCost) ? 0 : weeklyCost;

    return {
      personId: person.id,
      personName: person.name,
      weeklyCost: validWeeklyCost,
      monthlyCost: validWeeklyCost * 4.33, // Average weeks per month
      quarterlyCost: validWeeklyCost * 13, // 13 weeks per quarter
    };
  });

  const totalWeeklyCost = memberCosts.reduce((sum, m) => sum + m.weeklyCost, 0);
  const validTotalWeeklyCost =
    isNaN(totalWeeklyCost) || !isFinite(totalWeeklyCost) ? 0 : totalWeeklyCost;

  return {
    teamId: team.id,
    teamName: team.name,
    totalWeeklyCost: validTotalWeeklyCost,
    totalMonthlyCost: validTotalWeeklyCost * 4.33,
    totalQuarterlyCost: validTotalWeeklyCost * 13,
    memberCosts,
  };
};

/**
 * Calculate cost impact of a specific allocation
 */
export const calculateAllocationCostImpact = (
  allocation: Allocation,
  team: Team,
  cycle: Cycle,
  teamCostBreakdown: TeamCostBreakdown,
  projects: Project[],
  epics: Epic[]
): AllocationCostImpact => {
  // Calculate cycle length in weeks
  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);
  const cycleLength = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  // Calculate costs based on allocation percentage
  const allocationFactor = allocation.percentage / 100;
  const weeklyCost = teamCostBreakdown.totalWeeklyCost * allocationFactor;
  const monthlyCost = teamCostBreakdown.totalMonthlyCost * allocationFactor;
  const cycleCost = weeklyCost * cycleLength;

  // Get project and epic names
  let projectName: string | undefined;
  let epicName: string | undefined;

  if (allocation.epicId) {
    const epic = epics.find(e => e.id === allocation.epicId);
    if (epic) {
      epicName = epic.name;
      const project = projects.find(p => p.id === epic.projectId);
      projectName = project?.name;
    }
  }

  return {
    allocationId: allocation.id,
    teamId: team.id,
    teamName: team.name,
    projectId: allocation.epicId
      ? epics.find(e => e.id === allocation.epicId)?.projectId
      : undefined,
    projectName,
    epicId: allocation.epicId,
    epicName,
    percentage: allocation.percentage,
    weeklyCost,
    monthlyCost,
    cycleCost,
    cycleLength,
  };
};

/**
 * Calculate quarterly financial summary
 */
export const calculateQuarterlyFinancialSummary = (
  quarter: Cycle,
  allocations: Allocation[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  projects: Project[],
  epics: Epic[],
  config: AppConfig,
  quarterlyBudget: number = 0
): QuarterlyFinancialSummary => {
  const quarterAllocations = allocations.filter(a => a.cycleId === quarter.id);

  // Calculate team cost breakdowns
  const teamCostBreakdowns = teams.map(team =>
    calculateTeamCostBreakdown(team, people, roles, config)
  );

  // Calculate allocation costs
  const allocationCosts = quarterAllocations
    .map(allocation => {
      const team = teams.find(t => t.id === allocation.teamId);
      const teamCostBreakdown = teamCostBreakdowns.find(
        tcb => tcb.teamId === allocation.teamId
      );

      if (!team || !teamCostBreakdown) {
        return null;
      }

      return calculateAllocationCostImpact(
        allocation,
        team,
        quarter,
        teamCostBreakdown,
        projects,
        epics
      );
    })
    .filter((cost): cost is AllocationCostImpact => cost !== null);

  const totalAllocatedCost = allocationCosts.reduce(
    (sum, cost) => sum + cost.cycleCost,
    0
  );

  // Group by projects
  const projectCostMap = new Map<string, { name: string; cost: number }>();
  allocationCosts.forEach(cost => {
    if (cost.projectId && cost.projectName) {
      const existing = projectCostMap.get(cost.projectId);
      projectCostMap.set(cost.projectId, {
        name: cost.projectName,
        cost: (existing?.cost || 0) + cost.cycleCost,
      });
    }
  });

  // Group by teams
  const teamCostMap = new Map<string, { name: string; cost: number }>();
  allocationCosts.forEach(cost => {
    const existing = teamCostMap.get(cost.teamId);
    teamCostMap.set(cost.teamId, {
      name: cost.teamName,
      cost: (existing?.cost || 0) + cost.cycleCost,
    });
  });

  const projectBreakdown = Array.from(projectCostMap.entries()).map(
    ([projectId, data]) => ({
      projectId,
      projectName: data.name,
      totalCost: data.cost,
      percentage:
        totalAllocatedCost > 0 ? (data.cost / totalAllocatedCost) * 100 : 0,
    })
  );

  const teamBreakdown = Array.from(teamCostMap.entries()).map(
    ([teamId, data]) => ({
      teamId,
      teamName: data.name,
      totalCost: data.cost,
      percentage:
        totalAllocatedCost > 0 ? (data.cost / totalAllocatedCost) * 100 : 0,
    })
  );

  return {
    quarterId: quarter.id,
    quarterName: quarter.name,
    totalBudget: quarterlyBudget,
    allocatedCost: totalAllocatedCost,
    remainingBudget: quarterlyBudget - totalAllocatedCost,
    utilizationPercentage:
      quarterlyBudget > 0 ? (totalAllocatedCost / quarterlyBudget) * 100 : 0,
    projectBreakdown,
    teamBreakdown,
  };
};

/**
 * Calculate project financial impact across quarters
 */
export const calculateProjectFinancialImpact = (
  project: Project,
  allocations: Allocation[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  cycles: Cycle[],
  epics: Epic[],
  config: AppConfig
): ProjectFinancialImpact => {
  const projectEpics = epics.filter(e => e.projectId === project.id);
  const projectEpicIds = projectEpics.map(e => e.id);

  // Get all allocations for this project's epics
  const projectAllocations = allocations.filter(
    a => a.epicId && projectEpicIds.includes(a.epicId)
  );

  // Calculate team cost breakdowns
  const teamCostBreakdowns = teams.map(team =>
    calculateTeamCostBreakdown(team, people, roles, config)
  );

  // Group by quarters
  const quarterlyBreakdown = cycles.map(cycle => {
    const cycleAllocations = projectAllocations.filter(
      a => a.cycleId === cycle.id
    );

    const teamAllocations = cycleAllocations
      .map(allocation => {
        const team = teams.find(t => t.id === allocation.teamId);
        const teamCostBreakdown = teamCostBreakdowns.find(
          tcb => tcb.teamId === allocation.teamId
        );

        if (!team || !teamCostBreakdown) {
          return null;
        }

        const costImpact = calculateAllocationCostImpact(
          allocation,
          team,
          cycle,
          teamCostBreakdown,
          [project],
          projectEpics
        );

        return {
          teamId: team.id,
          teamName: team.name,
          cost: costImpact.cycleCost,
          percentage: allocation.percentage,
        };
      })
      .filter((ta): ta is NonNullable<typeof ta> => ta !== null);

    const totalCycleCost = teamAllocations.reduce(
      (sum, ta) => sum + ta.cost,
      0
    );

    return {
      quarterId: cycle.id,
      quarterName: cycle.name,
      cost: totalCycleCost,
      teamAllocations,
    };
  });

  const totalProjectCost = quarterlyBreakdown.reduce(
    (sum, qb) => sum + qb.cost,
    0
  );

  return {
    projectId: project.id,
    projectName: project.name,
    totalCost: totalProjectCost,
    quarterlyBreakdown,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (
  amount: number,
  currencySymbol: string = '$'
): string => {
  // Handle invalid amounts
  if (
    !isFinite(amount) ||
    isNaN(amount) ||
    amount === null ||
    amount === undefined
  ) {
    return `${currencySymbol}0`;
  }

  return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Calculate budget utilization percentage
 */
export const calculateBudgetUtilization = (
  allocatedCost: number,
  totalBudget: number
): number => {
  if (totalBudget === 0) return 0;
  return Math.round((allocatedCost / totalBudget) * 100);
};

/**
 * Get budget status based on utilization
 */
export const getBudgetStatus = (
  utilizationPercentage: number
): 'under' | 'optimal' | 'over' => {
  if (utilizationPercentage < 80) return 'under';
  if (utilizationPercentage <= 100) return 'optimal';
  return 'over';
};
