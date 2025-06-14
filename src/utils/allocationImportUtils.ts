
import { Allocation, Team, Epic, RunWorkCategory, Cycle } from '@/types';

export interface AllocationImportRow {
  teamName: string;
  epicName: string;
  epicType: string; // Project name or "Run Work"
  sprintNumber: number;
  percentage: number;
  quarter: string;
}

export const parseAllocationCSV = (text: string): AllocationImportRow[] => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1);
  
  return dataRows.map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    return {
      teamName: values[0] || '',
      epicName: values[1] || '',
      epicType: values[2] || '',
      sprintNumber: parseInt(values[3]) || 1,
      percentage: parseFloat(values[4]) || 0,
      quarter: values[5] || '',
    };
  }).filter(row => row.teamName && row.epicName);
};

export const validateAllocationImport = (
  importData: AllocationImportRow[],
  teams: Team[],
  epics: Epic[],
  runWorkCategories: RunWorkCategory[],
  cycles: Cycle[]
): { valid: AllocationImportRow[], errors: string[] } => {
  const errors: string[] = [];
  const valid: AllocationImportRow[] = [];

  importData.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for header and 0-based index
    
    // Validate team exists
    const team = teams.find(t => t.name.toLowerCase() === row.teamName.toLowerCase());
    if (!team) {
      errors.push(`Row ${rowNumber}: Team "${row.teamName}" not found`);
      return;
    }

    // Validate quarter exists
    const quarter = cycles.find(c => c.name.toLowerCase() === row.quarter.toLowerCase() && c.type === 'quarterly');
    if (!quarter) {
      errors.push(`Row ${rowNumber}: Quarter "${row.quarter}" not found`);
      return;
    }

    // Validate epic or run work exists
    if (row.epicType.toLowerCase() === 'run work') {
      const runWork = runWorkCategories.find(r => r.name.toLowerCase() === row.epicName.toLowerCase());
      if (!runWork) {
        errors.push(`Row ${rowNumber}: Run work category "${row.epicName}" not found`);
        return;
      }
    } else {
      const epic = epics.find(e => e.name.toLowerCase() === row.epicName.toLowerCase());
      if (!epic) {
        errors.push(`Row ${rowNumber}: Epic "${row.epicName}" not found`);
        return;
      }
    }

    // Validate percentage
    if (row.percentage <= 0 || row.percentage > 100) {
      errors.push(`Row ${rowNumber}: Invalid percentage ${row.percentage}. Must be between 1-100`);
      return;
    }

    valid.push(row);
  });

  return { valid, errors };
};

export const convertImportToAllocations = (
  importData: AllocationImportRow[],
  teams: Team[],
  epics: Epic[],
  runWorkCategories: RunWorkCategory[],
  cycles: Cycle[]
): Allocation[] => {
  const allocations: Allocation[] = [];

  importData.forEach(row => {
    const team = teams.find(t => t.name.toLowerCase() === row.teamName.toLowerCase());
    const quarter = cycles.find(c => c.name.toLowerCase() === row.quarter.toLowerCase() && c.type === 'quarterly');
    
    if (!team || !quarter) return;

    let epicId: string | undefined;
    let runWorkCategoryId: string | undefined;

    if (row.epicType.toLowerCase() === 'run work') {
      const runWork = runWorkCategories.find(r => r.name.toLowerCase() === row.epicName.toLowerCase());
      runWorkCategoryId = runWork?.id;
    } else {
      const epic = epics.find(e => e.name.toLowerCase() === row.epicName.toLowerCase());
      epicId = epic?.id;
    }

    allocations.push({
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      teamId: team.id,
      cycleId: quarter.id,
      iterationNumber: row.sprintNumber,
      epicId,
      runWorkCategoryId,
      percentage: row.percentage,
      notes: `Imported from CSV`,
    });
  });

  return allocations;
};

export const downloadAllocationSampleCSV = () => {
  const csvContent = `Team Name,Epic Name,Epic Type,Sprint Number,Percentage,Quarter
"Frontend Team","User Authentication","Auth System",1,60,"Q1 2024"
"Frontend Team","Support Tickets","Run Work",1,40,"Q1 2024"
"Backend Team","API Development","Core Platform",1,80,"Q1 2024"
"Backend Team","Bug Fixes","Run Work",1,20,"Q1 2024"`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'allocation-sample.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
