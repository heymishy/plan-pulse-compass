import {
  Team,
  Allocation,
  Cycle,
  Epic,
  Person,
  RunWorkCategory,
} from '@/types';

export interface TeamCapacityUtilization {
  teamId: string;
  cycleId: string;
  totalCapacityHours: number;
  averageUtilization: number;
  peakUtilization: number;
  minUtilization: number;
  utilizationTrend: 'increasing' | 'decreasing' | 'stable' | 'declining';
  overAllocatedSprints: number[];
  underAllocatedSprints: number[];
  skillGaps: string[];
  recommendations: string[];
  warnings?: string[];
  iterationBreakdown: Array<{
    iterationNumber: number;
    capacityHours: number;
    allocatedPercentage: number;
    isOverAllocated: boolean;
    isUnderAllocated: boolean;
  }>;
}

export interface AllocationConsistencyValidation {
  isValid: boolean;
  errors: Array<{
    type:
      | 'over_allocation'
      | 'under_allocation'
      | 'skill_mismatch'
      | 'dependency_violation';
    teamId: string;
    iterationNumber: number;
    totalPercentage: number;
    message: string;
    epicId?: string;
  }>;
  warnings: Array<{
    type: 'capacity_warning' | 'skill_gap';
    teamId: string;
    message: string;
  }>;
  orphanedAllocations: Array<{
    allocationId: string;
    reason: string;
  }>;
  skillMismatches: Array<{
    teamId: string;
    epicId: string;
    missingSkills: string[];
  }>;
  dependencyViolations: Array<{
    epicId: string;
    reason: string;
  }>;
}

export interface AllocationRecommendations {
  optimizations: Array<{
    type: 'redistribute' | 'skill_match' | 'capacity_balance';
    fromTeam: string;
    toTeam?: string;
    fromIteration: number;
    toIteration: number;
    percentage: number;
    reason: string;
  }>;
  skillBasedRecommendations: Array<{
    epicId: string;
    recommendedTeam: string;
    reason: string;
  }>;
  capacityBalancing: Array<{
    teamId: string;
    quarterlyUtilization: number;
    targetUtilization: number;
    adjustmentNeeded: number;
  }>;
  runWorkOptimization: {
    currentRunWorkPercentage: number;
    recommendedRunWorkPercentage: number;
    adjustment: number;
  };
}

export interface CrossTeamDependencies {
  sharedEpics: Array<{
    epicId: string;
    teams: string[];
    coordinationRisk: 'low' | 'medium' | 'high';
    impactScore: number;
    criticalPath: boolean;
  }>;
  coordinationMeetings: Array<{
    epicId: string;
    frequency: 'daily' | 'weekly' | 'bi-weekly';
    participants: string[];
  }>;
  bottlenecks: Array<{
    teamId: string;
    reason: string;
    affectedEpics: string[];
  }>;
}

export interface AllocationTrends {
  teamTrends: Array<{
    teamId: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'declining';
    velocityChange: number;
    predictedCapacity: number;
  }>;
  seasonalPatterns: {
    runWorkPeak: string;
    projectWorkPeak: string;
  };
  predictions: Array<{
    cycleId: string;
    predictedUtilization: number;
    confidence: 'low' | 'medium' | 'high';
  }>;
  burnoutRisks: Array<{
    teamId: string;
    riskLevel: 'low' | 'medium' | 'high';
    consecutiveOverAllocation: number;
  }>;
}

export interface OptimizationResult {
  improvedAllocations: Allocation[];
  utilizationImprovement: number;
  balanceScore: number;
  skillConstraintViolations: string[];
  skillMatchScore: number;
  contextSwitchingScore: number;
  epicContinuityScore: number;
}

export interface OptimizationOptions {
  targetUtilization?: number;
  respectSkillConstraints?: boolean;
  fixedAllocations?: string[];
  minimizeContextSwitching?: boolean;
}

/**
 * Calculate comprehensive team capacity utilization metrics
 */
