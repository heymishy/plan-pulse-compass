
import { ActualAllocation, IterationReview, IterationSnapshot } from '@/types';

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

export const parseActualAllocationCSV = (
  csvContent: string,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[]
): { allocations: ActualAllocation[], errors: { row: number, message: string }[] } => {
  const lines = parseCSV(csvContent);
  const headers = lines[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const dataRows = lines.slice(1);
  
  const allocations: ActualAllocation[] = [];
  const errors: { row: number, message: string }[] = [];

  dataRows.forEach((row, index) => {
    const rowNum = index + 2;
    try {
      const rowData: any = {};
      headers.forEach((header, i) => {
        rowData[header] = (row[i] || '').trim();
      });

      const teamName = rowData.team_name;
      if (!teamName) {
        errors.push({ row: rowNum, message: 'Team Name is required.' });
        return;
      }
      const team = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
      if (!team) {
        errors.push({ row: rowNum, message: `Team "${teamName}" not found.` });
        return;
      }

      const quarterName = rowData.quarter;
      if (!quarterName) {
        errors.push({ row: rowNum, message: 'Quarter is required.' });
        return;
      }
      const cycle = cycles.find(c => c.name.toLowerCase() === quarterName.toLowerCase() && c.type === 'quarterly');
      if (!cycle) {
        errors.push({ row: rowNum, message: `Quarter "${quarterName}" not found.` });
        return;
      }

      const iterationNumber = parseInt(rowData.iteration_number, 10);
      if (isNaN(iterationNumber)) {
        errors.push({ row: rowNum, message: `Invalid iteration number: "${rowData.iteration_number}". Must be a whole number.` });
        return;
      }

      const actualPercentage = parseFloat(rowData.actual_percentage);
      if (isNaN(actualPercentage)) {
        errors.push({ row: rowNum, message: `Invalid actual percentage: "${rowData.actual_percentage}". Must be a number.` });
        return;
      }

      let actualEpicId: string | undefined;
      let actualRunWorkCategoryId: string | undefined;
      const epicName = rowData.epic_name;
      if (epicName) {
        const epic = epics.find(e => e.name.toLowerCase() === epicName.toLowerCase());
        if (epic) {
          actualEpicId = epic.id;
        } else {
          const runWork = runWorkCategories.find(r => r.name.toLowerCase() === epicName.toLowerCase());
          if (runWork) {
            actualRunWorkCategoryId = runWork.id;
          } else {
            errors.push({ row: rowNum, message: `Epic or run work category "${epicName}" not found.` });
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
        varianceReason: rowData.variance_reason || undefined,
        enteredDate: new Date().toISOString(),
      };

      allocations.push(actualAllocation);
    } catch (error) {
      errors.push({ row: rowNum, message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
  });

  return { allocations, errors };
};

export const parseIterationReviewCSV = (
  csvContent: string,
  cycles: any[],
  epics: any[],
  projects: any[]
): { reviews: IterationReview[], errors: string[] } => {
  const lines = parseCSV(csvContent);
  const headers = lines[0];
  const dataRows = lines.slice(1);
  
  const reviews: IterationReview[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, index) => {
    try {
      const rowData: any = {};
      headers.forEach((header, i) => {
        rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
      });

      // Find cycle
      const cycle = cycles.find(c => 
        c.name.toLowerCase() === rowData.quarter?.toLowerCase() && c.type === 'quarterly'
      );
      if (!cycle) {
        errors.push(`Row ${index + 2}: Quarter "${rowData.quarter}" not found`);
        return;
      }

      const iterationNumber = parseInt(rowData.iteration_number);
      if (isNaN(iterationNumber)) {
        errors.push(`Row ${index + 2}: Invalid iteration number "${rowData.iteration_number}"`);
        return;
      }

      // Parse completed epics
      const completedEpics: string[] = [];
      if (rowData.completed_epics) {
        const epicNames = rowData.completed_epics.split(',').map((name: string) => name.trim());
        for (const epicName of epicNames) {
          const epic = epics.find(e => 
            e.name.toLowerCase() === epicName.toLowerCase()
          );
          if (epic) {
            completedEpics.push(epic.id);
          } else {
            errors.push(`Row ${index + 2}: Epic "${epicName}" not found`);
          }
        }
      }

      // Parse completed milestones (we'll need to implement milestone lookup when available)
      const completedMilestones: string[] = [];
      if (rowData.completed_milestones) {
        const milestoneNames = rowData.completed_milestones.split(',').map((name: string) => name.trim());
        for (const milestoneName of milestoneNames) {
          // Find milestone across all projects
          let milestoneFound = false;
          for (const project of projects) {
            const milestone = project.milestones?.find((m: any) => 
              m.name.toLowerCase() === milestoneName.toLowerCase()
            );
            if (milestone) {
              completedMilestones.push(milestone.id);
              milestoneFound = true;
              break;
            }
          }
          if (!milestoneFound) {
            errors.push(`Row ${index + 2}: Milestone "${milestoneName}" not found`);
          }
        }
      }

      const review: IterationReview = {
        id: `review-${Date.now()}-${index}`,
        cycleId: cycle.id,
        iterationNumber,
        reviewDate: rowData.review_date || new Date().toISOString().split('T')[0],
        status: (rowData.status as 'not-started' | 'in-progress' | 'completed') || 'completed',
        completedEpics,
        completedMilestones,
        notes: rowData.notes || undefined,
      };

      reviews.push(review);
    } catch (error) {
      errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return { reviews, errors };
};

export const parseBulkTrackingCSV = (
  csvContent: string,
  teams: any[],
  cycles: any[],
  epics: any[],
  runWorkCategories: any[],
  projects: any[]
): { allocations: ActualAllocation[], reviews: IterationReview[], errors: string[] } => {
  const lines = parseCSV(csvContent);
  const headers = lines[0];
  const dataRows = lines.slice(1);
  
  const allocations: ActualAllocation[] = [];
  const reviews: IterationReview[] = [];
  const errors: string[] = [];

  // Group rows by data type
  const allocationRows: string[][] = [];
  const reviewRows: string[][] = [];

  dataRows.forEach((row, index) => {
    const rowData: any = {};
    headers.forEach((header, i) => {
      rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
    });

    if (rowData.data_type?.toLowerCase() === 'allocation') {
      allocationRows.push(row);
    } else if (rowData.data_type?.toLowerCase() === 'review') {
      reviewRows.push(row);
    } else {
      errors.push(`Row ${index + 2}: Invalid data type "${rowData.data_type}". Must be "allocation" or "review"`);
    }
  });

  // Process allocation rows
  if (allocationRows.length > 0) {
    const allocationCSV = [headers, ...allocationRows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const allocationResult = parseActualAllocationCSV(
      allocationCSV, teams, cycles, epics, runWorkCategories
    );
    allocations.push(...allocationResult.allocations);
    errors.push(...allocationResult.errors);
  }

  // Process review rows
  if (reviewRows.length > 0) {
    const reviewCSV = [headers, ...reviewRows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const reviewResult = parseIterationReviewCSV(reviewCSV, cycles, epics, projects);
    reviews.push(...reviewResult.reviews);
    errors.push(...reviewResult.errors);
  }

  return { allocations, reviews, errors };
};

export const downloadActualAllocationSampleCSV = () => {
  const sampleData = [
    ['Team Name', 'Quarter', 'Iteration Number', 'Epic Name', 'Epic Type', 'Actual Percentage', 'Variance Reason', 'Notes'],
    ['Frontend Team', 'Q1 2024', '1', 'User Authentication', 'Epic', '65', 'scope-change', 'Additional security requirements'],
    ['Frontend Team', 'Q1 2024', '1', 'Production Support', 'Run Work', '35', 'none', ''],
    ['Backend Team', 'Q1 2024', '1', 'API Development', 'Epic', '80', 'none', ''],
    ['Backend Team', 'Q1 2024', '1', 'Technical Debt', 'Run Work', '20', 'priority-shift', 'Urgent tech debt items'],
  ];

  const csvContent = sampleData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

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
    ['Quarter', 'Iteration Number', 'Review Date', 'Status', 'Completed Epics', 'Completed Milestones', 'Notes'],
    ['Q1 2024', '1', '2024-01-15', 'completed', 'User Authentication,Profile Management', 'Alpha Release', 'Sprint completed successfully'],
    ['Q1 2024', '2', '2024-01-29', 'in-progress', 'Dashboard UI', '', 'In progress review'],
    ['Q1 2024', '3', '2024-02-12', 'completed', 'API Integration,Testing Suite', 'Beta Release', 'All features delivered on time'],
  ];

  const csvContent = sampleData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

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
    ['Data Type', 'Team Name', 'Quarter', 'Iteration Number', 'Epic Name', 'Actual Percentage', 'Variance Reason', 'Review Date', 'Status', 'Completed Epics', 'Completed Milestones', 'Notes'],
    ['allocation', 'Frontend Team', 'Q1 2024', '1', 'User Authentication', '65', 'scope-change', '', '', '', '', 'Additional security requirements'],
    ['allocation', 'Frontend Team', 'Q1 2024', '1', 'Production Support', '35', 'none', '', '', '', '', ''],
    ['review', '', 'Q1 2024', '1', '', '', '', '2024-01-15', 'completed', 'User Authentication,Profile Management', 'Alpha Release', 'Sprint completed successfully'],
    ['review', '', 'Q1 2024', '2', '', '', '', '2024-01-29', 'in-progress', 'Dashboard UI', '', 'In progress review'],
  ];

  const csvContent = sampleData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

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
    ['Type', 'Team', 'Quarter', 'Iteration', 'Work Item', 'Actual %', 'Variance Reason', 'Review Date', 'Status', 'Completed Epics', 'Notes', 'Entered Date']
  ];

  // Add allocation data
  actualAllocations.forEach(allocation => {
    const team = teams.find(t => t.id === allocation.teamId);
    const cycle = cycles.find(c => c.id === allocation.cycleId);
    const epic = epics.find(e => e.id === allocation.actualEpicId);
    const runWork = runWorkCategories.find(r => r.id === allocation.actualRunWorkCategoryId);
    
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
      allocation.enteredDate
    ]);
  });

  // Add review data
  iterationReviews.forEach(review => {
    const cycle = cycles.find(c => c.id === review.cycleId);
    const completedEpicNames = review.completedEpics.map(epicId => {
      const epic = epics.find(e => e.id === epicId);
      return epic?.name || epicId;
    }).join(', ');
    
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
      ''
    ]);
  });

  const csvContent = data.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracking-data-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
