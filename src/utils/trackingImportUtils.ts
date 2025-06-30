import {
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
  Allocation,
} from '@/types';

export interface ActualAllocationImport {
  teamName: string;
  quarter: string;
  iterationNumber: number;
  epicName?: string;
  epicType?: string;
  actualPercentage: number;
  varianceReason?: string;
  notes?: string;
}

export interface IterationReviewImport {
  quarter: string;
  iterationNumber: number;
  reviewDate: string;
  status: string;
  completedEpics: string;
  completedMilestones: string;
  notes?: string;
}

export interface BulkTrackingImport {
  dataType: 'allocation' | 'review';
  teamName?: string;
  quarter: string;
  iterationNumber: number;
  epicName?: string;
  actualPercentage?: number;
  varianceReason?: string;
  reviewDate?: string;
  status?: string;
  completedEpics?: string;
  completedMilestones?: string;
  notes?: string;
}

export interface PlanningAllocationImport {
  teamName: string;
  quarter: string;
  iterationNumber: number;
  epicName?: string;
  epicType?: string;
  percentage: number;
  notes?: string;
}

export const parseCSV = (csvContent: string): string[][] => {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result.map(field => field.replace(/^"(.*)"$/, '$1'));
  });
};

// Helper function to determine if an Epic Type should be treated as Run Work
export const isRunWorkEpicType = (epicType: string): boolean => {
  const runWorkTypes = ['Critical Run'];
  return runWorkTypes.includes(epicType);
};

// Helper function to determine if an Epic Type should be treated as Change Work
export const isChangeWorkEpicType = (epicType: string): boolean => {
  const changeWorkTypes = ['Feature', 'Platform', 'Tech Debt'];
  return changeWorkTypes.includes(epicType);
};

// Enhanced parsing function with field mapping support
export const parseActualAllocationCSVWithMapping = (
  csvContent: string,
  mapping: Record<string, string>,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[],
  valueMappings?: Record<string, Record<string, string | number>>
): {
  allocations: ActualAllocation[];
  errors: { row: number; message: string }[];
} => {
  const lines = parseCSV(csvContent);
  const headers = lines[0];
  const dataRows = lines.slice(1);

  const allocations: ActualAllocation[] = [];
  const errors: { row: number; message: string }[] = [];

  // Create reverse mapping from field ID to header index
  const fieldToIndex: Record<string, number> = {};
  Object.entries(mapping).forEach(([fieldId, headerName]) => {
    const index = headers.findIndex(h => h === headerName);
    if (index !== -1) {
      fieldToIndex[fieldId] = index;
    }
  });

  // Helper function to translate CSV value to system value
  const translateValue = (fieldId: string, csvValue: string): string => {
    // Don't apply value mappings to percentage fields - they should just be parsed as numbers
    const percentageFields = ['percentage', 'actual_percentage'];
    if (percentageFields.includes(fieldId)) {
      return csvValue;
    }

    if (!valueMappings || !valueMappings[fieldId]) {
      return csvValue;
    }
    return String(valueMappings[fieldId][csvValue] || csvValue);
  };

  dataRows.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      // Extract values using mapping
      const getValue = (fieldId: string): string => {
        const index = fieldToIndex[fieldId];
        return index !== undefined ? (row[index] || '').trim() : '';
      };

      const teamName = getValue('team_name');
      if (!teamName) {
        errors.push({ row: rowNum, message: 'Team Name is required.' });
        return;
      }
      const translatedTeamName = translateValue('team_name', teamName);
      const team = teams.find(
        t => t.name.toLowerCase() === translatedTeamName.toLowerCase()
      );
      if (!team) {
        errors.push({
          row: rowNum,
          message: `Team "${translatedTeamName}" not found.`,
        });
        return;
      }

      const quarterName = getValue('quarter');
      if (!quarterName) {
        errors.push({ row: rowNum, message: 'Quarter is required.' });
        return;
      }
      const translatedQuarterName = translateValue('quarter', quarterName);
      const cycle = cycles.find(
        c =>
          c.name.toLowerCase() === translatedQuarterName.toLowerCase() &&
          c.type === 'quarterly'
      );
      if (!cycle) {
        errors.push({
          row: rowNum,
          message: `Quarter "${translatedQuarterName}" not found.`,
        });
        return;
      }

      const iterationNumberStr = getValue('iteration_number');
      if (!iterationNumberStr) {
        errors.push({ row: rowNum, message: 'Iteration Number is required.' });
        return;
      }
      const translatedIterationNumberStr = translateValue(
        'iteration_number',
        iterationNumberStr
      );
      const iterationNumber = parseInt(translatedIterationNumberStr, 10);
      if (isNaN(iterationNumber)) {
        errors.push({
          row: rowNum,
          message: `Invalid iteration number: "${translatedIterationNumberStr}". Must be a whole number.`,
        });
        return;
      }

      const actualPercentageStr = getValue('actual_percentage');
      if (!actualPercentageStr) {
        errors.push({ row: rowNum, message: 'Actual Percentage is required.' });
        return;
      }
      const translatedActualPercentageStr = translateValue(
        'actual_percentage',
        actualPercentageStr
      );
      let actualPercentage = parseFloat(translatedActualPercentageStr);
      if (isNaN(actualPercentage)) {
        errors.push({
          row: rowNum,
          message: `Invalid actual percentage: "${translatedActualPercentageStr}". Must be a number.`,
        });
        return;
      }

      // Handle decimal percentages (e.g., 0.0047 should become 0.47%)
      if (actualPercentage < 1 && actualPercentage > 0) {
        actualPercentage = actualPercentage * 100;
      }

      // Validate percentage range
      if (actualPercentage < 0 || actualPercentage > 100) {
        errors.push({
          row: rowNum,
          message: `Invalid actual percentage: ${actualPercentage}%. Must be between 0 and 100.`,
        });
        return;
      }

      let actualEpicId: string | undefined;
      let actualRunWorkCategoryId: string | undefined;
      const epicName = getValue('epic_name');
      if (epicName) {
        const translatedEpicName = translateValue('epic_name', epicName);
        const epicType = getValue('epic_type');
        const translatedEpicType = epicType
          ? translateValue('epic_type', epicType)
          : epicType;

        if (epicType && isRunWorkEpicType(translatedEpicType)) {
          const runWork = runWorkCategories.find(
            r => r.name.toLowerCase() === translatedEpicName.toLowerCase()
          );
          if (runWork) {
            actualRunWorkCategoryId = runWork.id;
          } else {
            errors.push({
              row: rowNum,
              message: `Run work category "${translatedEpicName}" not found.`,
            });
            return;
          }
        } else {
          const epic = epics.find(
            e => e.name.toLowerCase() === translatedEpicName.toLowerCase()
          );
          if (epic) {
            actualEpicId = epic.id;
          } else {
            errors.push({
              row: rowNum,
              message: `Epic "${translatedEpicName}" not found.`,
            });
            return;
          }
        }
      }

      const actualAllocation: ActualAllocation = {
        id: `actual-${Date.now()}-${index}`,
        teamId: team.id,
        cycleId: cycle.id,
        iterationNumber,
        actualPercentage,
        actualEpicId,
        actualRunWorkCategoryId,
        varianceReason: getValue('variance_reason') || undefined,
        enteredDate: new Date().toISOString(),
      };

      allocations.push(actualAllocation);
    } catch (error) {
      errors.push({
        row: rowNum,
        message:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  });

  return { allocations, errors };
};

