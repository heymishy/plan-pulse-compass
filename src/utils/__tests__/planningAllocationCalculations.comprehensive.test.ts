import { describe, it, expect, vi } from 'vitest';
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
 * Targets 80% coverage for GitHub Issue #34
 */
describe('Planning Allocation Calculations - Comprehensive Coverage', () => {
  // Comprehensive test data representing a realistic organization
  const mockTeams: Team[] = [
    {
      id: 'team-frontend',
      name: 'Frontend Team',
      divisionId: 'engineering',
      capacity: 160,
      productOwnerId: 'person-po-1',
      skills: ['React', 'TypeScript', 'CSS', 'Testing'],
      members: ['person-1', 'person-2', 'person-3', 'person-4'],
      targetSkills: ['React', 'TypeScript', 'Next.js'],
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
      skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis'],
      members: ['person-5', 'person-6', 'person-7'],
      targetSkills: ['Node.js', 'Python', 'GraphQL'],
      type: 'permanent',
      status: 'active',
      created: '2024-01-01',
      modified: '2024-01-01',
    },
    {
      id: 'team-mobile',
      name: 'Mobile Team',
      divisionId: 'engineering',
      capacity: 80,
      productOwnerId: 'person-po-3',
      skills: ['React Native', 'Swift', 'Kotlin'],
      members: ['person-8', 'person-9'],
      targetSkills: ['React Native', 'Flutter'],
      type: 'project',
      status: 'active',
      created: '2024-01-01',
      modified: '2024-01-01',
    },
    {
      id: 'team-devops',
      name: 'DevOps Team',
      divisionId: 'engineering',
      capacity: 40,
      productOwnerId: 'person-po-4',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
      members: ['person-10'],
      targetSkills: ['Kubernetes', 'AWS', 'Monitoring'],
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
      name: 'Bob Frontend',
      email: 'bob@company.com',
      roleId: 'role-mid',
      skillIds: ['react', 'css'],
    },
    {
      id: 'person-3',
      name: 'Charlie Frontend',
      email: 'charlie@company.com',
      roleId: 'role-junior',
      skillIds: ['javascript', 'css'],
    },
    {
      id: 'person-4',
      name: 'Diana Frontend',
      email: 'diana@company.com',
      roleId: 'role-senior',
      skillIds: ['react', 'testing'],
    },
    {
      id: 'person-5',
      name: 'Eve Backend',
      email: 'eve@company.com',
      roleId: 'role-senior',
      skillIds: ['node', 'python'],
    },
    {
      id: 'person-6',
      name: 'Frank Backend',
      email: 'frank@company.com',
      roleId: 'role-mid',
      skillIds: ['node', 'postgresql'],
    },
    {
      id: 'person-7',
      name: 'Grace Backend',
      email: 'grace@company.com',
      roleId: 'role-junior',
      skillIds: ['python', 'redis'],
    },
    {
      id: 'person-8',
      name: 'Henry Mobile',
      email: 'henry@company.com',
      roleId: 'role-senior',
      skillIds: ['react-native', 'swift'],
    },
    {
      id: 'person-9',
      name: 'Ivy Mobile',
      email: 'ivy@company.com',
      roleId: 'role-mid',
      skillIds: ['react-native', 'kotlin'],
    },
    {
      id: 'person-10',
      name: 'Jack DevOps',
      email: 'jack@company.com',
      roleId: 'role-senior',
      skillIds: ['docker', 'kubernetes'],
    },
  ];

  const mockEpics: Epic[] = [
    {
      id: 'epic-auth',
      name: 'Authentication Overhaul',
      description: 'Complete authentication system redesign',
      projectId: 'project-platform',
      status: 'active',
      effort: 55,
      targetDate: '2024-03-31',
      targetEndDate: '2024-03-31',
      requiredSkills: ['React', 'Node.js', 'Security'],
      complexity: 'high',
      priority: 'critical',
    },
    {
      id: 'epic-dashboard',
      name: 'Analytics Dashboard',
      description: 'Real-time analytics and reporting',
      projectId: 'project-platform',
      status: 'planning',
      effort: 89,
      targetDate: '2024-06-30',
      targetEndDate: '2024-06-30',
      requiredSkills: ['React', 'Python', 'Data Visualization'],
      complexity: 'high',
      priority: 'high',
    },
    {
      id: 'epic-mobile-app',
      name: 'Mobile App V2',
      description: 'Mobile app rewrite with new features',
      projectId: 'project-mobile',
      status: 'planning',
      effort: 144,
      targetDate: '2024-09-30',
      targetEndDate: '2024-09-30',
      requiredSkills: ['React Native', 'Mobile UI/UX'],
      complexity: 'very-high',
      priority: 'high',
    },
    {
      id: 'epic-infrastructure',
      name: 'Infrastructure Modernization',
      description: 'Migrate to cloud-native architecture',
      projectId: 'project-infrastructure',
      status: 'planning',
      effort: 233,
      targetDate: '2024-12-31',
      targetEndDate: '2024-12-31',
      requiredSkills: ['Kubernetes', 'AWS', 'Microservices'],
      complexity: 'very-high',
      priority: 'medium',
    },
  ];

  const mockRunWorkCategories: RunWorkCategory[] = [
    {
      id: 'run-bugs',
      name: 'Bug Fixes',
      description: 'Production bug fixes',
      color: '#ef4444',
    },
    {
      id: 'run-support',
      name: 'Customer Support',
      description: 'Customer tickets and support',
      color: '#f59e0b',
    },
    {
      id: 'run-maintenance',
      name: 'Maintenance',
      description: 'System maintenance and updates',
      color: '#8b5cf6',
    },
    {
      id: 'run-security',
      name: 'Security',
      description: 'Security patches and audits',
      color: '#dc2626',
    },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'cycle-q1-2024',
      name: 'Q1 2024',
      type: 'quarterly',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      status: 'active',
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
          endDate: '2024-03-11',
        },
        {
          id: 'iter-6',
          name: 'Sprint 6',
          startDate: '2024-03-12',
          endDate: '2024-03-31',
        },
      ],
    },
    {
      id: 'cycle-q2-2024',
      name: 'Q2 2024',
      type: 'quarterly',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      status: 'planning',
      iterations: [
        {
          id: 'iter-7',
          name: 'Sprint 7',
          startDate: '2024-04-01',
          endDate: '2024-04-14',
        },
        {
          id: 'iter-8',
          name: 'Sprint 8',
          startDate: '2024-04-15',
          endDate: '2024-04-28',
        },
        {
          id: 'iter-9',
          name: 'Sprint 9',
          startDate: '2024-04-29',
          endDate: '2024-05-12',
        },
        {
          id: 'iter-10',
          name: 'Sprint 10',
          startDate: '2024-05-13',
          endDate: '2024-05-26',
        },
        {
          id: 'iter-11',
          name: 'Sprint 11',
          startDate: '2024-05-27',
          endDate: '2024-06-09',
        },
        {
          id: 'iter-12',
          name: 'Sprint 12',
          startDate: '2024-06-10',
          endDate: '2024-06-30',
        },
      ],
    },
  ];

  // Comprehensive allocation data representing different scenarios
  const mockAllocations: Allocation[] = [
    // Q1 2024 - Sprint 1: Mixed allocation patterns
    {
      id: 'alloc-1',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      epicId: 'epic-auth',
      percentage: 70,
      notes: 'Auth frontend work',
    },
    {
      id: 'alloc-2',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-bugs',
      percentage: 20,
      notes: 'Bug fixes',
    },
    {
      id: 'alloc-3',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-support',
      percentage: 10,
      notes: 'Customer support',
    },

    {
      id: 'alloc-4',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      epicId: 'epic-auth',
      percentage: 80,
      notes: 'Auth backend work',
    },
    {
      id: 'alloc-5',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-maintenance',
      percentage: 20,
      notes: 'Maintenance',
    },

    {
      id: 'alloc-6',
      teamId: 'team-mobile',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      epicId: 'epic-mobile-app',
      percentage: 60,
      notes: 'Mobile app planning',
    },
    {
      id: 'alloc-7',
      teamId: 'team-mobile',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-bugs',
      percentage: 40,
      notes: 'Mobile bug fixes',
    },

    {
      id: 'alloc-8',
      teamId: 'team-devops',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      epicId: 'epic-infrastructure',
      percentage: 50,
      notes: 'Infrastructure planning',
    },
    {
      id: 'alloc-9',
      teamId: 'team-devops',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-security',
      percentage: 30,
      notes: 'Security patches',
    },
    {
      id: 'alloc-10',
      teamId: 'team-devops',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-maintenance',
      percentage: 20,
      notes: 'System maintenance',
    },

    // Q1 2024 - Sprint 2: Over-allocation scenario
    {
      id: 'alloc-11',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      epicId: 'epic-auth',
      percentage: 60,
      notes: 'Auth continued',
    },
    {
      id: 'alloc-12',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      epicId: 'epic-dashboard',
      percentage: 40,
      notes: 'Dashboard start',
    },
    {
      id: 'alloc-13',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      runWorkCategoryId: 'run-bugs',
      percentage: 30,
      notes: 'Bug fixes',
    },

    {
      id: 'alloc-14',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      epicId: 'epic-auth',
      percentage: 50,
      notes: 'Auth backend continued',
    },
    {
      id: 'alloc-15',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      epicId: 'epic-dashboard',
      percentage: 30,
      notes: 'Dashboard backend',
    },
    {
      id: 'alloc-16',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 2,
      runWorkCategoryId: 'run-maintenance',
      percentage: 20,
      notes: 'Maintenance',
    },

    // Q1 2024 - Sprint 3: Under-allocation scenario
    {
      id: 'alloc-17',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 3,
      epicId: 'epic-dashboard',
      percentage: 60,
      notes: 'Dashboard UI',
    },
    {
      id: 'alloc-18',
      teamId: 'team-frontend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 3,
      runWorkCategoryId: 'run-support',
      percentage: 20,
      notes: 'Support tickets',
    },

    {
      id: 'alloc-19',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 3,
      epicId: 'epic-dashboard',
      percentage: 70,
      notes: 'Dashboard API',
    },
    {
      id: 'alloc-20',
      teamId: 'team-backend',
      cycleId: 'cycle-q1-2024',
      iterationNumber: 3,
      runWorkCategoryId: 'run-bugs',
      percentage: 15,
      notes: 'Bug fixes',
    },

    // Q2 2024 - Sprint 7: Future planning
    {
      id: 'alloc-21',
      teamId: 'team-mobile',
      cycleId: 'cycle-q2-2024',
      iterationNumber: 1,
      epicId: 'epic-mobile-app',
      percentage: 90,
      notes: 'Mobile app development',
    },
    {
      id: 'alloc-22',
      teamId: 'team-mobile',
      cycleId: 'cycle-q2-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-bugs',
      percentage: 10,
      notes: 'Bug fixes',
    },

    {
      id: 'alloc-23',
      teamId: 'team-devops',
      cycleId: 'cycle-q2-2024',
      iterationNumber: 1,
      epicId: 'epic-infrastructure',
      percentage: 80,
      notes: 'Infrastructure implementation',
    },
    {
      id: 'alloc-24',
      teamId: 'team-devops',
      cycleId: 'cycle-q2-2024',
      iterationNumber: 1,
      runWorkCategoryId: 'run-security',
      percentage: 20,
      notes: 'Security audits',
    },
  ];

  describe('Team Capacity Utilization Analysis', () => {
    it('should calculate comprehensive team utilization metrics', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[0], // Frontend team
        mockAllocations,
        mockCycles[0], // Q1 2024
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.teamId).toBe('team-frontend');
      expect(utilization.cycleId).toBe('cycle-q1-2024');
      expect(utilization.totalCapacityHours).toBe(1920); // 160 hours * 12 weeks
      expect(utilization.averageUtilization).toBeCloseTo(78.33, 1); // (100 + 130 + 80) / 3
      expect(utilization.peakUtilization).toBe(130); // Sprint 2 over-allocation
      expect(utilization.minUtilization).toBe(80); // Sprint 3 under-allocation
      expect(utilization.utilizationTrend).toBe('declining');
      expect(utilization.overAllocatedSprints).toEqual([2]);
      expect(utilization.underAllocatedSprints).toEqual([3]);
    });

    it('should identify skill gaps and recommendations', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[0],
        mockAllocations,
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.skillGaps).toContain('Data Visualization');
      expect(utilization.recommendations).toContain(
        'Consider training team members in Data Visualization skills'
      );
      expect(utilization.recommendations).toContain(
        'Redistribute work from Sprint 2 to Sprint 3'
      );
    });

    it('should handle team with perfect allocation', () => {
      const perfectAllocations: Allocation[] = [
        {
          id: 'perfect-1',
          teamId: 'team-backend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 100,
          notes: 'Perfect allocation',
        },
        {
          id: 'perfect-2',
          teamId: 'team-backend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 2,
          epicId: 'epic-auth',
          percentage: 100,
          notes: 'Perfect allocation',
        },
        {
          id: 'perfect-3',
          teamId: 'team-backend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 3,
          epicId: 'epic-auth',
          percentage: 100,
          notes: 'Perfect allocation',
        },
      ];

      const utilization = calculateTeamCapacityUtilization(
        mockTeams[1], // Backend team
        perfectAllocations,
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.averageUtilization).toBe(100);
      expect(utilization.utilizationTrend).toBe('stable');
      expect(utilization.overAllocatedSprints).toEqual([]);
      expect(utilization.underAllocatedSprints).toEqual([]);
    });

    it('should handle team with no allocations', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[3], // DevOps team (assuming no allocations in subset)
        [],
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.averageUtilization).toBe(0);
      expect(utilization.utilizationTrend).toBe('stable');
      expect(utilization.recommendations).toContain(
        'Team appears to have no work allocated'
      );
    });

    it('should calculate accurate working hours based on iteration lengths', () => {
      const customCycle: Cycle = {
        id: 'custom-cycle',
        name: 'Custom Cycle',
        type: 'quarterly',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        status: 'active',
        iterations: [
          {
            id: 'iter-1',
            name: 'Sprint 1',
            startDate: '2024-01-01',
            endDate: '2024-01-07',
          }, // 1 week
          {
            id: 'iter-2',
            name: 'Sprint 2',
            startDate: '2024-01-08',
            endDate: '2024-01-28',
          }, // 3 weeks
          {
            id: 'iter-3',
            name: 'Sprint 3',
            startDate: '2024-01-29',
            endDate: '2024-03-31',
          }, // 9 weeks
        ],
      };

      const utilization = calculateTeamCapacityUtilization(
        mockTeams[0],
        mockAllocations,
        customCycle,
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.totalCapacityHours).toBe(2080); // 160 * (1 + 3 + 9) weeks
      expect(utilization.iterationBreakdown).toHaveLength(3);
      expect(utilization.iterationBreakdown[0].capacityHours).toBe(160); // 1 week
      expect(utilization.iterationBreakdown[1].capacityHours).toBe(480); // 3 weeks
      expect(utilization.iterationBreakdown[2].capacityHours).toBe(1440); // 9 weeks
    });
  });

  describe('Allocation Consistency Validation', () => {
    it('should validate allocation consistency across teams and epics', () => {
      const validation = validateAllocationConsistency(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1); // Frontend team Sprint 2 over-allocation
      expect(validation.warnings).toHaveLength(2); // Frontend team Sprint 3 under-allocation, potentially others
      expect(validation.errors[0].type).toBe('over_allocation');
      expect(validation.errors[0].teamId).toBe('team-frontend');
      expect(validation.errors[0].iterationNumber).toBe(2);
      expect(validation.errors[0].totalPercentage).toBe(130);
    });

    it('should identify orphaned allocations', () => {
      const orphanedAllocations: Allocation[] = [
        ...mockAllocations,
        {
          id: 'orphan-1',
          teamId: 'non-existent-team',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 50,
          notes: 'Orphaned',
        },
        {
          id: 'orphan-2',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'non-existent-epic',
          percentage: 30,
          notes: 'Orphaned',
        },
      ];

      const validation = validateAllocationConsistency(
        orphanedAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(validation.orphanedAllocations).toHaveLength(2);
      expect(validation.orphanedAllocations[0].reason).toBe('Team not found');
      expect(validation.orphanedAllocations[1].reason).toBe('Epic not found');
    });

    it('should detect skill mismatches', () => {
      const validation = validateAllocationConsistency(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(validation.skillMismatches).toBeDefined();
      expect(validation.skillMismatches.length).toBeGreaterThan(0);

      // Frontend team working on infrastructure (skill mismatch)
      const infraMismatch = validation.skillMismatches.find(
        mismatch => mismatch.epicId === 'epic-infrastructure'
      );
      expect(infraMismatch).toBeDefined();
    });

    it('should validate epic dependency constraints', () => {
      const dependentEpics: Epic[] = [
        ...mockEpics,
        {
          id: 'epic-dependent',
          name: 'Dependent Epic',
          description: 'Depends on authentication',
          projectId: 'project-platform',
          status: 'blocked',
          effort: 34,
          targetDate: '2024-04-30',
          targetEndDate: '2024-04-30',
          dependencies: ['epic-auth'],
          requiredSkills: ['React'],
          complexity: 'medium',
          priority: 'medium',
        },
      ];

      const dependentAllocations: Allocation[] = [
        ...mockAllocations,
        {
          id: 'dep-1',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-dependent',
          percentage: 20,
          notes: 'Dependent work',
        },
      ];

      const validation = validateAllocationConsistency(
        dependentAllocations,
        mockTeams,
        dependentEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(validation.dependencyViolations).toHaveLength(1);
      expect(validation.dependencyViolations[0].epicId).toBe('epic-dependent');
      expect(validation.dependencyViolations[0].reason).toBe(
        'Allocated before dependency epic-auth is completed'
      );
    });
  });

  describe('Allocation Recommendations Engine', () => {
    it('should generate optimization recommendations', () => {
      const recommendations = generateAllocationRecommendations(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(recommendations.optimizations).toHaveLength(3);
      expect(recommendations.optimizations[0].type).toBe('redistribute');
      expect(recommendations.optimizations[0].fromTeam).toBe('team-frontend');
      expect(recommendations.optimizations[0].fromIteration).toBe(2);
      expect(recommendations.optimizations[0].toIteration).toBe(3);
      expect(recommendations.optimizations[0].percentage).toBe(30);
    });

    it('should recommend skill-based team assignments', () => {
      const recommendations = generateAllocationRecommendations(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(recommendations.skillBasedRecommendations).toHaveLength(2);
      expect(recommendations.skillBasedRecommendations[0].epicId).toBe(
        'epic-infrastructure'
      );
      expect(recommendations.skillBasedRecommendations[0].recommendedTeam).toBe(
        'team-devops'
      );
      expect(recommendations.skillBasedRecommendations[0].reason).toBe(
        'Team has required skills: Kubernetes, AWS'
      );
    });

    it('should suggest capacity balancing', () => {
      const recommendations = generateAllocationRecommendations(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(recommendations.capacityBalancing).toHaveLength(1);
      expect(
        recommendations.capacityBalancing[0].quarterlyUtilization
      ).toBeCloseTo(78.33, 1);
      expect(recommendations.capacityBalancing[0].targetUtilization).toBe(85);
      expect(recommendations.capacityBalancing[0].adjustmentNeeded).toBe(6.67);
    });

    it('should recommend run work optimization', () => {
      const recommendations = generateAllocationRecommendations(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(recommendations.runWorkOptimization).toBeDefined();
      expect(
        recommendations.runWorkOptimization.currentRunWorkPercentage
      ).toBeCloseTo(22.5, 1);
      expect(
        recommendations.runWorkOptimization.recommendedRunWorkPercentage
      ).toBe(20);
      expect(recommendations.runWorkOptimization.adjustment).toBe(-2.5);
    });
  });

  describe('Cross-Team Dependency Analysis', () => {
    it('should identify cross-team epic dependencies', () => {
      const dependencies = calculateCrossTeamDependencies(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles
      );

      expect(dependencies.sharedEpics).toHaveLength(2);
      expect(dependencies.sharedEpics[0].epicId).toBe('epic-auth');
      expect(dependencies.sharedEpics[0].teams).toEqual([
        'team-frontend',
        'team-backend',
      ]);
      expect(dependencies.sharedEpics[0].coordinationRisk).toBe('medium');
    });

    it('should calculate dependency impact scores', () => {
      const dependencies = calculateCrossTeamDependencies(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles
      );

      const authDependency = dependencies.sharedEpics.find(
        dep => dep.epicId === 'epic-auth'
      );
      expect(authDependency.impactScore).toBe(7.5); // Based on teams involved and effort
      expect(authDependency.criticalPath).toBe(true);
    });

    it('should suggest coordination meetings', () => {
      const dependencies = calculateCrossTeamDependencies(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles
      );

      expect(dependencies.coordinationMeetings).toHaveLength(2);
      expect(dependencies.coordinationMeetings[0].epicId).toBe('epic-auth');
      expect(dependencies.coordinationMeetings[0].frequency).toBe('weekly');
      expect(dependencies.coordinationMeetings[0].participants).toEqual([
        'team-frontend',
        'team-backend',
      ]);
    });

    it('should identify potential bottlenecks', () => {
      const dependencies = calculateCrossTeamDependencies(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles
      );

      expect(dependencies.bottlenecks).toHaveLength(1);
      expect(dependencies.bottlenecks[0].teamId).toBe('team-backend');
      expect(dependencies.bottlenecks[0].reason).toBe(
        'Team is critical path for multiple epics'
      );
      expect(dependencies.bottlenecks[0].affectedEpics).toEqual([
        'epic-auth',
        'epic-dashboard',
      ]);
    });
  });

  describe('Allocation Trend Analysis', () => {
    it('should analyze allocation trends over time', () => {
      const trends = analyzeAllocationTrends(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(trends.teamTrends).toHaveLength(4);
      expect(trends.teamTrends[0].teamId).toBe('team-frontend');
      expect(trends.teamTrends[0].trend).toBe('declining');
      expect(trends.teamTrends[0].velocityChange).toBe(-25); // From 100% to 80% to 80%
    });

    it('should identify seasonal patterns', () => {
      const trends = analyzeAllocationTrends(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(trends.seasonalPatterns).toBeDefined();
      expect(trends.seasonalPatterns.runWorkPeak).toBe('sprint-2');
      expect(trends.seasonalPatterns.projectWorkPeak).toBe('sprint-1');
    });

    it('should predict future allocation needs', () => {
      const trends = analyzeAllocationTrends(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(trends.predictions).toHaveLength(2);
      expect(trends.predictions[0].cycleId).toBe('cycle-q2-2024');
      expect(trends.predictions[0].predictedUtilization).toBeCloseTo(85, 0);
      expect(trends.predictions[0].confidence).toBe('medium');
    });

    it('should identify burnout risk indicators', () => {
      const highUtilizationAllocations: Allocation[] = [
        {
          id: 'high-1',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 120,
          notes: 'High utilization',
        },
        {
          id: 'high-2',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 2,
          epicId: 'epic-auth',
          percentage: 130,
          notes: 'High utilization',
        },
        {
          id: 'high-3',
          teamId: 'team-frontend',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 3,
          epicId: 'epic-auth',
          percentage: 125,
          notes: 'High utilization',
        },
      ];

      const trends = analyzeAllocationTrends(
        highUtilizationAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(trends.burnoutRisks).toHaveLength(1);
      expect(trends.burnoutRisks[0].teamId).toBe('team-frontend');
      expect(trends.burnoutRisks[0].riskLevel).toBe('high');
      expect(trends.burnoutRisks[0].consecutiveOverAllocation).toBe(3);
    });
  });

  describe('Allocation Distribution Optimization', () => {
    it('should optimize allocation distribution across teams', () => {
      const optimized = optimizeAllocationDistribution(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories,
        { targetUtilization: 85 }
      );

      expect(optimized.improvedAllocations).toHaveLength(
        mockAllocations.length
      );
      expect(optimized.utilizationImprovement).toBeGreaterThan(0);
      expect(optimized.balanceScore).toBeGreaterThan(0.8);
    });

    it('should respect team skill constraints during optimization', () => {
      const optimized = optimizeAllocationDistribution(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories,
        { respectSkillConstraints: true }
      );

      expect(optimized.skillConstraintViolations).toEqual([]);
      expect(optimized.skillMatchScore).toBeGreaterThan(0.7);
    });

    it('should handle optimization with fixed allocations', () => {
      const fixedAllocations = ['alloc-1', 'alloc-4']; // Critical auth work

      const optimized = optimizeAllocationDistribution(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories,
        { fixedAllocations, targetUtilization: 85 }
      );

      const fixedAlloc1 = optimized.improvedAllocations.find(
        a => a.id === 'alloc-1'
      );
      const fixedAlloc4 = optimized.improvedAllocations.find(
        a => a.id === 'alloc-4'
      );

      expect(fixedAlloc1.percentage).toBe(70); // Unchanged
      expect(fixedAlloc4.percentage).toBe(80); // Unchanged
    });

    it('should optimize for minimum context switching', () => {
      const optimized = optimizeAllocationDistribution(
        mockAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories,
        { minimizeContextSwitching: true }
      );

      expect(optimized.contextSwitchingScore).toBeGreaterThan(0.8);
      expect(optimized.epicContinuityScore).toBeGreaterThan(0.7);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large allocation datasets efficiently', () => {
      // Generate large dataset
      const largeAllocations = Array.from({ length: 10000 }, (_, i) => ({
        id: `large-alloc-${i}`,
        teamId: mockTeams[i % mockTeams.length].id,
        cycleId: mockCycles[i % mockCycles.length].id,
        iterationNumber: (i % 6) + 1,
        epicId: mockEpics[i % mockEpics.length].id,
        percentage: Math.floor(Math.random() * 50) + 25,
        notes: `Large allocation ${i}`,
      }));

      const startTime = performance.now();
      const validation = validateAllocationConsistency(
        largeAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(validation.isValid).toBeDefined();
    });

    it('should optimize memory usage during calculations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple calculations
      for (let i = 0; i < 100; i++) {
        calculateTeamCapacityUtilization(
          mockTeams[i % mockTeams.length],
          mockAllocations,
          mockCycles[0],
          mockEpics,
          mockRunWorkCategories
        );
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);

      expect(memoryIncreaseInMB).toBeLessThan(20); // Should not increase memory by more than 20MB
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing team data gracefully', () => {
      const invalidAllocations: Allocation[] = [
        {
          id: 'invalid-1',
          teamId: 'non-existent',
          cycleId: 'cycle-q1-2024',
          iterationNumber: 1,
          epicId: 'epic-auth',
          percentage: 50,
          notes: 'Invalid team',
        },
      ];

      const validation = validateAllocationConsistency(
        invalidAllocations,
        mockTeams,
        mockEpics,
        mockCycles,
        mockRunWorkCategories
      );

      expect(validation.isValid).toBe(false);
      expect(validation.orphanedAllocations).toHaveLength(1);
    });

    it('should handle zero-capacity teams', () => {
      const zeroCapacityTeam: Team = {
        ...mockTeams[0],
        capacity: 0,
      };

      const utilization = calculateTeamCapacityUtilization(
        zeroCapacityTeam,
        mockAllocations,
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.totalCapacityHours).toBe(0);
      expect(utilization.averageUtilization).toBe(0);
      expect(utilization.warnings).toContain('Team has zero capacity');
    });

    it('should handle empty allocation arrays', () => {
      const utilization = calculateTeamCapacityUtilization(
        mockTeams[0],
        [],
        mockCycles[0],
        mockEpics,
        mockRunWorkCategories
      );

      expect(utilization.averageUtilization).toBe(0);
      expect(utilization.recommendations).toContain(
        'Team appears to have no work allocated'
      );
    });
  });
});
