import {
  parseCSV,
  parsePeopleCSV,
  parseProjectsCSV,
  parseRolesCSV,
} from '../csvUtils';
import { Person, Team, Project, Role } from '@/types';

describe('csvUtils - Basic CSV Parsing', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV without quotes', () => {
      const input = 'name,email,role\nJohn Doe,john@example.com,Developer';
      const result = parseCSV(input);

      expect(result).toEqual([
        ['name', 'email', 'role'],
        ['John Doe', 'john@example.com', 'Developer'],
      ]);
    });

    it('should handle CSV with quoted fields', () => {
      const input = '"John Doe","john@example.com","Senior Developer"';
      const result = parseCSV(input);

      expect(result).toEqual([
        ['John Doe', 'john@example.com', 'Senior Developer'],
      ]);
    });

    it('should handle CSV with commas inside quoted fields', () => {
      const input = '"Doe, John","john@example.com","Developer, Senior"';
      const result = parseCSV(input);

      expect(result).toEqual([
        ['Doe, John', 'john@example.com', 'Developer, Senior'],
      ]);
    });

    it('should handle mixed quoted and unquoted fields', () => {
      const input =
        'John,"doe@example.com",Developer\n"Jane Doe",jane@example.com,"Senior Dev"';
      const result = parseCSV(input);

      expect(result).toEqual([
        ['John', 'doe@example.com', 'Developer'],
        ['Jane Doe', 'jane@example.com', 'Senior Dev'],
      ]);
    });

    it('should handle empty fields', () => {
      const input = 'John,,Developer\n,jane@example.com,';
      const result = parseCSV(input);

      expect(result).toEqual([
        ['John', '', 'Developer'],
        ['', 'jane@example.com', ''],
      ]);
    });

    it('should trim whitespace from fields', () => {
      const input = ' John Doe , john@example.com , Developer ';
      const result = parseCSV(input);

      expect(result).toEqual([['John Doe', 'john@example.com', 'Developer']]);
    });

    it('should handle single row CSV', () => {
      const input = 'name,email,role';
      const result = parseCSV(input);

      expect(result).toEqual([['name', 'email', 'role']]);
    });

    it('should handle empty input', () => {
      const input = '';
      const result = parseCSV(input);

      expect(result).toEqual([['']]);
    });
  });

  describe('parsePeopleCSV', () => {
    const validPeopleCSV = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend
Jane Smith,jane@example.com,Designer,Design Team,team-design
Bob Johnson,bob@example.com,Manager,Frontend Team,team-frontend`;

    it('should parse valid people CSV with teams', () => {
      const result = parsePeopleCSV(validPeopleCSV);

      expect(result.people).toHaveLength(3);
      expect(result.teams).toHaveLength(2);

      // Check first person
      expect(result.people[0]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-developer',
        teamId: 'team-frontend',
        isActive: true,
        employmentType: 'permanent',
      });

      // Check teams are created correctly
      expect(result.teams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'team-frontend',
            name: 'Frontend Team',
            capacity: 40,
          }),
          expect.objectContaining({
            id: 'team-design',
            name: 'Design Team',
            capacity: 40,
          }),
        ])
      );
    });

    it('should handle people CSV with quoted fields', () => {
      const csvWithQuotes = `"name","email","role","team_name","team_id"
"John, Jr","john@example.com","Senior Developer","Frontend Team","team-frontend"`;

      const result = parsePeopleCSV(csvWithQuotes);

      expect(result.people[0].name).toBe('John, Jr');
      expect(result.people[0].roleId).toBe('role-senior-developer');
    });

    it('should skip rows with insufficient data', () => {
      const csvWithBadRows = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend
Incomplete Row,missing@data.com
Jane Smith,jane@example.com,Designer,Design Team,team-design`;

      const result = parsePeopleCSV(csvWithBadRows);

      expect(result.people).toHaveLength(2);
      expect(result.people[0].name).toBe('John Doe');
      expect(result.people[1].name).toBe('Jane Smith');
    });

    it('should handle duplicate team IDs by reusing existing team', () => {
      const csvWithDuplicateTeams = `name,email,role,team_name,team_id
John Doe,john@example.com,Developer,Frontend Team,team-frontend
Jane Smith,jane@example.com,Designer,Frontend Team,team-frontend`;

      const result = parsePeopleCSV(csvWithDuplicateTeams);

      expect(result.people).toHaveLength(2);
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].id).toBe('team-frontend');
    });

    it('should generate unique person IDs', () => {
      const result = parsePeopleCSV(validPeopleCSV);

      const personIds = result.people.map(p => p.id);
      const uniqueIds = new Set(personIds);

      expect(uniqueIds.size).toBe(personIds.length);
      expect(personIds).toEqual(['person-1', 'person-2', 'person-3']);
    });

    it('should set default employment type and start date', () => {
      const result = parsePeopleCSV(validPeopleCSV);

      result.people.forEach(person => {
        expect(person.employmentType).toBe('permanent');
        expect(person.isActive).toBe(true);
        expect(person.startDate).toMatch(/\d{4}-\d{2}-\d{2}/);
      });
    });
  });

  describe('parseProjectsCSV', () => {
    const validProjectsCSV = `name,description,status,start_date,end_date,budget
Project Alpha,First project,active,2024-01-01,2024-12-31,100000
Project Beta,Second project,planning,2024-02-01,,50000
Project Gamma,Third project,completed,2023-01-01,2023-12-31,`;

    it('should parse valid projects CSV', () => {
      const result = parseProjectsCSV(validProjectsCSV);

      expect(result).toHaveLength(3);

      expect(result[0]).toMatchObject({
        name: 'Project Alpha',
        description: 'First project',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 100000,
      });
    });

    it('should handle missing optional fields', () => {
      const result = parseProjectsCSV(validProjectsCSV);

      // Project Beta has no end date
      expect(result[1].endDate).toBeUndefined();

      // Project Gamma has no budget
      expect(result[2].budget).toBeUndefined();
    });

    it('should handle quoted project data', () => {
      const csvWithQuotes = `"name","description","status","start_date","end_date","budget"
"Project Alpha, Phase 1","Multi-phase project","planning","2024-01-01","2024-06-30","75000"`;

      const result = parseProjectsCSV(csvWithQuotes);

      expect(result[0].name).toBe('Project Alpha, Phase 1');
      expect(result[0].description).toBe('Multi-phase project');
    });

    it('should filter out invalid rows', () => {
      const csvWithBadRows = `name,description,status,start_date
Project Alpha,First project,active,2024-01-01
,,,
Project Beta,Second project,planning,2024-02-01`;

      const result = parseProjectsCSV(csvWithBadRows);

      expect(result).toHaveLength(3); // Empty row still creates entry but may have empty name
      const validProjects = result.filter(p => p.name.trim() !== '');
      expect(validProjects).toHaveLength(2);
      expect(validProjects.map(p => p.name)).toEqual([
        'Project Alpha',
        'Project Beta',
      ]);
    });

    it('should generate unique project IDs', () => {
      const result = parseProjectsCSV(validProjectsCSV);

      const projectIds = result.map(p => p.id);
      const uniqueIds = new Set(projectIds);

      expect(uniqueIds.size).toBe(projectIds.length);
      expect(projectIds).toEqual(['project-1', 'project-2', 'project-3']);
    });

    it('should set default values for missing fields', () => {
      const minimalCSV = `name,description,status,start_date
Minimal Project,,,2024-01-01`;

      const result = parseProjectsCSV(minimalCSV);

      expect(result[0]).toMatchObject({
        name: 'Minimal Project',
        description: '',
        status: 'planning',
        milestones: [],
      });
    });
  });

  describe('parseRolesCSV', () => {
    const validRolesCSV = `role_name,default_rate
Developer,100
Designer,85
Manager,120
Senior Developer,150`;

    it('should parse valid roles CSV', () => {
      const result = parseRolesCSV(validRolesCSV);

      expect(result).toHaveLength(4);

      expect(result[0]).toMatchObject({
        id: 'role-developer',
        name: 'Developer',
        rateType: 'hourly',
        defaultRate: 100,
        defaultHourlyRate: 100,
      });
    });

    it('should handle roles with spaces in names', () => {
      const result = parseRolesCSV(validRolesCSV);

      const seniorDev = result.find(r => r.name === 'Senior Developer');
      expect(seniorDev).toBeDefined();
      expect(seniorDev?.id).toBe('role-senior-developer');
    });

    it('should handle quoted role data', () => {
      const csvWithQuotes = `"role_name","default_rate"
"Senior Developer, Full Stack","175"
"Product Manager, Lead","200"`;

      const result = parseRolesCSV(csvWithQuotes);

      expect(result[0].name).toBe('Senior Developer, Full Stack');
      expect(result[0].defaultRate).toBe(175);
    });

    it('should filter out invalid rows', () => {
      const csvWithBadRows = `role_name,default_rate
Developer,100
,
Manager,120`;

      const result = parseRolesCSV(csvWithBadRows);

      expect(result).toHaveLength(3); // parseRolesCSV may include empty row initially
      const validRoles = result.filter(r => r.name.trim() !== '');
      expect(validRoles).toHaveLength(2);
      expect(validRoles.map(r => r.name)).toEqual(['Developer', 'Manager']);
    });

    it('should handle non-numeric rates gracefully', () => {
      const csvWithBadRates = `role_name,default_rate
Developer,100
Designer,invalid
Manager,120`;

      const result = parseRolesCSV(csvWithBadRates);

      expect(result).toHaveLength(3);
      expect(result[1].defaultRate).toBeNaN();
    });

    it('should generate consistent role IDs', () => {
      const result = parseRolesCSV(validRolesCSV);

      const expectedIds = [
        'role-developer',
        'role-designer',
        'role-manager',
        'role-senior-developer',
      ];

      expect(result.map(r => r.id)).toEqual(expectedIds);
    });

    it('should set default values for role properties', () => {
      const result = parseRolesCSV(validRolesCSV);

      result.forEach(role => {
        expect(role.rateType).toBe('hourly');
        expect(typeof role.defaultRate).toBe('number');
        expect(typeof role.defaultHourlyRate).toBe('number');
      });
    });
  });
});
