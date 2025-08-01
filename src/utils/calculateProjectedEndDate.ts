import {
  Project,
  Epic,
  Milestone,
  Allocation,
  Team,
  Person,
  Role,
  Cycle,
} from '@/types';
import { addDays, parseISO, format, isValid } from 'date-fns';

/**
 * Calculates the projected end date for a project based on epic progress,
 * milestone schedules, team capacity, and current allocations.
 *
 * @param project - The project to calculate the projected end date for
 * @param epics - Array of epics associated with the project
 * @param milestones - Array of milestones associated with the project
 * @param allocations - Array of team allocations across cycles
 * @param teams - Array of team data for capacity calculations
 * @param people - Array of person data for team composition
 * @param roles - Array of role data for velocity calculations
 * @param cycles - Array of cycle/iteration data for timeline calculations
 * @returns Projected end date as ISO string, or null if cannot be calculated
 */
export function calculateProjectedEndDate(
  project: Project,
  epics: Epic[],
  milestones: Milestone[],
  allocations: Allocation[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  cycles: Cycle[]
): string | null {
  // Input validation
  if (!project) {
    return null;
  }

  // Handle arrays that might be null/undefined
  const safeEpics = Array.isArray(epics) ? epics : [];
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  const safeAllocations = Array.isArray(allocations) ? allocations : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeCycles = Array.isArray(cycles) ? cycles : [];

  // Filter data for this project
  const projectEpics = safeEpics.filter(epic => epic.projectId === project.id);
  const projectMilestones = safeMilestones.filter(
    milestone => milestone.projectId === project.id
  );

  // If no epics or milestones, return original end date
  if (projectEpics.length === 0 && projectMilestones.length === 0) {
    return project.endDate || null;
  }

  const projectedDates: Date[] = [];

  // Calculate based on completed work
  const completedEpicDates = projectEpics
    .filter(epic => epic.status === 'completed' && epic.endDate)
    .map(epic => parseISO(epic.endDate!))
    .filter(date => isValid(date));

  const completedMilestoneDates = projectMilestones
    .filter(
      milestone => milestone.status === 'completed' && milestone.isCompleted
    )
    .map(milestone => parseISO(milestone.dueDate))
    .filter(date => isValid(date));

  projectedDates.push(...completedEpicDates, ...completedMilestoneDates);

  // Calculate based on remaining work and team capacity
  const remainingEpics = projectEpics.filter(
    epic => epic.status === 'in-progress' || epic.status === 'todo'
  );

  if (remainingEpics.length > 0 && safeAllocations.length > 0) {
    const projectedCompletionDate = calculateRemainingWorkCompletion(
      remainingEpics,
      safeAllocations,
      safeTeams,
      safePeople,
      safeRoles,
      safeCycles
    );

    if (projectedCompletionDate) {
      projectedDates.push(projectedCompletionDate);
    }
  }

  // Include milestone due dates for incomplete milestones
  const incompleteMilestoneDates = projectMilestones
    .filter(milestone => !milestone.isCompleted)
    .map(milestone => parseISO(milestone.dueDate))
    .filter(date => isValid(date));

  projectedDates.push(...incompleteMilestoneDates);

  // If we have projected dates, return the latest one
  if (projectedDates.length > 0) {
    const latestDate = projectedDates.reduce((latest, current) =>
      current > latest ? current : latest
    );
    return format(latestDate, 'yyyy-MM-dd');
  }

  // Fallback to original project end date
  return project.endDate || null;
}

/**
 * Calculates the projected completion date based on remaining epic effort
 * and team capacity/allocations.
 */
function calculateRemainingWorkCompletion(
  remainingEpics: Epic[],
  allocations: Allocation[],
  teams: Team[],
  people: Person[],
  roles: Role[],
  cycles: Cycle[]
): Date | null {
  // Calculate total remaining effort
  const totalRemainingEffort = remainingEpics.reduce((sum, epic) => {
    return sum + (epic.estimatedEffort || 0);
  }, 0);

  if (totalRemainingEffort === 0) {
    return null;
  }

  // Calculate team velocity based on allocations
  const teamVelocityMap = new Map<string, number>();

  // Group allocations by team
  const teamAllocations = new Map<string, Allocation[]>();
  remainingEpics.forEach(epic => {
    const epicAllocations = allocations.filter(
      alloc => alloc.epicId === epic.id
    );
    epicAllocations.forEach(alloc => {
      if (!teamAllocations.has(alloc.teamId)) {
        teamAllocations.set(alloc.teamId, []);
      }
      teamAllocations.get(alloc.teamId)!.push(alloc);
    });
  });

  // Calculate velocity for each team
  teamAllocations.forEach((teamAllocs, teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || team.capacity === 0) {
      return;
    }

    // Calculate average allocation percentage for this team
    const avgAllocation =
      teamAllocs.reduce((sum, alloc) => sum + alloc.percentage, 0) /
      teamAllocs.length;

    // Calculate effective capacity
    const effectiveCapacity = (team.capacity * avgAllocation) / 100;

    // Adjust for team composition and role velocities
    const teamMembers = people.filter(
      person => person.teamId === teamId && person.isActive
    );
    const roleMultiplier = calculateRoleVelocityMultiplier(teamMembers, roles);

    const adjustedVelocity = effectiveCapacity * roleMultiplier;
    teamVelocityMap.set(teamId, adjustedVelocity);
  });

  // Calculate total team velocity (story points per cycle)
  const totalVelocity = Array.from(teamVelocityMap.values()).reduce(
    (sum, velocity) => sum + velocity,
    0
  );

  if (totalVelocity === 0) {
    return null;
  }

  // Estimate cycles needed to complete remaining work
  // Assuming a standard velocity of 2 story points per hour capacity
  const storyPointsPerHour = 0.5;
  const totalHoursNeeded = totalRemainingEffort / storyPointsPerHour;
  const cyclesNeeded = Math.ceil(totalHoursNeeded / totalVelocity);

  // Find the latest cycle with allocations to determine starting point
  const allocationCycles = allocations
    .map(alloc => cycles.find(cycle => cycle.id === alloc.cycleId))
    .filter((cycle): cycle is Cycle => cycle !== undefined)
    .sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );

  if (allocationCycles.length === 0) {
    return null;
  }

  const latestCycle = allocationCycles[0];
  const cycleStartDate = parseISO(latestCycle.endDate);

  // Estimate completion date by adding cycles
  // Assuming 3-month cycles on average
  const avgCycleDurationDays = 90;
  const additionalDays = cyclesNeeded * avgCycleDurationDays;

  return addDays(cycleStartDate, additionalDays);
}

/**
 * Calculates a velocity multiplier based on team composition and role experience.
 * Senior roles have higher velocity than junior roles.
 */
function calculateRoleVelocityMultiplier(
  teamMembers: Person[],
  roles: Role[]
): number {
  if (teamMembers.length === 0) {
    return 1.0;
  }

  const roleMultipliers: Record<string, number> = {
    senior: 1.3,
    lead: 1.4,
    principal: 1.5,
    architect: 1.4,
    junior: 0.8,
    intern: 0.6,
  };

  let totalMultiplier = 0;
  let memberCount = 0;

  teamMembers.forEach(member => {
    const role = roles.find(r => r.id === member.roleId);
    if (!role) {
      totalMultiplier += 1.0; // Default multiplier
      memberCount += 1;
      return;
    }

    const roleName = role.name.toLowerCase();
    let multiplier = 1.0; // Default multiplier

    // Check if role name contains any of the multiplier keywords
    Object.entries(roleMultipliers).forEach(([keyword, mult]) => {
      if (roleName.includes(keyword)) {
        multiplier = mult;
      }
    });

    totalMultiplier += multiplier;
    memberCount += 1;
  });

  return memberCount > 0 ? totalMultiplier / memberCount : 1.0;
}