// Enhanced iteration review parsing with mapping
export const parseIterationReviewCSVWithMapping = (
  csvContent: string,
  mapping: Record<string, string>,
  cycles: any[],
  epics: any[],
  projects: any[],
  valueMappings?: Record<string, Record<string, string | number>>
): {
  reviews: IterationReview[];
  errors: { row: number; message: string }[];
} => {
  const lines = parseCSV(csvContent);
  const headers = lines[0];
  const dataRows = lines.slice(1);

  const reviews: IterationReview[] = [];
  const errors: { row: number; message: string }[] = [];

  // Create reverse mapping from field ID to header index
  const fieldToIndex: Record<string, number> = {};
  Object.entries(mapping).forEach(([fieldId, headerName]) => {
    const index = headers.findIndex(h => h === headerName);
    if (index !== -1) {
      fieldToIndex[fieldId] = index;
    }
  });

  // Helper function to translate CSV value to system value
  const translateValue = (fieldId: string, csvValue: string): string => {
    // Don't apply value mappings to percentage fields - they should just be parsed as numbers
    const percentageFields = ['percentage', 'actual_percentage'];
    if (percentageFields.includes(fieldId)) {
      return csvValue;
    }

    if (!valueMappings || !valueMappings[fieldId]) {
      return csvValue;
    }
    return String(valueMappings[fieldId][csvValue] || csvValue);
  };

  dataRows.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      // Extract values using mapping
      const getValue = (fieldId: string): string => {
        const index = fieldToIndex[fieldId];
        return index !== undefined ? (row[index] || '').trim() : '';
      };

      // Find cycle
      const quarterName = getValue('quarter');
      if (!quarterName) {
        errors.push({ row: rowNum, message: 'Quarter is required.' });
        return;
      }
      const translatedQuarterName = translateValue('quarter', quarterName);
      const cycle = cycles.find(
        c =>
          c.name.toLowerCase() === translatedQuarterName.toLowerCase() &&
          c.type === 'quarterly'
      );
      if (!cycle) {
        errors.push({
          row: rowNum,
          message: `Quarter "${translatedQuarterName}" not found.`,
        });
        return;
      }

      const iterationNumberStr = getValue('iteration_number');
      if (!iterationNumberStr) {
        errors.push({ row: rowNum, message: 'Iteration Number is required.' });
        return;
      }
      const translatedIterationNumberStr = translateValue(
        'iteration_number',
        iterationNumberStr
      );
      const iterationNumber = parseInt(translatedIterationNumberStr, 10);
      if (isNaN(iterationNumber)) {
        errors.push({
          row: rowNum,
          message: `Invalid iteration number: "${translatedIterationNumberStr}". Must be a whole number.`,
        });
        return;
      }

      // Parse completed epics
      const completedEpics: string[] = [];
      const completedEpicsStr = getValue('completed_epics');
      if (completedEpicsStr) {
        const epicNames = completedEpicsStr.split(',').map(name => name.trim());
        epicNames.forEach(epicName => {
          const translatedEpicName = translateValue(
            'completed_epics',
            epicName
          );
          const epic = epics.find(
            e => e.name.toLowerCase() === translatedEpicName.toLowerCase()
          );
          if (epic) {
            completedEpics.push(epic.id);
          } else {
            errors.push({
              row: rowNum,
              message: `Epic "${translatedEpicName}" not found.`,
            });
          }
        });
      }

      // Parse completed milestones
      const completedMilestones: string[] = [];
      const completedMilestonesStr = getValue('completed_milestones');
      if (completedMilestonesStr) {
        const milestoneNames = completedMilestonesStr
          .split(',')
          .map(name => name.trim());
        milestoneNames.forEach(milestoneName => {
          const translatedMilestoneName = translateValue(
            'completed_milestones',
            milestoneName
          );
          const project = projects.find(
            p => p.name.toLowerCase() === translatedMilestoneName.toLowerCase()
          );
          if (project) {
            completedMilestones.push(project.id);
          } else {
            errors.push({
              row: rowNum,
              message: `Milestone "${translatedMilestoneName}" not found.`,
            });
          }
        });
      }

      const review: IterationReview = {
        id: `review-${Date.now()}-${index}`,
        cycleId: cycle.id,
        iterationNumber,
        reviewDate:
          getValue('review_date') || new Date().toISOString().split('T')[0],
        status: (getValue('status') as any) || 'not-started',
        completedEpics,
        completedMilestones,
        notes: getValue('notes') || undefined,
        completedBy: 'import',
      };

      reviews.push(review);
    } catch (error) {
      errors.push({
        row: rowNum,
        message:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  });

  return { reviews, errors };
};

