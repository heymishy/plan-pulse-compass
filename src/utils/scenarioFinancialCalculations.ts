/**
 * Scenario Financial Calculations Engine
 * Calculates team costs, burn rates, and budget analysis for scenarios
 */

import type {
  Team,
  Person,
  Project,
  Allocation,
  Role,
  TeamMember,
} from '@/types';
import type {
  TeamCostCalculation,
  ProjectBurnAnalysis,
  ScenarioFinancialComparison,
  TeamCostBreakdown,
  RoleCostConfig,
  TeamCostConfig,
  EnhancedScenarioData,
  ScenarioPerformanceConfig,
} from '@/types/scenarioFinancialTypes';
import { FINANCIAL_CONSTANTS } from '@/types/scenarioFinancialTypes';

/**
 * Default role cost configuration
 * These are average estimates that can be customized per organization
 */
export const DEFAULT_ROLE_COSTS: RoleCostConfig[] = [
  {
    roleId: 'senior-engineer',
    roleName: 'Senior Engineer',
    averageSalary: 120000,
    overheadMultiplier: 1.4,
    projectManagementRate: 0.1,
    licensingCostPerPerson: 5000,
  },
  {
    roleId: 'mid-engineer',
    roleName: 'Mid-Level Engineer',
    averageSalary: 90000,
    overheadMultiplier: 1.4,
    projectManagementRate: 0.1,
    licensingCostPerPerson: 4000,
  },
  {
    roleId: 'junior-engineer',
    roleName: 'Junior Engineer',
    averageSalary: 65000,
    overheadMultiplier: 1.4,
    projectManagementRate: 0.05,
    licensingCostPerPerson: 3000,
  },
  {
    roleId: 'tech-lead',
    roleName: 'Technical Lead',
    averageSalary: 140000,
    overheadMultiplier: 1.45,
    projectManagementRate: 0.2,
    licensingCostPerPerson: 6000,
  },
  {
    roleId: 'architect',
    roleName: 'Solutions Architect',
    averageSalary: 150000,
    overheadMultiplier: 1.45,
    projectManagementRate: 0.15,
    licensingCostPerPerson: 7000,
  },
  {
    roleId: 'product-manager',
    roleName: 'Product Manager',
    averageSalary: 110000,
    overheadMultiplier: 1.35,
    projectManagementRate: 0.3,
    licensingCostPerPerson: 4500,
  },
  {
    roleId: 'designer',
    roleName: 'UX/UI Designer',
    averageSalary: 85000,
    overheadMultiplier: 1.35,
    projectManagementRate: 0.1,
    licensingCostPerPerson: 8000,
  },
  {
    roleId: 'qa-engineer',
    roleName: 'QA Engineer',
    averageSalary: 75000,
    overheadMultiplier: 1.4,
    projectManagementRate: 0.1,
    licensingCostPerPerson: 3500,
  },
  {
    roleId: 'devops-engineer',
    roleName: 'DevOps Engineer',
    averageSalary: 115000,
    overheadMultiplier: 1.4,
    projectManagementRate: 0.1,
    licensingCostPerPerson: 6500,
  },
  {
    roleId: 'scrum-master',
    roleName: 'Scrum Master',
    averageSalary: 95000,
    overheadMultiplier: 1.35,
    projectManagementRate: 0.5,
    licensingCostPerPerson: 2000,
  },
];

/**
 * Calculate team costs including all overhead and additional costs
 */
