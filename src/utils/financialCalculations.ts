import {
  Person,
  Role,
  Allocation,
  Epic,
  Project,
  Cycle,
  Team,
  AppConfig,
  RoleType,
} from '@/types';
import { calculatePersonCostWithRoleType } from './roleTypeUtils';

const WORKING_DAYS_PER_MONTH = 22; // Default working days per month

// Default config for when config is not available
export const getDefaultConfig = (): AppConfig => ({
  workingHoursPerDay: 8,
  workingDaysPerWeek: 5,
  workingDaysPerYear: 260,
  workingDaysPerMonth: 22,
  currencySymbol: '$',
  financialYear: { id: 'default', name: 'Default', startDate: '', endDate: '' },
  iterationLength: 'fortnightly',
  quarters: [],
});

export interface PersonCostCalculation {
  personId: string;
  costPerHour: number;
  costPerDay: number;
  costPerWeek: number;
  costPerMonth: number;
  costPerYear: number;
  rateSource: 'personal' | 'role-default' | 'legacy-fallback';
  effectiveRate: number;
  rateType: 'hourly' | 'daily' | 'annual';
}

export const calculatePersonCost = (
  person: Person,
  role: Role,
  config: AppConfig,
  roleType?: RoleType
): PersonCostCalculation => {
  const safeConfig = config || getDefaultConfig();

  // Use new role type calculation if available
  const roleTypeCalc = calculatePersonCostWithRoleType(
    person,
    role,
    roleType,
    safeConfig
  );

  return {
    personId: person.id,
    costPerHour: roleTypeCalc.costPerHour,
    costPerDay: roleTypeCalc.costPerHour * safeConfig.workingHoursPerDay,
    costPerWeek:
      roleTypeCalc.costPerHour *
      safeConfig.workingHoursPerDay *
      safeConfig.workingDaysPerWeek,
    costPerMonth:
      roleTypeCalc.costPerHour *
      safeConfig.workingHoursPerDay *
      safeConfig.workingDaysPerMonth,
    costPerYear:
      roleTypeCalc.costPerHour *
      safeConfig.workingHoursPerDay *
      safeConfig.workingDaysPerYear,
    rateSource:
      roleTypeCalc.rateSource === 'role-type'
        ? 'role-default'
        : roleTypeCalc.rateSource, // Map role-type to role-default for backward compatibility
    effectiveRate: roleTypeCalc.effectiveRate,
    rateType: roleTypeCalc.rateType,
  };
};

export const calculateTeamWeeklyCost = (
  teamMembers: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  let weeklyCost = 0;
  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    if (role) {
      const personCost = calculatePersonCost(person, role, config);
      weeklyCost += personCost.costPerWeek;
    }
  });
  return weeklyCost;
};

export const calculateTeamMonthlyCost = (
  teamMembers: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  let monthlyCost = 0;
  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    if (role) {
      const personCost = calculatePersonCost(person, role, config);
      monthlyCost += personCost.costPerMonth;
    }
  });
  return monthlyCost;
};

export const calculateTeamQuarterlyCost = (
  teamMembers: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  return calculateTeamMonthlyCost(teamMembers, roles, config) * 3;
};

export const calculateTeamAnnualCost = (
  teamMembers: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  let annualCost = 0;
  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    if (role) {
      const personCost = calculatePersonCost(person, role, config);
      annualCost += personCost.costPerYear;
    }
  });
  return annualCost;
};

export const calculateAllocationCost = (
  allocation: Allocation,
  cycle: Cycle,
  teamMembers: Person[],
  roles: Role[],
  config: AppConfig
): number => {
  const cycleDurationInDays = Math.ceil(
    (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let totalCost = 0;

  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    if (!role) return;

    const personCost = calculatePersonCost(person, role, config);
    const allocationCost =
      personCost.costPerDay *
      cycleDurationInDays *
      (allocation.percentage / 100);
    totalCost += allocationCost;
  });

  return totalCost;
};