// Enhanced bulk tracking parsing with mapping
export const parseBulkTrackingCSVWithMapping = (
  csvContent: string,
  mapping: Record<string, string>,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[],
  projects: any[],
  valueMappings?: Record<string, Record<string, string | number>>
): {
  allocations: ActualAllocation[];
  reviews: IterationReview[];
  errors: { row: number; message: string }[];
} => {
  const lines = parseCSV(csvContent);
  const headers = lines[0];
  const dataRows = lines.slice(1);

  const allocations: ActualAllocation[] = [];
  const reviews: IterationReview[] = [];
  const errors: { row: number; message: string }[] = [];

  // Create reverse mapping from field ID to header index
  const fieldToIndex: Record<string, number> = {};
  Object.entries(mapping).forEach(([fieldId, headerName]) => {
    const index = headers.findIndex(h => h === headerName);
    if (index !== -1) {
      fieldToIndex[fieldId] = index;
    }
  });

  // Helper function to translate CSV value to system value
  const translateValue = (fieldId: string, csvValue: string): string => {
    // Don't apply value mappings to percentage fields - they should just be parsed as numbers
    const percentageFields = ['percentage', 'actual_percentage'];
    if (percentageFields.includes(fieldId)) {
      return csvValue;
    }

    if (!valueMappings || !valueMappings[fieldId]) {
      return csvValue;
    }
    return String(valueMappings[fieldId][csvValue] || csvValue);
  };

  dataRows.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      // Extract values using mapping
      const getValue = (fieldId: string): string => {
        const index = fieldToIndex[fieldId];
        return index !== undefined ? (row[index] || '').trim() : '';
      };

      const dataType = getValue('data_type')?.toLowerCase();
      if (!dataType) {
        errors.push({ row: rowNum, message: 'Data Type is required.' });
        return;
      }

      if (dataType === 'allocation') {
        // Parse as allocation
        const teamName = getValue('team_name');
        if (!teamName) {
          errors.push({
            row: rowNum,
            message: 'Team Name is required for allocation data.',
          });
          return;
        }
        const translatedTeamName = translateValue('team_name', teamName);
        const team = teams.find(
          t => t.name.toLowerCase() === translatedTeamName.toLowerCase()
        );
        if (!team) {
          errors.push({
            row: rowNum,
            message: `Team "${translatedTeamName}" not found.`,
          });
          return;
        }

        const quarterName = getValue('quarter');
        if (!quarterName) {
          errors.push({
            row: rowNum,
            message: 'Quarter is required for allocation data.',
          });
          return;
        }
        const translatedQuarterName = translateValue('quarter', quarterName);
        const cycle = cycles.find(
          c =>
            c.name.toLowerCase() === translatedQuarterName.toLowerCase() &&
            c.type === 'quarterly'
        );
        if (!cycle) {
          errors.push({
            row: rowNum,
            message: `Quarter "${translatedQuarterName}" not found.`,
          });
          return;
        }

        const iterationNumberStr = getValue('iteration_number');
        if (!iterationNumberStr) {
          errors.push({
            row: rowNum,
            message: 'Iteration Number is required for allocation data.',
          });
          return;
        }
        const translatedIterationNumberStr = translateValue(
          'iteration_number',
          iterationNumberStr
        );
        const iterationNumber = parseInt(translatedIterationNumberStr, 10);
        if (isNaN(iterationNumber)) {
          errors.push({
            row: rowNum,
            message: `Invalid iteration number: "${translatedIterationNumberStr}".`,
          });
          return;
        }

        const actualPercentageStr = getValue('actual_percentage');
        if (!actualPercentageStr) {
          errors.push({
            row: rowNum,
            message: 'Actual Percentage is required for allocation data.',
          });
          return;
        }
        const translatedActualPercentageStr = translateValue(
          'actual_percentage',
          actualPercentageStr
        );
        let actualPercentage = parseFloat(translatedActualPercentageStr);
        if (isNaN(actualPercentage)) {
          errors.push({
            row: rowNum,
            message: `Invalid actual percentage: "${translatedActualPercentageStr}".`,
          });
          return;
        }

        // Handle decimal percentages (e.g., 0.0047 should become 0.47%)
        if (actualPercentage < 1 && actualPercentage > 0) {
          actualPercentage = actualPercentage * 100;
        }

        // Validate percentage range
        if (actualPercentage < 0 || actualPercentage > 100) {
          errors.push({
            row: rowNum,
            message: `Invalid actual percentage: ${actualPercentage}%. Must be between 0 and 100.`,
          });
          return;
        }

        let actualEpicId: string | undefined;
        let actualRunWorkCategoryId: string | undefined;
        const epicName = getValue('epic_name');
        if (epicName) {
          const translatedEpicName = translateValue('epic_name', epicName);
          const epicType = getValue('epic_type');
          const translatedEpicType = epicType
            ? translateValue('epic_type', epicType)
            : epicType;

          if (epicType && isRunWorkEpicType(translatedEpicType)) {
            const runWork = runWorkCategories.find(
              r => r.name.toLowerCase() === translatedEpicName.toLowerCase()
            );
            if (runWork) {
              actualRunWorkCategoryId = runWork.id;
            } else {
              errors.push({
                row: rowNum,
                message: `Run work category "${translatedEpicName}" not found.`,
              });
              return;
            }
          } else {
            const epic = epics.find(
              e => e.name.toLowerCase() === translatedEpicName.toLowerCase()
            );
            if (epic) {
              actualEpicId = epic.id;
            } else {
              errors.push({
                row: rowNum,
                message: `Epic "${translatedEpicName}" not found.`,
              });
              return;
            }
          }
        }

        const actualAllocation: ActualAllocation = {
          id: `actual-${Date.now()}-${index}`,
          teamId: team.id,
          cycleId: cycle.id,
          iterationNumber,
          actualPercentage,
          actualEpicId,
          actualRunWorkCategoryId,
          varianceReason: getValue('variance_reason') || undefined,
          enteredDate: new Date().toISOString(),
        };

        allocations.push(actualAllocation);
      } else if (dataType === 'review') {
        // Parse as review
        const quarterName = getValue('quarter');
        if (!quarterName) {
          errors.push({
            row: rowNum,
            message: 'Quarter is required for review data.',
          });
          return;
        }
        const translatedQuarterName = translateValue('quarter', quarterName);
        const cycle = cycles.find(
          c =>
            c.name.toLowerCase() === translatedQuarterName.toLowerCase() &&
            c.type === 'quarterly'
        );
        if (!cycle) {
          errors.push({
            row: rowNum,
            message: `Quarter "${translatedQuarterName}" not found.`,
          });
          return;
        }

        const iterationNumberStr = getValue('iteration_number');
        if (!iterationNumberStr) {
          errors.push({
            row: rowNum,
            message: 'Iteration Number is required for review data.',
          });
          return;
        }
        const translatedIterationNumberStr = translateValue(
          'iteration_number',
          iterationNumberStr
        );
        const iterationNumber = parseInt(translatedIterationNumberStr, 10);
        if (isNaN(iterationNumber)) {
          errors.push({
            row: rowNum,
            message: `Invalid iteration number: "${translatedIterationNumberStr}".`,
          });
          return;
        }

        // Parse completed epics
        const completedEpics: string[] = [];
        const completedEpicsStr = getValue('completed_epics');
        if (completedEpicsStr) {
          const epicNames = completedEpicsStr
            .split(',')
            .map(name => name.trim());
          epicNames.forEach(epicName => {
            const translatedEpicName = translateValue(
              'completed_epics',
              epicName
            );
            const epic = epics.find(
              e => e.name.toLowerCase() === translatedEpicName.toLowerCase()
            );
            if (epic) {
              completedEpics.push(epic.id);
            } else {
              errors.push({
                row: rowNum,
                message: `Epic "${translatedEpicName}" not found.`,
              });
            }
          });
        }

        // Parse completed milestones
        const completedMilestones: string[] = [];
        const completedMilestonesStr = getValue('completed_milestones');
        if (completedMilestonesStr) {
          const milestoneNames = completedMilestonesStr
            .split(',')
            .map(name => name.trim());
          milestoneNames.forEach(milestoneName => {
            const translatedMilestoneName = translateValue(
              'completed_milestones',
              milestoneName
            );
            const project = projects.find(
              p =>
                p.name.toLowerCase() === translatedMilestoneName.toLowerCase()
            );
            if (project) {
              completedMilestones.push(project.id);
            } else {
              errors.push({
                row: rowNum,
                message: `Milestone "${translatedMilestoneName}" not found.`,
              });
            }
          });
        }

        const review: IterationReview = {
          id: `review-${Date.now()}-${index}`,
          cycleId: cycle.id,
          iterationNumber,
          reviewDate:
            getValue('review_date') || new Date().toISOString().split('T')[0],
          status: (getValue('status') as any) || 'not-started',
          completedEpics,
          completedMilestones,
          notes: getValue('notes') || undefined,
          completedBy: 'import',
        };

        reviews.push(review);
      } else {
        errors.push({
          row: rowNum,
          message: `Invalid data type: "${dataType}". Must be "allocation" or "review".`,
        });
      }
    } catch (error) {
      errors.push({
        row: rowNum,
        message:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  });

  return { allocations, reviews, errors };
};

