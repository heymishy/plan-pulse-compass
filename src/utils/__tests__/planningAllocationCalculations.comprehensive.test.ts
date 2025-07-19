import { describe, it, expect } from 'vitest';
import {
  calculateTeamCapacityUtilization,
  validateAllocationConsistency,
  generateAllocationRecommendations,
  calculateCrossTeamDependencies,
  analyzeAllocationTrends,
  optimizeAllocationDistribution,
} from '../planningAllocationCalculations';
import {
  Team,
  Allocation,
  Cycle,
  Epic,
  Person,
  RunWorkCategory,
} from '@/types';

/**
 * Comprehensive tests for planning allocation calculations
 * Updated to match actual implementation behavior
 */
describe('Planning Allocation Calculations - Comprehensive Coverage', () => {
  // Simplified test data that matches the actual implementation
  const mockTeams: Team[] = [
    {
      id: 'team-frontend',
      name: 'Frontend Team',
      divisionId: 'engineering',
      capacity: 160,
      productOwnerId: 'person-po-1',
      skills: ['React', 'TypeScript', 'CSS', 'Testing'],
      members: ['person-1', 'person-2', 'person-3', 'person-4'],
      targetSkills: ['React', 'TypeScript'],
      type: 'permanent',
      status: 'active',
      created: '2024-01-01',
      modified: '2024-01-01',
    },
    {
      id: 'team-backend',
      name: 'Backend Team',
      divisionId: 'engineering',
      capacity: 120,
      productOwnerId: 'person-po-2',
      skills: ['Node.js', 'Python', 'PostgreSQL'],
      members: ['person-5', 'person-6', 'person-7'],
      targetSkills: ['Node.js', 'Python'],
      type: 'permanent',
      status: 'active',
      created: '2024-01-01',
      modified: '2024-01-01',
    },
  ];

  const mockPeople: Person[] = [
    {
      id: 'person-1',
      name: 'Alice Frontend',
      email: 'alice@company.com',
      roleId: 'role-senior',
      skillIds: ['react', 'typescript'],
    },
    {
      id: 'person-2',
      name: 'Bob Backend',
      email: 'bob@company.com',
      roleId: 'role-mid',
      skillIds: ['node', 'python'],
    },
  ];

  const mockEpics: Epic[] = [
    {
      id: 'epic-auth',
      name: 'Authentication System',
      description: 'User authentication implementation',
      projectId: 'project-platform',
      status: 'active',
      effort: 55,
      targetDate: '2024-03-31',
      targetEndDate: '2024-03-31',
      requiredSkills: ['React', 'Node.js'],
      complexity: 'high',
      priority: 'critical',
    },
    {
      id: 'epic-dashboard',
      name: 'Analytics Dashboard',
      description: 'Dashboard for analytics',
      projectId: 'project-platform',
      status: 'planning',
      effort: 89,
      targetDate: '2024-06-30',
      targetEndDate: '2024-06-30',
      requiredSkills: ['React', 'Python', 'Data Visualization'],
      complexity: 'high',
      priority: 'high',
    },
  ];

  const mockRunWorkCategories: RunWorkCategory[] = [
    {
      id: 'run-maintenance',
      name: 'Maintenance',
      color: '#ff6b6b',
      description: 'Regular maintenance tasks',
    },
    {
      id: 'run-support',
      name: 'Customer Support',
      color: '#4ecdc4',
      description: 'Customer support activities',
    },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'cycle-q1-2024',
      name: 'Q1 2024',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      iterations: [
        {
          id: 'iter-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        },
        {
          id: 'iter-2',
          name: 'Sprint 2',
          startDate: '2024-01-15',
          endDate: '2024-01-28',
        },
        {
          id: 'iter-3',
          name: 'Sprint 3',
          startDate: '2024-01-29',
          endDate: '2024-02-11',
        },
        {
          id: 'iter-4',
          name: 'Sprint 4',
          startDate: '2024-02-12',
          endDate: '2024-02-25',
        },
        {
          id: 'iter-5',
          name: 'Sprint 5',
          startDate: '2024-02-26',
          endDate: '2024-03-10',
        },
        {
          id: 'iter-6',
          name: 'Sprint 6',
          startDate: '2024-03-11',
          endDate: '2024-03-31',
        },
      ],
    },
  ];

  const mockAllocations: Allocation[] = [
    {
      id: 'alloc-1',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      epicId: 'epic-auth',
      percentage: 70,
      notes: 'Frontend auth work',
    },
    {
      id: 'alloc-2',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-maintenance',
      percentage: 30,
      notes: 'Maintenance work',
    },
    {
      id: 'alloc-3',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      epicId: 'epic-dashboard',
      percentage: 130,
      notes: 'Over-allocated dashboard work',
    },
    {
      id: 'alloc-4',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      epicId: 'epic-auth',
      percentage: 80,
      notes: 'Backend auth work',
    },
  ];

  describe('Team Capacity Utilization Analysis', () => {
    it('should calculate team utilization metrics correctly', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[0], // Frontend team
        mockAllocations,
        mockCycles[0], // Q1 2024
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.teamId).toBe('team-frontend');
      expect(utilization.cycleId).toBe('cycle-q1-2024');
      // Based on actual implementation: capacity * iterations.length = 160 * 6 = 960
      expect(utilization.totalCapacityHours).toBe(960);
      expect(utilization.iterationBreakdown).toHaveLength(6);
      expect(utilization.overAllocatedSprints).toContain(2);
      expect(utilization.peakUtilization).toBe(130);
    });

    it('should handle team with no allocations', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[1], // Backend team (limited allocations)
        mockAllocations,
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.teamId).toBe('team-backend');
      expect(utilization.totalCapacityHours).toBe(720); // 120 * 6
      expect(utilization.averageUtilization).toBeGreaterThanOrEqual(0);
    });

    it('should identify skill gaps from epic requirements', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[0],
        mockAllocations,
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      // Should detect 'Data Visualization' skill gap from epic-dashboard
      expect(utilization.skillGaps).toContain('Data Visualization');
    });
  });

  describe('Allocation Consistency Validation', () => {
    it('should validate allocation consistency', () => {
      const validation = validateAllocationConsistency(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles
      );

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.errors).toBeDefined();
      expect(validation.warnings).toBeDefined();
    });

    it('should detect over-allocation scenarios', () => {
      const overAllocatedAllocations: Allocation[] = [
        {
          id: 'over-1',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 120,
          notes: 'Over-allocated',
        },
      ];

      const validation = validateAllocationConsistency(
        overAllocatedAllocations,
        mockTeams,
        mockEpics,
        mockCycles
      );

      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].type).toBe('over_allocation');
    });

    it('should handle empty allocations', () => {
      const validation = validateAllocationConsistency(
        [],
        mockTeams,
        mockEpics,
        mockCycles
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Allocation Recommendations Engine', () => {
    it('should generate allocation recommendations', () => {
      const recommendations = generateAllocationRecommendations(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.optimizations).toBeDefined();
      expect(recommendations.skillBasedRecommendations).toBeDefined();
      expect(recommendations.capacityBalancing).toBeDefined();
      expect(recommendations.runWorkOptimization).toBeDefined();
    });

    it('should handle recommendations for balanced teams', () => {
      const balancedAllocations: Allocation[] = [
        {
          id: 'balanced-1',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 90,
          notes: 'Balanced allocation',
        },
      ];

      const recommendations = generateAllocationRecommendations(
        balancedAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(recommendations.optimizations).toBeDefined();
      expect(recommendations.capacityBalancing).toBeDefined();
    });
  });

  describe('Cross-Team Dependency Analysis', () => {
    it('should analyze cross-team dependencies', () => {
      const dependencies = calculateCrossTeamDependencies(
        mockAllocations,
        mockTeams,
        mockEpics
      );

      expect(dependencies).toBeDefined();
      expect(dependencies.sharedEpics).toBeDefined();
      expect(dependencies.coordinationMeetings).toBeDefined();
      expect(dependencies.bottlenecks).toBeDefined();
    });

    it('should identify shared epics between teams', () => {
      const sharedEpicAllocations: Allocation[] = [
        {
          id: 'shared-1',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 50,
          notes: 'Frontend part',
        },
        {
          id: 'shared-2',
          teamId: 'team-backend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 50,
          notes: 'Backend part',
        },
      ];

      const dependencies = calculateCrossTeamDependencies(
        sharedEpicAllocations,
        mockTeams,
        mockEpics
      );

      expect(dependencies.sharedEpics.length).toBeGreaterThan(0);
      expect(dependencies.sharedEpics[0].epicId).toBe('epic-auth');
    });
  });

  describe('Allocation Trend Analysis', () => {
    it('should analyze allocation trends', () => {
      // Test with proper parameters (allocations, teams, epics, cycles, runWorkCategories)
      const trends = analyzeAllocationTrends(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(trends).toBeDefined();
      expect(trends.teamTrends).toBeDefined();
      expect(trends.seasonalPatterns).toBeDefined();
      expect(trends.predictions).toBeDefined();
      expect(trends.burnoutRisks).toBeDefined();
    });

    it('should handle empty cycles array', () => {
      // Test with empty cycles array to ensure the function handles it gracefully
      const trends = analyzeAllocationTrends(
        mockAllocations,
        mockTeams,
        mockEpics,
        [],
        mockRunWorkCategories
      );

      expect(trends).toBeDefined();
      expect(trends.teamTrends).toBeDefined();
      expect(trends.seasonalPatterns).toBeDefined();
      expect(trends.predictions).toBeDefined();
      expect(trends.burnoutRisks).toBeDefined();
    });
  });

  describe('Allocation Distribution Optimization', () => {
    it('should optimize allocation distribution', () => {
      const result = optimizeAllocationDistribution(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles[0]
      );

      expect(result).toBeDefined();
      expect(result.improvedAllocations).toBeDefined();
      expect(result.utilizationImprovement).toBeDefined();
      expect(result.balanceScore).toBeDefined();
    });

    it('should handle optimization with constraints', () => {
      const options = {
        targetUtilization: 85,
        respectSkillConstraints: true,
        maxContextSwitching: 2,
      };

      const result = optimizeAllocationDistribution(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles[0],
        options
      );

      expect(result.improvedAllocations).toBeDefined();
      expect(result.skillConstraintViolations).toBeDefined();
      expect(result.contextSwitchingScore).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing team data', () => {
      const result = calculateTeamCapacityUtilization(
        {
          id: 'missing-team',
          name: 'Missing Team',
          divisionId: 'missing',
          capacity: 0,
          type: 'permanent',
          status: 'active',
          created: '2024-01-01',
          modified: '2024-01-01',
        },
        mockAllocations,
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(result.teamId).toBe('missing-team');
      expect(result.totalCapacityHours).toBe(0);
    });

    it('should handle empty allocations gracefully', () => {
      const result = calculateTeamCapacityUtilization(
        mockTeams[0],
        [],
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(result.averageUtilization).toBe(0);
      expect(result.overAllocatedSprints).toHaveLength(0);
      expect(result.underAllocatedSprints).toHaveLength(0);
    });

    it('should handle cycles without iterations', () => {
      const cycleWithoutIterations: Cycle = {
        id: 'cycle-no-iterations',
        name: 'No Iterations Cycle',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      const result = calculateTeamCapacityUtilization(
        mockTeams[0],
        mockAllocations,
        cycleWithoutIterations,
        mockEpics,
        mockRunWorkCategories
      );

      // Should default to 12 iterations according to implementation
      expect(result.totalCapacityHours).toBe(1920); // 160 * 12
    });
  });
});
