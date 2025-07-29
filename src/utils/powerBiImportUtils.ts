/**
 * Power BI Import Utilities
 *
 * Handles parsing and processing of Power BI exported CSV files containing
 * Jira epic and story data for import into Plan Pulse Compass.
 */

import { Team, Epic } from '@/types';

// Types for Power BI data structures
export interface PowerBiEpicData {
  squad: string;
  epicName: string;
  epicType: string;
  sprint: string;
  storyPoints: number;
}

export interface PowerBiStoryData {
  squad: string;
  epicName: string;
  storyName: string;
  sprint: string;
  storyPoints: number;
}

export interface SprintData {
  totalStoryPoints: number;
  epicPoints: Map<string, number>;
  unassignedPoints: number;
}

export type TeamSprintData = Map<string, SprintData>;

export interface AllocationResult {
  teamName: string;
  epicName: string;
  sprint: string;
  percentage: number;
  storyPoints: number;
  epicType?: string;
}

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings?: string[];
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  validAllocations: AllocationResult[];
}

/**
 * Parse Power BI Epic CSV data
 */
export function parsePowerBiEpicCSV(
  csvContent: string
): ParseResult<PowerBiEpicData> {
  const errors: string[] = [];
  const data: PowerBiEpicData[] = [];

  if (!csvContent.trim()) {
    return {
      success: false,
      data: [],
      errors: ['CSV file is empty'],
    };
  }

  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        data: [],
        errors: ['CSV must contain headers and at least one data row'],
      };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = [
      'Squad',
      'Epic Name',
      'Epic Type',
      'Sprint',
      'Story Points',
    ];

    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        data: [],
        errors: [`Missing required headers: ${missingHeaders.join(', ')}`],
      };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowData: Record<string, string> = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      // Validate required fields
      const rowErrors: string[] = [];
      if (!rowData['Squad']) {
        rowErrors.push(`Row ${i + 1}: Squad is required but empty`);
      }
      if (!rowData['Epic Name']) {
        rowErrors.push(`Row ${i + 1}: Epic Name is required but empty`);
      }
      if (!rowData['Epic Type']) {
        rowErrors.push(`Row ${i + 1}: Epic Type is required but empty`);
      }
      if (!rowData['Sprint']) {
        rowErrors.push(`Row ${i + 1}: Sprint is required but empty`);
      }

      // Validate story points
      const storyPointsStr = rowData['Story Points'];
      if (!storyPointsStr) {
        rowErrors.push(`Row ${i + 1}: Story Points is required but empty`);
      } else {
        const storyPoints = parseFloat(storyPointsStr);
        if (isNaN(storyPoints)) {
          rowErrors.push(
            `Row ${i + 1}: Story Points must be a valid number, got '${storyPointsStr}'`
          );
        }
      }

      errors.push(...rowErrors);

      // Only add valid rows to data (no errors for this row)
      if (rowErrors.length === 0) {
        data.push({
          squad: rowData['Squad'],
          epicName: rowData['Epic Name'],
          epicType: rowData['Epic Type'],
          sprint: rowData['Sprint'],
          storyPoints: parseFloat(rowData['Story Points']),
        });
      }
    }

    return {
      success: errors.length === 0,
      data,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Parse Power BI Story CSV data
 */
export function parsePowerBiStoryCSV(
  csvContent: string
): ParseResult<PowerBiStoryData> {
  const errors: string[] = [];
  const data: PowerBiStoryData[] = [];

  if (!csvContent.trim()) {
    return {
      success: false,
      data: [],
      errors: ['CSV file is empty'],
    };
  }

  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        data: [],
        errors: ['CSV must contain headers and at least one data row'],
      };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = [
      'Squad',
      'Epic Name',
      'Story Name',
      'Sprint',
      'Story Points',
    ];

    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        data: [],
        errors: [`Missing required headers: ${missingHeaders.join(', ')}`],
      };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowData: Record<string, string> = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      // Validate required fields
      const rowErrors: string[] = [];
      if (!rowData['Squad']) {
        rowErrors.push(`Row ${i + 1}: Squad is required but empty`);
      }
      if (!rowData['Epic Name']) {
        rowErrors.push(`Row ${i + 1}: Epic Name is required but empty`);
      }
      if (!rowData['Story Name']) {
        rowErrors.push(`Row ${i + 1}: Story Name is required but empty`);
      }
      if (!rowData['Sprint']) {
        rowErrors.push(`Row ${i + 1}: Sprint is required but empty`);
      }

      // Validate story points
      const storyPointsStr = rowData['Story Points'];
      if (!storyPointsStr) {
        rowErrors.push(`Row ${i + 1}: Story Points is required but empty`);
      } else {
        const storyPoints = parseFloat(storyPointsStr);
        if (isNaN(storyPoints)) {
          rowErrors.push(
            `Row ${i + 1}: Story Points must be a valid number, got '${storyPointsStr}'`
          );
        } else {
          // Valid row, add to data
          data.push({
            squad: rowData['Squad'],
            epicName: rowData['Epic Name'],
            storyName: rowData['Story Name'],
            sprint: rowData['Sprint'],
            storyPoints,
          });
        }
      }

      errors.push(...rowErrors);
    }

    return {
      success: errors.length === 0,
      data,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Aggregate epic and story data by team and sprint
 */
export function aggregateTeamSprintData(
  epicData: PowerBiEpicData[],
  storyData: PowerBiStoryData[]
): Map<string, TeamSprintData> {
  const result: Map<string, TeamSprintData> = new Map();

  // Create a map of epic story points by team/sprint/epic
  const epicPointsMap: Map<string, number> = new Map();
  epicData.forEach(epic => {
    const key = `${epic.squad}|${epic.sprint}|${epic.epicName}`;
    epicPointsMap.set(key, epic.storyPoints);
  });

  // Aggregate story points by team/sprint/epic
  const storyAggregation: Map<string, Map<string, number>> = new Map();
  storyData.forEach(story => {
    const teamSprintKey = `${story.squad}|${story.sprint}`;
    if (!storyAggregation.has(teamSprintKey)) {
      storyAggregation.set(teamSprintKey, new Map());
    }

    const epicMap = storyAggregation.get(teamSprintKey)!;
    const currentPoints = epicMap.get(story.epicName) || 0;
    epicMap.set(story.epicName, currentPoints + story.storyPoints);
  });

  // First, initialize all team/sprint combinations from epic data
  epicData.forEach(epic => {
    const teamName = epic.squad;
    const sprint = epic.sprint;

    if (!result.has(teamName)) {
      result.set(teamName, new Map());
    }

    const teamData = result.get(teamName)!;
    if (!teamData.has(sprint)) {
      teamData.set(sprint, {
        totalStoryPoints: 0,
        epicPoints: new Map(),
        unassignedPoints: 0,
      });
    }

    const sprintData = teamData.get(sprint)!;

    // Initialize epic with planned points from epics CSV
    sprintData.epicPoints.set(epic.epicName, epic.storyPoints);
  });

  // Process story data to get actual story points and find unassigned stories
  storyAggregation.forEach((epicMap, teamSprintKey) => {
    const [teamName, sprint] = teamSprintKey.split('|');

    if (!result.has(teamName)) {
      result.set(teamName, new Map());
    }

    const teamData = result.get(teamName)!;
    if (!teamData.has(sprint)) {
      teamData.set(sprint, {
        totalStoryPoints: 0,
        epicPoints: new Map(),
        unassignedPoints: 0,
      });
    }

    const sprintData = teamData.get(sprint)!;

    epicMap.forEach((storyPoints, epicName) => {
      const epicKey = `${teamName}|${sprint}|${epicName}`;
      if (epicPointsMap.has(epicKey)) {
        // This epic exists in the epic data, use actual story points
        sprintData.epicPoints.set(epicName, storyPoints);
      } else {
        // This is unassigned work (stories without matching epics)
        sprintData.unassignedPoints += storyPoints;
      }
    });
  });

  // Calculate total story points for each team/sprint
  result.forEach(teamData => {
    teamData.forEach(sprintData => {
      let totalPoints = sprintData.unassignedPoints;
      sprintData.epicPoints.forEach(points => {
        totalPoints += points;
      });
      sprintData.totalStoryPoints = totalPoints;
    });
  });

  return result;
}

/**
 * Calculate allocation percentages from aggregated data
 */
export function calculateAllocationPercentages(
  aggregationResult: Map<string, TeamSprintData>
): AllocationResult[] {
  const results: AllocationResult[] = [];

  aggregationResult.forEach((teamSprintData, teamName) => {
    teamSprintData.forEach((sprintData, sprint) => {
      const { totalStoryPoints, epicPoints, unassignedPoints } = sprintData;

      // Skip if no story points
      if (totalStoryPoints === 0) {
        return;
      }

      // Calculate percentages for each epic
      epicPoints.forEach((storyPoints, epicName) => {
        const percentage =
          Math.round((storyPoints / totalStoryPoints) * 100 * 100) / 100; // Round to 2 decimals

        results.push({
          teamName,
          epicName,
          sprint,
          percentage,
          storyPoints,
          epicType: undefined, // Will be resolved in mapping step
        });
      });

      // Add unassigned work as Run Work if any
      if (unassignedPoints > 0) {
        const percentage =
          Math.round((unassignedPoints / totalStoryPoints) * 100 * 100) / 100; // Round to 2 decimals

        results.push({
          teamName,
          epicName: 'Unassigned Work',
          sprint,
          percentage,
          storyPoints: unassignedPoints,
          epicType: 'Run Work',
        });
      }
    });
  });

  return results;
}

/**
 * Validate Power BI import data
 */
export function validatePowerBiData(
  allocations: AllocationResult[],
  teams: Team[],
  epics: Epic[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validAllocations: AllocationResult[] = [];

  // Create lookup maps for faster validation
  const teamMap = new Map(teams.map(t => [t.name.toLowerCase(), t]));

  // Validate each allocation
  allocations.forEach(allocation => {
    let isValid = true;

    // Validate team exists
    if (!teamMap.has(allocation.teamName.toLowerCase())) {
      errors.push(`Team "${allocation.teamName}" not found in existing teams`);
      isValid = false;
    }

    if (isValid) {
      validAllocations.push(allocation);
    }
  });

  // Check for over-allocation by team and sprint
  const teamSprintTotals: Map<string, number> = new Map();
  validAllocations.forEach(allocation => {
    const key = `${allocation.teamName} Sprint ${allocation.sprint}`;
    const currentTotal = teamSprintTotals.get(key) || 0;
    teamSprintTotals.set(key, currentTotal + allocation.percentage);
  });

  // Add warnings for over-allocation
  teamSprintTotals.forEach((total, key) => {
    if (total > 100) {
      warnings.push(`${key} allocation exceeds 100%: ${total}%`);
    }
  });

  return {
    success: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    validAllocations,
  };
}
