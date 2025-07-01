import {
  Person,
  Role,
  Team,
  Division,
  Project,
  Epic,
  Milestone,
  Allocation,
  ActualAllocation,
  Cycle,
  RunWorkCategory,
  Skill,
  Solution,
} from '@/types';
import { CsvParseError, CsvParseWarning } from './unifiedCsvParser';

export interface ValidationRule<T> {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning';
  validate: (data: T, context: ValidationContext) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: CsvParseError[];
  warnings: CsvParseWarning[];
}

export interface ValidationContext {
  existingData: {
    people: Person[];
    teams: Team[];
    divisions: Division[];
    roles: Role[];
    projects: Project[];
    epics: Epic[];
    cycles: Cycle[];
    runWorkCategories: RunWorkCategory[];
    skills: Skill[];
    solutions: Solution[];
  };
  options: {
    strictValidation: boolean;
    allowPartialImports: boolean;
    skipEmptyRows: boolean;
  };
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: CsvParseError[];
  warnings: CsvParseWarning[];
  summary: {
    totalItems: number;
    validItems: number;
    errorItems: number;
    warningItems: number;
    processingTime: number;
  };
}

export class ValidationEngine {
  private static readonly PEOPLE_RULES: ValidationRule<Person>[] = [
    {
      id: 'person-required-fields',
      name: 'Required Fields',
      description: 'Person must have name, email, role, and team',
      severity: 'error',
      validate: (
        person: Person,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (!person.name?.trim()) {
          errors.push({
            row: 0,
            column: 'name',
            message: 'Person name is required',
            severity: 'error',
          });
        }

        if (!person.email?.trim()) {
          errors.push({
            row: 0,
            column: 'email',
            message: 'Person email is required',
            severity: 'error',
          });
        }

        if (!person.roleId?.trim()) {
          errors.push({
            row: 0,
            column: 'role',
            message: 'Person role is required',
            severity: 'error',
          });
        }

        if (!person.teamId?.trim()) {
          errors.push({
            row: 0,
            column: 'team',
            message: 'Person team is required',
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'person-email-format',
      name: 'Email Format',
      description: 'Email must be in valid format',
      severity: 'error',
      validate: (
        person: Person,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (person.email && !this.isValidEmail(person.email)) {
          errors.push({
            row: 0,
            column: 'email',
            message: `Invalid email format: ${person.email}`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'person-role-exists',
      name: 'Role Exists',
      description: 'Person role must exist in the system',
      severity: 'error',
      validate: (
        person: Person,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          person.roleId &&
          !context.existingData.roles.find(r => r.id === person.roleId)
        ) {
          errors.push({
            row: 0,
            column: 'role',
            message: `Role with ID '${person.roleId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'person-team-exists',
      name: 'Team Exists',
      description: 'Person team must exist in the system',
      severity: 'error',
      validate: (
        person: Person,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          person.teamId &&
          !context.existingData.teams.find(t => t.id === person.teamId)
        ) {
          errors.push({
            row: 0,
            column: 'team',
            message: `Team with ID '${person.teamId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'person-duplicate-email',
      name: 'Duplicate Email',
      description: 'Person email must be unique',
      severity: 'error',
      validate: (
        person: Person,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (person.email) {
          const existingPerson = context.existingData.people.find(
            p =>
              p.email.toLowerCase() === person.email.toLowerCase() &&
              p.id !== person.id
          );
          if (existingPerson) {
            errors.push({
              row: 0,
              column: 'email',
              message: `Email '${person.email}' is already used by ${existingPerson.name}`,
              severity: 'error',
            });
          }
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
  ];

  private static readonly TEAM_RULES: ValidationRule<Team>[] = [
    {
      id: 'team-required-fields',
      name: 'Required Fields',
      description: 'Team must have name and capacity',
      severity: 'error',
      validate: (team: Team, context: ValidationContext): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (!team.name?.trim()) {
          errors.push({
            row: 0,
            column: 'name',
            message: 'Team name is required',
            severity: 'error',
          });
        }

        if (team.capacity <= 0) {
          errors.push({
            row: 0,
            column: 'capacity',
            message: 'Team capacity must be greater than 0',
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'team-division-exists',
      name: 'Division Exists',
      description: 'Team division must exist in the system',
      severity: 'error',
      validate: (team: Team, context: ValidationContext): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          team.divisionId &&
          !context.existingData.divisions.find(d => d.id === team.divisionId)
        ) {
          errors.push({
            row: 0,
            column: 'division',
            message: `Division with ID '${team.divisionId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'team-duplicate-name',
      name: 'Duplicate Name',
      description: 'Team name must be unique within division',
      severity: 'error',
      validate: (team: Team, context: ValidationContext): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (team.name) {
          const existingTeam = context.existingData.teams.find(
            t =>
              t.name.toLowerCase() === team.name.toLowerCase() &&
              t.divisionId === team.divisionId &&
              t.id !== team.id
          );
          if (existingTeam) {
            errors.push({
              row: 0,
              column: 'name',
              message: `Team name '${team.name}' already exists in this division`,
              severity: 'error',
            });
          }
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
  ];

  private static readonly ALLOCATION_RULES: ValidationRule<Allocation>[] = [
    {
      id: 'allocation-required-fields',
      name: 'Required Fields',
      description:
        'Allocation must have team, cycle, iteration, and percentage',
      severity: 'error',
      validate: (
        allocation: Allocation,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (!allocation.teamId?.trim()) {
          errors.push({
            row: 0,
            column: 'team',
            message: 'Team is required',
            severity: 'error',
          });
        }

        if (!allocation.cycleId?.trim()) {
          errors.push({
            row: 0,
            column: 'cycle',
            message: 'Cycle is required',
            severity: 'error',
          });
        }

        if (allocation.iterationNumber <= 0) {
          errors.push({
            row: 0,
            column: 'iteration',
            message: 'Iteration number must be greater than 0',
            severity: 'error',
          });
        }

        if (allocation.percentage <= 0 || allocation.percentage > 100) {
          errors.push({
            row: 0,
            column: 'percentage',
            message: 'Percentage must be between 1 and 100',
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'allocation-team-exists',
      name: 'Team Exists',
      description: 'Allocation team must exist in the system',
      severity: 'error',
      validate: (
        allocation: Allocation,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          allocation.teamId &&
          !context.existingData.teams.find(t => t.id === allocation.teamId)
        ) {
          errors.push({
            row: 0,
            column: 'team',
            message: `Team with ID '${allocation.teamId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'allocation-cycle-exists',
      name: 'Cycle Exists',
      description: 'Allocation cycle must exist in the system',
      severity: 'error',
      validate: (
        allocation: Allocation,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          allocation.cycleId &&
          !context.existingData.cycles.find(c => c.id === allocation.cycleId)
        ) {
          errors.push({
            row: 0,
            column: 'cycle',
            message: `Cycle with ID '${allocation.cycleId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'allocation-epic-exists',
      name: 'Epic Exists',
      description: 'Allocation epic must exist in the system',
      severity: 'error',
      validate: (
        allocation: Allocation,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          allocation.epicId &&
          !context.existingData.epics.find(e => e.id === allocation.epicId)
        ) {
          errors.push({
            row: 0,
            column: 'epic',
            message: `Epic with ID '${allocation.epicId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'allocation-runwork-exists',
      name: 'Run Work Category Exists',
      description: 'Allocation run work category must exist in the system',
      severity: 'error',
      validate: (
        allocation: Allocation,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          allocation.runWorkCategoryId &&
          !context.existingData.runWorkCategories.find(
            r => r.id === allocation.runWorkCategoryId
          )
        ) {
          errors.push({
            row: 0,
            column: 'run_work_category',
            message: `Run work category with ID '${allocation.runWorkCategoryId}' does not exist`,
            severity: 'error',
          });
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
    {
      id: 'allocation-total-percentage',
      name: 'Total Percentage',
      description:
        'Total allocation percentage for team/iteration should not exceed 100%',
      severity: 'warning',
      validate: (
        allocation: Allocation,
        context: ValidationContext
      ): ValidationResult => {
        const errors: CsvParseError[] = [];
        const warnings: CsvParseWarning[] = [];

        if (
          allocation.teamId &&
          allocation.cycleId &&
          allocation.iterationNumber
        ) {
          const existingAllocations = context.existingData.allocations.filter(
            a =>
              a.teamId === allocation.teamId &&
              a.cycleId === allocation.cycleId &&
              a.iterationNumber === allocation.iterationNumber &&
              a.id !== allocation.id
          );

          const totalPercentage =
            existingAllocations.reduce((sum, a) => sum + a.percentage, 0) +
            allocation.percentage;

          if (totalPercentage > 100) {
            warnings.push({
              row: 0,
              column: 'percentage',
              message: `Total allocation for team/iteration will exceed 100% (${totalPercentage.toFixed(1)}%)`,
              data: { totalPercentage: totalPercentage.toFixed(1) },
            });
          }
        }

        return { isValid: errors.length === 0, errors, warnings };
      },
    },
  ];

  /**
   * Validate a single item using all applicable rules
   */
  static validateItem<T>(
    item: T,
    itemType: 'person' | 'team' | 'allocation' | 'project' | 'epic',
    context: ValidationContext
  ): ValidationResult {
    const errors: CsvParseError[] = [];
    const warnings: CsvParseWarning[] = [];

    let rules: ValidationRule<T>[] = [];

    switch (itemType) {
      case 'person':
        rules = this.PEOPLE_RULES as ValidationRule<T>[];
        break;
      case 'team':
        rules = this.TEAM_RULES as ValidationRule<T>[];
        break;
      case 'allocation':
        rules = this.ALLOCATION_RULES as ValidationRule<T>[];
        break;
      default:
        return { isValid: true, errors, warnings };
    }

    for (const rule of rules) {
      try {
        const result = rule.validate(item, context);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } catch (error) {
        errors.push({
          row: 0,
          column: 'general',
          message: `Validation rule '${rule.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        });
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a batch of items with progress reporting
   */
  static validateBatch<T>(
    items: T[],
    itemType: 'person' | 'team' | 'allocation' | 'project' | 'epic',
    context: ValidationContext,
    onProgress?: (progress: { current: number; total: number }) => void
  ): BatchValidationResult {
    const startTime = Date.now();
    const errors: CsvParseError[] = [];
    const warnings: CsvParseWarning[] = [];
    let validItems = 0;
    let errorItems = 0;
    let warningItems = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = this.validateItem(item, itemType, context);

      // Update row numbers to reflect actual position
      result.errors.forEach(error => (error.row = i + 2)); // +2 for header and 0-based index
      result.warnings.forEach(warning => (warning.row = i + 2));

      errors.push(...result.errors);
      warnings.push(...result.warnings);

      if (result.isValid) {
        validItems++;
      } else {
        errorItems++;
      }

      if (result.warnings.length > 0) {
        warningItems++;
      }

      // Report progress
      if (onProgress && i % 100 === 0) {
        onProgress({ current: i, total: items.length });
      }
    }

    return {
      isValid: errorItems === 0,
      errors,
      warnings,
      summary: {
        totalItems: items.length,
        validItems,
        errorItems,
        warningItems,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get validation rules for a specific item type
   */
  static getRules<T>(
    itemType: 'person' | 'team' | 'allocation' | 'project' | 'epic'
  ): ValidationRule<T>[] {
    switch (itemType) {
      case 'person':
        return this.PEOPLE_RULES as ValidationRule<T>[];
      case 'team':
        return this.TEAM_RULES as ValidationRule<T>[];
      case 'allocation':
        return this.ALLOCATION_RULES as ValidationRule<T>[];
      default:
        return [];
    }
  }

  /**
   * Create a custom validation rule
   */
  static createRule<T>(
    id: string,
    name: string,
    description: string,
    severity: 'error' | 'warning',
    validate: (data: T, context: ValidationContext) => ValidationResult
  ): ValidationRule<T> {
    return {
      id,
      name,
      description,
      severity,
      validate,
    };
  }
}
