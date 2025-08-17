import { Team, Allocation, Cycle, Epic } from '@/types';

export interface CapacityCheck {
  teamId: string;
  iterationNumber: number;
  allocatedPercentage: number;
  capacityHours: number;
  isOverAllocated: boolean;
  isUnderAllocated: boolean;
}

export const calculateTeamCapacity = (
  team: Team,
  iterationNumber: number,
  allocations: Allocation[],
  iterations: Cycle[]
): CapacityCheck => {
  // Get the iteration object for this iteration number
  const iteration = iterations[iterationNumber - 1]; // iterationNumber is 1-based, array is 0-based

  // Filter by both cycleId (preferred) and iterationNumber (fallback) to handle both storage methods
  const teamAllocations = allocations.filter(a => {
    const matchesTeam = a.teamId === team.id;
    const matchesCycleId = iteration && a.cycleId === iteration.id;
    const matchesIterationNumber = a.iterationNumber === iterationNumber;

    // Prefer cycleId matching, fallback to iterationNumber
    return matchesTeam && (matchesCycleId || matchesIterationNumber);
  });

  const totalPercentage = teamAllocations.reduce(
    (sum, a) => sum + a.percentage,
    0
  );

  // Get iteration duration to calculate actual capacity
  let iterationWeeks = 2; // Default to 2 weeks

  if (iteration) {
    const startDate = new Date(iteration.startDate);
    const endDate = new Date(iteration.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    iterationWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  const capacityHours = team.capacity * iterationWeeks;

  return {
    teamId: team.id,
    iterationNumber,
    allocatedPercentage: totalPercentage,
    capacityHours,
    isOverAllocated: totalPercentage > 100,
    isUnderAllocated: totalPercentage < 100 && totalPercentage > 0,
  };
};

export const getProjectEndDateFromEpics = (
  epics: Epic[]
): string | undefined => {
  const endDates = epics
    .map(epic => epic.actualEndDate || epic.targetEndDate)
    .filter(Boolean) as string[];

  if (endDates.length === 0) return undefined;

  return endDates.reduce((latest, current) => {
    return new Date(current) > new Date(latest) ? current : latest;
  });
};
