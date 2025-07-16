import {
  parseAllocationCSV,
  validateAllocationImport,
  convertImportToAllocations,
  AllocationImportRow,
} from '../allocationImportUtils';
import { Team, Epic, RunWorkCategory, Cycle, Allocation } from '@/types';

describe('allocationImportUtils - Planning Allocation Import', () => {
  // Test data setup
  const mockTeams: Team[] = [
    { id: 'team-frontend', name: 'Frontend Team', capacity: 160 },
    { id: 'team-backend', name: 'Backend Team', capacity: 120 },
    { id: 'team-design', name: 'Design Team', capacity: 80 },
  ];

  const mockEpics: Epic[] = [
    {
      id: 'epic-auth',
      name: 'User Authentication',
      description: 'Authentication system',
      projectId: 'project-1',
      status: 'planning',
      effort: 34,
      targetDate: '2024-03-31',
    },
    {
      id: 'epic-api',
      name: 'API Development',
      description: 'Core API development',
      projectId: 'project-2',
      status: 'active',
      effort: 55,
      targetDate: '2024-05-31',
    },
  ];

  const mockRunWorkCategories: RunWorkCategory[] = [
    {
      id: 'run-support',
      name: 'Support Tickets',
      description: 'Customer support work',
    },
    {
      id: 'run-maintenance',
      name: 'System Maintenance',
      description: 'Infrastructure maintenance',
    },
    { id: 'run-bugs', name: 'Bug Fixes', description: 'Production bug fixes' },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'cycle-q1-2024',
      name: 'Q1 2024',
      type: 'quarterly',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      iterations: [],
    },
    {
      id: 'cycle-q2-2024',
      name: 'Q2 2024',
      type: 'quarterly',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      iterations: [],
    },
  ];

  describe('parseAllocationCSV', () => {
    it('should parse valid allocation CSV', () => {
      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication,Auth Project,1,60,Q1 2024
Frontend Team,Support Tickets,Run Work,1,40,Q1 2024
Backend Team,API Development,Core Platform,1,80,Q1 2024
Backend Team,Bug Fixes,Run Work,1,20,Q1 2024`;

      const result = parseAllocationCSV(csvContent);

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        teamName: 'Frontend Team',
        epicName: 'User Authentication',
        epicType: 'Auth Project',
        sprintNumber: 1,
        percentage: 60,
        quarter: 'Q1 2024',
      });
    });

    it('should handle quoted CSV fields', () => {
      const csvContent = `"teamName","epicName","epicType","sprintNumber","percentage","quarter"
"Frontend Team","User Authentication","Auth Project","1","60","Q1 2024"
"Design Team","UI/UX Design","Design Project","2","100","Q2 2024"`;

      const result = parseAllocationCSV(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0].teamName).toBe('Frontend Team');
      expect(result[1].teamName).toBe('Design Team');
      expect(result[1].epicName).toBe('UI/UX Design');
    });

    it('should filter out rows with missing required fields', () => {
      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication,Auth Project,1,60,Q1 2024
,Missing Team Epic,Project,1,50,Q1 2024
Backend Team,,Missing Epic,1,30,Q1 2024
Valid Team,Valid Epic,Valid Project,1,70,Q1 2024`;

      const result = parseAllocationCSV(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0].teamName).toBe('Frontend Team');
      expect(result[1].teamName).toBe('Valid Team');
    });

    it('should parse numeric fields correctly', () => {
      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,Epic 1,Project 1,2,75.5,Q1 2024
Backend Team,Epic 2,Project 2,invalid,invalid,Q1 2024`;

      const result = parseAllocationCSV(csvContent);

      expect(result[0].sprintNumber).toBe(2);
      expect(result[0].percentage).toBe(75.5);

      // Invalid numbers should default to 1 and 0
      expect(result[1].sprintNumber).toBe(1);
      expect(result[1].percentage).toBe(0);
    });

    it('should handle empty CSV gracefully', () => {
      const result = parseAllocationCSV('');
      expect(result).toEqual([]);
    });

    it('should handle CSV with only headers', () => {
      const csvContent =
        'teamName,epicName,epicType,sprintNumber,percentage,quarter';
      const result = parseAllocationCSV(csvContent);
      expect(result).toEqual([]);
    });
  });

  describe('validateAllocationImport', () => {
    const validImportData: AllocationImportRow[] = [
      {
        teamName: 'Frontend Team',
        epicName: 'User Authentication',
        epicType: 'Auth Project',
        sprintNumber: 1,
        percentage: 60,
        quarter: 'Q1 2024',
      },
      {
        teamName: 'Frontend Team',
        epicName: 'Support Tickets',
        epicType: 'Run Work',
        sprintNumber: 1,
        percentage: 40,
        quarter: 'Q1 2024',
      },
    ];

    it('should validate correct allocation data', () => {
      const result = validateAllocationImport(
        validImportData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch invalid team names', () => {
      const invalidData = [
        {
          ...validImportData[0],
          teamName: 'Nonexistent Team',
        },
      ];

      const result = validateAllocationImport(
        invalidData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Team "Nonexistent Team" not found');
    });

    it('should catch invalid quarter names', () => {
      const invalidData = [
        {
          ...validImportData[0],
          quarter: 'Q5 2024',
        },
      ];

      const result = validateAllocationImport(
        invalidData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Quarter "Q5 2024" not found');
    });

    it('should catch invalid epic names for project work', () => {
      const invalidData = [
        {
          ...validImportData[0],
          epicName: 'Nonexistent Epic',
          epicType: 'Some Project',
        },
      ];

      const result = validateAllocationImport(
        invalidData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Epic "Nonexistent Epic" not found');
    });

    it('should catch invalid run work category names', () => {
      const invalidData = [
        {
          ...validImportData[1],
          epicName: 'Nonexistent Run Work',
          epicType: 'Run Work',
        },
      ];

      const result = validateAllocationImport(
        invalidData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        'Run work category "Nonexistent Run Work" not found'
      );
    });

    it('should validate percentage ranges', () => {
      const invalidPercentages = [
        { ...validImportData[0], percentage: 0 },
        { ...validImportData[0], percentage: -10 },
        { ...validImportData[0], percentage: 150 },
      ];

      const result = validateAllocationImport(
        invalidPercentages,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(3);
      result.errors.forEach(error => {
        expect(error).toContain('Invalid percentage');
        expect(error).toContain('Must be between 1-100');
      });
    });

    it('should provide accurate row numbers in error messages', () => {
      const mixedData = [
        validImportData[0], // Valid - row 2
        { ...validImportData[0], teamName: 'Invalid Team' }, // Invalid - row 3
        validImportData[1], // Valid - row 4
        { ...validImportData[0], percentage: 150 }, // Invalid - row 5
      ];

      const result = validateAllocationImport(
        mixedData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Row 3:');
      expect(result.errors[1]).toContain('Row 5:');
    });

    it('should handle case-insensitive matching', () => {
      const caseVariationData = [
        { ...validImportData[0], teamName: 'FRONTEND TEAM' },
        { ...validImportData[0], quarter: 'q1 2024' },
        { ...validImportData[1], epicName: 'SUPPORT TICKETS' },
      ];

      const result = validateAllocationImport(
        caseVariationData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.valid).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('convertImportToAllocations', () => {
    const validImportData: AllocationImportRow[] = [
      {
        teamName: 'Frontend Team',
        epicName: 'User Authentication',
        epicType: 'Auth Project',
        sprintNumber: 1,
        percentage: 60,
        quarter: 'Q1 2024',
      },
      {
        teamName: 'Frontend Team',
        epicName: 'Support Tickets',
        epicType: 'Run Work',
        sprintNumber: 1,
        percentage: 40,
        quarter: 'Q1 2024',
      },
    ];

    it('should convert valid import data to allocations', () => {
      const result = convertImportToAllocations(
        validImportData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result).toHaveLength(2);

      // Check project epic allocation
      expect(result[0]).toMatchObject({
        teamId: 'team-frontend',
        cycleId: 'cycle-q1-2024',
        iterationNumber: 1,
        epicId: 'epic-auth',
        percentage: 60,
        notes: 'Imported from CSV',
      });
      expect(result[0].runWorkCategoryId).toBeUndefined();

      // Check run work allocation
      expect(result[1]).toMatchObject({
        teamId: 'team-frontend',
        cycleId: 'cycle-q1-2024',
        iterationNumber: 1,
        runWorkCategoryId: 'run-support',
        percentage: 40,
        notes: 'Imported from CSV',
      });
      expect(result[1].epicId).toBeUndefined();
    });

    it('should generate unique allocation IDs', () => {
      const result = convertImportToAllocations(
        validImportData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      const allocationIds = result.map(a => a.id);
      const uniqueIds = new Set(allocationIds);

      expect(uniqueIds.size).toBe(allocationIds.length);
      allocationIds.forEach(id => {
        expect(id).toMatch(/^imported-\d+-\w+$/);
      });
    });

    it('should skip rows with missing team or quarter references', () => {
      const invalidData = [
        validImportData[0], // Valid
        { ...validImportData[0], teamName: 'Nonexistent Team' }, // Invalid team
        { ...validImportData[0], quarter: 'Invalid Quarter' }, // Invalid quarter
        validImportData[1], // Valid
      ];

      const result = convertImportToAllocations(
        invalidData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result).toHaveLength(2);
      expect(result[0].teamId).toBe('team-frontend');
      expect(result[1].teamId).toBe('team-frontend');
    });

    it('should handle case-insensitive name matching', () => {
      const caseVariationData = [
        {
          ...validImportData[0],
          teamName: 'FRONTEND TEAM',
          quarter: 'q1 2024',
        },
        { ...validImportData[1], epicName: 'SUPPORT TICKETS' },
      ];

      const result = convertImportToAllocations(
        caseVariationData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result).toHaveLength(2);
      expect(result[0].teamId).toBe('team-frontend');
      expect(result[1].runWorkCategoryId).toBe('run-support');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete import workflow with mixed epic types', () => {
      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication,Auth Project,1,50,Q1 2024
Frontend Team,Support Tickets,Run Work,1,30,Q1 2024
Frontend Team,Bug Fixes,Run Work,1,20,Q1 2024
Backend Team,API Development,Core Platform,1,70,Q1 2024
Backend Team,System Maintenance,Run Work,1,30,Q1 2024
Design Team,Invalid Epic,Some Project,1,100,Q1 2024`;

      // Parse CSV
      const importData = parseAllocationCSV(csvContent);
      expect(importData).toHaveLength(6);

      // Validate data
      const validation = validateAllocationImport(
        importData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(validation.valid).toHaveLength(5);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('Epic "Invalid Epic" not found');

      // Convert valid data to allocations
      const allocations = convertImportToAllocations(
        validation.valid,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(allocations).toHaveLength(5);

      // Verify allocation distribution
      const frontendAllocations = allocations.filter(
        a => a.teamId === 'team-frontend'
      );
      const backendAllocations = allocations.filter(
        a => a.teamId === 'team-backend'
      );

      expect(frontendAllocations).toHaveLength(3);
      expect(backendAllocations).toHaveLength(2);

      // Verify percentage totals per team
      const frontendTotal = frontendAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );
      const backendTotal = backendAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );

      expect(frontendTotal).toBe(100);
      expect(backendTotal).toBe(100);
    });

    it('should handle quarterly allocation planning across multiple teams', () => {
      const csvContent = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication,Auth Project,1,60,Q1 2024
Frontend Team,Support Tickets,Run Work,1,40,Q1 2024
Frontend Team,User Authentication,Auth Project,2,50,Q1 2024
Frontend Team,Bug Fixes,Run Work,2,50,Q1 2024
Backend Team,API Development,Core Platform,1,80,Q2 2024
Backend Team,System Maintenance,Run Work,1,20,Q2 2024`;

      const importData = parseAllocationCSV(csvContent);
      const validation = validateAllocationImport(
        importData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(validation.valid).toHaveLength(6);

      const allocations = convertImportToAllocations(
        validation.valid,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      // Verify quarter distribution
      const q1Allocations = allocations.filter(
        a => a.cycleId === 'cycle-q1-2024'
      );
      const q2Allocations = allocations.filter(
        a => a.cycleId === 'cycle-q2-2024'
      );

      expect(q1Allocations).toHaveLength(4);
      expect(q2Allocations).toHaveLength(2);

      // Verify sprint distribution within quarters
      const q1Sprint1 = q1Allocations.filter(a => a.iterationNumber === 1);
      const q1Sprint2 = q1Allocations.filter(a => a.iterationNumber === 2);

      expect(q1Sprint1).toHaveLength(2);
      expect(q1Sprint2).toHaveLength(2);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed CSV gracefully', () => {
      const malformedCSV = `teamName,epicName,epicType
Frontend Team,Epic 1
Backend Team`;

      const result = parseAllocationCSV(malformedCSV);
      expect(result).toHaveLength(1); // parseAllocationCSV might include partially parsed row
    });

    it('should handle very large percentage allocations', () => {
      const extremeData = [
        {
          teamName: 'Frontend Team',
          epicName: 'User Authentication',
          epicType: 'Auth Project',
          sprintNumber: 1,
          percentage: 999999,
          quarter: 'Q1 2024',
        },
      ];

      const validation = validateAllocationImport(
        extremeData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('Invalid percentage 999999');
    });

    it('should handle floating-point percentage precision', () => {
      const preciseData = [
        {
          teamName: 'Frontend Team',
          epicName: 'User Authentication',
          epicType: 'Auth Project',
          sprintNumber: 1,
          percentage: 33.333333,
          quarter: 'Q1 2024',
        },
      ];

      const validation = validateAllocationImport(
        preciseData,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(validation.valid).toHaveLength(1);
      expect(validation.valid[0].percentage).toBe(33.333333);
    });
  });
});
