import { describe, it, expect } from 'vitest';
import { parseActualAllocationCSV } from '../trackingImportUtils';

describe('Actual Allocation Import', () => {
  const mockTeams = [
    { id: '1', name: 'Engineering Team' },
    { id: '2', name: 'Design Team' },
    { id: '3', name: 'Frontend Team' },
    { id: '4', name: 'Backend Team' },
  ];

  const mockCycles = [
    { id: '1', name: 'Q1 2024', type: 'quarterly' },
    { id: '2', name: 'Q2 2024', type: 'quarterly' },
  ];

  const mockEpics = [
    { id: '1', name: 'User Authentication' },
    { id: '2', name: 'Dashboard UI' },
  ];

  const mockRunWorkCategories = [
    { id: '1', name: 'Production Support' },
    { id: '2', name: 'Technical Debt' },
  ];

  it('should successfully parse valid CSV data', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Engineering Team,Q1 2024,1,User Authentication,Epic,65,scope-change,Additional security requirements
Design Team,Q1 2024,1,Dashboard UI,Epic,80,none,`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].teamId).toBe('1');
    expect(result.allocations[1].teamId).toBe('2');
  });

  it('should handle team name case insensitivity', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
engineering team,Q1 2024,1,User Authentication,Epic,65,scope-change,Additional security requirements`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].teamId).toBe('1');
  });

  it('should handle team name with extra spaces', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
  Engineering Team  ,Q1 2024,1,User Authentication,Epic,65,scope-change,Additional security requirements`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].teamId).toBe('1');
  });

  it('should error for non-existent team', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
NonExistentTeam,Q1 2024,1,User Authentication,Epic,65,scope-change,Additional security requirements`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain(
      'Team "NonExistentTeam" not found'
    );
    expect(result.allocations).toHaveLength(0);
  });

  it('should handle "unassigned" team name correctly', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
unassigned,Q1 2024,1,User Authentication,Epic,65,scope-change,Additional security requirements`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Team "unassigned" not found');
    expect(result.allocations).toHaveLength(0);
  });

  it('should handle run work categories', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Engineering Team,Q1 2024,1,Production Support,Run Work,35,none,`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].actualRunWorkCategoryId).toBe('1');
    expect(result.allocations[0].actualEpicId).toBeUndefined();
  });

  it('should handle missing epic name', () => {
    const csvContent = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Engineering Team,Q1 2024,1,,Epic,65,none,`;

    const result = parseActualAllocationCSV(
      csvContent,
      mockTeams,
      mockCycles,
      mockEpics,
      mockRunWorkCategories
    );

    expect(result.errors).toHaveLength(0);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].actualEpicId).toBeUndefined();
    expect(result.allocations[0].actualRunWorkCategoryId).toBeUndefined();
  });
});
