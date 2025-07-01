import {
  Person,
  Role,
  Team,
  Project,
  Allocation,
  Cycle,
  AppConfig,
  Division,
  Epic,
  RunWorkCategory,
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
  Skill,
  PersonSkill,
  Release,
  Solution,
  ProjectSkill,
  ProjectSolution,
} from '@/types';

export interface ImportConfig {
  allowPartialImports: boolean;
  strictValidation: boolean;
  skipEmptyRows: boolean;
  maxRows?: number;
  /**
   * Import mode: 'insert-only', 'update-only', or 'upsert'. Default is 'upsert'.
   */
  importMode?: 'insert-only' | 'update-only' | 'upsert';
  onProgress?: (progress: {
    current: number;
    total: number;
    stage: string;
  }) => void;
}

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: ImportWarning[];
  summary: {
    totalRows: number;
    successfulRows: number;
    errorRows: number;
    warningRows: number;
    processingTime: number;
    fileSize: number;
    inserted: number;
    updated: number;
    skipped: number;
  };
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
  severity: 'error';
}

export interface ImportWarning {
  row: number;
  column: string;
  message: string;
  severity: 'warning';
}

export interface UpsertResult {
  inserted: Person[];
  updated: Person[];
  skipped: Person[];
  insertedTeams: Team[];
  updatedTeams: Team[];
  skippedTeams: Team[];
  insertedDivisions: Division[];
  updatedDivisions: Division[];
  skippedDivisions: Division[];
  insertedRoles: Role[];
  updatedRoles: Role[];
  skippedRoles: Role[];
}

