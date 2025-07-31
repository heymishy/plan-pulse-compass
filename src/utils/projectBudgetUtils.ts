import { Project, ProjectFinancialYearBudget } from '@/types';

/**
 * Calculate the total budget for a project from its financial year budgets
 * Falls back to legacy budget field if no financial year budgets exist
 */
export const calculateProjectTotalBudget = (project: Project): number => {
  // If project has financial year budgets, sum them up
  if (project.financialYearBudgets && project.financialYearBudgets.length > 0) {
    return project.financialYearBudgets.reduce(
      (total, fyBudget) => total + fyBudget.amount,
      0
    );
  }

  // Fall back to legacy budget field
  return project.budget || 0;
};

/**
 * Get the effective priority order for a project
 * Uses priorityOrder if set, otherwise falls back to priority
 */
export const getProjectPriorityOrder = (project: Project): number => {
  return project.priorityOrder ?? project.priority;
};

/**
 * Get budget for a specific financial year
 */
export const getProjectBudgetForFinancialYear = (
  project: Project,
  financialYearId: string
): number => {
  if (!project.financialYearBudgets) {
    return 0;
  }

  const fyBudget = project.financialYearBudgets.find(
    budget => budget.financialYearId === financialYearId
  );

  return fyBudget?.amount || 0;
};

/**
 * Set budget for a specific financial year
 */
export const setProjectBudgetForFinancialYear = (
  project: Project,
  financialYearId: string,
  amount: number
): Project => {
  const updatedProject = { ...project };

  if (!updatedProject.financialYearBudgets) {
    updatedProject.financialYearBudgets = [];
  } else {
    // Deep clone the financial year budgets array to avoid mutation
    updatedProject.financialYearBudgets = [
      ...updatedProject.financialYearBudgets,
    ];
  }

  const existingIndex = updatedProject.financialYearBudgets.findIndex(
    budget => budget.financialYearId === financialYearId
  );

  if (existingIndex >= 0) {
    // Update existing budget
    updatedProject.financialYearBudgets[existingIndex] = {
      financialYearId,
      amount,
    };
  } else {
    // Add new budget
    updatedProject.financialYearBudgets.push({
      financialYearId,
      amount,
    });
  }

  return updatedProject;
};

/**
 * Remove budget for a specific financial year
 */
export const removeProjectBudgetForFinancialYear = (
  project: Project,
  financialYearId: string
): Project => {
  const updatedProject = { ...project };

  if (!updatedProject.financialYearBudgets) {
    return updatedProject;
  }

  // Filter creates a new array, so this is safe from mutation
  updatedProject.financialYearBudgets =
    updatedProject.financialYearBudgets.filter(
      budget => budget.financialYearId !== financialYearId
    );

  return updatedProject;
};

/**
 * Get all financial years that have budgets for a project
 */
export const getProjectFinancialYearsWithBudgets = (
  project: Project
): string[] => {
  if (!project.financialYearBudgets) {
    return [];
  }

  return project.financialYearBudgets.map(budget => budget.financialYearId);
};

/**
 * Migrate legacy budget to financial year budget structure
 * Useful for upgrading existing projects
 */
export const migrateLegacyBudgetToFinancialYear = (
  project: Project,
  defaultFinancialYearId: string
): Project => {
  // If already has financial year budgets or no legacy budget, return as-is
  if (project.financialYearBudgets?.length || !project.budget) {
    return project;
  }

  return {
    ...project,
    financialYearBudgets: [
      {
        financialYearId: defaultFinancialYearId,
        amount: project.budget,
      },
    ],
  };
};

/**
 * Assign default priority order values to projects that don't have them
 * Projects with undefined priorityOrder get assigned their priority level value
 */
export const assignDefaultPriorityOrder = (project: Project): Project => {
  // If project already has a priority order, return as-is
  if (project.priorityOrder !== undefined) {
    return project;
  }

  // Assign priority level as default priority order
  return {
    ...project,
    priorityOrder: project.priority || 4, // Default to lowest priority if priority is also undefined
  };
};

/**
 * Assign default priority order values to multiple projects
 * Ensures all projects have a priority order for consistent sorting
 */
export const assignDefaultPriorityOrderToProjects = (
  projects: Project[]
): Project[] => {
  return projects.map(assignDefaultPriorityOrder);
};