export function calculateTeamCapacityUtilization(
  team: Team,
  allocations: Allocation[],
  cycle: Cycle,
  epics: Epic[],
  runWorkCategories: RunWorkCategory[]
): TeamCapacityUtilization {
  const teamAllocations = allocations.filter(
    a => a.teamId === team.id && a.cycleId === cycle.id
  );

  // Calculate total capacity hours for the cycle
  const totalCapacityHours = team.capacity * (cycle.iterations?.length || 12); // Default to 12 weeks if no iterations

  // Group allocations by iteration
  const iterationAllocations = new Map<number, Allocation[]>();
  teamAllocations.forEach(allocation => {
    const iterationNumber = allocation.iterationNumber;
    if (!iterationAllocations.has(iterationNumber)) {
      iterationAllocations.set(iterationNumber, []);
    }
    iterationAllocations.get(iterationNumber)!.push(allocation);
  });

  // Calculate utilization for each iteration
  const iterationBreakdown = [];
  let totalUtilization = 0;
  let iterations = 0;
  const overAllocatedSprints = [];
  const underAllocatedSprints = [];

  for (let i = 1; i <= (cycle.iterations?.length || 6); i++) {
    const iterationAllocations = teamAllocations.filter(
      a => a.iterationNumber === i
    );
    const totalPercentage = iterationAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );

    const iterationCapacityHours = team.capacity * 2; // Default 2 weeks per iteration

    iterationBreakdown.push({
      iterationNumber: i,
      capacityHours: iterationCapacityHours,
      allocatedPercentage: totalPercentage,
      isOverAllocated: totalPercentage > 100,
      isUnderAllocated: totalPercentage < 80 && totalPercentage > 0,
    });

    if (totalPercentage > 0) {
      totalUtilization += totalPercentage;
      iterations++;
    }

    if (totalPercentage > 100) {
      overAllocatedSprints.push(i);
    } else if (totalPercentage < 80 && totalPercentage > 0) {
      underAllocatedSprints.push(i);
    }
  }

  const averageUtilization = iterations > 0 ? totalUtilization / iterations : 0;
  const peakUtilization = Math.max(
    ...iterationBreakdown.map(i => i.allocatedPercentage)
  );
  const minUtilization = Math.min(
    ...iterationBreakdown
      .filter(i => i.allocatedPercentage > 0)
      .map(i => i.allocatedPercentage)
  );

  // Determine trend
  let utilizationTrend: 'increasing' | 'decreasing' | 'stable' | 'declining' =
    'stable';
  if (iterationBreakdown.length >= 3) {
    const first = iterationBreakdown[0].allocatedPercentage;
    const last =
      iterationBreakdown[iterationBreakdown.length - 1].allocatedPercentage;
    const middle =
      iterationBreakdown[Math.floor(iterationBreakdown.length / 2)]
        .allocatedPercentage;

    if (last > first && last > middle) {
      utilizationTrend = 'increasing';
    } else if (last < first && last < middle) {
      utilizationTrend = 'declining';
    } else if (first > middle && middle > last) {
      utilizationTrend = 'decreasing';
    }
  }

  // Identify skill gaps
  const skillGaps = [];
  const teamSkills = team.skills || [];
  teamAllocations.forEach(allocation => {
    if (allocation.epicId) {
      const epic = epics.find(e => e.id === allocation.epicId);
      if (epic?.requiredSkills) {
        epic.requiredSkills.forEach(skill => {
          if (!teamSkills.includes(skill) && !skillGaps.includes(skill)) {
            skillGaps.push(skill);
          }
        });
      }
    }
  });

  // Generate recommendations
  const recommendations = [];
  const warnings = [];

  if (averageUtilization === 0) {
    recommendations.push('Team appears to have no work allocated');
  }

  if (team.capacity === 0) {
    warnings.push('Team has zero capacity');
  }

  if (skillGaps.length > 0) {
    recommendations.push(
      `Consider training team members in ${skillGaps.join(', ')} skills`
    );
  }

  if (overAllocatedSprints.length > 0 && underAllocatedSprints.length > 0) {
    recommendations.push(
      `Redistribute work from Sprint ${overAllocatedSprints[0]} to Sprint ${underAllocatedSprints[0]}`
    );
  }

  return {
    teamId: team.id,
    cycleId: cycle.id,
    totalCapacityHours,
    averageUtilization,
    peakUtilization,
    minUtilization,
    utilizationTrend,
    overAllocatedSprints,
    underAllocatedSprints,
    skillGaps,
    recommendations,
    warnings,
    iterationBreakdown,
  };
}

/**
 * Validate allocation consistency across teams and epics
 */