export function calculateTeamCosts(
  teams: Team[],
  people: Person[],
  teamMembers: TeamMember[],
  roles: Role[],
  roleCostConfig: RoleCostConfig[] = DEFAULT_ROLE_COSTS,
  teamCostConfig: TeamCostConfig[] = []
): TeamCostCalculation[] {
  return teams.map(team => {
    const teamConfig = teamCostConfig.find(tc => tc.teamId === team.id);
    const teamPeople = getTeamPeople(team.id, people, teamMembers);

    let totalBaseSalaries = 0;
    let totalOverhead = 0;
    let totalProjectManagement = 0;
    let totalLicensing = 0;
    let totalOther = 0;

    teamPeople.forEach(person => {
      const roleConfig =
        roleCostConfig.find(rc => rc.roleId === person.roleId) ||
        getDefaultRoleConfig(person.roleId, roles);

      const baseSalary = roleConfig.averageSalary;
      const overheadMultiplier =
        teamConfig?.customOverheadMultiplier || roleConfig.overheadMultiplier;

      totalBaseSalaries += baseSalary;
      totalOverhead += baseSalary * (overheadMultiplier - 1);
      totalProjectManagement += baseSalary * roleConfig.projectManagementRate;
      totalLicensing += roleConfig.licensingCostPerPerson;
    });

    // Add team-specific additional costs
    if (teamConfig?.additionalCosts) {
      totalOther += teamConfig.additionalCosts.equipment || 0;
      totalOther += teamConfig.additionalCosts.training || 0;
      totalOther += teamConfig.additionalCosts.other || 0;
    }

    const totalCost =
      totalBaseSalaries +
      totalOverhead +
      totalProjectManagement +
      totalLicensing +
      totalOther;
    const headcount = teamPeople.length;

    // Calculate rates
    const costPerHour =
      totalCost / (FINANCIAL_CONSTANTS.WORKING_HOURS_PER_WEEK * 52); // Annual hours
    const costPerIteration =
      (totalCost / 52) * FINANCIAL_CONSTANTS.WEEKS_PER_ITERATION;
    const costPerQuarter =
      (totalCost / 52) * FINANCIAL_CONSTANTS.WEEKS_PER_QUARTER;
    const averageRoleRate = headcount > 0 ? totalBaseSalaries / headcount : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      totalCost,
      costBreakdown: {
        baseSalaries: totalBaseSalaries,
        overhead: totalOverhead,
        projectManagement: totalProjectManagement,
        licensing: totalLicensing,
        other: totalOther,
      },
      costPerHour,
      costPerIteration,
      costPerQuarter,
      headcount,
      averageRoleRate,
    };
  });
}

/**
 * Calculate project burn analysis including team allocations and budget utilization
 */
export function calculateProjectBurnAnalysis(
  projects: Project[],
  allocations: Allocation[],
  teamCosts: TeamCostCalculation[],
  financialYear?: string,
  quarter?: string,
  epics?: any[]
): ProjectBurnAnalysis[] {
  // Critical validation: Detect missing allocation data
  if (!allocations || allocations.length === 0) {
    console.error(
      '[ProjectBurnAnalysis] CRITICAL: No allocations provided - all project burn rates will be $0'
    );
    console.error(
      'This indicates allocation data is missing from scenario context'
    );
    console.error(
      'Expected: scenario.allocations should contain team-project allocation data'
    );
    console.error('Actual: allocations array is empty or undefined');
    console.error(
      'Impact: All project burn rates will show $0 despite teams having costs'
    );
  }

  return projects.map(project => {
    // Filter allocations for this project - include both direct project allocations and epic allocations
    const directProjectAllocations = allocations.filter(
      a => a.projectId === project.id
    );

    // Find epics belonging to this project and get their allocations
    let epicAllocations: Allocation[] = [];
    if (epics && epics.length > 0) {
      const projectEpicIds = epics
        .filter((e: any) => e.projectId === project.id)
        .map((e: any) => e.id);
      epicAllocations = allocations.filter(
        a => a.epicId && projectEpicIds.includes(a.epicId)
      );
    }

    // Combine all allocations for this project
    const projectAllocations = [
      ...directProjectAllocations,
      ...epicAllocations,
    ];

    // Calculate allocated team costs
    let allocatedTeamCosts = 0;
    const teamAllocationDetails = teamCosts
      .map(teamCost => {
        const teamAllocations = projectAllocations.filter(
          a => a.teamId === teamCost.teamId
        );
        const rawAllocationPercentage = teamAllocations.reduce(
          (sum, a) => sum + (a.percentage || 0),
          0
        );

        // Cap allocation percentage at 100% to prevent over-allocation issues
        // This handles cases where there might be duplicate or overlapping allocations
        const totalAllocationPercentage = Math.min(
          rawAllocationPercentage,
          100
        );

        const allocatedCost =
          (teamCost.costPerQuarter * totalAllocationPercentage) / 100;
        const burnRate =
          (teamCost.costPerIteration * totalAllocationPercentage) / 100;
        allocatedTeamCosts += allocatedCost;

        return {
          teamId: teamCost.teamId,
          teamName: teamCost.teamName,
          allocatedPercentage: totalAllocationPercentage,
          allocatedCost,
          burnRate,
        };
      })
      .filter(ta => ta.allocatedPercentage > 0);

    // Calculate burn rates
    const burnRatePerIteration = teamAllocationDetails.reduce(
      (sum, ta) => sum + ta.burnRate,
      0
    );
    const burnRatePerQuarter = allocatedTeamCosts;
    const projectedBurnRate =
      burnRatePerIteration *
      (FINANCIAL_CONSTANTS.WEEKS_PER_QUARTER /
        FINANCIAL_CONSTANTS.WEEKS_PER_ITERATION);

    // Calculate budget utilization
    const totalBudget = project.budget || 0;
    const budgetUtilizationPercentage =
      totalBudget > 0 ? (allocatedTeamCosts / totalBudget) * 100 : 0;
    const remainingBudget = totalBudget - allocatedTeamCosts;
    const isOverBudget = allocatedTeamCosts > totalBudget;
    const budgetVariance = allocatedTeamCosts - totalBudget;

    return {
      projectId: project.id,
      projectName: project.name,
      financialYear: financialYear || 'Current',
      quarter: quarter || 'Current',
      totalBudget,
      allocatedTeamCosts,
      burnRate: {
        perIteration: burnRatePerIteration,
        perQuarter: burnRatePerQuarter,
        projected: projectedBurnRate,
      },
      budgetUtilization: {
        percentage: budgetUtilizationPercentage,
        remaining: remainingBudget,
        overBudget: isOverBudget,
        variance: budgetVariance,
      },
      teamAllocations: teamAllocationDetails,
    };
  });
}

