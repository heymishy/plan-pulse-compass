import { Team, Allocation, Epic, Project, Person, Cycle } from '@/types';

export type ConflictType =
  | 'overallocation'
  | 'skill-mismatch'
  | 'dependency-violation'
  | 'resource-contention'
  | 'timeline-overlap'
  | 'capacity-exceeded';

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AllocationConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  affectedAllocations: string[];
  affectedTeams: string[];
  affectedEpics: string[];
  suggestedActions: string[];
  impact: {
    delayRisk: number; // 0-100
    qualityRisk: number; // 0-100
    resourceWaste: number; // 0-100
  };
}

export interface ConflictDetectionResult {
  conflicts: AllocationConflict[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  affectedTeamsCount: number;
  affectedEpicsCount: number;
  overallRiskScore: number; // 0-100
}

export const detectAllocationConflicts = (
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  projects: Project[],
  people: Person[],
  iterations: Cycle[],
  selectedCycleId: string
): ConflictDetectionResult => {
  const relevantAllocations = allocations.filter(
    a => a.cycleId === selectedCycleId
  );
  const conflicts: AllocationConflict[] = [];

  // 1. Detect overallocation conflicts
  conflicts.push(
    ...detectOverallocationConflicts(relevantAllocations, teams, iterations)
  );

  // 2. Detect skill mismatches
  conflicts.push(
    ...detectSkillMismatches(
      relevantAllocations,
      teams,
      epics,
      projects,
      people
    )
  );

  // 3. Detect dependency violations
  conflicts.push(
    ...detectDependencyViolations(
      relevantAllocations,
      epics,
      projects,
      iterations
    )
  );

  // 4. Detect resource contention
  conflicts.push(
    ...detectResourceContention(relevantAllocations, teams, epics)
  );

  // 5. Detect timeline overlaps
  conflicts.push(
    ...detectTimelineOverlaps(relevantAllocations, iterations, epics, projects)
  );

  // Calculate summary
  const summary = {
    total: conflicts.length,
    critical: conflicts.filter(c => c.severity === 'critical').length,
    high: conflicts.filter(c => c.severity === 'high').length,
    medium: conflicts.filter(c => c.severity === 'medium').length,
    low: conflicts.filter(c => c.severity === 'low').length,
  };

  const affectedTeamsCount = new Set(conflicts.flatMap(c => c.affectedTeams))
    .size;
  const affectedEpicsCount = new Set(conflicts.flatMap(c => c.affectedEpics))
    .size;

  // Calculate overall risk score
  const overallRiskScore = calculateOverallRiskScore(conflicts);

  return {
    conflicts,
    summary,
    affectedTeamsCount,
    affectedEpicsCount,
    overallRiskScore,
  };
};

const detectOverallocationConflicts = (
  allocations: Allocation[],
  teams: Team[],
  iterations: Cycle[]
): AllocationConflict[] => {
  const conflicts: AllocationConflict[] = [];

  teams.forEach(team => {
    iterations.forEach((iteration, index) => {
      const iterationNumber = index + 1;
      const teamAllocations = allocations.filter(
        a => a.teamId === team.id && a.iterationNumber === iterationNumber
      );

      const totalPercentage = teamAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );

      if (totalPercentage > 100) {
        const severity: ConflictSeverity =
          totalPercentage > 150
            ? 'critical'
            : totalPercentage > 125
              ? 'high'
              : totalPercentage > 110
                ? 'medium'
                : 'low';

        conflicts.push({
          id: `overallocation-${team.id}-${iterationNumber}`,
          type: 'overallocation',
          severity,
          title: `Team ${team.name} overallocated in iteration ${iterationNumber}`,
          description: `Team is allocated ${Math.round(totalPercentage)}% capacity (${Math.round(totalPercentage - 100)}% over limit)`,
          affectedAllocations: teamAllocations.map(a => a.id),
          affectedTeams: [team.id],
          affectedEpics: teamAllocations
            .filter(a => a.epicId)
            .map(a => a.epicId!),
          suggestedActions: [
            'Reduce allocation percentages',
            'Move some work to another iteration',
            'Split work across multiple teams',
            'Increase team capacity if possible',
          ],
          impact: {
            delayRisk: Math.min(100, (totalPercentage - 100) * 2),
            qualityRisk: Math.min(100, (totalPercentage - 100) * 1.5),
            resourceWaste: Math.min(100, (totalPercentage - 100) * 1.2),
          },
        });
      }
    });
  });

