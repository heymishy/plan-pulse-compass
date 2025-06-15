
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
}

export const calculatePersonCost = (person: Person, role: Role): PersonCostCalculation => {
  let costPerHour = 0;

  if (person.employmentType === 'permanent') {
    // Use individual salary if set, otherwise use role default
    const annualSalary = person.annualSalary || role.defaultAnnualSalary || 0;
    costPerHour = annualSalary / (WORKING_DAYS_PER_YEAR * 8); // Assuming 8 hours per day
  } else if (person.employmentType === 'contractor') {
    if (person.contractDetails?.hourlyRate) {
      costPerHour = person.contractDetails.hourlyRate;
    } else if (person.contractDetails?.dailyRate) {
      costPerHour = person.contractDetails.dailyRate / 8;
    } else if (role.defaultHourlyRate) {
      costPerHour = role.defaultHourlyRate;
    } else if (role.defaultDailyRate) {
      costPerHour = role.defaultDailyRate / 8;
    } else {
      // Fallback to legacy rate
      costPerHour = role.defaultRate;
    }
  }

  return {
    personId: person.id,
    costPerHour,
    costPerDay: costPerHour * 8,
    costPerWeek: costPerHour * 8 * WORKING_DAYS_PER_WEEK,
    costPerMonth: costPerHour * 8 * WORKING_DAYS_PER_MONTH,
    costPerYear: costPerHour * 8 * WORKING_DAYS_PER_YEAR,
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
          allocations: []
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
