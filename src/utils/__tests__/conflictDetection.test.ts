import {
  detectAllocationConflicts,
  getConflictTypeIcon,
  getConflictSeverityColor,
} from '../conflictDetection';
import { Team, Allocation, Epic, Project, Person, Cycle } from '@/types';

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Frontend Team', divisionId: 'dev', capacity: 40 },
  { id: 'team2', name: 'Backend Team', divisionId: 'dev', capacity: 40 },
];

const mockIterations: Cycle[] = [
  {
    id: 'iter1',
    name: 'Q1 2024 - Iteration 1',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    type: 'iteration',
    parentCycleId: 'q1-2024',
    status: 'planning',
  },
  {
    id: 'iter2',
    name: 'Q1 2024 - Iteration 2',
    startDate: '2024-01-15',
    endDate: '2024-01-28',
    type: 'iteration',
    parentCycleId: 'q1-2024',
    status: 'planning',
  },
];

const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Mobile App',
    description: 'Mobile application project',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    status: 'active',
    budget: 100000,
    milestones: [],
  },
];

const mockEpics: Epic[] = [
  {
    id: 'epic1',
    name: 'User Authentication',
    projectId: 'proj1',
    description: 'Implement user login and registration',
    status: 'active',
    points: 21,
  },
  {
    id: 'epic2',
    name: 'Dashboard',
    projectId: 'proj1',
    description: 'User dashboard',
    status: 'active',
    points: 13,
  },
];

const mockPeople: Person[] = [
  {
    id: 'person1',
    name: 'John Doe',
    email: 'john@example.com',
    teamId: 'team1',
    roleId: 'role1',
    isActive: true,
    startDate: '2024-01-01',
  },
];

describe('conflictDetection', () => {
  describe('detectAllocationConflicts', () => {
    it('should detect no conflicts with normal allocations', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 80,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      expect(result.conflicts).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(result.overallRiskScore).toBe(0);
    });

    it('should detect overallocation conflicts', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 80,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: 'epic2',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      expect(result.conflicts.length).toBeGreaterThan(0);

      const overallocationConflict = result.conflicts.find(
        c => c.type === 'overallocation'
      );
      expect(overallocationConflict).toBeDefined();
      expect(overallocationConflict!.severity).toBe('medium');
      expect(overallocationConflict!.affectedTeams).toContain('team1');
    });

    it('should detect critical overallocation', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 100,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 80,
          epicId: 'epic2',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      const criticalConflict = result.conflicts.find(
        c => c.type === 'overallocation' && c.severity === 'critical'
      );
      expect(criticalConflict).toBeDefined();
      expect(criticalConflict!.currentCapacity).toBe(180);
    });

    it('should detect resource contention conflicts', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team2',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: 'epic1', // Same epic
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      const contentionConflict = result.conflicts.find(
        c => c.type === 'resource-contention'
      );
      expect(contentionConflict).toBeDefined();
      expect(contentionConflict!.affectedTeams).toHaveLength(2);
      expect(contentionConflict!.affectedEpics).toContain('epic1');
    });

    it('should detect dependency violation conflicts', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team2',
          cycleId: 'q1-2024',
          iterationNumber: 2,
          percentage: 50,
          epicId: 'epic2',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      const dependencyConflict = result.conflicts.find(
        c => c.type === 'dependency-violation'
      );
      expect(dependencyConflict).toBeDefined();
      expect(dependencyConflict!.affectedEpics).toHaveLength(2);
    });

    it('should detect timeline overlap conflicts', () => {
      const manyEpics: Epic[] = [
        ...mockEpics,
        {
          id: 'epic3',
          name: 'Epic 3',
          projectId: 'proj1',
          description: '',
          status: 'active',
          points: 5,
        },
        {
          id: 'epic4',
          name: 'Epic 4',
          projectId: 'proj1',
          description: '',
          status: 'active',
          points: 5,
        },
      ];

      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 30,
          epicId: 'epic2',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc3',
          teamId: 'team2',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 50,
          epicId: 'epic3',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        manyEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      const timelineConflict = result.conflicts.find(
        c => c.type === 'timeline-overlap'
      );
      expect(timelineConflict).toBeDefined();
    });

    it('should calculate correct summary statistics', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 130, // Critical overallocation
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team2',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 110, // Medium overallocation
          epicId: 'epic2',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      expect(result.summary.total).toBe(2);
      expect(result.summary.critical).toBe(1);
      expect(result.summary.medium).toBe(1);
      expect(result.affectedTeamsCount).toBe(2);
      expect(result.overallRiskScore).toBeGreaterThan(0);
    });

    it('should filter conflicts by selected cycle', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 130,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
        {
          id: 'alloc2',
          teamId: 'team1',
          cycleId: 'q2-2024', // Different cycle
          iterationNumber: 1,
          percentage: 130,
          epicId: 'epic2',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      // Should only detect conflicts for q1-2024
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].affectedAllocations).toContain('alloc1');
      expect(result.conflicts[0].affectedAllocations).not.toContain('alloc2');
    });
  });

  describe('getConflictTypeIcon', () => {
    it('should return correct icons for conflict types', () => {
      expect(getConflictTypeIcon('overallocation')).toBe('⚠️');
      expect(getConflictTypeIcon('skill-mismatch')).toBe('🎯');
      expect(getConflictTypeIcon('dependency-violation')).toBe('🔗');
      expect(getConflictTypeIcon('resource-contention')).toBe('⚔️');
      expect(getConflictTypeIcon('timeline-overlap')).toBe('⏰');
      expect(getConflictTypeIcon('capacity-exceeded')).toBe('📊');
    });
  });

  describe('getConflictSeverityColor', () => {
    it('should return correct colors for severity levels', () => {
      expect(getConflictSeverityColor('critical')).toContain('text-red-600');
      expect(getConflictSeverityColor('high')).toContain('text-orange-600');
      expect(getConflictSeverityColor('medium')).toContain('text-yellow-600');
      expect(getConflictSeverityColor('low')).toContain('text-blue-600');
    });
  });

  describe('edge cases', () => {
    it('should handle empty allocations', () => {
      const result = detectAllocationConflicts(
        [],
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      expect(result.conflicts).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(result.overallRiskScore).toBe(0);
    });

    it('should handle empty teams', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 130,
          epicId: 'epic1',
          runWorkCategoryId: '',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        [],
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle run work allocations (without epic)', () => {
      const allocations: Allocation[] = [
        {
          id: 'alloc1',
          teamId: 'team1',
          cycleId: 'q1-2024',
          iterationNumber: 1,
          percentage: 130,
          epicId: '',
          runWorkCategoryId: 'maintenance',
          notes: '',
        },
      ];

      const result = detectAllocationConflicts(
        allocations,
        mockTeams,
        mockEpics,
        mockProjects,
        mockPeople,
        mockIterations,
        'q1-2024'
      );

      // Should still detect overallocation
      expect(result.conflicts.length).toBeGreaterThan(0);
      const overallocationConflict = result.conflicts.find(
        c => c.type === 'overallocation'
      );
      expect(overallocationConflict).toBeDefined();
    });
  });
});
