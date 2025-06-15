
import { Person, Role, Allocation, Epic, Project, Cycle } from '@/types';

export const WORKING_DAYS_PER_WEEK = 5;
export const WORKING_DAYS_PER_MONTH = 22;
export const WORKING_DAYS_PER_YEAR = 260;

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

export const calculatePersonCost = (person: Person, role: Role): PersonCostCalculation => {
  let costPerHour = 0;
  let rateSource: 'personal' | 'role-default' | 'legacy-fallback' = 'legacy-fallback';
  let effectiveRate = 0;
  let rateType: 'hourly' | 'daily' | 'annual' = 'hourly';

  if (person.employmentType === 'permanent') {
    // Priority 1: Individual salary
    if (person.annualSalary && person.annualSalary > 0) {
      costPerHour = person.annualSalary / (WORKING_DAYS_PER_YEAR * 8);
      rateSource = 'personal';
      effectiveRate = person.annualSalary;
      rateType = 'annual';
    }
    // Priority 2: Role default annual salary
    else if (role.defaultAnnualSalary && role.defaultAnnualSalary > 0) {
      costPerHour = role.defaultAnnualSalary / (WORKING_DAYS_PER_YEAR * 8);
      rateSource = 'role-default';
      effectiveRate = role.defaultAnnualSalary;
      rateType = 'annual';
    }
    // Priority 3: Legacy fallback
    else if (role.defaultRate && role.defaultRate > 0) {
      costPerHour = role.defaultRate;
      rateSource = 'legacy-fallback';
      effectiveRate = role.defaultRate;
      rateType = 'hourly';
    }
  } else if (person.employmentType === 'contractor') {
    // Priority 1: Individual contract rates
    if (person.contractDetails?.hourlyRate && person.contractDetails.hourlyRate > 0) {
      costPerHour = person.contractDetails.hourlyRate;
      rateSource = 'personal';
      effectiveRate = person.contractDetails.hourlyRate;
      rateType = 'hourly';
    } else if (person.contractDetails?.dailyRate && person.contractDetails.dailyRate > 0) {
      costPerHour = person.contractDetails.dailyRate / 8;
      rateSource = 'personal';
      effectiveRate = person.contractDetails.dailyRate;
      rateType = 'daily';
    }
    // Priority 2: Role default contractor rates
    else if (role.defaultHourlyRate && role.defaultHourlyRate > 0) {
      costPerHour = role.defaultHourlyRate;
      rateSource = 'role-default';
      effectiveRate = role.defaultHourlyRate;
      rateType = 'hourly';
    } else if (role.defaultDailyRate && role.defaultDailyRate > 0) {
      costPerHour = role.defaultDailyRate / 8;
      rateSource = 'role-default';
      effectiveRate = role.defaultDailyRate;
      rateType = 'daily';
    }
    // Priority 3: Legacy fallback
    else if (role.defaultRate && role.defaultRate > 0) {
      costPerHour = role.defaultRate;
      rateSource = 'legacy-fallback';
      effectiveRate = role.defaultRate;
      rateType = 'hourly';
    }
  }

  return {
    personId: person.id,
    costPerHour,
    costPerDay: costPerHour * 8,
    costPerWeek: costPerHour * 8 * WORKING_DAYS_PER_WEEK,
    costPerMonth: costPerHour * 8 * WORKING_DAYS_PER_MONTH,
    costPerYear: costPerHour * 8 * WORKING_DAYS_PER_YEAR,
    rateSource,
    effectiveRate,
    rateType,
  };
};

export const calculateAllocationCost = (
  allocation: Allocation,
  cycle: Cycle,
  teamMembers: Person[],
  roles: Role[]
): number => {
  const cycleDurationInDays = Math.ceil(
    (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  let totalCost = 0;

  teamMembers.forEach(person => {
    const role = roles.find(r => r.id === person.roleId);
    if (!role) return;

    const personCost = calculatePersonCost(person, role);
    const allocationCost = personCost.costPerDay * cycleDurationInDays * (allocation.percentage / 100);
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
  roles: Role[]
): { totalCost: number; breakdown: any[] } => {
  const projectEpics = epics.filter(epic => epic.projectId === project.id);
  const projectAllocations = allocations.filter(allocation => 
    allocation.epicId && projectEpics.some(epic => epic.id === allocation.epicId)
  );

  let totalCost = 0;
  const breakdown: any[] = [];

  projectAllocations.forEach(allocation => {
    const cycle = cycles.find(c => c.id === allocation.cycleId);
    if (!cycle) return;

    const teamMembers = people.filter(person => 
      person.teamId === allocation.teamId && person.isActive
    );

    teamMembers.forEach(person => {
      const role = roles.find(r => r.id === person.roleId);
      if (!role) return;

      const personCost = calculatePersonCost(person, role);
      const cycleDurationInDays = Math.ceil(
        (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const allocationCost = personCost.costPerDay * cycleDurationInDays * (allocation.percentage / 100);
      totalCost += allocationCost;

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
          rateType: personCost.rateType
        };
        breakdown.push(breakdownEntry);
      }

      breakdownEntry.totalCost += allocationCost;
      breakdownEntry.allocations.push({
        allocationId: allocation.id,
        cycleName: cycle.name,
        percentage: allocation.percentage,
        cost: allocationCost
      });
    });
  });

  return { totalCost, breakdown };
};

export const validateRateConfiguration = (person: Person, role: Role): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} => {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let isValid = true;

  if (person.employmentType === 'permanent') {
    if (!person.annualSalary && !role.defaultAnnualSalary && !role.defaultRate) {
      warnings.push('No salary information available');
      suggestions.push('Set either personal annual salary or role default salary');
      isValid = false;
    }
  } else if (person.employmentType === 'contractor') {
    const hasPersonalRate = person.contractDetails?.hourlyRate || person.contractDetails?.dailyRate;
    const hasRoleDefault = role.defaultHourlyRate || role.defaultDailyRate;
    
    if (!hasPersonalRate && !hasRoleDefault && !role.defaultRate) {
      warnings.push('No contractor rate information available');
      suggestions.push('Set either personal hourly/daily rate or role default rates');
      isValid = false;
    }
  }

  return { isValid, warnings, suggestions };
};
