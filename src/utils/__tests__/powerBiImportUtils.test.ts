import { describe, it, expect, beforeEach } from 'vitest';
import {
  parsePowerBiEpicCSV,
  parsePowerBiStoryCSV,
  aggregateTeamSprintData,
  calculateAllocationPercentages,
  validatePowerBiData,
  type PowerBiEpicData,
  type PowerBiStoryData,
  type SprintData,
  type TeamSprintData,
  type AllocationResult,
} from '../powerBiImportUtils';
import { Team, Cycle, Epic } from '@/types';

describe('PowerBI Import Utils', () => {
  // Mock data setup
  const mockTeams: Team[] = [
    {
      id: 'team1',
      name: 'Team Alpha',
      description: 'Alpha team',
      type: 'permanent',
      status: 'active',
      divisionId: 'dev',
      capacity: 40,
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'team2',
      name: 'Team Beta',
      description: 'Beta team',
      type: 'permanent',
      status: 'active',
      divisionId: 'dev',
      capacity: 40,
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'q1-2024',
      name: 'Q1 2024',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      type: 'quarterly',
      financialYearId: 'fy2024',
    },
  ];

  const mockEpics: Epic[] = [
    {
      id: 'epic1',
      name: 'User Authentication',
      projectId: 'proj1',
      status: 'in-progress',
      priority: 'high',
      ranking: 1,
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset any mocks or state
  });

  describe('parsePowerBiEpicCSV', () => {
    it('should successfully parse valid epic CSV data', () => {
      const csvContent = `Squad,Epic Name,Epic Type,Sprint,Story Points
Team Alpha,User Authentication,Feature,1,20
Team Alpha,Payment Processing,Platform,1,30
Team Beta,Database Migration,Tech Debt,2,15`;

      const result = parsePowerBiEpicCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        squad: 'Team Alpha',
        epicName: 'User Authentication',
        epicType: 'Feature',
        sprint: '1',
        storyPoints: 20,
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing required fields', () => {
      const csvContent = `Squad,Epic Name,Sprint,Story Points
Team Alpha,User Authentication,1,20
,Payment Processing,1,30`;

      const result = parsePowerBiEpicCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Missing required headers: Epic Type');
    });

    it('should validate story points as numbers', () => {
      const csvContent = `Squad,Epic Name,Epic Type,Sprint,Story Points
Team Alpha,User Authentication,Feature,1,invalid`;

      const result = parsePowerBiEpicCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Story Points must be a valid number');
    });

    it('should handle empty CSV content', () => {
      const result = parsePowerBiEpicCSV('');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('CSV file is empty');
    });
  });

  describe('parsePowerBiStoryCSV', () => {
    it('should successfully parse valid story CSV data', () => {
      const csvContent = `Squad,Epic Name,Story Name,Sprint,Story Points
Team Alpha,User Authentication,Login Form,1,5
Team Alpha,User Authentication,Password Reset,1,8
Team Beta,Payment Processing,Stripe Integration,2,13`;

      const result = parsePowerBiStoryCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        squad: 'Team Alpha',
        epicName: 'User Authentication',
        storyName: 'Login Form',
        sprint: '1',
        storyPoints: 5,
      });
    });

    it('should handle missing required fields in story data', () => {
      const csvContent = `Squad,Epic Name,Story Name,Sprint,Story Points
Team Alpha,,Login Form,1,5
Team Beta,Payment Processing,,2,13`;

      const result = parsePowerBiStoryCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Epic Name is required');
      expect(result.errors[1]).toContain('Story Name is required');
    });
  });

  describe('aggregateTeamSprintData', () => {
    it('should correctly aggregate epic and story data by team and sprint', () => {
      const epicData: PowerBiEpicData[] = [
        {
          squad: 'Team Alpha',
          epicName: 'User Authentication',
          epicType: 'Feature',
          sprint: '1',
          storyPoints: 20,
        },
        {
          squad: 'Team Alpha',
          epicName: 'Payment Processing',
          epicType: 'Platform',
          sprint: '1',
          storyPoints: 30,
        },
      ];

      const storyData: PowerBiStoryData[] = [
        {
          squad: 'Team Alpha',
          epicName: 'User Authentication',
          storyName: 'Login Form',
          sprint: '1',
          storyPoints: 8,
        },
        {
          squad: 'Team Alpha',
          epicName: 'User Authentication',
          storyName: 'Password Reset',
          sprint: '1',
          storyPoints: 12,
        },
        {
          squad: 'Team Alpha',
          epicName: 'Payment Processing',
          storyName: 'Stripe Integration',
          sprint: '1',
          storyPoints: 30,
        },
      ];

      const result = aggregateTeamSprintData(epicData, storyData);

      expect(result.has('Team Alpha')).toBe(true);
      const teamAlphaData = result.get('Team Alpha')!;
      expect(teamAlphaData.has('1')).toBe(true);

      const sprint1Data = teamAlphaData.get('1')!;
      expect(sprint1Data.totalStoryPoints).toBe(50); // 20 + 30
      expect(sprint1Data.epicPoints.get('User Authentication')).toBe(20); // 8 + 12
      expect(sprint1Data.epicPoints.get('Payment Processing')).toBe(30);
      expect(sprint1Data.unassignedPoints).toBe(0);
    });

    it('should handle unassigned story points (stories without matching epics)', () => {
      const epicData: PowerBiEpicData[] = [
        {
          squad: 'Team Alpha',
          epicName: 'User Authentication',
          epicType: 'Feature',
          sprint: '1',
          storyPoints: 20,
        },
      ];

      const storyData: PowerBiStoryData[] = [
        {
          squad: 'Team Alpha',
          epicName: 'User Authentication',
          storyName: 'Login Form',
          sprint: '1',
          storyPoints: 8,
        },
        {
          squad: 'Team Alpha',
          epicName: 'Untracked Epic',
          storyName: 'Bug Fix',
          sprint: '1',
          storyPoints: 5,
        },
      ];

      const result = aggregateTeamSprintData(epicData, storyData);
      const sprint1Data = result.get('Team Alpha')!.get('1')!;

      expect(sprint1Data.totalStoryPoints).toBe(13); // 8 (User Auth stories) + 5 (unassigned)
      expect(sprint1Data.epicPoints.get('User Authentication')).toBe(8);
      expect(sprint1Data.unassignedPoints).toBe(5);
    });
  });

  describe('calculateAllocationPercentages', () => {
    it('should calculate correct allocation percentages', () => {
      const teamSprintData: TeamSprintData = new Map([
        [
          '1',
          {
            totalStoryPoints: 50,
            epicPoints: new Map([
              ['User Authentication', 20],
              ['Payment Processing', 30],
            ]),
            unassignedPoints: 0,
          },
        ],
      ]);

      const aggregationResult: Map<string, TeamSprintData> = new Map([
        ['Team Alpha', teamSprintData],
      ]);

      const result = calculateAllocationPercentages(aggregationResult);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        teamName: 'Team Alpha',
        epicName: 'User Authentication',
        sprint: '1',
        percentage: 40, // 20/50 * 100
        storyPoints: 20,
        epicType: undefined, // Will be resolved in mapping step
      });
      expect(result[1]).toEqual({
        teamName: 'Team Alpha',
        epicName: 'Payment Processing',
        sprint: '1',
        percentage: 60, // 30/50 * 100
        storyPoints: 30,
        epicType: undefined,
      });
    });

    it('should handle unassigned points as Run Work allocation', () => {
      const teamSprintData: TeamSprintData = new Map([
        [
          '1',
          {
            totalStoryPoints: 30,
            epicPoints: new Map([['User Authentication', 20]]),
            unassignedPoints: 10,
          },
        ],
      ]);

      const aggregationResult: Map<string, TeamSprintData> = new Map([
        ['Team Alpha', teamSprintData],
      ]);

      const result = calculateAllocationPercentages(aggregationResult);

      expect(result).toHaveLength(2);
      expect(result.find(r => r.epicName === 'Unassigned Work')).toEqual({
        teamName: 'Team Alpha',
        epicName: 'Unassigned Work',
        sprint: '1',
        percentage: 33.33, // 10/30 * 100, rounded to 2 decimals
        storyPoints: 10,
        epicType: 'Run Work',
      });
    });

    it('should handle zero story points gracefully', () => {
      const teamSprintData: TeamSprintData = new Map([
        [
          '1',
          {
            totalStoryPoints: 0,
            epicPoints: new Map(),
            unassignedPoints: 0,
          },
        ],
      ]);

      const aggregationResult: Map<string, TeamSprintData> = new Map([
        ['Team Alpha', teamSprintData],
      ]);

      const result = calculateAllocationPercentages(aggregationResult);

      expect(result).toHaveLength(0);
    });
  });

  describe('validatePowerBiData', () => {
    it('should validate team allocation totals', () => {
      const allocations: AllocationResult[] = [
        {
          teamName: 'Team Alpha',
          epicName: 'Epic A',
          sprint: '1',
          percentage: 60,
          storyPoints: 30,
          epicType: 'Feature',
        },
        {
          teamName: 'Team Alpha',
          epicName: 'Epic B',
          sprint: '1',
          percentage: 50, // Total = 110% (over-allocated)
          storyPoints: 25,
          epicType: 'Platform',
        },
      ];

      const result = validatePowerBiData(allocations, mockTeams, mockEpics);

      expect(result.success).toBe(false);
      expect(result.warnings).toContain(
        'Team Alpha Sprint 1 allocation exceeds 100%: 110%'
      );
    });

    it('should validate team existence', () => {
      const allocations: AllocationResult[] = [
        {
          teamName: 'Unknown Team',
          epicName: 'Epic A',
          sprint: '1',
          percentage: 50,
          storyPoints: 25,
          epicType: 'Feature',
        },
      ];

      const result = validatePowerBiData(allocations, mockTeams, mockEpics);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Team "Unknown Team" not found in existing teams'
      );
    });

    it('should pass validation for correct data', () => {
      const allocations: AllocationResult[] = [
        {
          teamName: 'Team Alpha',
          epicName: 'Epic A',
          sprint: '1',
          percentage: 50,
          storyPoints: 25,
          epicType: 'Feature',
        },
        {
          teamName: 'Team Alpha',
          epicName: 'Epic B',
          sprint: '1',
          percentage: 50,
          storyPoints: 25,
          epicType: 'Platform',
        },
      ];

      const result = validatePowerBiData(allocations, mockTeams, mockEpics);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
