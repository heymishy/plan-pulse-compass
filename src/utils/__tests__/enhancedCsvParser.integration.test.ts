import { describe, it, expect, vi } from 'vitest';
import {
  parseCSV,
  validateCSVData,
  processCSVUpload,
} from '../enhancedCsvParser';
import { Team, Epic, Person, RunWorkCategory, Cycle } from '@/types';

/**
 * Integration tests for enhanced CSV parser
 * Tests complex real-world CSV scenarios for GitHub Issue #34
 */
describe('Enhanced CSV Parser Integration Tests', () => {
  // Mock data representing a real organization setup
  const mockTeams: Team[] = [
    {
      id: 'team-frontend',
      name: 'Frontend Team',
      divisionId: 'engineering',
      capacity: 160,
      productOwnerId: 'person-po-1',
      skills: ['React', 'TypeScript', 'CSS'],
      members: ['person-1', 'person-2', 'person-3'],
      created: '2024-01-01',
      modified: '2024-01-01',
    },
    {
      id: 'team-backend',
      name: 'Backend Team',
      divisionId: 'engineering',
      capacity: 120,
      productOwnerId: 'person-po-2',
      skills: ['Node.js', 'Python', 'PostgreSQL'],
      members: ['person-4', 'person-5'],
      created: '2024-01-01',
      modified: '2024-01-01',
    },
    {
      id: 'team-design',
      name: 'Design Team',
      divisionId: 'product',
      capacity: 80,
      productOwnerId: 'person-po-3',
      skills: ['Figma', 'UI/UX', 'Prototyping'],
      members: ['person-6'],
      created: '2024-01-01',
      modified: '2024-01-01',
    },
  ];

  const mockPeople: Person[] = [
    {
      id: 'person-1',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      roleId: 'role-senior-dev',
      skillIds: ['skill-react', 'skill-typescript'],
      divisionId: 'engineering',
    },
    {
      id: 'person-2',
      name: 'Bob Smith',
      email: 'bob@company.com',
      roleId: 'role-dev',
      skillIds: ['skill-react', 'skill-css'],
      divisionId: 'engineering',
    },
    {
      id: 'person-3',
      name: 'Charlie Brown',
      email: 'charlie@company.com',
      roleId: 'role-junior-dev',
      skillIds: ['skill-javascript'],
      divisionId: 'engineering',
    },
    {
      id: 'person-4',
      name: 'Diana Prince',
      email: 'diana@company.com',
      roleId: 'role-senior-dev',
      skillIds: ['skill-node', 'skill-python'],
      divisionId: 'engineering',
    },
    {
      id: 'person-5',
      name: 'Edward Norton',
      email: 'edward@company.com',
      roleId: 'role-dev',
      skillIds: ['skill-postgresql', 'skill-node'],
      divisionId: 'engineering',
    },
    {
      id: 'person-6',
      name: 'Fiona Green',
      email: 'fiona@company.com',
      roleId: 'role-designer',
      skillIds: ['skill-figma', 'skill-ux'],
      divisionId: 'product',
    },
  ];

  const mockEpics: Epic[] = [
    {
      id: 'epic-auth',
      name: 'User Authentication System',
      description: 'Complete authentication overhaul',
      projectId: 'project-platform',
      status: 'active',
      effort: 34,
      targetDate: '2024-03-31',
      targetEndDate: '2024-03-31',
    },
    {
      id: 'epic-dashboard',
      name: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard',
      projectId: 'project-platform',
      status: 'planning',
      effort: 55,
      targetDate: '2024-06-30',
      targetEndDate: '2024-06-30',
    },
    {
      id: 'epic-mobile',
      name: 'Mobile App Launch',
      description: 'iOS and Android app launch',
      projectId: 'project-mobile',
      status: 'planning',
      effort: 89,
      targetDate: '2024-09-30',
      targetEndDate: '2024-09-30',
    },
  ];

  const mockRunWorkCategories: RunWorkCategory[] = [
    {
      id: 'run-support',
      name: 'Customer Support',
      description: 'Handle customer tickets and issues',
      color: '#f59e0b',
    },
    {
      id: 'run-bugs',
      name: 'Bug Fixes',
      description: 'Fix production bugs and issues',
      color: '#ef4444',
    },
    {
      id: 'run-maintenance',
      name: 'System Maintenance',
      description: 'Infrastructure and system maintenance',
      color: '#8b5cf6',
    },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'cycle-q1-2024',
      name: 'Q1 2024',
      type: 'quarterly',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      status: 'active',
      financialYearId: 'fy-2024',
    },
    {
      id: 'cycle-q2-2024',
      name: 'Q2 2024',
      type: 'quarterly',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      status: 'planning',
      financialYearId: 'fy-2024',
    },
    {
      id: 'cycle-q3-2024',
      name: 'Q3 2024',
      type: 'quarterly',
      startDate: '2024-07-01',
      endDate: '2024-09-30',
      status: 'planning',
      financialYearId: 'fy-2024',
    },
  ];

  describe('Real-world CSV Import Scenarios', () => {
    it('should handle complete quarterly allocation import', async () => {
      const quarterlyAllocationCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024
Frontend Team,Customer Support,Run Work,1,40,Q1 2024
Frontend Team,User Authentication System,Project Epic,2,50,Q1 2024
Frontend Team,Bug Fixes,Run Work,2,50,Q1 2024
Backend Team,User Authentication System,Project Epic,1,70,Q1 2024
Backend Team,System Maintenance,Run Work,1,30,Q1 2024
Backend Team,Analytics Dashboard,Project Epic,2,80,Q1 2024
Backend Team,Bug Fixes,Run Work,2,20,Q1 2024
Design Team,User Authentication System,Project Epic,1,60,Q1 2024
Design Team,Analytics Dashboard,Project Epic,1,40,Q1 2024
Design Team,Mobile App Launch,Project Epic,2,80,Q1 2024
Design Team,Customer Support,Run Work,2,20,Q1 2024`;

      const result = await processCSVUpload(
        quarterlyAllocationCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(true);
      expect(result.validRows).toHaveLength(12);
      expect(result.errors).toHaveLength(0);

      // Verify all teams have allocations
      const frontendAllocations = result.validRows.filter(
        row => row.teamName === 'Frontend Team'
      );
      const backendAllocations = result.validRows.filter(
        row => row.teamName === 'Backend Team'
      );
      const designAllocations = result.validRows.filter(
        row => row.teamName === 'Design Team'
      );

      expect(frontendAllocations).toHaveLength(4);
      expect(backendAllocations).toHaveLength(4);
      expect(designAllocations).toHaveLength(4);

      // Verify percentage totals per team per sprint
      const frontendSprint1 = frontendAllocations.filter(
        row => row.sprintNumber === 1
      );
      const frontendSprint1Total = frontendSprint1.reduce(
        (sum, row) => sum + row.percentage,
        0
      );
      expect(frontendSprint1Total).toBe(100);
    });

    it('should handle mixed valid/invalid data with detailed error reporting', async () => {
      const mixedDataCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024
Invalid Team,User Authentication System,Project Epic,1,40,Q1 2024
Frontend Team,Invalid Epic,Project Epic,2,50,Q1 2024
Frontend Team,User Authentication System,Project Epic,3,150,Q1 2024
Backend Team,Customer Support,Run Work,1,70,Invalid Quarter
Design Team,User Authentication System,Project Epic,1,60,Q1 2024`;

      const result = await processCSVUpload(
        mixedDataCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.validRows).toHaveLength(2); // Only 2 valid rows
      expect(result.errors).toHaveLength(4);

      // Verify specific error messages
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages).toContain(
        expect.stringContaining('Team "Invalid Team" not found')
      );
      expect(errorMessages).toContain(
        expect.stringContaining('Epic "Invalid Epic" not found')
      );
      expect(errorMessages).toContain(
        expect.stringContaining('Invalid percentage 150')
      );
      expect(errorMessages).toContain(
        expect.stringContaining('Quarter "Invalid Quarter" not found')
      );
    });

    it('should handle case-insensitive team and epic matching', async () => {
      const caseInsensitiveCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
FRONTEND TEAM,USER AUTHENTICATION SYSTEM,Project Epic,1,60,Q1 2024
frontend team,user authentication system,Project Epic,2,50,Q1 2024
Frontend Team,USER AUTHENTICATION SYSTEM,Project Epic,3,40,Q1 2024
BACKEND TEAM,customer support,Run Work,1,70,q1 2024
design team,ANALYTICS DASHBOARD,Project Epic,1,80,Q1 2024`;

      const result = await processCSVUpload(
        caseInsensitiveCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(true);
      expect(result.validRows).toHaveLength(5);
      expect(result.errors).toHaveLength(0);

      // Verify team matching worked correctly
      const teamNames = result.validRows.map(row => row.teamName);
      expect(teamNames).toEqual([
        'FRONTEND TEAM',
        'frontend team',
        'Frontend Team',
        'BACKEND TEAM',
        'design team',
      ]);
    });

    it('should validate percentage allocation constraints', async () => {
      const percentageTestCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,0,Q1 2024
Frontend Team,User Authentication System,Project Epic,2,-10,Q1 2024
Frontend Team,User Authentication System,Project Epic,3,101,Q1 2024
Frontend Team,User Authentication System,Project Epic,4,100.5,Q1 2024
Frontend Team,User Authentication System,Project Epic,5,50.25,Q1 2024`;

      const result = await processCSVUpload(
        percentageTestCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.validRows).toHaveLength(2); // Only 100.5 and 50.25 are valid
      expect(result.errors).toHaveLength(3);

      // Verify percentage validation
      const validPercentages = result.validRows.map(row => row.percentage);
      expect(validPercentages).toEqual([100.5, 50.25]);
    });

    it('should handle large CSV files with performance tracking', async () => {
      // Generate a large CSV with 1000 rows
      const headerRow =
        'teamName,epicName,epicType,sprintNumber,percentage,quarter';
      const dataRows = Array.from({ length: 1000 }, (_, i) => {
        const teamIndex = i % mockTeams.length;
        const epicIndex = i % mockEpics.length;
        const sprintNumber = (i % 6) + 1;
        const percentage = Math.floor(Math.random() * 50) + 25; // 25-75%

        return `${mockTeams[teamIndex].name},${mockEpics[epicIndex].name},Project Epic,${sprintNumber},${percentage},Q1 2024`;
      });

      const largeCsv = [headerRow, ...dataRows].join('\n');

      const startTime = performance.now();
      const result = await processCSVUpload(
        largeCsv,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.validRows).toHaveLength(1000);
      expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
    });

    it('should handle CSV with different delimiter formats', async () => {
      const semicolonDelimitedCSV = `teamName;epicName;epicType;sprintNumber;percentage;quarter
Frontend Team;User Authentication System;Project Epic;1;60;Q1 2024
Backend Team;Customer Support;Run Work;1;40;Q1 2024`;

      const tabDelimitedCSV = `teamName	epicName	epicType	sprintNumber	percentage	quarter
Frontend Team	User Authentication System	Project Epic	1	60	Q1 2024
Backend Team	Customer Support	Run Work	1	40	Q1 2024`;

      // Test semicolon delimiter
      const semicolonResult = await processCSVUpload(
        semicolonDelimitedCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles,
        { delimiter: ';' }
      );

      expect(semicolonResult.success).toBe(true);
      expect(semicolonResult.validRows).toHaveLength(2);

      // Test tab delimiter
      const tabResult = await processCSVUpload(
        tabDelimitedCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles,
        { delimiter: '\t' }
      );

      expect(tabResult.success).toBe(true);
      expect(tabResult.validRows).toHaveLength(2);
    });

    it('should handle CSV with quoted fields and special characters', async () => {
      const quotedFieldsCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
"Frontend Team","User Authentication System","Project Epic",1,60,"Q1 2024"
"Backend Team","Customer Support (24/7)","Run Work",1,40,"Q1 2024"
"Design Team","Mobile App Launch, Phase 1","Project Epic",1,80,"Q1 2024"`;

      const result = await processCSVUpload(
        quotedFieldsCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false); // Some epics won't match due to modified names
      expect(result.validRows).toHaveLength(1); // Only the first row should match exactly
    });

    it('should provide detailed import statistics', async () => {
      const statisticsTestCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024
Frontend Team,Customer Support,Run Work,1,40,Q1 2024
Backend Team,User Authentication System,Project Epic,1,70,Q1 2024
Invalid Team,User Authentication System,Project Epic,1,30,Q1 2024
Frontend Team,Invalid Epic,Project Epic,2,50,Q1 2024`;

      const result = await processCSVUpload(
        statisticsTestCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalRows).toBe(5);
      expect(result.statistics.validRows).toBe(3);
      expect(result.statistics.errorRows).toBe(2);
      expect(result.statistics.teamsInvolved).toBe(2); // Frontend and Backend
      expect(result.statistics.epicsInvolved).toBe(1); // Only User Authentication System
      expect(result.statistics.quartersInvolved).toBe(1); // Only Q1 2024
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle malformed CSV gracefully', async () => {
      const malformedCSV = `teamName,epicName,epicType
Frontend Team,User Authentication System
Backend Team`;

      const result = await processCSVUpload(
        malformedCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('missing required fields');
    });

    it('should handle empty CSV file', async () => {
      const emptyCSV = '';

      const result = await processCSVUpload(
        emptyCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('CSV file is empty');
    });

    it('should handle CSV with only headers', async () => {
      const headersOnlyCSV =
        'teamName,epicName,epicType,sprintNumber,percentage,quarter';

      const result = await processCSVUpload(
        headersOnlyCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('No data rows found');
    });

    it('should handle CSV with missing required columns', async () => {
      const missingColumnsCSV = `teamName,epicName,percentage
Frontend Team,User Authentication System,60
Backend Team,Customer Support,40`;

      const result = await processCSVUpload(
        missingColumnsCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Missing required columns');
    });

    it('should provide recovery suggestions for common errors', async () => {
      const commonErrorCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024
Fronend Team,User Authentication System,Project Epic,1,40,Q1 2024
Frontend Team,User Auth System,Project Epic,2,50,Q1 2024
Frontend Team,User Authentication System,Project Epic,3,60,Q2 2024`;

      const result = await processCSVUpload(
        commonErrorCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3);

      // Verify error messages include suggestions
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes('Did you mean'))).toBe(
        true
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent CSV processing', async () => {
      const csv1 = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024`;

      const csv2 = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Backend Team,Customer Support,Run Work,1,40,Q1 2024`;

      const csv3 = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Design Team,Analytics Dashboard,Project Epic,1,80,Q1 2024`;

      const promises = [
        processCSVUpload(
          csv1,
          mockTeams,
          mockEpics,
          mockRunWorkCategories,
          mockCycles
        ),
        processCSVUpload(
          csv2,
          mockTeams,
          mockEpics,
          mockRunWorkCategories,
          mockCycles
        ),
        processCSVUpload(
          csv3,
          mockTeams,
          mockEpics,
          mockRunWorkCategories,
          mockCycles
        ),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.validRows).toHaveLength(1);
      });
    });

    it('should handle memory-efficient processing of large files', async () => {
      // Simulate a very large CSV (10,000 rows)
      const headerRow =
        'teamName,epicName,epicType,sprintNumber,percentage,quarter';
      const dataRows = Array.from({ length: 10000 }, (_, i) => {
        const teamIndex = i % mockTeams.length;
        const epicIndex = i % mockEpics.length;
        const sprintNumber = (i % 6) + 1;
        const percentage = 20; // Fixed percentage for consistency

        return `${mockTeams[teamIndex].name},${mockEpics[epicIndex].name},Project Epic,${sprintNumber},${percentage},Q1 2024`;
      });

      const largeCsv = [headerRow, ...dataRows].join('\n');

      const initialMemory = process.memoryUsage().heapUsed;
      const result = await processCSVUpload(
        largeCsv,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles
      );
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);

      expect(result.success).toBe(true);
      expect(result.validRows).toHaveLength(10000);
      expect(memoryIncreaseInMB).toBeLessThan(100); // Should not increase memory by more than 100MB
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should validate allocation percentages sum to reasonable totals', async () => {
      const allocationSumCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024
Frontend Team,Customer Support,Run Work,1,40,Q1 2024
Frontend Team,User Authentication System,Project Epic,2,120,Q1 2024
Frontend Team,Customer Support,Run Work,2,30,Q1 2024`;

      const result = await processCSVUpload(
        allocationSumCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles,
        { validateAllocationTotals: true }
      );

      expect(result.success).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('exceeds 100%');
    });

    it('should validate cross-team epic dependencies', async () => {
      const crossTeamCSV = `teamName,epicName,epicType,sprintNumber,percentage,quarter
Frontend Team,User Authentication System,Project Epic,1,60,Q1 2024
Backend Team,User Authentication System,Project Epic,1,70,Q1 2024
Frontend Team,User Authentication System,Project Epic,2,50,Q1 2024
Backend Team,User Authentication System,Project Epic,3,80,Q1 2024`;

      const result = await processCSVUpload(
        crossTeamCSV,
        mockTeams,
        mockEpics,
        mockRunWorkCategories,
        mockCycles,
        { validateCrossTeamDependencies: true }
      );

      expect(result.success).toBe(true);
      expect(result.validRows).toHaveLength(4);
      expect(result.insights).toBeDefined();
      expect(result.insights.crossTeamEpics).toContain(
        'User Authentication System'
      );
    });
  });
});
