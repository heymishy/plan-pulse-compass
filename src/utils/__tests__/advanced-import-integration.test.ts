import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseActualAllocationCSV,
  parsePlanningAllocationCSVWithMapping,
} from '../trackingImportUtils';
import { parseTeamsWithDivisionsCSV } from '../enhancedCsvUtils';

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
    expect(allocationsResult.errors[0].message).toContain(
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
    expect(allocationsResult.errors[0].message).toContain(
      'Team "unassigned" not found'
    );
    expect(allocationsResult.allocations).toHaveLength(2); // Only valid teams
  });

  it('should handle advanced import with large CSV files and team creation', () => {
    // Test the advanced import functionality with a large CSV file
    // This simulates the real-world scenario with 100+ teams

    // Start with only a few existing teams
    const existingTeams = [
      { id: '1', name: 'Engineering Team', capacity: 100 },
      { id: '2', name: 'Design Team', capacity: 80 },
    ];

    const existingCycles = [
      { id: '1', name: 'Q1 2024', type: 'quarterly' },
      { id: '2', name: 'Q2 2024', type: 'quarterly' },
    ];

    const existingEpics = [
      { id: '1', name: 'User Authentication' },
      { id: '2', name: 'Dashboard UI' },
    ];

    const existingRunWorkCategories = [
      { id: '1', name: 'Production Support' },
      { id: '2', name: 'Technical Debt' },
    ];

    // Create a large CSV with many teams (simulating 100+ teams scenario)
    const largeAllocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Allocation Percentage,Notes
Engineering Team,Q1 2024,1,User Authentication,Project,60,Existing team
Design Team,Q1 2024,1,Dashboard UI,Project,40,Existing team
Frontend Team,Q1 2024,1,User Authentication,Project,70,New team 1
Backend Team,Q1 2024,1,API Development,Project,80,New team 2
Mobile Team,Q1 2024,1,Mobile App,Project,65,New team 3
QA Team,Q1 2024,1,Testing Suite,Project,50,New team 4
DevOps Team,Q1 2024,1,Infrastructure,Project,45,New team 5
Data Team,Q1 2024,1,Analytics Platform,Project,75,New team 6
Security Team,Q1 2024,1,Security Audit,Project,55,New team 7
Product Team,Q1 2024,1,Feature Development,Project,85,New team 8
Marketing Team,Q1 2024,1,Marketing Tools,Project,30,New team 9
Sales Team,Q1 2024,1,Sales Dashboard,Project,40,New team 10
Support Team,Q1 2024,1,Customer Support,Project,35,New team 11
Research Team,Q1 2024,1,Research Platform,Project,60,New team 12
Architecture Team,Q1 2024,1,System Design,Project,70,New team 13
Integration Team,Q1 2024,1,API Integration,Project,65,New team 14
Performance Team,Q1 2024,1,Performance Optimization,Project,55,New team 15
Accessibility Team,Q1 2024,1,Accessibility Features,Project,45,New team 16
Internationalization Team,Q1 2024,1,Localization,Project,50,New team 17
Documentation Team,Q1 2024,1,Documentation System,Project,40,New team 18
Monitoring Team,Q1 2024,1,Monitoring Tools,Project,60,New team 19
Compliance Team,Q1 2024,1,Compliance Features,Project,70,New team 20
Innovation Team,Q1 2024,1,Innovation Platform,Project,80,New team 21`;

    // Test the planning allocation import with mapping functionality
    const mapping = {
      team_name: 'Team Name',
      quarter: 'Quarter',
      iteration_number: 'Iteration Number',
      epic_name: 'Epic Name',
      epic_type: 'Epic Type',
      percentage: 'Allocation Percentage',
      notes: 'Notes',
    };

    // Create value mappings for new teams (simulating what the advanced import would do)
    const valueMappings = {
      team_name: {
        'Frontend Team': 'NEW:Frontend Team',
        'Backend Team': 'NEW:Backend Team',
        'Mobile Team': 'NEW:Mobile Team',
        'QA Team': 'NEW:QA Team',
        'DevOps Team': 'NEW:DevOps Team',
        'Data Team': 'NEW:Data Team',
        'Security Team': 'NEW:Security Team',
        'Product Team': 'NEW:Product Team',
        'Marketing Team': 'NEW:Marketing Team',
        'Sales Team': 'NEW:Sales Team',
        'Support Team': 'NEW:Support Team',
        'Research Team': 'NEW:Research Team',
        'Architecture Team': 'NEW:Architecture Team',
        'Integration Team': 'NEW:Integration Team',
        'Performance Team': 'NEW:Performance Team',
        'Accessibility Team': 'NEW:Accessibility Team',
        'Internationalization Team': 'NEW:Internationalization Team',
        'Documentation Team': 'NEW:Documentation Team',
        'Monitoring Team': 'NEW:Monitoring Team',
        'Compliance Team': 'NEW:Compliance Team',
        'Innovation Team': 'NEW:Innovation Team',
      },
      epic_name: {
        'API Development': 'NEW:API Development',
        'Mobile App': 'NEW:Mobile App',
        'Testing Suite': 'NEW:Testing Suite',
        Infrastructure: 'NEW:Infrastructure',
        'Analytics Platform': 'NEW:Analytics Platform',
        'Security Audit': 'NEW:Security Audit',
        'Feature Development': 'NEW:Feature Development',
        'Marketing Tools': 'NEW:Marketing Tools',
        'Sales Dashboard': 'NEW:Sales Dashboard',
        'Customer Support': 'NEW:Customer Support',
        'Research Platform': 'NEW:Research Platform',
        'System Design': 'NEW:System Design',
        'API Integration': 'NEW:API Integration',
        'Performance Optimization': 'NEW:Performance Optimization',
        'Accessibility Features': 'NEW:Accessibility Features',
        Localization: 'NEW:Localization',
        'Documentation System': 'NEW:Documentation System',
        'Monitoring Tools': 'NEW:Monitoring Tools',
        'Compliance Features': 'NEW:Compliance Features',
        'Innovation Platform': 'NEW:Innovation Platform',
      },
    };

    // Test the planning allocation parsing with mapping
    const result = parsePlanningAllocationCSVWithMapping(
      largeAllocationsCSV,
      mapping,
      existingTeams,
      existingCycles,
      existingEpics,
      existingRunWorkCategories,
      valueMappings
    );

    // Verify no errors occurred
    expect(result.errors).toHaveLength(0);

    // Verify all allocations were created (should be 21 unique allocations)
    expect(result.allocations.length).toBeGreaterThanOrEqual(21);
    expect(result.allocations.length).toBeLessThanOrEqual(23); // Allow for some flexibility

    // Verify new teams were created
    expect(result.newTeams).toBeDefined();
    expect(result.newTeams!.length).toBe(19); // 21 total - 2 existing = 19 new

    // Verify new epics were created
    expect(result.newEpics).toBeDefined();
    expect(result.newEpics!.length).toBe(19); // All new epics

    // Verify specific new teams were created
    const newTeamNames = result.newTeams!.map(team => team.name);
    expect(newTeamNames).toContain('Frontend Team');
    expect(newTeamNames).toContain('Backend Team');
    expect(newTeamNames).toContain('Mobile Team');
    expect(newTeamNames).toContain('QA Team');
    expect(newTeamNames).toContain('DevOps Team');

    // Verify specific new epics were created
    const newEpicNames = result.newEpics!.map(epic => epic.name);
    expect(newEpicNames).toContain('API Development');
    expect(newEpicNames).toContain('Mobile App');
    expect(newEpicNames).toContain('Testing Suite');
    expect(newEpicNames).toContain('Infrastructure');

    // Verify allocations reference the correct teams and epics
    const frontendAllocation = result.allocations.find(
      a =>
        a.teamId === result.newTeams!.find(t => t.name === 'Frontend Team')?.id
    );
    expect(frontendAllocation).toBeDefined();
    expect(frontendAllocation!.percentage).toBe(70);

    const backendAllocation = result.allocations.find(
      a =>
        a.teamId === result.newTeams!.find(t => t.name === 'Backend Team')?.id
    );
    expect(backendAllocation).toBeDefined();
    expect(backendAllocation!.percentage).toBe(80);

    // Verify existing teams were used correctly
    const engineeringAllocation = result.allocations.find(
      a => a.teamId === '1' // Engineering Team ID
    );
    expect(engineeringAllocation).toBeDefined();
    expect(engineeringAllocation!.percentage).toBe(60);

    // Verify team capacities were set correctly for new teams
    result.newTeams!.forEach(team => {
      expect(team.capacity).toBe(40); // Default capacity
      expect(team.id).toMatch(/^team-.*-\d+$/); // Correct ID format
    });

    // Verify epic descriptions were set correctly for new epics
    result.newEpics!.forEach(epic => {
      expect(epic.description).toMatch(/^Imported epic: .*$/);
      expect(epic.effort).toBe(0); // Default effort
      expect(epic.id).toMatch(/^epic-.*-\d+$/); // Correct ID format
    });
  });

  it('should handle advanced import with mixed existing and new values', () => {
    // Test scenario where some values exist and some need to be created
    const existingTeams = [
      { id: '1', name: 'Engineering Team', capacity: 100 },
      { id: '2', name: 'Design Team', capacity: 80 },
      { id: '3', name: 'Frontend Team', capacity: 90 }, // This team already exists
    ];

    const existingCycles = [
      { id: '1', name: 'Q1 2024', type: 'quarterly' },
      { id: '2', name: 'Q2 2024', type: 'quarterly' },
    ];

    const existingEpics = [
      { id: '1', name: 'User Authentication' },
      { id: '2', name: 'Dashboard UI' },
      { id: '3', name: 'API Development' }, // This epic already exists
    ];

    const mixedAllocationsCSV = `Team Name,Quarter,Iteration Number,Epic Name,Epic Type,Allocation Percentage,Notes
Engineering Team,Q1 2024,1,User Authentication,Project,60,Existing team and epic
Frontend Team,Q1 2024,1,API Development,Project,70,Existing team and epic
Backend Team,Q1 2024,1,New Epic,Project,80,New team and epic
Mobile Team,Q1 2024,1,User Authentication,Project,65,New team, existing epic
Design Team,Q1 2024,1,New Epic 2,Project,55,Existing team, new epic`;

    const mapping = {
      team_name: 'Team Name',
      quarter: 'Quarter',
      iteration_number: 'Iteration Number',
      epic_name: 'Epic Name',
      epic_type: 'Epic Type',
      percentage: 'Allocation Percentage',
      notes: 'Notes',
    };

    const valueMappings = {
      team_name: {
        'Backend Team': 'NEW:Backend Team',
        'Mobile Team': 'NEW:Mobile Team',
      },
      epic_name: {
        'New Epic': 'NEW:New Epic',
        'New Epic 2': 'NEW:New Epic 2',
      },
    };

    const result = parsePlanningAllocationCSVWithMapping(
      mixedAllocationsCSV,
      mapping,
      existingTeams,
      existingCycles,
      existingEpics,
      [],
      valueMappings
    );

    // Verify no errors
    expect(result.errors).toHaveLength(0);

    // Verify all allocations were created
    expect(result.allocations).toHaveLength(5);

    // Verify new teams were created
    expect(result.newTeams).toBeDefined();
    expect(result.newTeams!.length).toBe(2); // Backend Team, Mobile Team

    // Verify new epics were created
    expect(result.newEpics).toBeDefined();
    expect(result.newEpics!.length).toBe(2); // New Epic, New Epic 2

    // Verify existing teams were used (not duplicated)
    const engineeringAllocation = result.allocations.find(
      a => a.teamId === '1' // Engineering Team ID
    );
    expect(engineeringAllocation).toBeDefined();

    const frontendAllocation = result.allocations.find(
      a => a.teamId === '3' // Frontend Team ID (existing)
    );
    expect(frontendAllocation).toBeDefined();

    // Verify existing epics were used (not duplicated)
    const authEpicAllocation = result.allocations.find(
      a => a.epicId === '1' // User Authentication ID
    );
    expect(authEpicAllocation).toBeDefined();

    const apiEpicAllocation = result.allocations.find(
      a => a.epicId === '3' // API Development ID
    );
    expect(apiEpicAllocation).toBeDefined();

    // Verify new teams have correct properties
    const newTeamNames = result.newTeams!.map(team => team.name);
    expect(newTeamNames).toContain('Backend Team');
    expect(newTeamNames).toContain('Mobile Team');

    // Verify new epics have correct properties
    const newEpicNames = result.newEpics!.map(epic => epic.name);
    expect(newEpicNames).toContain('New Epic');
    expect(newEpicNames).toContain('New Epic 2');
  });
});
