import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine, ValidationContext } from '../validationEngine';
import { Person, Team, Allocation, Role, Cycle } from '@/types';

describe('ValidationEngine', () => {
  let mockContext: ValidationContext;

  beforeEach(() => {
    mockContext = {
      existingData: {
        people: [],
        teams: [
          {
            id: 'team-1',
            name: 'Test Team',
            capacity: 40,
          },
        ],
        divisions: [],
        roles: [
          {
            id: 'role-1',
            name: 'Software Engineer',
            rateType: 'annual',
            defaultRate: 100000,
          },
        ],
        projects: [],
        epics: [],
        cycles: [
          {
            id: 'cycle-1',
            type: 'quarterly',
            name: 'Q1 2024',
            startDate: '2024-01-01',
            endDate: '2024-03-31',
            status: 'active',
          },
        ],
        runWorkCategories: [],
        skills: [],
        solutions: [],
        allocations: [],
      },
      options: {
        strictValidation: false,
        allowPartialImports: true,
        skipEmptyRows: true,
      },
    };
  });

  describe('validateItem - Person', () => {
    it('should validate person with all required fields', () => {
      const person: Person = {
        id: 'person-1',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-1',
        teamId: 'team-1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-15',
      };

      const result = ValidationEngine.validateItem(
        person,
        'person',
        mockContext
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for person missing required fields', () => {
      const person: Person = {
        id: 'person-1',
        name: '',
        email: '',
        roleId: '',
        teamId: '',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-15',
      };

      const result = ValidationEngine.validateItem(
        person,
        'person',
        mockContext
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4); // name, email, role, team
    });

    it('should fail validation for invalid email format', () => {
      const person: Person = {
        id: 'person-1',
        name: 'John Doe',
        email: 'invalid-email',
        roleId: 'role-1',
        teamId: 'team-1',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2023-01-15',
      };

      const result = ValidationEngine.validateItem(
        person,
        'person',
        mockContext
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid email format');
    });
  });

  describe('validateItem - Team', () => {
    it('should validate team with all required fields', () => {
      const team: Team = {
        id: 'team-1',
        name: 'Frontend Team',
        capacity: 40,
      };

      const result = ValidationEngine.validateItem(team, 'team', mockContext);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for team missing required fields', () => {
      const team: Team = {
        id: 'team-1',
        name: '',
        capacity: 0,
      };

      const result = ValidationEngine.validateItem(team, 'team', mockContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // name and capacity
    });
  });

  describe('validateItem - Allocation', () => {
    it('should validate allocation with all required fields', () => {
      const allocation: Allocation = {
        id: 'allocation-1',
        teamId: 'team-1',
        cycleId: 'cycle-1',
        iterationNumber: 1,
        percentage: 50,
      };

      const result = ValidationEngine.validateItem(
        allocation,
        'allocation',
        mockContext
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for allocation missing required fields', () => {
      const allocation: Allocation = {
        id: 'allocation-1',
        teamId: '',
        cycleId: '',
        iterationNumber: 0,
        percentage: 0,
      };

      const result = ValidationEngine.validateItem(
        allocation,
        'allocation',
        mockContext
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4); // team, cycle, iteration, percentage
    });
  });
});