export const calculateProjectCost = (
  project: Project,
  epics: Epic[],
  allocations: Allocation[],
  cycles: Cycle[],
  people: Person[],
  roles: Role[],
  teams: Team[],
  config: AppConfig
): {
  totalCost: number;
  breakdown: Array<{
    personId: string;
    personName: string;
    totalCost: number;
    allocations: Array<{
      allocationId: string;
      cycleName: string;
      percentage: number;
      cost: number;
    }>;
    rateSource: string;
    effectiveRate: number;
    rateType: string;
  }>;
  teamBreakdown: Array<{ teamName: string; totalCost: number }>;
  monthlyBurnRate: number;
  totalDurationInDays: number;
} => {
  // Validate inputs to prevent NaN errors
  if (!project || !config) {
    return {
      totalCost: 0,
      breakdown: [],
      teamBreakdown: [],
      monthlyBurnRate: 0,
      totalDurationInDays: 0,
    };
  }

  const safeConfig = config || getDefaultConfig();
  const projectEpics = epics.filter(epic => epic.projectId === project.id);
  const projectAllocations = allocations.filter(
    allocation =>
      allocation.epicId &&
      projectEpics.some(epic => epic.id === allocation.epicId)
  );

  let totalCost = 0;
  const breakdown: Array<{
    personId: string;
    personName: string;
    totalCost: number;
    allocations: Array<{
      allocationId: string;
      cycleName: string;
      percentage: number;
      cost: number;
    }>;
    rateSource: string;
    effectiveRate: number;
    rateType: string;
  }> = [];
  const teamBreakdown: {
    [teamId: string]: { teamName: string; totalCost: number };
  } = {};

  let minStartDate: Date | null = null;
  let maxEndDate: Date | null = null;

  projectAllocations.forEach(allocation => {
    const cycle = cycles.find(c => c.id === allocation.cycleId);
    if (!cycle) return;

    const cycleStartDate = new Date(cycle.startDate);
    const cycleEndDate = new Date(cycle.endDate);
    if (!minStartDate || cycleStartDate < minStartDate)
      minStartDate = cycleStartDate;
    if (!maxEndDate || cycleEndDate > maxEndDate) maxEndDate = cycleEndDate;

    const teamMembers = people.filter(
      person => person.teamId === allocation.teamId && person.isActive
    );

    teamMembers.forEach(person => {
      const role = roles.find(r => r.id === person.roleId);
      if (!role) return;

      const personCost = calculatePersonCost(person, role, config);
      const cycleDurationInDays = Math.ceil(
        (new Date(cycle.endDate).getTime() -
          new Date(cycle.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const allocationCost =
        personCost.costPerDay *
        cycleDurationInDays *
        (allocation.percentage / 100);

      // Validate the calculated cost to prevent NaN
      const validAllocationCost =
        isNaN(allocationCost) || !isFinite(allocationCost) ? 0 : allocationCost;
      totalCost += validAllocationCost;

      // Find existing breakdown entry or create new one
      let breakdownEntry = breakdown.find(b => b.personId === person.id);
      if (!breakdownEntry) {
        breakdownEntry = {
          personId: person.id,
          personName: person.name,
          totalCost: 0,
          allocations: [],
          rateSource: personCost.rateSource,
          effectiveRate: personCost.effectiveRate,
          rateType: personCost.rateType,
        };
        breakdown.push(breakdownEntry);
      }

      breakdownEntry.totalCost += validAllocationCost;
      breakdownEntry.allocations.push({
        allocationId: allocation.id,
        cycleName: cycle.name,
        percentage: allocation.percentage,
        cost: validAllocationCost,
      });

      // Update team breakdown
      const team = teams.find(t => t.id === allocation.teamId);
      if (team) {
        if (!teamBreakdown[team.id]) {
          teamBreakdown[team.id] = { teamName: team.name, totalCost: 0 };
        }
        teamBreakdown[team.id].totalCost += validAllocationCost;
      }
    });
  });

  const totalDurationInDays =
    minStartDate && maxEndDate
      ? Math.ceil(
          (maxEndDate.getTime() - minStartDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const monthlyBurnRate =
    totalDurationInDays > 0
      ? (totalCost / totalDurationInDays) * WORKING_DAYS_PER_MONTH
      : 0;

  // Validate all return values to prevent NaN
  const validTotalCost =
    isNaN(totalCost) || !isFinite(totalCost) ? 0 : totalCost;
  const validMonthlyBurnRate =
    isNaN(monthlyBurnRate) || !isFinite(monthlyBurnRate) ? 0 : monthlyBurnRate;
  const validTotalDurationInDays =
    isNaN(totalDurationInDays) || !isFinite(totalDurationInDays)
      ? 0
      : totalDurationInDays;

  return {
    totalCost: validTotalCost,
    breakdown,
    teamBreakdown: Object.values(teamBreakdown).sort(
      (a, b) => (b.totalCost || 0) - (a.totalCost || 0)
    ),
    monthlyBurnRate: validMonthlyBurnRate,
    totalDurationInDays: validTotalDurationInDays,
  };
};

export const calculateProjectCostForYear = (
  project: Project,
  epics: Epic[],
  allocations: Allocation[],
  cycles: Cycle[],
  people: Person[],
  roles: Role[],
  teams: Team[],
  config: AppConfig
): {
  totalAnnualCost: number;
  quarterlyCosts: { [quarterName: string]: number };
} => {
  const { quarters } = config;
  const quarterlyCosts: { [quarterName: string]: number } = {};
  let totalAnnualCost = 0;

  const projectEpics = epics.filter(e => e.projectId === project.id);
  const projectEpicIds = new Set(projectEpics.map(e => e.id));

  quarters.forEach(quarter => {
    let quarterCost = 0;
    const iterationsInQuarter = cycles.filter(
      c => c.type === 'iteration' && c.parentCycleId === quarter.id
    );

    const projectAllocationsForQuarter = allocations.filter(
      a => a.cycleId === quarter.id && a.epicId && projectEpicIds.has(a.epicId)
    );

    projectAllocationsForQuarter.forEach(alloc => {
      // Find the corresponding iteration cycle to get its duration
      const getIterationNumberFromName = (cycleName: string) => {
        if (typeof cycleName !== 'string') {
          return null;
        }
        const match = cycleName.match(/\d+$/);
        return match ? parseInt(match[0], 10) : null;
      };

      const iterationCycle = iterationsInQuarter.find(
        iter => getIterationNumberFromName(iter.name) === alloc.iterationNumber
      );

      if (iterationCycle) {
        const teamMembers = people.filter(
          p => p.teamId === alloc.teamId && p.isActive
        );
        // calculateAllocationCost requires all team members, not just active ones for historical cost.
        const allTeamMembers = people.filter(p => p.teamId === alloc.teamId);
        const costOfAllocation = calculateAllocationCost(
          alloc,
          iterationCycle,
          allTeamMembers,
          roles,
          config
        );
        quarterCost += costOfAllocation;
      }
    });

    quarterlyCosts[quarter.name] = quarterCost;
    totalAnnualCost += quarterCost;
  });

  return { totalAnnualCost, quarterlyCosts };
};

export const validateRateConfiguration = (
  person: Person,
  role: Role
): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} => {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let isValid = true;

  if (person.employmentType === 'permanent') {
    if (
      !person.annualSalary &&
      !role.defaultAnnualSalary &&
      !role.defaultRate
    ) {
      warnings.push('No salary information available');
      suggestions.push(
        'Set either personal annual salary or role default salary'
      );
      isValid = false;
    }
  } else if (person.employmentType === 'contractor') {
    const hasPersonalRate =
      person.contractDetails?.hourlyRate || person.contractDetails?.dailyRate;
    const hasRoleDefault = role.defaultHourlyRate || role.defaultDailyRate;

    if (!hasPersonalRate && !hasRoleDefault && !role.defaultRate) {
      warnings.push('No contractor rate information available');
      suggestions.push(
        'Set either personal hourly/daily rate or role default rates'
      );
      isValid = false;
    }
  }

  return { isValid, warnings, suggestions };
};