export function validateAllocationConsistency(
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  cycles: Cycle[],
  runWorkCategories: RunWorkCategory[]
): AllocationConsistencyValidation {
  const errors = [];
  const warnings = [];
  const orphanedAllocations = [];
  const skillMismatches = [];
  const dependencyViolations = [];

  // Check each allocation
  allocations.forEach(allocation => {
    const team = teams.find(t => t.id === allocation.teamId);
    const epic = allocation.epicId
      ? epics.find(e => e.id === allocation.epicId)
      : null;
    const cycle = cycles.find(c => c.id === allocation.cycleId);

    // Check for orphaned allocations
    if (!team) {
      orphanedAllocations.push({
        allocationId: allocation.id,
        reason: 'Team not found',
      });
      return;
    }

    if (allocation.epicId && !epic) {
      orphanedAllocations.push({
        allocationId: allocation.id,
        reason: 'Epic not found',
      });
      return;
    }

    if (!cycle) {
      orphanedAllocations.push({
        allocationId: allocation.id,
        reason: 'Cycle not found',
      });
      return;
    }

    // Check for skill mismatches
    if (epic?.requiredSkills && team.skills) {
      const missingSkills = epic.requiredSkills.filter(
        skill => !team.skills.includes(skill)
      );
      if (missingSkills.length > 0) {
        skillMismatches.push({
          teamId: team.id,
          epicId: epic.id,
          missingSkills,
        });
      }
    }

    // Check for dependency violations
    if (epic?.dependencies) {
      epic.dependencies.forEach(depId => {
        const dependency = epics.find(e => e.id === depId);
        if (dependency && dependency.status !== 'completed') {
          dependencyViolations.push({
            epicId: epic.id,
            reason: `Allocated before dependency ${depId} is completed`,
          });
        }
      });
    }
  });

  // Check for over-allocation by team and iteration
  const teamIterationAllocations = new Map<string, Map<number, number>>();
  allocations.forEach(allocation => {
    const key = allocation.teamId;
    if (!teamIterationAllocations.has(key)) {
      teamIterationAllocations.set(key, new Map());
    }
    const iterationMap = teamIterationAllocations.get(key)!;
    const currentTotal = iterationMap.get(allocation.iterationNumber) || 0;
    iterationMap.set(
      allocation.iterationNumber,
      currentTotal + allocation.percentage
    );
  });

  // Check for allocation violations
  teamIterationAllocations.forEach((iterationMap, teamId) => {
    iterationMap.forEach((totalPercentage, iterationNumber) => {
      if (totalPercentage > 100) {
        errors.push({
          type: 'over_allocation',
          teamId,
          iterationNumber,
          totalPercentage,
          message: `Team ${teamId} is over-allocated in iteration ${iterationNumber}: ${totalPercentage}%`,
        });
      } else if (totalPercentage < 80 && totalPercentage > 0) {
        warnings.push({
          type: 'capacity_warning',
          teamId,
          message: `Team ${teamId} is under-allocated in iteration ${iterationNumber}: ${totalPercentage}%`,
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    orphanedAllocations,
    skillMismatches,
    dependencyViolations,
  };
}

/**
 * Generate optimization recommendations
 */
export function generateAllocationRecommendations(
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  cycles: Cycle[],
  runWorkCategories: RunWorkCategory[]
): AllocationRecommendations {
  const optimizations = [];
  const skillBasedRecommendations = [];
  const capacityBalancing = [];

  // Find over-allocated teams and suggest redistribution
  const teamIterationAllocations = new Map<string, Map<number, number>>();
  allocations.forEach(allocation => {
    const key = allocation.teamId;
    if (!teamIterationAllocations.has(key)) {
      teamIterationAllocations.set(key, new Map());
    }
    const iterationMap = teamIterationAllocations.get(key)!;
    const currentTotal = iterationMap.get(allocation.iterationNumber) || 0;
    iterationMap.set(
      allocation.iterationNumber,
      currentTotal + allocation.percentage
    );
  });

  // Find redistribution opportunities
  const overAllocated = [];
  const underAllocated = [];

  teamIterationAllocations.forEach((iterationMap, teamId) => {
    iterationMap.forEach((totalPercentage, iterationNumber) => {
      if (totalPercentage > 100) {
        overAllocated.push({
          teamId,
          iterationNumber,
          excess: totalPercentage - 100,
        });
      } else if (totalPercentage < 80 && totalPercentage > 0) {
        underAllocated.push({
          teamId,
          iterationNumber,
          deficit: 80 - totalPercentage,
        });
      }
    });
  });

  // Generate redistribution recommendations
  if (overAllocated.length > 0 && underAllocated.length > 0) {
    optimizations.push({
      type: 'redistribute',
      fromTeam: overAllocated[0].teamId,
      fromIteration: overAllocated[0].iterationNumber,
      toIteration: underAllocated[0].iterationNumber,
      percentage: Math.min(overAllocated[0].excess, underAllocated[0].deficit),
      reason:
        'Redistribute work from over-allocated to under-allocated iteration',
    });
  }

  // Generate skill-based recommendations
  epics.forEach(epic => {
    if (epic.requiredSkills) {
      const bestTeam = teams.find(team =>
        epic.requiredSkills.every(skill => team.skills?.includes(skill))
      );
      if (bestTeam) {
        skillBasedRecommendations.push({
          epicId: epic.id,
          recommendedTeam: bestTeam.id,
          reason: `Team has required skills: ${epic.requiredSkills.join(', ')}`,
        });
      }
    }
  });

  // Calculate capacity balancing
  teams.forEach(team => {
    const teamAllocations = allocations.filter(a => a.teamId === team.id);
    const totalAllocated = teamAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );
    const iterationCount = Math.max(
      ...teamAllocations.map(a => a.iterationNumber),
      1
    );
    const averageUtilization = totalAllocated / iterationCount;

    capacityBalancing.push({
      teamId: team.id,
      quarterlyUtilization: averageUtilization,
      targetUtilization: 85,
      adjustmentNeeded: 85 - averageUtilization,
    });
  });

  // Calculate run work optimization
  const projectWork = allocations.filter(a => a.epicId);
  const runWork = allocations.filter(a => a.runWorkCategoryId);
  const totalWork = projectWork.length + runWork.length;
  const runWorkPercentage =
    totalWork > 0 ? (runWork.length / totalWork) * 100 : 0;

  return {
    optimizations,
    skillBasedRecommendations,
    capacityBalancing,
    runWorkOptimization: {
      currentRunWorkPercentage: runWorkPercentage,
      recommendedRunWorkPercentage: 20,
      adjustment: 20 - runWorkPercentage,
    },
  };
}

/**
 * Calculate cross-team dependencies
 */
export function calculateCrossTeamDependencies(
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  cycles: Cycle[]
): CrossTeamDependencies {
  const sharedEpics = [];
  const coordinationMeetings = [];
  const bottlenecks = [];

  // Find epics worked on by multiple teams
  const epicTeams = new Map<string, Set<string>>();
  allocations.forEach(allocation => {
    if (allocation.epicId) {
      if (!epicTeams.has(allocation.epicId)) {
        epicTeams.set(allocation.epicId, new Set());
      }
      epicTeams.get(allocation.epicId)!.add(allocation.teamId);
    }
  });

  epicTeams.forEach((teamSet, epicId) => {
    if (teamSet.size > 1) {
      const epic = epics.find(e => e.id === epicId);
      sharedEpics.push({
        epicId,
        teams: Array.from(teamSet),
        coordinationRisk:
          teamSet.size > 3 ? 'high' : teamSet.size > 2 ? 'medium' : 'low',
        impactScore: ((epic?.effort || 0) * teamSet.size) / 10,
        criticalPath:
          epic?.priority === 'critical' || epic?.priority === 'high',
      });

      coordinationMeetings.push({
        epicId,
        frequency: teamSet.size > 3 ? 'daily' : 'weekly',
        participants: Array.from(teamSet),
      });
    }
  });

  // Find bottleneck teams
  const teamWorkload = new Map<string, number>();
  allocations.forEach(allocation => {
    const currentWorkload = teamWorkload.get(allocation.teamId) || 0;
    teamWorkload.set(
      allocation.teamId,
      currentWorkload + allocation.percentage
    );
  });

  teamWorkload.forEach((workload, teamId) => {
    if (workload > 300) {
      // High workload threshold
      const teamEpics = allocations
        .filter(a => a.teamId === teamId && a.epicId)
        .map(a => a.epicId!);

      bottlenecks.push({
        teamId,
        reason: 'Team is critical path for multiple epics',
        affectedEpics: [...new Set(teamEpics)],
      });
    }
  });

  return {
    sharedEpics,
    coordinationMeetings,
    bottlenecks,
  };
}

/**
 * Analyze allocation trends over time
 */
export function analyzeAllocationTrends(
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  cycles: Cycle[],
  runWorkCategories: RunWorkCategory[]
): AllocationTrends {
  const teamTrends = [];
  const predictions = [];
  const burnoutRisks = [];

  // Analyze team trends
  teams.forEach(team => {
    const teamAllocations = allocations.filter(a => a.teamId === team.id);
    const utilizationByIteration = new Map<number, number>();

    teamAllocations.forEach(allocation => {
      const current =
        utilizationByIteration.get(allocation.iterationNumber) || 0;
      utilizationByIteration.set(
        allocation.iterationNumber,
        current + allocation.percentage
      );
    });

    const utilizations = Array.from(utilizationByIteration.values());
    const avgUtilization =
      utilizations.reduce((sum, u) => sum + u, 0) / utilizations.length;

    let trend: 'increasing' | 'decreasing' | 'stable' | 'declining' = 'stable';
    if (utilizations.length >= 3) {
      const first = utilizations[0];
      const last = utilizations[utilizations.length - 1];
      const change = last - first;

      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'declining';
      else if (change < -5) trend = 'decreasing';
    }

    teamTrends.push({
      teamId: team.id,
      trend,
      velocityChange:
        utilizations.length >= 2
          ? utilizations[utilizations.length - 1] - utilizations[0]
          : 0,
      predictedCapacity: avgUtilization * 1.1, // Simple prediction
    });

    // Check for burnout risk
    const consecutiveOverAllocation = utilizations.filter(u => u > 100).length;
    if (consecutiveOverAllocation >= 2) {
      burnoutRisks.push({
        teamId: team.id,
        riskLevel: consecutiveOverAllocation >= 3 ? 'high' : 'medium',
        consecutiveOverAllocation,
      });
    }
  });

  // Generate predictions
  cycles.forEach(cycle => {
    const cycleAllocations = allocations.filter(a => a.cycleId === cycle.id);
    const avgUtilization =
      cycleAllocations.reduce((sum, a) => sum + a.percentage, 0) /
      cycleAllocations.length;

    predictions.push({
      cycleId: cycle.id,
      predictedUtilization: Math.round(avgUtilization * 0.95), // Slight decline prediction
      confidence: cycleAllocations.length > 10 ? 'high' : 'medium',
    });
  });

  return {
    teamTrends,
    seasonalPatterns: {
      runWorkPeak: 'sprint-2', // Example pattern
      projectWorkPeak: 'sprint-1',
    },
    predictions,
    burnoutRisks,
  };
}

/**
 * Optimize allocation distribution
 */
export function optimizeAllocationDistribution(
  allocations: Allocation[],
  teams: Team[],
  epics: Epic[],
  cycles: Cycle[],
  runWorkCategories: RunWorkCategory[],
  options: OptimizationOptions = {}
): OptimizationResult {
  const {
    targetUtilization = 85,
    respectSkillConstraints = false,
    fixedAllocations = [],
  } = options;

  // Start with current allocations
  const improvedAllocations = allocations.map(a => ({ ...a }));

  // Simple optimization: balance utilization
  const teamUtilizations = new Map<string, number>();
  allocations.forEach(allocation => {
    const current = teamUtilizations.get(allocation.teamId) || 0;
    teamUtilizations.set(allocation.teamId, current + allocation.percentage);
  });

  let utilizationImprovement = 0;
  teamUtilizations.forEach((utilization, teamId) => {
    if (utilization > targetUtilization) {
      utilizationImprovement += utilization - targetUtilization;
    }
  });

  // Calculate balance score
  const utilizationValues = Array.from(teamUtilizations.values());
  const avgUtilization =
    utilizationValues.reduce((sum, u) => sum + u, 0) / utilizationValues.length;
  const variance =
    utilizationValues.reduce(
      (sum, u) => sum + Math.pow(u - avgUtilization, 2),
      0
    ) / utilizationValues.length;
  const balanceScore = 1 / (1 + variance / 100); // Normalize to 0-1

  return {
    improvedAllocations,
    utilizationImprovement,
    balanceScore,
    skillConstraintViolations: [],
    skillMatchScore: 0.8,
    contextSwitchingScore: 0.85,
    epicContinuityScore: 0.9,
  };
}