/**
 * Compare financial impacts between scenario and live data
 */
export function compareScenarioFinancials(
  scenarioData: EnhancedScenarioData,
  liveData: EnhancedScenarioData,
  scenarioId: string
): ScenarioFinancialComparison {
  const scenarioTeamCosts = scenarioData.financialAnalysis?.teamCosts || [];
  const liveTeamCosts = liveData.financialAnalysis?.teamCosts || [];
  const scenarioProjectBurn =
    scenarioData.financialAnalysis?.projectBurnAnalysis || [];
  const liveProjectBurn = liveData.financialAnalysis?.projectBurnAnalysis || [];

  // Calculate team cost changes - include teams from both live and scenario data
  const allTeamIds = new Set([
    ...liveTeamCosts.map(tc => tc.teamId),
    ...scenarioTeamCosts.map(tc => tc.teamId),
  ]);

  const teamCostChanges = Array.from(allTeamIds)
    .map(teamId => {
      const liveTeam = liveTeamCosts.find(lt => lt.teamId === teamId);
      const scenarioTeam = scenarioTeamCosts.find(st => st.teamId === teamId);

      const liveCost = liveTeam?.totalCost || 0;
      const scenarioCost = scenarioTeam?.totalCost || 0;
      const difference = scenarioCost - liveCost;
      const percentageChange = liveCost > 0 ? (difference / liveCost) * 100 : 0;

      return {
        teamId,
        teamName:
          scenarioTeam?.teamName || liveTeam?.teamName || 'Unknown Team',
        liveCost,
        scenarioCost,
        difference,
        percentageChange,
      };
    })
    .filter(change => change.liveCost > 0 || change.scenarioCost > 0); // Only include teams with costs

  // Calculate project burn changes - include projects from both live and scenario data
  const allProjectIds = new Set([
    ...liveProjectBurn.map(pb => pb.projectId),
    ...scenarioProjectBurn.map(pb => pb.projectId),
  ]);

  const projectBurnChanges = Array.from(allProjectIds).map(projectId => {
    const liveProject = liveProjectBurn.find(lp => lp.projectId === projectId);
    const scenarioProject = scenarioProjectBurn.find(
      sp => sp.projectId === projectId
    );

    const liveBurnRate = liveProject?.burnRate.perQuarter || 0;
    const scenarioBurnRate = scenarioProject?.burnRate.perQuarter || 0;

    const budgetImpact =
      (scenarioProject?.budgetUtilization.variance || 0) -
      (liveProject?.budgetUtilization.variance || 0);
    const quarterlyVariance = scenarioBurnRate - liveBurnRate;

    return {
      projectId,
      projectName:
        scenarioProject?.projectName ||
        liveProject?.projectName ||
        'Unknown Project',
      liveBurnRate,
      scenarioBurnRate,
      budgetImpact,
      quarterlyVariance,
    };
  }); // Show all projects for debugging - remove filter temporarily

  // Calculate quarterly analysis
  const quarterlyAnalysis = generateQuarterlyAnalysis(scenarioData, liveData);

  // Generate detailed breakdown for teams with changes
  const detailedBreakdown: TeamCostBreakdown[] = teamCostChanges
    .filter(change => change.difference !== 0)
    .map(change => {
      const liveTeam = liveTeamCosts.find(tc => tc.teamId === change.teamId);
      const scenarioTeam = scenarioTeamCosts.find(
        tc => tc.teamId === change.teamId
      );

      const liveHeadcount = liveTeam?.headcount || 0;
      const scenarioHeadcount = scenarioTeam?.headcount || 0;
      const headcountChange = scenarioHeadcount - liveHeadcount;

      const liveCostPerPerson =
        liveHeadcount > 0 ? liveTeam.totalCost / liveHeadcount : 0;
      const scenarioCostPerPerson =
        scenarioHeadcount > 0 ? scenarioTeam.totalCost / scenarioHeadcount : 0;

      // Calculate breakdown differences
      const liveBreakdown = liveTeam?.costBreakdown || {
        baseSalaries: 0,
        overhead: 0,
        projectManagement: 0,
        licensing: 0,
        other: 0,
      };
      const scenarioBreakdown = scenarioTeam?.costBreakdown || {
        baseSalaries: 0,
        overhead: 0,
        projectManagement: 0,
        licensing: 0,
        other: 0,
      };

      return {
        teamId: change.teamId,
        teamName: change.teamName,
        liveHeadcount,
        scenarioHeadcount,
        headcountChange,
        liveCostPerPerson,
        scenarioCostPerPerson,
        costBreakdown: {
          baseSalariesDiff:
            scenarioBreakdown.baseSalaries - liveBreakdown.baseSalaries,
          overheadDiff: scenarioBreakdown.overhead - liveBreakdown.overhead,
          projectManagementDiff:
            scenarioBreakdown.projectManagement -
            liveBreakdown.projectManagement,
          licensingDiff: scenarioBreakdown.licensing - liveBreakdown.licensing,
          otherDiff: scenarioBreakdown.other - liveBreakdown.other,
        },
        annualImpact: change.difference,
        quarterlyImpact: change.difference / 4,
      };
    });

  // Calculate summary totals
  const totalCostDifference = teamCostChanges.reduce(
    (sum, tc) => sum + tc.difference,
    0
  );
  const totalBudgetVariance = projectBurnChanges.reduce(
    (sum, pb) => sum + pb.budgetImpact,
    0
  );

  const result = {
    scenarioId,
    comparedAt: new Date().toISOString(),
    summary: {
      totalCostDifference,
      totalBudgetVariance,
      teamCostChanges: teamCostChanges.length,
      projectBudgetChanges: projectBurnChanges.length,
    },
    teamCostChanges,
    projectBurnChanges,
    quarterlyAnalysis,
    detailedBreakdown,
  };

  return result;
}

