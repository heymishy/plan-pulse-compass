import {
  isRunWorkEpicType,
  isChangeWorkEpicType,
  parsePlanningAllocationCSVWithMapping,
} from '../trackingImportUtils';
import { describe, it, expect } from 'vitest';

describe('Epic Type Mapping', () => {
  describe('isRunWorkEpicType', () => {
    it('should return true for Critical Run', () => {
      expect(isRunWorkEpicType('Critical Run')).toBe(true);
    });

    it('should return false for Change Work types', () => {
      expect(isRunWorkEpicType('Feature')).toBe(false);
      expect(isRunWorkEpicType('Platform')).toBe(false);
      expect(isRunWorkEpicType('Tech Debt')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isRunWorkEpicType('critical run')).toBe(false);
      expect(isRunWorkEpicType('CRITICAL RUN')).toBe(false);
    });
  });

  describe('isChangeWorkEpicType', () => {
    it('should return true for Change Work types', () => {
      expect(isChangeWorkEpicType('Feature')).toBe(true);
      expect(isChangeWorkEpicType('Platform')).toBe(true);
      expect(isChangeWorkEpicType('Tech Debt')).toBe(true);
    });

    it('should return false for Run Work types', () => {
      expect(isChangeWorkEpicType('Critical Run')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isChangeWorkEpicType('feature')).toBe(false);
      expect(isChangeWorkEpicType('FEATURE')).toBe(false);
    });
  });

  it('should correctly identify Run Work Epic Types', () => {
    expect(isRunWorkEpicType('Critical Run')).toBe(true);
    expect(isRunWorkEpicType('Run Work')).toBe(true);
    expect(isRunWorkEpicType('Feature')).toBe(false);
    expect(isRunWorkEpicType('Platform')).toBe(false);
    expect(isRunWorkEpicType('Tech Debt')).toBe(false);
    expect(isRunWorkEpicType('Project')).toBe(false);
  });

  it('should correctly identify Change Work Epic Types', () => {
    expect(isChangeWorkEpicType('Feature')).toBe(true);
    expect(isChangeWorkEpicType('Platform')).toBe(true);
    expect(isChangeWorkEpicType('Tech Debt')).toBe(true);
    expect(isChangeWorkEpicType('Project')).toBe(true);
    expect(isChangeWorkEpicType('Critical Run')).toBe(false);
    expect(isChangeWorkEpicType('Run Work')).toBe(false);
  });

  it('should handle project detection in planning allocations', () => {
    const mockTeams = [{ id: '1', name: 'Engineering Team' }];
    const mockCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    const mockEpics = [
      {
        id: '1',
        name: 'User Authentication',
        projectId: 'project-1', // Epic with project association
      },
      {
        id: '2',
        name: 'Support Tickets', // Epic without project association
      },
    ];
    const mockRunWorkCategories = [{ id: '1', name: 'Production Support' }];
    const mockProjects = [
      { id: 'project-1', name: 'Digital Platform', milestones: [] },
    ];

    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Project Name,Allocation Percentage,Notes
Engineering Team,Q1 2024,1,User Authentication,,Digital Platform,60,Project epic
Engineering Team,Q1 2024,1,Support Tickets,,,40,Run work epic
Engineering Team,Q1 2024,1,New Epic,Feature,New Project,20,New project epic`;

    const mapping = {
      team_name: 'Team Name',
      quarter: 'Quarter',
      iteration_number: 'Iteration Number',
      epic_name: 'Epic Name',
      epic_type: 'Epic Type',
      project_name: 'Project Name',
      percentage: 'Allocation Percentage',
      notes: 'Notes',
    };

    const result = parsePlanningAllocationCSVWithMapping(
      csvContent,
      mapping,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories,
      mockProjects
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(3);

    // First allocation should be an epic (project-associated)
    expect(result.allocations[0].epicId).toBeDefined();
    expect(result.allocations[0].runWorkCategoryId).toBeUndefined();

    // Second allocation should be run work (no project association)
    expect(result.allocations[1].epicId).toBeUndefined();
    expect(result.allocations[1].runWorkCategoryId).toBeDefined();

    // Third allocation should be an epic (new project)
    expect(result.allocations[2].epicId).toBeDefined();
    expect(result.allocations[2].runWorkCategoryId).toBeUndefined();

    // Should have created new project
    expect(result.newProjects).toBeDefined();
    expect(result.newProjects!.length).toBe(1);
    expect(result.newProjects![0].name).toBe('New Project');
  });

  it('should handle direct project references without epic names', () => {
    const mockTeams = [{ id: '1', name: 'Engineering Team' }];
    const mockCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    const mockEpics = [];
    const mockRunWorkCategories = [];
    const mockProjects = [];

    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Project Name,Allocation Percentage,Notes
Engineering Team,Q1 2024,1,,,Digital Platform,100,Direct project allocation`;

    const mapping = {
      team_name: 'Team Name',
      quarter: 'Quarter',
      iteration_number: 'Iteration Number',
      epic_name: 'Epic Name',
      epic_type: 'Epic Type',
      project_name: 'Project Name',
      percentage: 'Allocation Percentage',
      notes: 'Notes',
    };

    const result = parsePlanningAllocationCSVWithMapping(
      csvContent,
      mapping,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories,
      mockProjects
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(1);

    // Should create a generic epic for the project
    expect(result.allocations[0].epicId).toBeDefined();
    expect(result.allocations[0].runWorkCategoryId).toBeUndefined();

    // Should have created new project and epic
    expect(result.newProjects).toBeDefined();
    expect(result.newProjects!.length).toBe(1);
    expect(result.newEpics).toBeDefined();
    expect(result.newEpics!.length).toBe(1);
    expect(result.newEpics![0].name).toBe('Digital Platform - General Work');
  });
});