  return conflicts;
};

const detectSkillMismatches = (
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  projects: Project[],
  people: Person[]
): AllocationConflict[] => {
  // This would require skill data which we don't have in the current schema
  // For now, return empty array but structure is in place for future implementation
  return [];
};

const detectDependencyViolations = (
  allocations: Allocation[],
  epics: Epic[],
  projects: Project[],
  iterations: Cycle[]
): AllocationConflict[] => {
  const conflicts: AllocationConflict[] = [];

  // Look for projects with multiple epics allocated to different iterations without considering dependencies
  projects.forEach(project => {
    const projectEpics = epics.filter(e => e.projectId === project.id);
    const epicAllocations = allocations.filter(
      a => a.epicId && projectEpics.some(e => e.id === a.epicId)
    );

    // Group by iteration
    const allocationsByIteration = new Map<number, Allocation[]>();
    epicAllocations.forEach(allocation => {
      const iter = allocation.iterationNumber;
      if (!allocationsByIteration.has(iter)) {
        allocationsByIteration.set(iter, []);
      }
      allocationsByIteration.get(iter)!.push(allocation);
    });

    // Check for potential dependency issues (parallel work on same project)
    if (allocationsByIteration.size > 1) {
      const iterations = Array.from(allocationsByIteration.keys()).sort();
      const overlappingIterations = iterations.filter(
        (iter, i) => i < iterations.length - 1 && iterations[i + 1] === iter + 1
      );

      if (overlappingIterations.length > 0) {
        conflicts.push({
          id: `dependency-${project.id}`,
          type: 'dependency-violation',
          severity: 'medium',
          title: `Potential dependency conflicts in ${project.name}`,
          description: `Multiple epics from ${project.name} are scheduled in overlapping iterations, which may create dependency issues`,
          affectedAllocations: epicAllocations.map(a => a.id),
          affectedTeams: Array.from(
            new Set(epicAllocations.map(a => a.teamId))
          ),
          affectedEpics: Array.from(
            new Set(epicAllocations.filter(a => a.epicId).map(a => a.epicId!))
          ),
          suggestedActions: [
            'Review epic dependencies',
            'Sequence epics based on dependencies',
            'Consider team coordination overhead',
            'Plan integration points',
          ],
          impact: {
            delayRisk: 60,
            qualityRisk: 40,
            resourceWaste: 30,
          },
        });
      }
    }
  });

  return conflicts;
};