/**
 * Generate quarterly financial analysis
 */
function generateQuarterlyAnalysis(
  scenarioData: EnhancedScenarioData,
  liveData: EnhancedScenarioData
) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentYear = new Date().getFullYear().toString();

  return quarters.map(quarter => {
    const scenarioQuarterlyTotals =
      scenarioData.financialAnalysis?.quarterlyTotals?.find(
        qt => qt.quarter === quarter && qt.financialYear === currentYear
      );
    const liveQuarterlyTotals =
      liveData.financialAnalysis?.quarterlyTotals?.find(
        qt => qt.quarter === quarter && qt.financialYear === currentYear
      );

    const liveTotalCost = liveQuarterlyTotals?.totalTeamCosts || 0;
    const scenarioTotalCost = scenarioQuarterlyTotals?.totalTeamCosts || 0;
    const variance = scenarioTotalCost - liveTotalCost;

    // Find affected projects (projects with different burn rates)
    const affectedProjects = scenarioData.projects
      .filter(project => {
        const scenarioProject =
          scenarioData.financialAnalysis?.projectBurnAnalysis?.find(
            pb => pb.projectId === project.id && pb.quarter === quarter
          );
        const liveProject =
          liveData.financialAnalysis?.projectBurnAnalysis?.find(
            pb => pb.projectId === project.id && pb.quarter === quarter
          );

        return (
          (scenarioProject?.burnRate.perQuarter || 0) !==
          (liveProject?.burnRate.perQuarter || 0)
        );
      })
      .map(p => p.id);

    return {
      quarter,
      financialYear: currentYear,
      liveTotalCost,
      scenarioTotalCost,
      variance,
      affectedProjects,
    };
  });
}

