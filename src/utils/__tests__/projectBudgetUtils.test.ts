import { describe, it, expect } from 'vitest';
import { Project } from '@/types';
import {
  calculateProjectTotalBudget,
  getProjectPriorityOrder,
  getProjectBudgetForFinancialYear,
  setProjectBudgetForFinancialYear,
  removeProjectBudgetForFinancialYear,
  getProjectFinancialYearsWithBudgets,
  migrateLegacyBudgetToFinancialYear,
} from '../projectBudgetUtils';

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'planning',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  milestones: [],
  priority: 2,
  ranking: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('projectBudgetUtils', () => {
  describe('calculateProjectTotalBudget', () => {
    it('should calculate total from financial year budgets', () => {
      const project = createMockProject({
        financialYearBudgets: [
          { financialYearId: 'fy2024', amount: 100000 },
          { financialYearId: 'fy2025', amount: 50000 },
          { financialYearId: 'fy2026', amount: 25000 },
        ],
      });

      const total = calculateProjectTotalBudget(project);
      expect(total).toBe(175000);
    });

    it('should fall back to legacy budget when no financial year budgets exist', () => {
      const project = createMockProject({
        budget: 120000,
        financialYearBudgets: undefined,
      });

      const total = calculateProjectTotalBudget(project);
      expect(total).toBe(120000);
    });

    it('should return 0 when no budgets exist at all', () => {
      const project = createMockProject({
        budget: undefined,
        financialYearBudgets: undefined,
      });

      const total = calculateProjectTotalBudget(project);
      expect(total).toBe(0);
    });

    it('should prefer financial year budgets over legacy budget', () => {
      const project = createMockProject({
        budget: 100000, // This should be ignored
        financialYearBudgets: [
          { financialYearId: 'fy2024', amount: 75000 },
          { financialYearId: 'fy2025', amount: 25000 },
        ],
      });

      const total = calculateProjectTotalBudget(project);
      expect(total).toBe(100000); // Sum of FY budgets, not legacy budget
    });

    it('should handle empty financial year budgets array', () => {
      const project = createMockProject({
        budget: 150000,
        financialYearBudgets: [],
      });

      const total = calculateProjectTotalBudget(project);
      expect(total).toBe(150000); // Should fall back to legacy budget
    });
  });

  describe('getProjectPriorityOrder', () => {
    it('should return priorityOrder when set', () => {
      const project = createMockProject({
        priority: 2,
        priorityOrder: 5,
      });

      const priorityOrder = getProjectPriorityOrder(project);
      expect(priorityOrder).toBe(5);
    });

    it('should fall back to priority when priorityOrder is not set', () => {
      const project = createMockProject({
        priority: 3,
        priorityOrder: undefined,
      });

      const priorityOrder = getProjectPriorityOrder(project);
      expect(priorityOrder).toBe(3);
    });

    it('should handle priorityOrder of 0', () => {
      const project = createMockProject({
        priority: 2,
        priorityOrder: 0,
      });

      const priorityOrder = getProjectPriorityOrder(project);
      expect(priorityOrder).toBe(0);
    });
  });

  describe('getProjectBudgetForFinancialYear', () => {
    it('should return budget for existing financial year', () => {
      const project = createMockProject({
        financialYearBudgets: [
          { financialYearId: 'fy2024', amount: 100000 },
          { financialYearId: 'fy2025', amount: 75000 },
        ],
      });

      const budget = getProjectBudgetForFinancialYear(project, 'fy2025');
      expect(budget).toBe(75000);
    });

    it('should return 0 for non-existing financial year', () => {
      const project = createMockProject({
        financialYearBudgets: [{ financialYearId: 'fy2024', amount: 100000 }],
      });

      const budget = getProjectBudgetForFinancialYear(project, 'fy2026');
      expect(budget).toBe(0);
    });

    it('should return 0 when no financial year budgets exist', () => {
      const project = createMockProject({
        financialYearBudgets: undefined,
      });

      const budget = getProjectBudgetForFinancialYear(project, 'fy2024');
      expect(budget).toBe(0);
    });
  });

  describe('setProjectBudgetForFinancialYear', () => {
    it('should add new budget when financial year does not exist', () => {
      const project = createMockProject({
        financialYearBudgets: [{ financialYearId: 'fy2024', amount: 100000 }],
      });

      const updatedProject = setProjectBudgetForFinancialYear(
        project,
        'fy2025',
        50000
      );

      expect(updatedProject.financialYearBudgets).toHaveLength(2);
      expect(updatedProject.financialYearBudgets).toContainEqual({
        financialYearId: 'fy2025',
        amount: 50000,
      });
    });

    it('should update existing budget when financial year exists', () => {
      const project = createMockProject({
        financialYearBudgets: [
          { financialYearId: 'fy2024', amount: 100000 },
          { financialYearId: 'fy2025', amount: 50000 },
        ],
      });

      const updatedProject = setProjectBudgetForFinancialYear(
        project,
        'fy2025',
        75000
      );

      expect(updatedProject.financialYearBudgets).toHaveLength(2);
      const fy2025Budget = updatedProject.financialYearBudgets?.find(
        b => b.financialYearId === 'fy2025'
      );
      expect(fy2025Budget?.amount).toBe(75000);
    });

    it('should create financial year budgets array when it does not exist', () => {
      const project = createMockProject({
        financialYearBudgets: undefined,
      });

      const updatedProject = setProjectBudgetForFinancialYear(
        project,
        'fy2024',
        100000
      );

      expect(updatedProject.financialYearBudgets).toHaveLength(1);
      expect(updatedProject.financialYearBudgets?.[0]).toEqual({
        financialYearId: 'fy2024',
        amount: 100000,
      });
    });

    it('should not mutate the original project', () => {
      const project = createMockProject({
        financialYearBudgets: [{ financialYearId: 'fy2024', amount: 100000 }],
      });

      const updatedProject = setProjectBudgetForFinancialYear(
        project,
        'fy2025',
        50000
      );

      expect(project.financialYearBudgets).toHaveLength(1);
      expect(updatedProject.financialYearBudgets).toHaveLength(2);
      expect(project).not.toBe(updatedProject);
    });
  });

  describe('removeProjectBudgetForFinancialYear', () => {
    it('should remove budget for existing financial year', () => {
      const project = createMockProject({
        financialYearBudgets: [
          { financialYearId: 'fy2024', amount: 100000 },
          { financialYearId: 'fy2025', amount: 50000 },
          { financialYearId: 'fy2026', amount: 25000 },
        ],
      });

      const updatedProject = removeProjectBudgetForFinancialYear(
        project,
        'fy2025'
      );

      expect(updatedProject.financialYearBudgets).toHaveLength(2);
      expect(updatedProject.financialYearBudgets).not.toContainEqual({
        financialYearId: 'fy2025',
        amount: 50000,
      });
    });

    it('should return unchanged project when financial year does not exist', () => {
      const project = createMockProject({
        financialYearBudgets: [{ financialYearId: 'fy2024', amount: 100000 }],
      });

      const updatedProject = removeProjectBudgetForFinancialYear(
        project,
        'fy2026'
      );

      expect(updatedProject.financialYearBudgets).toHaveLength(1);
      expect(updatedProject.financialYearBudgets?.[0]).toEqual({
        financialYearId: 'fy2024',
        amount: 100000,
      });
    });

    it('should return unchanged project when no financial year budgets exist', () => {
      const project = createMockProject({
        financialYearBudgets: undefined,
      });

      const updatedProject = removeProjectBudgetForFinancialYear(
        project,
        'fy2024'
      );

      expect(updatedProject.financialYearBudgets).toBeUndefined();
    });
  });

  describe('getProjectFinancialYearsWithBudgets', () => {
    it('should return all financial year IDs with budgets', () => {
      const project = createMockProject({
        financialYearBudgets: [
          { financialYearId: 'fy2024', amount: 100000 },
          { financialYearId: 'fy2025', amount: 50000 },
          { financialYearId: 'fy2026', amount: 25000 },
        ],
      });

      const fyIds = getProjectFinancialYearsWithBudgets(project);
      expect(fyIds).toEqual(['fy2024', 'fy2025', 'fy2026']);
    });

    it('should return empty array when no financial year budgets exist', () => {
      const project = createMockProject({
        financialYearBudgets: undefined,
      });

      const fyIds = getProjectFinancialYearsWithBudgets(project);
      expect(fyIds).toEqual([]);
    });

    it('should return empty array for empty budgets array', () => {
      const project = createMockProject({
        financialYearBudgets: [],
      });

      const fyIds = getProjectFinancialYearsWithBudgets(project);
      expect(fyIds).toEqual([]);
    });
  });

  describe('migrateLegacyBudgetToFinancialYear', () => {
    it('should migrate legacy budget to financial year budget', () => {
      const project = createMockProject({
        budget: 150000,
        financialYearBudgets: undefined,
      });

      const migratedProject = migrateLegacyBudgetToFinancialYear(
        project,
        'fy2024'
      );

      expect(migratedProject.financialYearBudgets).toHaveLength(1);
      expect(migratedProject.financialYearBudgets?.[0]).toEqual({
        financialYearId: 'fy2024',
        amount: 150000,
      });
    });

    it('should not migrate when financial year budgets already exist', () => {
      const project = createMockProject({
        budget: 150000,
        financialYearBudgets: [{ financialYearId: 'fy2025', amount: 100000 }],
      });

      const migratedProject = migrateLegacyBudgetToFinancialYear(
        project,
        'fy2024'
      );

      expect(migratedProject.financialYearBudgets).toHaveLength(1);
      expect(migratedProject.financialYearBudgets?.[0]).toEqual({
        financialYearId: 'fy2025',
        amount: 100000,
      });
    });

    it('should not migrate when no legacy budget exists', () => {
      const project = createMockProject({
        budget: undefined,
        financialYearBudgets: undefined,
      });

      const migratedProject = migrateLegacyBudgetToFinancialYear(
        project,
        'fy2024'
      );

      expect(migratedProject.financialYearBudgets).toBeUndefined();
    });

    it('should not mutate the original project', () => {
      const project = createMockProject({
        budget: 150000,
        financialYearBudgets: undefined,
      });

      const migratedProject = migrateLegacyBudgetToFinancialYear(
        project,
        'fy2024'
      );

      expect(project.financialYearBudgets).toBeUndefined();
      expect(migratedProject.financialYearBudgets).toHaveLength(1);
      expect(project).not.toBe(migratedProject);
    });
  });
});