// Legacy functions for backward compatibility
export const parseActualAllocationCSV = (
  csvContent: string,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[]
): {
  allocations: ActualAllocation[];
  errors: { row: number; message: string }[];
} => {
  // Create flexible default mapping that can handle both column name variations
  const lines = parseCSV(csvContent);
  const headers = lines[0];

  // Determine the correct epic column name based on what's in the CSV
  const epicColumnName =
    headers.find(h => h === 'Epic/Work Name') ||
    headers.find(h => h === 'Epic Name') ||
    'Epic/Work Name';

  const defaultMapping = {
    team_name: 'Team Name',
    quarter: 'Quarter',
    iteration_number: 'Iteration Number',
    epic_name: epicColumnName,
    epic_type: 'Epic Type',
    actual_percentage: 'Actual Percentage',
    variance_reason: 'Variance Reason',
    notes: 'Notes',
  };

  return parseActualAllocationCSVWithMapping(
    csvContent,
    defaultMapping,
    teams,
    cycles,
    epics,
    runWorkCategories
  );
};

export const parseIterationReviewCSV = (
  csvContent: string,
  cycles: any[],
  epics: any[],
  projects: any[]
): { reviews: IterationReview[]; errors: string[] } => {
  // Create default mapping based on expected headers
  const defaultMapping = {
    quarter: 'Quarter',
    iteration_number: 'Iteration Number',
    review_date: 'Review Date',
    status: 'Status',
    completed_epics: 'Completed Epics',
    completed_milestones: 'Completed Milestones',
    notes: 'Notes',
  };

  const result = parseIterationReviewCSVWithMapping(
    csvContent,
    defaultMapping,
    cycles,
    epics,
    projects
  );
  return {
    reviews: result.reviews,
    errors: result.errors.map(e => `Row ${e.row}: ${e.message}`),
  };
};

