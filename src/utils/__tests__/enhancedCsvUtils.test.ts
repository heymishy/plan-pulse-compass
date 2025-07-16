import {
  parseCSV,
  parseEnhancedPeopleCSV,
  parseTeamsWithDivisionsCSV,
  parseRolesCSV,
  exportEnhancedPeopleCSV,
  exportTeamsWithDivisionsCSV,
  exportRolesCSV,
} from '../enhancedCsvUtils';
import { Person, Team, Division, Role } from '@/types';

describe('enhancedCsvUtils - Enhanced People/Teams/Roles Import', () => {
  describe('parseCSV', () => {
    it('should parse CSV and clean quoted fields', () => {
      const input = '"John Doe","john@example.com","Developer"';
      const result = parseCSV(input);

      expect(result).toEqual([['John Doe', 'john@example.com', 'Developer']]);
    });

    it('should handle mixed quoted and unquoted fields', () => {
      const input = 'John,"doe@example.com",Developer';
      const result = parseCSV(input);

      expect(result).toEqual([['John', 'doe@example.com', 'Developer']]);
    });
  });

  describe('parseEnhancedPeopleCSV', () => {
    const basicPeopleCSV = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend
Jane Smith,jane@example.com,Designer,Design Team,team-design`;

    const enhancedPeopleCSV = `name,email,role,team_name,team_id,employment_type,annual_salary,hourly_rate,daily_rate,start_date,end_date,is_active,division_name,division_id,team_capacity
John Doe,john@example.com,Senior Developer,Frontend Team,team-frontend,permanent,85000,,,2024-01-15,,true,Engineering Division,div-eng,160
Jane Smith,jane@example.com,UI Designer,Design Team,team-design,contractor,,75,600,2024-02-01,2024-12-31,true,Design Division,div-design,120
Bob Johnson,bob@example.com,Project Manager,Management Team,team-mgmt,permanent,95000,,,2023-06-01,,false,Operations Division,div-ops,80`;

    it('should parse basic people CSV with default values', () => {
      const result = parseEnhancedPeopleCSV(basicPeopleCSV);

      expect(result.people).toHaveLength(2);
      expect(result.teams).toHaveLength(2);
      expect(result.divisions).toHaveLength(0);
      expect(result.roles).toHaveLength(2);

      // Check person defaults
      expect(result.people[0]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-developer',
        teamId: 'team-frontend',
        isActive: true,
        employmentType: 'permanent',
        startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
      });
    });

    it('should parse enhanced people CSV with all fields', () => {
      const result = parseEnhancedPeopleCSV(enhancedPeopleCSV);

      expect(result.people).toHaveLength(3);
      expect(result.teams).toHaveLength(3);
      expect(result.divisions).toHaveLength(3);
      expect(result.roles).toHaveLength(3);

      // Check enhanced person data
      const john = result.people[0];
      expect(john).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-senior-developer',
        teamId: 'team-frontend',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-15',
        annualSalary: 85000,
      });

      // Check contractor data
      const jane = result.people[1];
      expect(jane).toMatchObject({
        employmentType: 'contractor',
        contractDetails: {
          hourlyRate: 75,
          dailyRate: 600,
        },
        endDate: '2024-12-31',
      });

      // Check inactive person
      const bob = result.people[2];
      expect(bob.isActive).toBe(false);
    });

    it('should create divisions with proper attributes', () => {
      const result = parseEnhancedPeopleCSV(enhancedPeopleCSV);

      const engDivision = result.divisions.find(d => d.id === 'div-eng');
      expect(engDivision).toMatchObject({
        id: 'div-eng',
        name: 'Engineering Division',
      });
    });

    it('should create teams with division assignments and capacity', () => {
      const result = parseEnhancedPeopleCSV(enhancedPeopleCSV);

      const frontendTeam = result.teams.find(t => t.id === 'team-frontend');
      expect(frontendTeam).toMatchObject({
        id: 'team-frontend',
        name: 'Frontend Team',
        divisionId: 'div-eng',
        capacity: 160,
      });
    });

    it('should create roles with multiple rate types', () => {
      const result = parseEnhancedPeopleCSV(enhancedPeopleCSV);

      const seniorDevRole = result.roles.find(
        r => r.id === 'role-senior-developer'
      );
      expect(seniorDevRole).toMatchObject({
        id: 'role-senior-developer',
        name: 'Senior Developer',
        rateType: 'hourly',
        defaultRate: expect.any(Number),
      });
    });

    it('should handle duplicate teams and roles correctly', () => {
      const csvWithDuplicates = `name,email,role,team_name,team_id,division_name,division_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend,Engineering,div-eng
Jane Smith,jane@example.com,Developer,Frontend Team,team-frontend,Engineering,div-eng`;

      const result = parseEnhancedPeopleCSV(csvWithDuplicates);

      expect(result.people).toHaveLength(2);
      expect(result.teams).toHaveLength(1);
      expect(result.divisions).toHaveLength(1);
      expect(result.roles).toHaveLength(1);
    });

    it('should handle missing optional fields gracefully', () => {
      const csvWithMissingFields = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend`;

      const result = parseEnhancedPeopleCSV(csvWithMissingFields);

      expect(result.people[0]).toMatchObject({
        isActive: true,
        employmentType: 'permanent',
        startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
      });
      expect(result.people[0].endDate).toBeUndefined();
    });

    it('should parse employment type correctly', () => {
      const csvWithEmploymentTypes = `name,email,role,team_name,team_id,employment_type
John Doe,john@example.com,Developer,Frontend Team,team-frontend,permanent
Jane Smith,jane@example.com,Designer,Design Team,team-design,contractor
Bob Johnson,bob@example.com,Manager,Management Team,team-mgmt,CONTRACTOR`;

      const result = parseEnhancedPeopleCSV(csvWithEmploymentTypes);

      expect(result.people[0].employmentType).toBe('permanent');
      expect(result.people[1].employmentType).toBe('contractor');
      expect(result.people[2].employmentType).toBe('contractor');
    });

    it('should parse boolean fields correctly', () => {
      const csvWithBooleans = `name,email,role,team_name,team_id,is_active
John Doe,john@example.com,Developer,Frontend Team,team-frontend,true
Jane Smith,jane@example.com,Designer,Design Team,team-design,false
Bob Johnson,bob@example.com,Manager,Management Team,team-mgmt,0`;

      const result = parseEnhancedPeopleCSV(csvWithBooleans);

      expect(result.people[0].isActive).toBe(true);
      expect(result.people[1].isActive).toBe(false);
      expect(result.people[2].isActive).toBe(false);
    });

    it('should skip rows with insufficient data', () => {
      const csvWithBadRows = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend
Incomplete Row,missing@data.com
Jane Smith,jane@example.com,Designer,Design Team,team-design`;

      const result = parseEnhancedPeopleCSV(csvWithBadRows);

      expect(result.people).toHaveLength(2);
      expect(result.people.map(p => p.name)).toEqual([
        'John Doe',
        'Jane Smith',
      ]);
    });
  });

  describe('parseTeamsWithDivisionsCSV', () => {
    const teamsCSV = `team_id,team_name,division_id,division_name,capacity,division_budget,division_description
team-frontend,Frontend Team,div-eng,Engineering Division,160,500000,Core engineering teams
team-backend,Backend Team,div-eng,Engineering Division,120,,
team-design,Design Team,div-design,Design Division,80,200000,User experience and design`;

    it('should parse teams with divisions correctly', () => {
      const result = parseTeamsWithDivisionsCSV(teamsCSV);

      expect(result.teams).toHaveLength(3);
      expect(result.divisions).toHaveLength(2);

      const frontendTeam = result.teams.find(t => t.id === 'team-frontend');
      expect(frontendTeam).toMatchObject({
        id: 'team-frontend',
        name: 'Frontend Team',
        divisionId: 'div-eng',
        capacity: 160,
      });

      const engDivision = result.divisions.find(d => d.id === 'div-eng');
      expect(engDivision).toMatchObject({
        id: 'div-eng',
        name: 'Engineering Division',
        description: 'Core engineering teams',
        budget: 500000,
      });
    });

    it('should handle teams without divisions', () => {
      const teamsOnlyCSV = `team_id,team_name,capacity
team-standalone,Standalone Team,40`;

      const result = parseTeamsWithDivisionsCSV(teamsOnlyCSV);

      expect(result.teams).toHaveLength(1);
      expect(result.divisions).toHaveLength(0);
      expect(result.teams[0].divisionId).toBeUndefined();
    });

    it('should deduplicate divisions', () => {
      const csvWithDuplicateDivisions = `team_id,team_name,division_id,division_name
team-frontend,Frontend Team,div-eng,Engineering Division
team-backend,Backend Team,div-eng,Engineering Division`;

      const result = parseTeamsWithDivisionsCSV(csvWithDuplicateDivisions);

      expect(result.teams).toHaveLength(2);
      expect(result.divisions).toHaveLength(1);
    });
  });

  describe('parseRolesCSV', () => {
    const rolesCSV = `role_id,role_name,description,default_annual_salary,default_hourly_rate,default_daily_rate,legacy_default_rate
role-dev,Developer,Software developer,75000,50,400,50
role-senior,Senior Developer,Senior software developer,95000,75,600,75
role-manager,Manager,Team manager,85000,,,85`;

    it('should parse roles with multiple rate types', () => {
      const result = parseRolesCSV(rolesCSV);

      expect(result).toHaveLength(3);

      const developer = result.find(r => r.id === 'role-dev');
      expect(developer).toMatchObject({
        id: 'role-dev',
        name: 'Developer',
        description: 'Software developer',
        defaultAnnualSalary: 75000,
        defaultHourlyRate: 50,
        defaultDailyRate: 400,
        defaultRate: 50,
      });
    });

    it('should handle missing rate fields', () => {
      const minimalRolesCSV = `role_name,default_rate
Developer,100`;

      const result = parseRolesCSV(minimalRolesCSV);

      expect(result[0]).toMatchObject({
        name: 'Developer',
        defaultRate: 100,
        rateType: 'hourly',
      });
    });

    it('should filter out empty role names', () => {
      const csvWithEmptyNames = `role_name,default_rate
Developer,100
,50
Manager,120`;

      const result = parseRolesCSV(csvWithEmptyNames);

      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['Developer', 'Manager']);
    });
  });

  describe('export functions', () => {
    const samplePeople: Person[] = [
      {
        id: 'person-1',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-dev',
        teamId: 'team-frontend',
        isActive: true,
        employmentType: 'permanent',
        startDate: '2024-01-01',
        annualSalary: 75000,
      },
    ];

    const sampleTeams: Team[] = [
      {
        id: 'team-frontend',
        name: 'Frontend Team',
        divisionId: 'div-eng',
        capacity: 160,
      },
    ];

    const sampleDivisions: Division[] = [
      {
        id: 'div-eng',
        name: 'Engineering Division',
        description: 'Core engineering teams',
        budget: 500000,
      },
    ];

    const sampleRoles: Role[] = [
      {
        id: 'role-dev',
        name: 'Developer',
        rateType: 'hourly',
        defaultRate: 50,
        defaultHourlyRate: 50,
        defaultAnnualSalary: 75000,
      },
    ];

    describe('exportEnhancedPeopleCSV', () => {
      it('should export people with all fields', () => {
        const csv = exportEnhancedPeopleCSV(
          samplePeople,
          sampleTeams,
          sampleDivisions,
          sampleRoles
        );

        expect(csv).toContain('name"');
        expect(csv).toContain('John Doe');
        expect(csv).toContain('john@example.com');
        expect(csv).toContain('Developer');
        expect(csv).toContain('Frontend Team');
        expect(csv).toContain('Engineering Division');
      });

      it('should handle missing related data gracefully', () => {
        const csv = exportEnhancedPeopleCSV(samplePeople, [], [], []);

        expect(csv).toContain('John Doe');
        expect(csv).toContain('Unknown'); // Default team name
      });

      it('should properly escape CSV fields', () => {
        const peopleWithCommas: Person[] = [
          {
            ...samplePeople[0],
            name: 'Doe, John Jr.',
          },
        ];

        const csv = exportEnhancedPeopleCSV(
          peopleWithCommas,
          sampleTeams,
          sampleDivisions,
          sampleRoles
        );

        expect(csv).toContain('"Doe, John Jr."');
      });
    });

    describe('exportTeamsWithDivisionsCSV', () => {
      it('should export teams with divisions', () => {
        const csv = exportTeamsWithDivisionsCSV(sampleTeams, sampleDivisions);

        expect(csv).toContain('team_id"');
        expect(csv).toContain('team-frontend');
        expect(csv).toContain('Frontend Team');
        expect(csv).toContain('div-eng');
        expect(csv).toContain('Engineering Division');
      });

      it('should handle teams without divisions', () => {
        const teamsWithoutDiv: Team[] = [
          {
            id: 'team-standalone',
            name: 'Standalone Team',
            capacity: 40,
          },
        ];

        const csv = exportTeamsWithDivisionsCSV(teamsWithoutDiv, []);

        expect(csv).toContain('team-standalone');
        expect(csv).toContain('Standalone Team');
      });
    });

    describe('exportRolesCSV', () => {
      it('should export roles with all rate types', () => {
        const csv = exportRolesCSV(sampleRoles);

        expect(csv).toContain('role_id"');
        expect(csv).toContain('role-dev');
        expect(csv).toContain('Developer');
        expect(csv).toContain('75000'); // Annual salary
        expect(csv).toContain('50'); // Hourly rate
      });

      it('should handle missing optional fields', () => {
        const minimalRoles: Role[] = [
          {
            id: 'role-minimal',
            name: 'Minimal Role',
            rateType: 'hourly',
            defaultRate: 100,
          },
        ];

        const csv = exportRolesCSV(minimalRoles);

        expect(csv).toContain('role-minimal');
        expect(csv).toContain('Minimal Role');
      });
    });
  });

  describe('data consistency and validation', () => {
    it('should maintain referential integrity between people, teams, and roles', () => {
      const csvData = `name,email,role,team_name,team_id,division_name,division_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend,Engineering,div-eng
Jane Smith,jane@example.com,Developer,Frontend Team,team-frontend,Engineering,div-eng`;

      const result = parseEnhancedPeopleCSV(csvData);

      // All people should reference existing team and role IDs
      result.people.forEach(person => {
        const team = result.teams.find(t => t.id === person.teamId);
        const role = result.roles.find(r => r.id === person.roleId);

        expect(team).toBeDefined();
        expect(role).toBeDefined();
      });
    });

    it('should generate consistent IDs for similar data', () => {
      const csvData1 = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend`;

      const csvData2 = `name,email,role,team_name,team_id
Jane Smith,jane@example.com,Developer,Frontend Team,team-frontend`;

      const result1 = parseEnhancedPeopleCSV(csvData1);
      const result2 = parseEnhancedPeopleCSV(csvData2);

      // Same role and team should generate same IDs
      expect(result1.roles[0].id).toBe(result2.roles[0].id);
      expect(result1.teams[0].id).toBe(result2.teams[0].id);
    });
  });
});
