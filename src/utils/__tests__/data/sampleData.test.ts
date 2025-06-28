import { describe, it, expect } from 'vitest';
import {
  sampleData,
  getTeamById,
  getDivisionById,
  getPeopleByTeamId,
  getTeamsByDivisionId,
  getRoleById,
} from '../../../data/sampleData';
import {
  loadSampleData,
  validateLoadedData,
  getDataSummary,
} from '../../dataLoader';
import {
  loadMinimalTestData,
  loadPeopleTestData,
  loadFullTestData,
  validateTestData,
  loadTestData,
} from '../../../test/utils/testDataLoader';

describe('Sample Data', () => {
  describe('Core Sample Data', () => {
    it('should have the correct number of divisions', () => {
      expect(sampleData.divisions).toHaveLength(4);
    });

    it('should have the correct number of teams', () => {
      expect(sampleData.teams).toHaveLength(50);
    });

    it('should have the correct number of roles', () => {
      expect(sampleData.roles).toHaveLength(4);
    });

    it('should have people data', () => {
      expect(sampleData.people.length).toBeGreaterThan(0);
    });

    it('should have teams distributed across divisions', () => {
      const teamCounts = sampleData.divisions.map(division => ({
        division: division.name,
        count: sampleData.teams.filter(team => team.divisionId === division.id)
          .length,
      }));

      expect(teamCounts).toEqual([
        { division: 'Consumer Lending', count: 12 },
        { division: 'Business Lending', count: 15 },
        { division: 'Cards & Payments', count: 10 },
        { division: 'Everyday Banking', count: 13 },
      ]);
    });

    it('should have realistic team sizes', () => {
      const teamSizes = sampleData.teams.map(team => {
        const teamPeople = sampleData.people.filter(
          person => person.teamId === team.id
        );
        return teamPeople.length;
      });

      // All teams should have between 7-10 people
      teamSizes.forEach(size => {
        expect(size).toBeGreaterThanOrEqual(7);
        expect(size).toBeLessThanOrEqual(10);
      });
    });

    it('should have one Product Owner per team', () => {
      sampleData.teams.forEach(team => {
        const teamPeople = sampleData.people.filter(
          person => person.teamId === team.id
        );
        const productOwners = teamPeople.filter(person => {
          const role = getRoleById(person.roleId);
          return role?.name === 'Product Owner';
        });
        expect(productOwners).toHaveLength(1);
      });
    });
  });

  describe('Helper Functions', () => {
    it('should find team by ID', () => {
      const team = getTeamById('team-001');
      expect(team).toBeDefined();
      expect(team?.name).toBe('Mortgage Origination');
    });

    it('should find division by ID', () => {
      const division = getDivisionById('div-001');
      expect(division).toBeDefined();
      expect(division?.name).toBe('Consumer Lending');
    });

    it('should find people by team ID', () => {
      const people = getPeopleByTeamId('team-001');
      expect(people.length).toBeGreaterThan(0);
      people.forEach(person => {
        expect(person.teamId).toBe('team-001');
      });
    });

    it('should find teams by division ID', () => {
      const teams = getTeamsByDivisionId('div-001');
      expect(teams).toHaveLength(12);
      teams.forEach(team => {
        expect(team.divisionId).toBe('div-001');
      });
    });

    it('should find role by ID', () => {
      const role = getRoleById('role-po');
      expect(role).toBeDefined();
      expect(role?.name).toBe('Product Owner');
    });
  });

  describe('Data Loader', () => {
    it('should load sample data correctly', () => {
      const data = loadSampleData({
        loadSampleData: true,
        includeSkills: true,
        includeSolutions: true,
        includeCycles: true,
        includeRunWorkCategories: true,
      });

      expect(data.divisions).toHaveLength(4);
      expect(data.teams).toHaveLength(50);
      expect(data.people.length).toBeGreaterThan(0);
      expect(data.roles).toHaveLength(4);
      expect(data.cycles?.length).toBeGreaterThan(0);
      expect(data.runWorkCategories?.length).toBeGreaterThan(0);
      expect(data.skills?.length).toBeGreaterThan(0);
      expect(data.solutions?.length).toBeGreaterThan(0);
    });

    it('should validate loaded data', () => {
      const data = loadSampleData();
      const validation = validateLoadedData(data);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should provide data summary', () => {
      const data = loadSampleData();
      const summary = getDataSummary(data);

      expect(summary.divisions).toBe(4);
      expect(summary.teams).toBe(50);
      expect(summary.people).toBeGreaterThan(0);
      expect(summary.roles).toBe(4);
    });
  });

  describe('Test Data Loader', () => {
    it('should load minimal test data', () => {
      const data = loadMinimalTestData();
      expect(data.divisions).toHaveLength(2);
      expect(data.teams).toHaveLength(4);
      expect(data.people).toHaveLength(0);
      expect(data.roles).toHaveLength(4);
    });

    it('should load people test data', () => {
      const data = loadPeopleTestData();
      expect(data.divisions).toHaveLength(2);
      expect(data.teams).toHaveLength(4);
      expect(data.people).toHaveLength(16);
      expect(data.roles).toHaveLength(4);
      expect(data.skills).toHaveLength(5);
      expect(data.personSkills).toHaveLength(20);
    });

    it('should load full test data', () => {
      const data = loadFullTestData();
      expect(data.divisions).toHaveLength(2);
      expect(data.teams).toHaveLength(4);
      expect(data.people).toHaveLength(16);
      expect(data.roles).toHaveLength(4);
      expect(data.cycles).toHaveLength(3);
      expect(data.runWorkCategories).toHaveLength(3);
      expect(data.skills).toHaveLength(5);
      expect(data.personSkills).toHaveLength(20);
      expect(data.solutions).toHaveLength(2);
    });

    it('should validate test data', () => {
      const data = loadFullTestData();
      const validation = validateTestData(data);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should create test fixtures', () => {
      const minimal = loadTestData({ loadPeople: false });
      const people = loadTestData({
        loadCycles: false,
        loadRunWorkCategories: false,
      });
      const full = loadTestData();

      expect(minimal.people).toHaveLength(0);
      expect(people.people.length).toBeGreaterThan(0);
      expect(full.people.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent team-division relationships', () => {
      sampleData.teams.forEach(team => {
        const division = getDivisionById(team.divisionId!);
        expect(division).toBeDefined();
        expect(team.divisionName).toBe(division?.name);
      });
    });

    it('should have consistent person-team relationships', () => {
      sampleData.people.forEach(person => {
        const team = getTeamById(person.teamId);
        expect(team).toBeDefined();
      });
    });

    it('should have consistent person-role relationships', () => {
      sampleData.people.forEach(person => {
        const role = getRoleById(person.roleId);
        expect(role).toBeDefined();
      });
    });

    it('should have realistic salary ranges', () => {
      sampleData.people.forEach(person => {
        if (person.employmentType === 'permanent' && person.annualSalary) {
          expect(person.annualSalary).toBeGreaterThan(80000);
          expect(person.annualSalary).toBeLessThan(150000);
        }
      });
    });

    it('should have valid email addresses', () => {
      sampleData.people.forEach(person => {
        expect(person.email).toMatch(/^[a-z]+\.[a-z]+@bankcorp\.com$/);
      });
    });
  });
});