export const parseBulkTrackingCSV = (
  csvContent: string,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[],
  projects: any[]
): {
  allocations: ActualAllocation[];
  reviews: IterationReview[];
  errors: string[];
} => {
  // Create default mapping based on expected headers
  const defaultMapping = {
    data_type: 'Data Type',
    team_name: 'Team Name',
    quarter: 'Quarter',
    iteration_number: 'Iteration Number',
    epic_name: 'Epic/Work Name',
    actual_percentage: 'Actual Percentage',
    variance_reason: 'Variance Reason',
    review_date: 'Review Date',
    status: 'Status',
    completed_epics: 'Completed Epics',
    completed_milestones: 'Completed Milestones',
    notes: 'Notes',
  };

  const result = parseBulkTrackingCSVWithMapping(
    csvContent,
    defaultMapping,
    teams,
    cycles,
    epics,
    runWorkCategories,
    projects
  );
  return {
    allocations: result.allocations,
    reviews: result.reviews,
    errors: result.errors.map(e => `Row ${e.row}: ${e.message}`),
  };
};

export const downloadActualAllocationSampleCSV = () => {
  const sampleData = [
    [
      'Team Name',
      'Quarter',
      'Iteration Number',
      'Epic Name',
      'Epic Type',
      'Actual Percentage',
      'Variance Reason',
      'Notes',
    ],
    [
      'Frontend Team',
      'Q1 2024',
      '1',
      'User Authentication',
      'Feature',
      '65',
      'scope-change',
      'Additional security requirements',
    ],
    [
      'Frontend Team',
      'Q1 2024',
      '1',
      'Production Support',
      'Critical Run',
      '35',
      'none',
      '',
    ],
    [
      'Backend Team',
      'Q1 2024',
      '1',
      'API Development',
      'Platform',
      '80',
      'none',
      '',
    ],
    [
      'Backend Team',
      'Q1 2024',
      '1',
      'Code Refactoring',
      'Tech Debt',
      '20',
      'priority-shift',
      'Urgent tech debt items',
    ],
  ];

  const csvContent = sampleData
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'actual-allocations-sample.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

export const downloadIterationReviewSampleCSV = () => {
  const sampleData = [
    [
      'Quarter',
      'Iteration Number',
      'Review Date',
      'Status',
      'Completed Epics',
      'Completed Milestones',
      'Notes',
    ],
    [
      'Q1 2024',
      '1',
      '2024-01-15',
      'completed',
      'User Authentication,Profile Management',
      'Alpha Release',
      'Sprint completed successfully',
    ],
    [
      'Q1 2024',
      '2',
      '2024-01-29',
      'in-progress',
      'Dashboard UI',
      '',
      'In progress review',
    ],
    [
      'Q1 2024',
      '3',
      '2024-02-12',
      'completed',
      'API Integration,Testing Suite',
      'Beta Release',
      'All features delivered on time',
    ],
  ];

  const csvContent = sampleData
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'iteration-reviews-sample.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

export const downloadBulkTrackingSampleCSV = () => {
  const sampleData = [
    [
      'Data Type',
      'Team Name',
      'Quarter',
      'Iteration Number',
      'Epic Name',
      'Actual Percentage',
      'Variance Reason',
      'Review Date',
      'Status',
      'Completed Epics',
      'Completed Milestones',
      'Notes',
    ],
    [
      'allocation',
      'Frontend Team',
      'Q1 2024',
      '1',
      'User Authentication',
      '65',
      'scope-change',
      '',
      '',
      '',
      '',
      'Additional security requirements',
    ],
    [
      'allocation',
      'Frontend Team',
      'Q1 2024',
      '1',
      'Production Support',
      '35',
      'none',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      'review',
      '',
      'Q1 2024',
      '1',
      '',
      '',
      '',
      '2024-01-15',
      'completed',
      'User Authentication,Profile Management',
      'Alpha Release',
      'Sprint completed successfully',
    ],
    [
      'review',
      '',
      'Q1 2024',
      '2',
      '',
      '',
      '',
      '2024-01-29',
      'in-progress',
      'Dashboard UI',
      '',
      'In progress review',
    ],
  ];

  const csvContent = sampleData
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bulk-tracking-sample.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportTrackingDataCSV = (
  actualAllocations: ActualAllocation[],
  iterationReviews: IterationReview[],
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[]
) => {
  const data = [
    [
      'Type',
      'Team',
      'Quarter',
      'Iteration',
      'Work Item',
      'Actual %',
      'Variance Reason',
      'Review Date',
      'Status',
      'Completed Epics',
      'Notes',
      'Entered Date',
    ],
  ];

  // Add allocation data
  actualAllocations.forEach(allocation => {
    const team = teams.find(t => t.id === allocation.teamId);
    const cycle = cycles.find(c => c.id === allocation.cycleId);
    const epic = epics.find(e => e.id === allocation.actualEpicId);
    const runWork = runWorkCategories.find(
      r => r.id === allocation.actualRunWorkCategoryId
    );

    data.push([
      'Allocation',
      team?.name || '',
      cycle?.name || '',
      allocation.iterationNumber.toString(),
      epic?.name || runWork?.name || '',
      allocation.actualPercentage.toString(),
      allocation.varianceReason || '',
      '',
      '',
      '',
      '',
      allocation.enteredDate,
    ]);
  });

  // Add review data
  iterationReviews.forEach(review => {
    const cycle = cycles.find(c => c.id === review.cycleId);
    const completedEpicNames = review.completedEpics
      .map(epicId => {
        const epic = epics.find(e => e.id === epicId);
        return epic?.name || epicId;
      })
      .join(', ');

    data.push([
      'Review',
      '',
      cycle?.name || '',
      review.iterationNumber.toString(),
      '',
      '',
      '',
      review.reviewDate,
      review.status,
      completedEpicNames,
      review.notes || '',
      '',
    ]);
  });

  const csvContent = data
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracking-data-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Enhanced parsing function for planning allocations with field mapping support
export const parsePlanningAllocationCSVWithMapping = (
  csvContent: string,
  mapping: Record<string, string>,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[],
  valueMappings?: Record<string, Record<string, string | number>>
): {
  allocations: Allocation[];
  errors: { row: number; message: string }[];
  newTeams?: any[];
  newCycles?: any[];
  newEpics?: any[];
  newRunWorkCategories?: any[];
} => {
  const lines = parseCSV(csvContent);
  const headers = lines[0];
  const dataRows = lines.slice(1);

  const allocations: Allocation[] = [];
  const errors: { row: number; message: string }[] = [];

  // Track new records that need to be created
  const newTeams: any[] = [];
  const newCycles: any[] = [];
  const newEpics: any[] = [];
  const newRunWorkCategories: any[] = [];

  // Create reverse mapping from field ID to header index
  const fieldToIndex: Record<string, number> = {};
  Object.entries(mapping).forEach(([fieldId, headerName]) => {
    const index = headers.findIndex(h => h === headerName);
    if (index !== -1) {
      fieldToIndex[fieldId] = index;
    }
  });

  // Helper function to translate CSV value to system value
  const translateValue = (fieldId: string, csvValue: string): string => {
    // Don't apply value mappings to percentage fields - they should just be parsed as numbers
    const percentageFields = ['percentage', 'actual_percentage'];
    if (percentageFields.includes(fieldId)) {
      return csvValue;
    }

    if (!valueMappings || !valueMappings[fieldId]) {
      return csvValue;
    }

    const mappedValue = valueMappings[fieldId][csvValue];
    if (!mappedValue) {
      return csvValue;
    }

    // Handle "NEW:" prefix for creating new records
    if (String(mappedValue).startsWith('NEW:')) {
      return String(mappedValue).replace('NEW:', '');
    }

    return String(mappedValue);
  };

  // Helper function to get or create team
  const getOrCreateTeam = (teamName: string): any => {
    let team = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
    if (!team) {
      // Check if we already created this team in this import
      team = newTeams.find(
        t => t.name.toLowerCase() === teamName.toLowerCase()
      );
      if (!team) {
        team = {
          id: `team-${teamName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: teamName,
          capacity: 40, // Default capacity
        };
        newTeams.push(team);
      }
    }
    return team;
  };

  // Helper function to get or create cycle
  const getOrCreateCycle = (cycleName: string): any => {
    let cycle = cycles.find(
      c =>
        c.name.toLowerCase() === cycleName.toLowerCase() &&
        c.type === 'quarterly'
    );
    if (!cycle) {
      // Check if we already created this cycle in this import
      cycle = newCycles.find(
        c => c.name.toLowerCase() === cycleName.toLowerCase()
      );
      if (!cycle) {
        // Parse quarter name to get start/end dates
        const quarterMatch = cycleName.match(/Q(\d)\s+(\d{4})/);
        if (quarterMatch) {
          const quarter = parseInt(quarterMatch[1]);
          const year = parseInt(quarterMatch[2]);
          const startMonth = (quarter - 1) * 3;
          const startDate = new Date(year, startMonth, 1);
          const endDate = new Date(year, startMonth + 3, 0);

          cycle = {
            id: `cycle-${cycleName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: cycleName,
            type: 'quarterly',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          };
          newCycles.push(cycle);
        }
      }
    }
    return cycle;
  };

  // Helper function to get or create epic
  const getOrCreateEpic = (epicName: string): any => {
    let epic = epics.find(e => e.name.toLowerCase() === epicName.toLowerCase());
    if (!epic) {
      // Check if we already created this epic in this import
      epic = newEpics.find(
        e => e.name.toLowerCase() === epicName.toLowerCase()
      );
      if (!epic) {
        epic = {
          id: `epic-${epicName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: epicName,
          description: `Imported epic: ${epicName}`,
          effort: 0,
        };
        newEpics.push(epic);
      }
    }
    return epic;
  };

  // Helper function to get or create run work category
  const getOrCreateRunWorkCategory = (categoryName: string): any => {
    let category = runWorkCategories.find(
      r => r.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (!category) {
      // Check if we already created this category in this import
      category = newRunWorkCategories.find(
        r => r.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (!category) {
        category = {
          id: `runwork-${categoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: categoryName,
          description: `Imported run work: ${categoryName}`,
        };
        newRunWorkCategories.push(category);
      }
    }
    return category;
  };

  dataRows.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      // Extract values using mapping
      const getValue = (fieldId: string): string => {
        const index = fieldToIndex[fieldId];
        return index !== undefined ? (row[index] || '').trim() : '';
      };

      const teamName = getValue('team_name');
      if (!teamName) {
        errors.push({ row: rowNum, message: 'Team Name is required.' });
        return;
      }
      const translatedTeamName = translateValue('team_name', teamName);
      const team = getOrCreateTeam(translatedTeamName);

      const quarterName = getValue('quarter');
      if (!quarterName) {
        errors.push({ row: rowNum, message: 'Quarter is required.' });
        return;
      }
      const translatedQuarterName = translateValue('quarter', quarterName);
      const cycle = getOrCreateCycle(translatedQuarterName);

      const iterationNumberStr = getValue('iteration_number');
      if (!iterationNumberStr) {
        errors.push({ row: rowNum, message: 'Iteration Number is required.' });
        return;
      }
      const translatedIterationNumberStr = translateValue(
        'iteration_number',
        iterationNumberStr
      );
      const iterationNumber = parseInt(translatedIterationNumberStr, 10);
      if (isNaN(iterationNumber)) {
        errors.push({
          row: rowNum,
          message: `Invalid iteration number: "${translatedIterationNumberStr}". Must be a whole number.`,
        });
        return;
      }

      const percentageStr = getValue('percentage');
      if (!percentageStr) {
        errors.push({
          row: rowNum,
          message: 'Allocation Percentage is required.',
        });
        return;
      }
      const translatedPercentageStr = translateValue(
        'percentage',
        percentageStr
      );
      let percentage = parseFloat(translatedPercentageStr);
      if (isNaN(percentage)) {
        errors.push({
          row: rowNum,
          message: `Invalid allocation percentage: "${translatedPercentageStr}". Must be a number.`,
        });
        return;
      }

      // Handle decimal percentages (e.g., 0.0047 should become 0.47%)
      if (percentage < 1 && percentage > 0) {
        percentage = percentage * 100;
      }

      // Validate percentage range
      if (percentage < 0 || percentage > 100) {
        errors.push({
          row: rowNum,
          message: `Invalid allocation percentage: ${percentage}%. Must be between 0 and 100.`,
        });
        return;
      }

      let epicId: string | undefined;
      let runWorkCategoryId: string | undefined;
      const epicName = getValue('epic_name');
      if (epicName) {
        const translatedEpicName = translateValue('epic_name', epicName);
        const epicType = getValue('epic_type');
        const translatedEpicType = epicType
          ? translateValue('epic_type', epicType)
          : epicType;

        if (epicType && isRunWorkEpicType(translatedEpicType)) {
          const runWork = getOrCreateRunWorkCategory(translatedEpicName);
          runWorkCategoryId = runWork.id;
        } else {
          const epic = getOrCreateEpic(translatedEpicName);
          epicId = epic.id;
        }
      }

      const notes = getValue('notes');
      // Include epic name in notes if it wasn't matched to an existing epic or run work category
      const finalNotes =
        epicName && !epicId && !runWorkCategoryId
          ? `${notes ? notes + ' - ' : ''}Epic/Work: ${epicName}`
          : notes;

      // Create allocation object
      const allocation: Allocation = {
        id: `planning-${Date.now()}-${index}`,
        teamId: team.id,
        cycleId: cycle.id,
        iterationNumber,
        epicId,
        runWorkCategoryId,
        percentage,
        notes: finalNotes,
      };

      allocations.push(allocation);
    } catch (error) {
      errors.push({
        row: rowNum,
        message: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  return {
    allocations,
    errors,
    newTeams,
    newCycles,
    newEpics,
    newRunWorkCategories,
  };
};

export const downloadPlanningAllocationSampleCSV = () => {
  const sampleData = [
    [
      'Team Name',
      'Quarter',
      'Iteration Number',
      'Epic Name',
      'Epic Type',
      'Allocation Percentage',
      'Notes',
    ],
    [
      'Mortgage Origination',
      'Q1 2024',
      '1',
      'User Authentication',
      'Feature',
      '60',
      'Core authentication system',
    ],
    [
      'Mortgage Origination',
      'Q1 2024',
      '1',
      'Support Tickets',
      'Critical Run',
      '40',
      'Ongoing support work',
    ],
    [
      'Personal Loans Platform',
      'Q1 2024',
      '1',
      'Payments Integration',
      'Platform',
      '80',
      'Payment gateway integration',
    ],
    [
      'Personal Loans Platform',
      'Q1 2024',
      '1',
      'Code Refactoring',
      'Tech Debt',
      '20',
      'Technical debt reduction',
    ],
  ];

  const csvContent = sampleData
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'planning-allocations-sample.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