/**
 * Helper function to get team members for a specific team
 * Uses the people array directly with teamId, which is consistent with scenario modifications
 */
function getTeamPeople(
  teamId: string,
  people: Person[],
  teamMembers: TeamMember[]
): Person[] {
  // Use the people array directly for team membership, as this is how scenario modifications work
  // This ensures that when people are added to teams in scenarios (by updating person.teamId),
  // the financial calculations properly reflect the team size changes
  return people.filter(person => person.teamId === teamId && person.isActive);
}

/**
 * Get default role configuration for roles not in the config
 */
function getDefaultRoleConfig(roleId: string, roles: Role[]): RoleCostConfig {
  const role = roles.find(r => r.id === roleId);

  return {
    roleId,
    roleName: role?.name || 'Unknown Role',
    averageSalary: 80000, // Default average
    overheadMultiplier: FINANCIAL_CONSTANTS.DEFAULT_OVERHEAD_MULTIPLIER,
    projectManagementRate: FINANCIAL_CONSTANTS.DEFAULT_PROJECT_MANAGEMENT_RATE,
    licensingCostPerPerson: 4000, // Default licensing cost
  };
}

/**
 * Performance-optimized batch calculation for large datasets
 */
export async function calculateFinancialsInBatches(
  data: EnhancedScenarioData,
  performanceConfig: ScenarioPerformanceConfig,
  roleCostConfig?: RoleCostConfig[],
  teamCostConfig?: TeamCostConfig[]
): Promise<EnhancedScenarioData['financialAnalysis']> {
  const { chunkSize, maxConcurrentCalculations } = performanceConfig;

  // Process teams in chunks
  const teamChunks = chunkArray(data.teams, chunkSize);
  const teamCostPromises = teamChunks.map(async (chunk, index) => {
    // Add delay to prevent blocking UI
    if (index > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return calculateTeamCosts(
      chunk,
      data.people,
      data.teamMembers,
      data.roles,
      roleCostConfig,
      teamCostConfig
    );
  });

  // Execute team cost calculations with concurrency limit
  const teamCostResults = await executeInBatches(
    teamCostPromises,
    maxConcurrentCalculations
  );
  const teamCosts = teamCostResults.flat();

  // Process projects in chunks
  const projectChunks = chunkArray(data.projects, chunkSize);
  const projectBurnPromises = projectChunks.map(async (chunk, index) => {
    if (index > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return calculateProjectBurnAnalysis(
      chunk,
      data.allocations,
      teamCosts,
      undefined,
      undefined,
      data.epics
    );
  });

  const projectBurnResults = await executeInBatches(
    projectBurnPromises,
    maxConcurrentCalculations
  );
  const projectBurnAnalysis = projectBurnResults.flat();

  return {
    teamCosts,
    projectBurnAnalysis,
    quarterlyTotals: generateQuarterlyTotals(teamCosts, projectBurnAnalysis),
    roleCostConfig: roleCostConfig || DEFAULT_ROLE_COSTS,
    teamCostConfig: teamCostConfig || [],
  };
}

/**
 * Utility function to chunk arrays for batch processing
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Execute promises in batches to control concurrency
 */
async function executeInBatches<T>(
  promises: Promise<T>[],
  maxConcurrent: number
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += maxConcurrent) {
    const batch = promises.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate quarterly totals from team costs and project burn analysis
 * Note: Currently returns the same values for all quarters since we don't have
 * quarter-specific team costs or project budgets in the current data model.
 * This is by design - team costs are annual figures divided by quarters.
 */
function generateQuarterlyTotals(
  teamCosts: TeamCostCalculation[],
  projectBurnAnalysis: ProjectBurnAnalysis[]
) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentYear = new Date().getFullYear().toString();

  // Calculate total quarterly costs and budgets
  const totalTeamCosts = teamCosts.reduce(
    (sum, tc) => sum + tc.costPerQuarter,
    0
  );
  const totalProjectBudgets = projectBurnAnalysis.reduce(
    (sum, pb) => sum + pb.totalBudget,
    0
  );
  const utilization =
    totalProjectBudgets > 0 ? (totalTeamCosts / totalProjectBudgets) * 100 : 0;

  return quarters.map(quarter => {
    return {
      quarter,
      financialYear: currentYear,
      totalTeamCosts, // Same for all quarters - annual cost divided by 4
      totalProjectBudgets, // Same for all quarters - total annual budget
      utilization, // Same for all quarters based on current data model
    };
  });
}
