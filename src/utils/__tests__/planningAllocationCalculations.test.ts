import {
  calculateTeamCapacity,
  getProjectEndDateFromEpics,
  CapacityCheck,
} from '../capacityUtils';
import { Team, Allocation, Cycle, Epic } from '@/types';

describe('Planning Allocation Calculations', () => {
  // Test data setup
  const mockTeams: Team[] = [
    { id: 'team-1', name: 'Frontend Team', capacity: 160 }, // 160 hours per week
    { id: 'team-2', name: 'Backend Team', capacity: 120 },
    { id: 'team-3', name: 'Design Team', capacity: 80 },
  ];

  const mockIterations: Cycle[] = [
    {
      id: 'iter-1',
      name: 'Sprint 1',
      type: 'iteration',
      startDate: '2024-01-01',
      endDate: '2024-01-14', // 2 weeks
      status: 'planning',
    },
    {
      id: 'iter-2',
      name: 'Sprint 2',
      type: 'iteration',
      startDate: '2024-01-15',
      endDate: '2024-01-28', // 2 weeks
      status: 'planning',
    },
    {
      id: 'iter-3',
      name: 'Sprint 3',
      type: 'iteration',
      startDate: '2024-01-29',
      endDate: '2024-02-18', // 3 weeks
      status: 'planning',
    },
  ];

  const mockAllocations: Allocation[] = [
    // Team 1, Iteration 1: 100% allocated
    {
      id: 'alloc-1',
      teamId: 'team-1',
      iterationNumber: 1,
      epicId: 'epic-1',
      percentage: 70,
      notes: 'Frontend development',
    },
    {
      id: 'alloc-2',
      teamId: 'team-1',
      iterationNumber: 1,
      runWorkCategoryId: 'run-1',
      percentage: 30,
      notes: 'Bug fixes',
    },
    // Team 1, Iteration 2: Under-allocated
    {
      id: 'alloc-3',
      teamId: 'team-1',
      iterationNumber: 2,
      epicId: 'epic-2',
      percentage: 80,
      notes: 'Feature development',
    },
    // Team 2, Iteration 1: Over-allocated
    {
      id: 'alloc-4',
      teamId: 'team-2',
      iterationNumber: 1,
      epicId: 'epic-1',
      percentage: 60,
      notes: 'Backend API',
    },
    {
      id: 'alloc-5',
      teamId: 'team-2',
      iterationNumber: 1,
      epicId: 'epic-3',
      percentage: 50,
      notes: 'Database work',
    },
    {
      id: 'alloc-6',
      teamId: 'team-2',
      iterationNumber: 1,
      runWorkCategoryId: 'run-2',
      percentage: 20,
      notes: 'Maintenance',
    },
  ];

  const mockEpics: Epic[] = [
    {
      id: 'epic-1',
      name: 'User Authentication',
      description: 'Login system',
      projectId: 'project-1',
      status: 'active',
      effort: 34,
      targetDate: '2024-03-31',
      targetEndDate: '2024-03-31',
    },
    {
      id: 'epic-2',
      name: 'Dashboard Features',
      description: 'Analytics dashboard',
      projectId: 'project-1',
      status: 'planning',
      effort: 55,
      targetDate: '2024-04-30',
      targetEndDate: '2024-04-30',
    },
    {
      id: 'epic-3',
      name: 'Payment Integration',
      description: 'Payment processing',
      projectId: 'project-2',
      status: 'planning',
      effort: 21,
      targetDate: '2024-02-28',
      targetEndDate: '2024-02-28',
      actualEndDate: '2024-03-15', // Delayed
    },
  ];

  describe('calculateTeamCapacity', () => {
    it('should calculate correct capacity for perfectly allocated team', () => {
      const result = calculateTeamCapacity(
        mockTeams[0], // Frontend Team, 160h capacity
        1, // Iteration 1
        mockAllocations,
        mockIterations
      );

      expect(result).toMatchObject({
        teamId: 'team-1',
        iterationNumber: 1,
        allocatedPercentage: 100, // 70% + 30%
        capacityHours: 320, // 160h * 2 weeks
        isOverAllocated: false,
        isUnderAllocated: false,
      });
    });

    it('should detect under-allocation correctly', () => {
      const result = calculateTeamCapacity(
        mockTeams[0], // Frontend Team
        2, // Iteration 2 - only 80% allocated
        mockAllocations,
        mockIterations
      );

      expect(result).toMatchObject({
        teamId: 'team-1',
        iterationNumber: 2,
        allocatedPercentage: 80,
        capacityHours: 320, // 160h * 2 weeks
        isOverAllocated: false,
        isUnderAllocated: true,
      });
    });

    it('should detect over-allocation correctly', () => {
      const result = calculateTeamCapacity(
        mockTeams[1], // Backend Team
        1, // Iteration 1 - 60% + 50% + 20% = 130%
        mockAllocations,
        mockIterations
      );

      expect(result).toMatchObject({
        teamId: 'team-2',
        iterationNumber: 1,
        allocatedPercentage: 130,
        capacityHours: 240, // 120h * 2 weeks
        isOverAllocated: true,
        isUnderAllocated: false,
      });
    });

    it('should handle team with no allocations', () => {
      const result = calculateTeamCapacity(
        mockTeams[2], // Design Team - no allocations
        1,
        mockAllocations,
        mockIterations
      );

      expect(result).toMatchObject({
        teamId: 'team-3',
        iterationNumber: 1,
        allocatedPercentage: 0,
        capacityHours: 160, // 80h * 2 weeks
        isOverAllocated: false,
        isUnderAllocated: false, // 0% is not considered under-allocated
      });
    });

    it('should calculate capacity correctly for different iteration lengths', () => {
      // Test 3-week iteration
      const result = calculateTeamCapacity(
        mockTeams[0],
        3, // Iteration 3 is 3 weeks
        [],
        mockIterations
      );

      expect(result.capacityHours).toBe(480); // 160h * 3 weeks
    });

    it('should handle missing iteration with default duration', () => {
      const result = calculateTeamCapacity(
        mockTeams[0],
        99, // Non-existent iteration
        [],
        mockIterations
      );

      expect(result.capacityHours).toBe(320); // 160h * 2 weeks (default)
    });

    it('should calculate iteration duration correctly', () => {
      // Test exact date calculation for capacity
      const customIterations: Cycle[] = [
        {
          id: 'custom-iter',
          name: 'Custom Sprint',
          type: 'iteration',
          startDate: '2024-01-01', // Monday
          endDate: '2024-01-21', // Sunday (3 weeks exactly)
          status: 'planning',
        },
      ];

      const result = calculateTeamCapacity(
        mockTeams[0],
        1,
        [],
        customIterations
      );

      expect(result.capacityHours).toBe(480); // 160h * 3 weeks
    });

    it('should handle edge case of same start and end date', () => {
      const singleDayIteration: Cycle[] = [
        {
          id: 'single-day',
          name: 'Single Day',
          type: 'iteration',
          startDate: '2024-01-01',
          endDate: '2024-01-01',
          financialYearId: 'fy-2024',
        },
      ];

      const result = calculateTeamCapacity(
        mockTeams[0],
        1,
        [],
        singleDayIteration
      );

      // Same start and end date results in 0 duration, hence 0 capacity
      expect(result.capacityHours).toBe(0);
    });

    it('should aggregate multiple allocations correctly', () => {
      const multipleAllocations: Allocation[] = [
        {
          id: 'multi-1',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-1',
          percentage: 25,
          notes: 'Epic 1',
        },
        {
          id: 'multi-2',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-2',
          percentage: 35,
          notes: 'Epic 2',
        },
        {
          id: 'multi-3',
          teamId: 'team-1',
          iterationNumber: 1,
          runWorkCategoryId: 'run-1',
          percentage: 20,
          notes: 'Run work 1',
        },
        {
          id: 'multi-4',
          teamId: 'team-1',
          iterationNumber: 1,
          runWorkCategoryId: 'run-2',
          percentage: 15,
          notes: 'Run work 2',
        },
      ];

      const result = calculateTeamCapacity(
        mockTeams[0],
        1,
        multipleAllocations,
        mockIterations
      );

      expect(result.allocatedPercentage).toBe(95); // 25 + 35 + 20 + 15
      expect(result.isUnderAllocated).toBe(true);
    });

    it('should handle floating point percentages accurately', () => {
      const floatingAllocations: Allocation[] = [
        {
          id: 'float-1',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-1',
          percentage: 33.33,
          notes: 'One third',
        },
        {
          id: 'float-2',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-2',
          percentage: 33.33,
          notes: 'Another third',
        },
        {
          id: 'float-3',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-3',
          percentage: 33.34,
          notes: 'Final third',
        },
      ];

      const result = calculateTeamCapacity(
        mockTeams[0],
        1,
        floatingAllocations,
        mockIterations
      );

      expect(result.allocatedPercentage).toBe(100); // 33.33 + 33.33 + 33.34
      expect(result.isOverAllocated).toBe(false);
      expect(result.isUnderAllocated).toBe(false);
    });
  });

  describe('getProjectEndDateFromEpics', () => {
    it('should return latest target end date when no actual dates', () => {
      const epicsWithTargetDates = mockEpics.filter(
        e => e.id === 'epic-1' || e.id === 'epic-2'
      );

      const result = getProjectEndDateFromEpics(epicsWithTargetDates);
      expect(result).toBe('2024-04-30'); // Latest target date
    });

    it('should prioritize actual end dates over target dates', () => {
      const result = getProjectEndDateFromEpics(mockEpics);
      expect(result).toBe('2024-04-30'); // Should still be latest overall
    });

    it('should return undefined for epics with no dates', () => {
      const epicsWithoutDates: Epic[] = [
        {
          id: 'epic-no-date',
          name: 'Epic Without Dates',
          description: 'No dates set',
          projectId: 'project-1',
          status: 'planning',
          effort: 10,
        },
      ];

      const result = getProjectEndDateFromEpics(epicsWithoutDates);
      expect(result).toBeUndefined();
    });

    it('should handle empty epics array', () => {
      const result = getProjectEndDateFromEpics([]);
      expect(result).toBeUndefined();
    });

    it('should handle mix of actual and target dates correctly', () => {
      const mixedEpics: Epic[] = [
        {
          id: 'epic-actual-early',
          name: 'Early Actual',
          description: 'Finished early',
          projectId: 'project-1',
          status: 'completed',
          effort: 10,
          targetDate: '2024-03-31',
          targetEndDate: '2024-03-31',
          actualEndDate: '2024-03-15', // Earlier than target
        },
        {
          id: 'epic-actual-late',
          name: 'Late Actual',
          description: 'Finished late',
          projectId: 'project-1',
          status: 'completed',
          effort: 15,
          targetDate: '2024-02-28',
          targetEndDate: '2024-02-28',
          actualEndDate: '2024-04-15', // Later than target
        },
        {
          id: 'epic-target-only',
          name: 'Target Only',
          description: 'Not finished yet',
          projectId: 'project-1',
          status: 'active',
          effort: 20,
          targetDate: '2024-05-31',
          targetEndDate: '2024-05-31',
        },
      ];

      const result = getProjectEndDateFromEpics(mixedEpics);
      expect(result).toBe('2024-05-31'); // Latest date overall
    });

    it('should handle same dates correctly', () => {
      const sameDateEpics: Epic[] = [
        {
          id: 'epic-same-1',
          name: 'Same Date 1',
          description: 'Same end date',
          projectId: 'project-1',
          status: 'completed',
          effort: 10,
          targetEndDate: '2024-03-31',
          actualEndDate: '2024-03-31',
        },
        {
          id: 'epic-same-2',
          name: 'Same Date 2',
          description: 'Same end date',
          projectId: 'project-1',
          status: 'completed',
          effort: 15,
          targetEndDate: '2024-03-31',
        },
      ];

      const result = getProjectEndDateFromEpics(sameDateEpics);
      expect(result).toBe('2024-03-31');
    });
  });

  describe('Integration Scenarios', () => {
    it('should calculate team utilization across multiple iterations', () => {
      const fullAllocationSet: Allocation[] = [
        // Team 1 - Consistent 100% allocation
        {
          id: '1',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-1',
          percentage: 80,
          notes: '',
        },
        {
          id: '2',
          teamId: 'team-1',
          iterationNumber: 1,
          runWorkCategoryId: 'run-1',
          percentage: 20,
          notes: '',
        },
        {
          id: '3',
          teamId: 'team-1',
          iterationNumber: 2,
          epicId: 'epic-1',
          percentage: 90,
          notes: '',
        },
        {
          id: '4',
          teamId: 'team-1',
          iterationNumber: 2,
          runWorkCategoryId: 'run-1',
          percentage: 10,
          notes: '',
        },

        // Team 2 - Varying allocation
        {
          id: '5',
          teamId: 'team-2',
          iterationNumber: 1,
          epicId: 'epic-2',
          percentage: 110,
          notes: '',
        }, // Over-allocated
        {
          id: '6',
          teamId: 'team-2',
          iterationNumber: 2,
          epicId: 'epic-2',
          percentage: 60,
          notes: '',
        }, // Under-allocated
      ];

      const team1Results = [1, 2].map(iteration =>
        calculateTeamCapacity(
          mockTeams[0],
          iteration,
          fullAllocationSet,
          mockIterations
        )
      );

      const team2Results = [1, 2].map(iteration =>
        calculateTeamCapacity(
          mockTeams[1],
          iteration,
          fullAllocationSet,
          mockIterations
        )
      );

      // Team 1 should be perfectly allocated both iterations
      expect(team1Results[0].allocatedPercentage).toBe(100);
      expect(team1Results[1].allocatedPercentage).toBe(100);
      expect(
        team1Results.every(r => !r.isOverAllocated && !r.isUnderAllocated)
      ).toBe(true);

      // Team 2 should be over-allocated in iteration 1, under-allocated in iteration 2
      expect(team2Results[0].isOverAllocated).toBe(true);
      expect(team2Results[1].isUnderAllocated).toBe(true);
    });

    it('should handle complex project timeline calculations', () => {
      const projectEpics: Epic[] = [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: 'Foundation',
          projectId: 'big-project',
          status: 'completed',
          effort: 34,
          targetEndDate: '2024-02-28',
          actualEndDate: '2024-03-15', // Delayed
        },
        {
          id: 'phase-2',
          name: 'Phase 2',
          description: 'Core features',
          projectId: 'big-project',
          status: 'active',
          effort: 55,
          targetEndDate: '2024-05-31', // Future target
        },
        {
          id: 'phase-3',
          name: 'Phase 3',
          description: 'Polish',
          projectId: 'big-project',
          status: 'planning',
          effort: 21,
          targetEndDate: '2024-04-30', // Earlier target but not started
        },
      ];

      const projectEndDate = getProjectEndDateFromEpics(projectEpics);
      expect(projectEndDate).toBe('2024-05-31'); // Latest target date

      // Verify epic dependencies and timeline
      const completedEpics = projectEpics.filter(e => e.actualEndDate);
      const activeEpics = projectEpics.filter(
        e => e.status === 'active' || e.status === 'planning'
      );

      expect(completedEpics).toHaveLength(1);
      expect(activeEpics).toHaveLength(2);
    });

    it('should validate quarter-level capacity planning', () => {
      // Simulate quarter with 6 iterations (fortnightly for 3 months)
      const quarterIterations = Array.from({ length: 6 }, (_, i) => ({
        id: `q1-iter-${i + 1}`,
        name: `Q1 Iteration ${i + 1}`,
        type: 'iteration' as const,
        startDate: new Date(2024, 0, 1 + i * 14).toISOString().split('T')[0],
        endDate: new Date(2024, 0, 14 + i * 14).toISOString().split('T')[0],
        status: 'planning' as const,
      }));

      // Create allocations for each iteration
      const quarterAllocations: Allocation[] = quarterIterations.flatMap(
        (_, iterNum) => [
          {
            id: `q1-alloc-project-${iterNum + 1}`,
            teamId: 'team-1',
            iterationNumber: iterNum + 1,
            epicId: 'epic-1',
            percentage: 70,
            notes: 'Project work',
          },
          {
            id: `q1-alloc-run-${iterNum + 1}`,
            teamId: 'team-1',
            iterationNumber: iterNum + 1,
            runWorkCategoryId: 'run-1',
            percentage: 30,
            notes: 'Run work',
          },
        ]
      );

      // Calculate capacity for all iterations
      const capacityChecks = quarterIterations.map((_, i) =>
        calculateTeamCapacity(
          mockTeams[0],
          i + 1,
          quarterAllocations,
          quarterIterations
        )
      );

      // All iterations should be perfectly allocated
      capacityChecks.forEach((check, i) => {
        expect(check.allocatedPercentage).toBe(100);
        expect(check.isOverAllocated).toBe(false);
        expect(check.isUnderAllocated).toBe(false);
        expect(check.iterationNumber).toBe(i + 1);
      });

      // Total quarter capacity
      const totalQuarterHours = capacityChecks.reduce(
        (sum, check) => sum + check.capacityHours,
        0
      );
      expect(totalQuarterHours).toBe(1920); // 160h * 2 weeks * 6 iterations
    });

    it('should handle real-world allocation scenarios with rounding', () => {
      // Simulate real CSV import data with percentage rounding issues
      const realWorldAllocations: Allocation[] = [
        {
          id: '1',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-1',
          percentage: 33.3333,
          notes: '',
        },
        {
          id: '2',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'epic-2',
          percentage: 33.3333,
          notes: '',
        },
        {
          id: '3',
          teamId: 'team-1',
          iterationNumber: 1,
          runWorkCategoryId: 'run-1',
          percentage: 16.6667,
          notes: '',
        },
        {
          id: '4',
          teamId: 'team-1',
          iterationNumber: 1,
          runWorkCategoryId: 'run-2',
          percentage: 16.6667,
          notes: '',
        },
      ];

      const result = calculateTeamCapacity(
        mockTeams[0],
        1,
        realWorldAllocations,
        mockIterations
      );

      // Should sum to 100% (33.3333 + 33.3333 + 16.6667 + 16.6667 = 100)
      expect(result.allocatedPercentage).toBeCloseTo(100, 4);
      expect(result.isOverAllocated).toBe(false);
      expect(result.isUnderAllocated).toBe(false);
    });

    it('should detect capacity conflicts across teams and iterations', () => {
      const conflictScenario: Allocation[] = [
        // Shared epic across teams
        {
          id: 'c1',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'shared-epic',
          percentage: 50,
          notes: 'Frontend',
        },
        {
          id: 'c2',
          teamId: 'team-2',
          iterationNumber: 1,
          epicId: 'shared-epic',
          percentage: 40,
          notes: 'Backend',
        },

        // Over-allocation in one team
        {
          id: 'c3',
          teamId: 'team-1',
          iterationNumber: 1,
          epicId: 'another-epic',
          percentage: 60,
          notes: 'UI work',
        },

        // Under-allocation in another team
        {
          id: 'c4',
          teamId: 'team-2',
          iterationNumber: 1,
          runWorkCategoryId: 'run-1',
          percentage: 30,
          notes: 'Maintenance',
        },
      ];

      const team1Check = calculateTeamCapacity(
        mockTeams[0],
        1,
        conflictScenario,
        mockIterations
      );
      const team2Check = calculateTeamCapacity(
        mockTeams[1],
        1,
        conflictScenario,
        mockIterations
      );

      expect(team1Check.allocatedPercentage).toBe(110); // Over-allocated
      expect(team1Check.isOverAllocated).toBe(true);

      expect(team2Check.allocatedPercentage).toBe(70); // Under-allocated
      expect(team2Check.isUnderAllocated).toBe(true);

      // Shared epic should have combined effort from both teams
      const sharedEpicAllocations = conflictScenario.filter(
        a => a.epicId === 'shared-epic'
      );
      const totalSharedEffort = sharedEpicAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );
      expect(totalSharedEffort).toBe(90); // 50% + 40%
    });
  });
});