const detectResourceContention = (
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[]
): AllocationConflict[] => {
  const conflicts: AllocationConflict[] = [];

  // Detect when the same epic is allocated to multiple teams in the same iteration
  const epicAllocationsByIteration = new Map<
    string,
    Map<number, Allocation[]>
  >();

  allocations.forEach(allocation => {
    if (!allocation.epicId) return;

    if (!epicAllocationsByIteration.has(allocation.epicId)) {
      epicAllocationsByIteration.set(allocation.epicId, new Map());
    }

    const epicMap = epicAllocationsByIteration.get(allocation.epicId)!;
    if (!epicMap.has(allocation.iterationNumber)) {
      epicMap.set(allocation.iterationNumber, []);
    }

    epicMap.get(allocation.iterationNumber)!.push(allocation);
  });

  epicAllocationsByIteration.forEach((iterationMap, epicId) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return;

    iterationMap.forEach((allocations, iterationNumber) => {
      if (allocations.length > 1) {
        // Multiple teams working on same epic in same iteration
        const uniqueTeams = new Set(allocations.map(a => a.teamId));

        if (uniqueTeams.size > 1) {
          conflicts.push({
            id: `contention-${epicId}-${iterationNumber}`,
            type: 'resource-contention',
            severity: 'medium',
            title: `Multiple teams on ${epic.name} in iteration ${iterationNumber}`,
            description: `${uniqueTeams.size} teams are working on the same epic simultaneously, which may cause coordination overhead`,
            affectedAllocations: allocations.map(a => a.id),
            affectedTeams: Array.from(uniqueTeams),
            affectedEpics: [epicId],
            suggestedActions: [
              'Designate a lead team',
              'Split epic into smaller, team-specific tasks',
              'Plan coordination meetings',
              'Define clear interfaces between teams',
            ],
            impact: {
              delayRisk: 40,
              qualityRisk: 50,
              resourceWaste: 35,
            },
          });
        }
      }
    });
  });

  return conflicts;
};

const detectTimelineOverlaps = (
  allocations: Allocation[],
  iterations: Cycle[],
  epics: Epic[],
  projects: Project[]
): AllocationConflict[] => {
  const conflicts: AllocationConflict[] = [];

  // Detect projects with unrealistic timeline compression
  projects.forEach(project => {
    const projectEpics = epics.filter(e => e.projectId === project.id);
    const projectAllocations = allocations.filter(
      a => a.epicId && projectEpics.some(e => e.id === a.epicId)
    );

    if (projectAllocations.length === 0) return;

    const iterationNumbers = projectAllocations.map(a => a.iterationNumber);
    const minIteration = Math.min(...iterationNumbers);
    const maxIteration = Math.max(...iterationNumbers);
    const spanIterations = maxIteration - minIteration + 1;

    // If project spans only 1-2 iterations but has many epics, flag potential timeline conflict
    if (spanIterations <= 2 && projectEpics.length >= 3) {
      conflicts.push({
        id: `timeline-${project.id}`,
        type: 'timeline-overlap',
        severity: 'high',
        title: `Aggressive timeline for ${project.name}`,
        description: `Project has ${projectEpics.length} epics compressed into ${spanIterations} iteration${spanIterations !== 1 ? 's' : ''}`,
        affectedAllocations: projectAllocations.map(a => a.id),
        affectedTeams: Array.from(
          new Set(projectAllocations.map(a => a.teamId))
        ),
        affectedEpics: projectEpics.map(e => e.id),
        suggestedActions: [
          'Extend project timeline',
          'Reduce scope for initial delivery',
          'Parallelize epic development',
          'Review epic complexity estimates',
        ],
        impact: {
          delayRisk: 80,
          qualityRisk: 70,
          resourceWaste: 20,
        },
      });
    }
  });

  return conflicts;
};

const calculateOverallRiskScore = (conflicts: AllocationConflict[]): number => {
  if (conflicts.length === 0) return 0;

  const severityWeights = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };

  const totalWeightedScore = conflicts.reduce((sum, conflict) => {
    return sum + severityWeights[conflict.severity];
  }, 0);

  const maxPossibleScore = conflicts.length * 100;
  return Math.round((totalWeightedScore / maxPossibleScore) * 100);
};

export const getConflictTypeIcon = (type: ConflictType): string => {
  switch (type) {
    case 'overallocation':
      return '⚠️';
    case 'skill-mismatch':
      return '🎯';
    case 'dependency-violation':
      return '🔗';
    case 'resource-contention':
      return '⚔️';
    case 'timeline-overlap':
      return '⏰';
    case 'capacity-exceeded':
      return '📊';
    default:
      return '❓';
  }
};

export const getConflictSeverityColor = (
  severity: ConflictSeverity
): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
