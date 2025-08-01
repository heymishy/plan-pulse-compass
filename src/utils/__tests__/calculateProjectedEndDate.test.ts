import { describe, it, expect } from 'vitest';
import { calculateProjectedEndDate } from '../calculateProjectedEndDate';
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

// Mock data factory functions following TypeScript interfaces
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'in-progress',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: 100000,
  milestones: [],
  priority: 2,
  ranking: 1,
  priorityOrder: 2,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockEpic = (overrides: Partial<Epic> = {}): Epic => ({
  id: 'epic-1',
  name: 'Test Epic',
  description: 'Test epic description',
  projectId: 'proj-1',
  status: 'in-progress',
  priority: 'high',
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  estimatedEffort: 40,
  ranking: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockMilestone = (
  overrides: Partial<Milestone> = {}
): Milestone => ({
  id: 'milestone-1',
  name: 'Test Milestone',
  description: 'Test milestone description',
  projectId: 'proj-1',
  dueDate: '2024-06-30',
  status: 'not-started',
  isCompleted: false,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockAllocation = (
  overrides: Partial<Allocation> = {}
): Allocation => ({
  id: 'alloc-1',
  teamId: 'team-1',
  cycleId: 'cycle-1',
  iterationNumber: 1,
  epicId: 'epic-1',
  percentage: 80,
  notes: '',
  ...overrides,
});

const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Test Team',
  description: 'Test team description',
  type: 'permanent',
  status: 'active',
  divisionId: 'div-1',
  capacity: 40,
  targetSkills: [],
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockPerson = (overrides: Partial<Person> = {}): Person => ({
  id: 'person-1',
  name: 'Test Person',
  email: 'test@example.com',
  roleId: 'role-1',
  teamId: 'team-1',
  isActive: true,
  employmentType: 'permanent',
  annualSalary: 80000,
  startDate: '2024-01-01',
  skills: [],
  ...overrides,
});

const createMockRole = (overrides: Partial<Role> = {}): Role => ({
  id: 'role-1',
  name: 'Developer',
  rateType: 'annual',
  defaultAnnualSalary: 80000,
  description: 'Software Developer',
  ...overrides,
});

const createMockCycle = (overrides: Partial<Cycle> = {}): Cycle => ({
  id: 'cycle-1',
  name: 'Q1 2024',
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  type: 'quarterly',
  financialYearId: 'fy-2024',
  ...overrides,
});

describe('calculateProjectedEndDate', () => {
  describe('when project has no epics or milestones', () => {
    it('should return the original project end date', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const result = calculateProjectedEndDate(
        project,
        [],
        [],
        [],
        [],
        [],
        [],
        []
      );

      expect(result).toBe('2024-12-31');
    });

    it('should return null when project has no end date', () => {
      const project = createMockProject({
        endDate: undefined,
      });

      const result = calculateProjectedEndDate(
        project,
        [],
        [],
        [],
        [],
        [],
        [],
        []
      );

      expect(result).toBeNull();
    });
  });

  describe('when project has completed epics and milestones', () => {
    it('should return the latest completion date from epics', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'completed',
          endDate: '2024-03-15',
        }),
        createMockEpic({
          id: 'epic-2',
          projectId: 'proj-1',
          status: 'completed',
          endDate: '2024-04-30',
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        [],
        [],
        [],
        [],
        []
      );

      expect(result).toBe('2024-04-30');
    });

    it('should return the latest completion date from milestones', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const milestones = [
        createMockMilestone({
          id: 'milestone-1',
          projectId: 'proj-1',
          status: 'completed',
          dueDate: '2024-05-15',
          isCompleted: true,
        }),
        createMockMilestone({
          id: 'milestone-2',
          projectId: 'proj-1',
          status: 'completed',
          dueDate: '2024-06-30',
          isCompleted: true,
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        [],
        milestones,
        [],
        [],
        [],
        [],
        []
      );

      expect(result).toBe('2024-06-30');
    });
  });

  describe('when project has in-progress work', () => {
    it('should calculate projected end date based on team capacity and epic effort', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: 60, // story points
          startDate: '2024-01-01',
        }),
        createMockEpic({
          id: 'epic-2',
          projectId: 'proj-1',
          status: 'todo',
          estimatedEffort: 80,
        }),
      ];

      const allocations = [
        createMockAllocation({
          teamId: 'team-1',
          epicId: 'epic-1',
          percentage: 80,
          cycleId: 'cycle-1',
        }),
        createMockAllocation({
          teamId: 'team-2',
          epicId: 'epic-2',
          percentage: 60,
          cycleId: 'cycle-2',
        }),
      ];

      const teams = [
        createMockTeam({
          id: 'team-1',
          capacity: 40, // hours per iteration
        }),
        createMockTeam({
          id: 'team-2',
          capacity: 35,
        }),
      ];

      const cycles = [
        createMockCycle({
          id: 'cycle-1',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        }),
        createMockCycle({
          id: 'cycle-2',
          startDate: '2024-04-01',
          endDate: '2024-06-30',
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        allocations,
        teams,
        [],
        [],
        cycles
      );

      // Should calculate based on team velocity and effort remaining
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(new Date(result!).getTime()).toBeGreaterThan(
        new Date('2024-01-01').getTime()
      );
    });

    it('should handle teams with no allocations gracefully', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: 40,
        }),
      ];

      const teams = [
        createMockTeam({
          id: 'team-1',
          capacity: 40,
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        [], // No allocations
        teams,
        [],
        [],
        []
      );

      // Should fallback to original end date when no allocations exist
      expect(result).toBe('2024-12-31');
    });
  });

  describe('when calculating team velocity', () => {
    it('should factor in team member availability and capacity', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: 100,
        }),
      ];

      const allocations = [
        createMockAllocation({
          teamId: 'team-1',
          epicId: 'epic-1',
          percentage: 50, // Half capacity
        }),
      ];

      const teams = [
        createMockTeam({
          id: 'team-1',
          capacity: 80, // Total capacity
        }),
      ];

      const people = [
        createMockPerson({
          id: 'person-1',
          teamId: 'team-1',
        }),
        createMockPerson({
          id: 'person-2',
          teamId: 'team-1',
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        allocations,
        teams,
        people,
        [],
        []
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should account for different role velocities', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: 80,
        }),
      ];

      const people = [
        createMockPerson({
          id: 'person-1',
          teamId: 'team-1',
          roleId: 'senior-dev',
        }),
        createMockPerson({
          id: 'person-2',
          teamId: 'team-1',
          roleId: 'junior-dev',
        }),
      ];

      const roles = [
        createMockRole({
          id: 'senior-dev',
          name: 'Senior Developer',
        }),
        createMockRole({
          id: 'junior-dev',
          name: 'Junior Developer',
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        [],
        [],
        people,
        roles,
        []
      );

      expect(result).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle projects with missing data gracefully', () => {
      const project = createMockProject({
        endDate: undefined,
      });

      const result = calculateProjectedEndDate(
        project,
        [],
        [],
        [],
        [],
        [],
        [],
        []
      );

      expect(result).toBeNull();
    });

    it('should handle epics without effort estimates', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: undefined,
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        [],
        [],
        [],
        [],
        []
      );

      // Should fallback to original end date when effort is unknown
      expect(result).toBe('2024-12-31');
    });

    it('should handle teams with zero capacity', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: 40,
        }),
      ];

      const teams = [
        createMockTeam({
          id: 'team-1',
          capacity: 0, // No capacity
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        [],
        teams,
        [],
        [],
        []
      );

      expect(result).toBe('2024-12-31');
    });

    it('should validate input parameters', () => {
      const project = createMockProject();

      // Should not throw errors with null/undefined inputs
      expect(() => {
        calculateProjectedEndDate(
          project,
          // @ts-expect-error - Testing runtime behavior with invalid inputs
          null,
          // @ts-expect-error - Testing runtime behavior with invalid inputs
          undefined,
          [],
          [],
          [],
          [],
          []
        );
      }).not.toThrow();
    });
  });

  describe('complex project scenarios', () => {
    it('should handle projects with mixed epic statuses correctly', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'completed',
          endDate: '2024-02-15',
          estimatedEffort: 40,
        }),
        createMockEpic({
          id: 'epic-2',
          projectId: 'proj-1',
          status: 'in-progress',
          estimatedEffort: 60,
        }),
        createMockEpic({
          id: 'epic-3',
          projectId: 'proj-1',
          status: 'todo',
          estimatedEffort: 50,
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        [],
        [],
        [],
        [],
        [],
        []
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should prioritize milestone dates over epic estimates when milestones are later', () => {
      const project = createMockProject({
        endDate: '2024-12-31',
      });

      const epics = [
        createMockEpic({
          id: 'epic-1',
          projectId: 'proj-1',
          status: 'completed',
          endDate: '2024-03-31',
        }),
      ];

      const milestones = [
        createMockMilestone({
          id: 'milestone-1',
          projectId: 'proj-1',
          dueDate: '2024-06-30',
          status: 'not-started',
        }),
      ];

      const result = calculateProjectedEndDate(
        project,
        epics,
        milestones,
        [],
        [],
        [],
        [],
        []
      );

      // Should return the later milestone date
      expect(result).toBe('2024-06-30');
    });
  });
});