export class EnhancedImportManager {
  /**
   * Import people and teams with enhanced validation and error handling
   */
  static async importPeopleAndTeams(
    csvContent: string,
    existingData: {
      people: Person[];
      teams: Team[];
      divisions: Division[];
      roles: Role[];
    },
    config: ImportConfig
  ): Promise<ImportResult<UpsertResult>> {
    const startTime = Date.now();

    // Default importMode to 'upsert' if not provided
    const importMode = config.importMode || 'upsert';
    config.importMode = importMode;

    config.onProgress?.({
      current: 0,
      total: 100,
      stage: 'Starting import...',
    });

    try {
      // Step 1: Parse CSV content
      config.onProgress?.({
        current: 20,
        total: 100,
        stage: 'Parsing CSV data...',
      });

      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const dataRows = lines.slice(1);

      const people: Person[] = [];
      const teams: Team[] = [];
      const divisions: Division[] = [];
      const roles: Role[] = [];

      // Step 2: Process each row
      config.onProgress?.({
        current: 40,
        total: 100,
        stage: 'Processing data...',
      });

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i].split(',').map(cell => cell.trim());
        const rowData: Record<string, string> = {};

        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });

        // Create person
        if (rowData.name && rowData.email) {
          const person: Person = {
            id: `person-${Date.now()}-${i}`,
            name: rowData.name,
            email: rowData.email,
            roleId: `role-${rowData.role || 'default'}`,
            teamId: `team-${rowData.team_name || 'default'}`,
            isActive: rowData.is_active !== 'false',
            employmentType:
              rowData.employment_type === 'contractor'
                ? 'contractor'
                : 'permanent',
            startDate:
              rowData.start_date || new Date().toISOString().split('T')[0],
            endDate: rowData.end_date || undefined,
          };

          if (person.employmentType === 'permanent' && rowData.annual_salary) {
            person.annualSalary = parseFloat(rowData.annual_salary);
          } else if (person.employmentType === 'contractor') {
            person.contractDetails = {
              hourlyRate: rowData.hourly_rate
                ? parseFloat(rowData.hourly_rate)
                : undefined,
              dailyRate: rowData.daily_rate
                ? parseFloat(rowData.daily_rate)
                : undefined,
            };
          }

          people.push(person);
        }

        // Create team
        if (rowData.team_name) {
          const team: Team = {
            id: `team-${rowData.team_name}`,
            name: rowData.team_name,
            divisionId: rowData.division_name
              ? `division-${rowData.division_name}`
              : undefined,
            capacity: rowData.team_capacity
              ? parseFloat(rowData.team_capacity)
              : 40,
          };
          teams.push(team);
        }

        // Create division
        if (rowData.division_name) {
          const division: Division = {
            id: `division-${rowData.division_name}`,
            name: rowData.division_name,
            description: undefined,
          };
          divisions.push(division);
        }

        // Create role
        if (rowData.role) {
          const role: Role = {
            id: `role-${rowData.role}`,
            name: rowData.role,
            rateType: 'annual',
            defaultRate: 100000,
          };
          roles.push(role);
        }

        config.onProgress?.({
          current: 40 + Math.floor((i / dataRows.length) * 40),
          total: 100,
          stage: 'Processing data...',
        });
      }

      // Step 3: Apply upsert logic
      config.onProgress?.({
        current: 80,
        total: 100,
        stage: 'Applying changes...',
      });

      const upsertResult = this.applyUpsertLogic(
        people,
        teams,
        divisions,
        roles,
        existingData,
        importMode
      );

      // Step 4: Prepare result
      config.onProgress?.({
        current: 100,
        total: 100,
        stage: 'Completing import...',
      });

      const totalProcessed =
        upsertResult.inserted.length +
        upsertResult.updated.length +
        upsertResult.skipped.length;

      return {
        success: config.allowPartialImports ? totalProcessed > 0 : true,
        data: [upsertResult],
        errors: [],
        warnings: [],
        summary: {
          totalRows: dataRows.length,
          successfulRows: totalProcessed,
          errorRows: 0,
          warningRows: 0,
          processingTime: Date.now() - startTime,
          fileSize: new Blob([csvContent]).size,
          inserted: upsertResult.inserted.length,
          updated: upsertResult.updated.length,
          skipped: upsertResult.skipped.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [
          {
            row: 0,
            column: 'general',
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ],
        warnings: [],
        summary: {
          totalRows: 0,
          successfulRows: 0,
          errorRows: 1,
          warningRows: 0,
          processingTime: Date.now() - startTime,
          fileSize: new Blob([csvContent]).size,
          inserted: 0,
          updated: 0,
          skipped: 0,
        },
      };
    }
  }

  /**
   * Apply upsert logic based on import mode
   */
  private static applyUpsertLogic(
    newPeople: Person[],
    newTeams: Team[],
    newDivisions: Division[],
    newRoles: Role[],
    existingData: {
      people: Person[];
      teams: Team[];
      divisions: Division[];
      roles: Role[];
    },
    importMode: 'insert-only' | 'update-only' | 'upsert'
  ): UpsertResult {
    const result: UpsertResult = {
      inserted: [],
      updated: [],
      skipped: [],
      insertedTeams: [],
      updatedTeams: [],
      skippedTeams: [],
      insertedDivisions: [],
      updatedDivisions: [],
      skippedDivisions: [],
      insertedRoles: [],
      updatedRoles: [],
      skippedRoles: [],
    };

    // --- People: upsert by email (case-insensitive) ---
    for (const person of newPeople) {
      const existingPerson = existingData.people.find(
        p => p.email.trim().toLowerCase() === person.email.trim().toLowerCase()
      );
      if (existingPerson) {
        if (importMode === 'insert-only') {
          result.skipped.push(person);
        } else {
          // Update existing person
          Object.assign(existingPerson, {
            name: person.name,
            roleId: person.roleId,
            teamId: person.teamId,
            isActive: person.isActive,
            employmentType: person.employmentType,
            startDate: person.startDate,
            endDate: person.endDate,
            annualSalary: person.annualSalary,
            contractDetails: person.contractDetails,
          });
          result.updated.push(person);
        }
      } else {
        if (importMode === 'update-only') {
          result.skipped.push(person);
        } else {
          existingData.people.push(person);
          result.inserted.push(person);
        }
      }
    }

    // --- Teams: upsert by name+division (case-insensitive) ---
    for (const team of newTeams) {
      const existingTeam = existingData.teams.find(
        t =>
          t.name.trim().toLowerCase() === team.name.trim().toLowerCase() &&
          (t.divisionId || '').toLowerCase() ===
            (team.divisionId || '').toLowerCase()
      );
      if (existingTeam) {
        if (importMode === 'insert-only') {
          result.skippedTeams.push(team);
        } else {
          Object.assign(existingTeam, {
            capacity: team.capacity,
          });
          result.updatedTeams.push(team);
        }
      } else {
        if (importMode === 'update-only') {
          result.skippedTeams.push(team);
        } else {
          existingData.teams.push(team);
          result.insertedTeams.push(team);
        }
      }
    }

    // --- Divisions: upsert by name (case-insensitive) ---
    for (const division of newDivisions) {
      const existingDivision = existingData.divisions.find(
        d => d.name.trim().toLowerCase() === division.name.trim().toLowerCase()
      );
      if (existingDivision) {
        if (importMode === 'insert-only') {
          result.skippedDivisions.push(division);
        } else {
          Object.assign(existingDivision, {
            description: division.description,
          });
          result.updatedDivisions.push(division);
        }
      } else {
        if (importMode === 'update-only') {
          result.skippedDivisions.push(division);
        } else {
          existingData.divisions.push(division);
          result.insertedDivisions.push(division);
        }
      }
    }

    // --- Roles: upsert by name (case-insensitive) ---
    for (const role of newRoles) {
      const existingRole = existingData.roles.find(
        r => r.name.trim().toLowerCase() === role.name.trim().toLowerCase()
      );
      if (existingRole) {
        if (importMode === 'insert-only') {
          result.skippedRoles.push(role);
        } else {
          Object.assign(existingRole, {
            rateType: role.rateType,
            defaultRate: role.defaultRate,
            defaultHourlyRate: role.defaultHourlyRate,
          });
          result.updatedRoles.push(role);
        }
      } else {
        if (importMode === 'update-only') {
          result.skippedRoles.push(role);
        } else {
          existingData.roles.push(role);
          result.insertedRoles.push(role);
        }
      }
    }

    return result;
  }

  /**
   * Import planning allocations with enhanced validation
   */
  static async importPlanningAllocations(
    csvContent: string,
    existingData: {
      teams: Team[];
      epics: Epic[];
      runWorkCategories: RunWorkCategory[];
      cycles: Cycle[];
      allocations: Allocation[];
    },
    config: ImportConfig
  ): Promise<ImportResult<Allocation[]>> {
    const startTime = Date.now();

    config.onProgress?.({
      current: 0,
      total: 100,
      stage: 'Starting allocation import...',
    });

    try {
      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const dataRows = lines.slice(1);

      const allocations: Allocation[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i].split(',').map(cell => cell.trim());
        const rowData: Record<string, string> = {};

        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });

        if (
          rowData.team_name &&
          rowData.quarter &&
          rowData.iteration_number &&
          rowData.percentage
        ) {
          const team = existingData.teams.find(
            t => t.name.toLowerCase() === rowData.team_name.toLowerCase()
          );

          const cycle = existingData.cycles.find(
            c => c.name.toLowerCase() === rowData.quarter.toLowerCase()
          );

          if (team && cycle) {
            const allocation: Allocation = {
              id: `allocation-${Date.now()}-${i}`,
              teamId: team.id,
              cycleId: cycle.id,
              iterationNumber: parseInt(rowData.iteration_number),
              percentage: parseFloat(rowData.percentage),
              notes: rowData.notes || undefined,
            };

            allocations.push(allocation);
          }
        }

        config.onProgress?.({
          current: Math.floor((i / dataRows.length) * 100),
          total: 100,
          stage: 'Processing allocations...',
        });
      }

      return {
        success: true,
        data: allocations,
        errors: [],
        warnings: [],
        summary: {
          totalRows: dataRows.length,
          successfulRows: allocations.length,
          errorRows: 0,
          warningRows: 0,
          processingTime: Date.now() - startTime,
          fileSize: new Blob([csvContent]).size,
          inserted: allocations.length,
          updated: 0,
          skipped: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [
          {
            row: 0,
            column: 'general',
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ],
        warnings: [],
        summary: {
          totalRows: 0,
          successfulRows: 0,
          errorRows: 1,
          warningRows: 0,
          processingTime: Date.now() - startTime,
          fileSize: new Blob([csvContent]).size,
          inserted: 0,
          updated: 0,
          skipped: 0,
        },
      };
    }
  }
}
