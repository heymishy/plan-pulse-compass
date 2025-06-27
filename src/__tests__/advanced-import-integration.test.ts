import { describe, it, expect, beforeEach } from 'vitest';
import { parseActualAllocationCSV } from '../utils/trackingImportUtils';
import { parseTeamsWithDivisionsCSV } from '../utils/enhancedCsvUtils';

describe('Advanced Import Integration', () => {
  let importedTeams: any[] = [];
  let importedCycles: any[] = [];
  let importedEpics: any[] = [];
  let importedRunWorkCategories: any[] = [];

  beforeEach(() => {
    // Reset imported data
    importedTeams = [];
    importedCycles = [];
    importedEpics = [];
    importedRunWorkCategories = [];
  });

  it('should import teams first, then actual allocations with those teams', () => {
    // Step 1: Import teams using the existing utility
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Frontend Team,div-1,Engineering,100,500000,Engineering division
team-2,Backend Team,div-1,Engineering,120,500000,Engineering division
team-3,Design Team,div-2,Product,80,300000,Product division
team-4,QA Team,div-1,Engineering,60,500000,Engineering division`;

    const teamsResult = parseTeamsWithDivisionsCSV(teamsCSV);
    expect(teamsResult.teams).toHaveLength(4);
    expect(teamsResult.divisions).toHaveLength(2);

    importedTeams = teamsResult.teams;

    // Step 2: Create some cycles (quarters)
    importedCycles = [
      { id: '1', name: 'Q1 2024', type: 'quarterly' },
      { id: '2', name: 'Q2 2024', type: 'quarterly' },
    ];

    // Step 3: Create some epics
    importedEpics = [
      { id: '1', name: 'User Authentication' },
      { id: '2', name: 'Dashboard UI' },
      { id: '3', name: 'API Development' },
    ];

    // Step 4: Create run work categories
    importedRunWorkCategories = [
      { id: '1', name: 'Production Support' },
      { id: '2', name: 'Technical Debt' },
      { id: '3', name: 'Bug Fixes' },
    ];

    // Step 5: Import actual allocations using the imported teams
    const allocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Frontend Team,Q1 2024,1,User Authentication,Epic,65,scope-change,Additional security requirements
Frontend Team,Q1 2024,1,Production Support,Run Work,35,none,Regular support work
Backend Team,Q1 2024,1,API Development,Epic,80,none,API development completed
Backend Team,Q1 2024,1,Technical Debt,Run Work,20,priority-shift,Urgent tech debt items
Design Team,Q1 2024,1,Dashboard UI,Epic,90,none,Design work completed
QA Team,Q1 2024,1,Bug Fixes,Run Work,100,none,QA testing and bug fixes`;

    const allocationsResult = parseActualAllocationCSV(
      allocationsCSV,
      importedTeams,
      importedCycles,
      importedEpics,
      importedRunWorkCategories
    );

    // Verify no errors
    expect(allocationsResult.errors).toHaveLength(0);
    expect(allocationsResult.allocations).toHaveLength(6);

    // Verify team matching worked correctly
    const frontendAllocations = allocationsResult.allocations.filter(
      a => a.teamId === importedTeams[0].id
    );
    const backendAllocations = allocationsResult.allocations.filter(
      a => a.teamId === importedTeams[1].id
    );
    const designAllocations = allocationsResult.allocations.filter(
      a => a.teamId === importedTeams[2].id
    );
    const qaAllocations = allocationsResult.allocations.filter(
      a => a.teamId === importedTeams[3].id
    );

    expect(frontendAllocations).toHaveLength(2);
    expect(backendAllocations).toHaveLength(2);
    expect(designAllocations).toHaveLength(1);
    expect(qaAllocations).toHaveLength(1);
  });

  it('should handle case sensitivity and whitespace in team names', () => {
    // Import teams with specific names
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Engineering Team,div-1,Engineering,100,500000,Engineering division
team-2,Design Team,div-2,Product,80,300000,Product division`;

    const teamsResult = parseTeamsWithDivisionsCSV(teamsCSV);
    importedTeams = teamsResult.teams;

    importedCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    importedEpics = [{ id: '1', name: 'User Authentication' }];
    importedRunWorkCategories = [{ id: '1', name: 'Production Support' }];

    // Test with different case and whitespace variations
    const allocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
engineering team,Q1 2024,1,User Authentication,Epic,65,none,Lowercase
  Engineering Team  ,Q1 2024,1,User Authentication,Epic,70,none,Extra spaces
DESIGN TEAM,Q1 2024,1,User Authentication,Epic,80,none,Uppercase`;

    const allocationsResult = parseActualAllocationCSV(
      allocationsCSV,
      importedTeams,
      importedCycles,
      importedEpics,
      importedRunWorkCategories
    );

    expect(allocationsResult.errors).toHaveLength(0);
    expect(allocationsResult.allocations).toHaveLength(3);
  });

  it('should provide clear error messages for missing teams', () => {
    // Import teams
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Frontend Team,div-1,Engineering,100,500000,Engineering division`;

    const teamsResult = parseTeamsWithDivisionsCSV(teamsCSV);
    importedTeams = teamsResult.teams;

    importedCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    importedEpics = [{ id: '1', name: 'User Authentication' }];
    importedRunWorkCategories = [{ id: '1', name: 'Production Support' }];

    // Try to import allocations with a non-existent team
    const allocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
NonExistentTeam,Q1 2024,1,User Authentication,Epic,65,none,This team doesn't exist
Frontend Team,Q1 2024,1,User Authentication,Epic,65,none,This team exists`;

    const allocationsResult = parseActualAllocationCSV(
      allocationsCSV,
      importedTeams,
      importedCycles,
      importedEpics,
      importedRunWorkCategories
    );

    expect(allocationsResult.errors).toHaveLength(1);
    expect(allocationsResult.errors[0]).toContain(
      'Team "NonExistentTeam" not found'
    );
    expect(allocationsResult.allocations).toHaveLength(1); // Only the valid one should be imported
  });

  it('should handle mixed epic and run work allocations', () => {
    // Import teams
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Engineering Team,div-1,Engineering,100,500000,Engineering division`;

    const teamsResult = parseTeamsWithDivisionsCSV(teamsCSV);
    importedTeams = teamsResult.teams;

    importedCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    importedEpics = [{ id: '1', name: 'User Authentication' }];
    importedRunWorkCategories = [{ id: '1', name: 'Production Support' }];

    // Test mixed epic and run work allocations
    const allocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Engineering Team,Q1 2024,1,User Authentication,Epic,60,none,Epic work
Engineering Team,Q1 2024,1,Production Support,Run Work,40,none,Run work`;

    const allocationsResult = parseActualAllocationCSV(
      allocationsCSV,
      importedTeams,
      importedCycles,
      importedEpics,
      importedRunWorkCategories
    );

    expect(allocationsResult.errors).toHaveLength(0);
    expect(allocationsResult.allocations).toHaveLength(2);

    const epicAllocation = allocationsResult.allocations.find(
      a => a.actualEpicId
    );
    const runWorkAllocation = allocationsResult.allocations.find(
      a => a.actualRunWorkCategoryId
    );

    expect(epicAllocation?.actualEpicId).toBe('1');
    expect(runWorkAllocation?.actualRunWorkCategoryId).toBe('1');
  });

  it('should handle missing epic names gracefully', () => {
    // Import teams
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Engineering Team,div-1,Engineering,100,500000,Engineering division`;

    const teamsResult = parseTeamsWithDivisionsCSV(teamsCSV);
    importedTeams = teamsResult.teams;

    importedCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    importedEpics = [{ id: '1', name: 'User Authentication' }];
    importedRunWorkCategories = [{ id: '1', name: 'Production Support' }];

    // Test with missing epic names
    const allocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Engineering Team,Q1 2024,1,,Epic,65,none,No epic specified
Engineering Team,Q1 2024,1,,Run Work,35,none,No run work specified`;

    const allocationsResult = parseActualAllocationCSV(
      allocationsCSV,
      importedTeams,
      importedCycles,
      importedEpics,
      importedRunWorkCategories
    );

    expect(allocationsResult.errors).toHaveLength(0);
    expect(allocationsResult.allocations).toHaveLength(2);

    // Both allocations should have no epic or run work category assigned
    allocationsResult.allocations.forEach(allocation => {
      expect(allocation.actualEpicId).toBeUndefined();
      expect(allocation.actualRunWorkCategoryId).toBeUndefined();
    });
  });

  it('should reproduce the "unassigned" team error scenario', () => {
    // Import teams
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-1,Frontend Team,div-1,Engineering,100,500000,Engineering division
team-2,Backend Team,div-1,Engineering,120,500000,Engineering division`;

    const teamsResult = parseTeamsWithDivisionsCSV(teamsCSV);
    importedTeams = teamsResult.teams;

    importedCycles = [{ id: '1', name: 'Q1 2024', type: 'quarterly' }];
    importedEpics = [{ id: '1', name: 'User Authentication' }];
    importedRunWorkCategories = [{ id: '1', name: 'Production Support' }];

    // This should reproduce the error you encountered
    const allocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Actual Percentage,Variance Reason,Notes
Frontend Team,Q1 2024,1,User Authentication,Epic,65,none,Valid team
unassigned,Q1 2024,1,User Authentication,Epic,35,none,This should cause the error
Backend Team,Q1 2024,1,User Authentication,Epic,80,none,Valid team`;

    const allocationsResult = parseActualAllocationCSV(
      allocationsCSV,
      importedTeams,
      importedCycles,
      importedEpics,
      importedRunWorkCategories
    );

    // Should have one error for the "unassigned" team
    expect(allocationsResult.errors).toHaveLength(1);
    expect(allocationsResult.errors[0]).toContain(
      'Team "unassigned" not found'
    );

    // Should only import the valid allocations
    expect(allocationsResult.allocations).toHaveLength(2);

    // Verify the valid teams were imported correctly
    const frontendAllocation = allocationsResult.allocations.find(
      a => a.teamId === importedTeams[0].id
    );
    const backendAllocation = allocationsResult.allocations.find(
      a => a.teamId === importedTeams[1].id
    );

    expect(frontendAllocation).toBeDefined();
    expect(backendAllocation).toBeDefined();
  });
});
