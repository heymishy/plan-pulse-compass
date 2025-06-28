import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFullTestData,
  validateTestData,
} from '@/test/utils/testDataLoader';
import {
  getTestTeamById,
  getTestDivisionById,
  getTestPeopleByTeamId,
  getTestTeamsByDivisionId,
} from '@/test/data/testData';

describe('Teams Integration Tests', () => {
  let testData: ReturnType<typeof loadFullTestData>;

  beforeEach(() => {
    testData = loadFullTestData();
    const validation = validateTestData(testData);
    expect(validation.isValid).toBe(true);
  });

  describe('Team-Division Integration', () => {
    it('should have teams with proper division assignments', () => {
      testData.teams.forEach(team => {
        const division = getTestDivisionById(team.divisionId!);
        expect(division).toBeDefined();
        expect(team.divisionName).toBe(division?.name);
      });
    });

    it('should have teams distributed across divisions', () => {
      const divisionTeamCounts = testData.divisions.map(division => ({
        division: division.name,
        count: getTestTeamsByDivisionId(division.id).length,
      }));

      expect(divisionTeamCounts).toEqual([
        { division: 'Consumer Lending', count: 2 },
        { division: 'Business Lending', count: 2 },
      ]);
    });
  });

  describe('Team-People Integration', () => {
    it('should have people assigned to teams', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        expect(teamPeople.length).toBeGreaterThan(0);
        expect(teamPeople.length).toBeLessThanOrEqual(4); // Max 4 people per test team
      });
    });

    it('should have one Product Owner per team', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const productOwners = teamPeople.filter(person => {
          const role = testData.roles.find(r => r.id === person.roleId);
          return role?.name === 'Product Owner';
        });
        expect(productOwners).toHaveLength(1);
      });
    });
  });

  describe('Team Analytics Integration', () => {
    it('should calculate team capacity metrics', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const teamMetrics = {
          peopleCount: teamPeople.length,
          totalSalary: teamPeople.reduce((sum, person) => {
            return sum + (person.annualSalary || 0);
          }, 0),
          avgSalary:
            teamPeople.reduce((sum, person) => {
              return sum + (person.annualSalary || 0);
            }, 0) / teamPeople.length,
        };

        expect(teamMetrics.peopleCount).toBeGreaterThan(0);
        expect(teamMetrics.totalSalary).toBeGreaterThan(0);
        expect(teamMetrics.avgSalary).toBeGreaterThan(0);
      });
    });

    it('should calculate division team metrics', () => {
      testData.divisions.forEach(division => {
        const divisionTeams = getTestTeamsByDivisionId(division.id);
        const divisionMetrics = {
          teamCount: divisionTeams.length,
          totalPeople: divisionTeams.reduce((sum, team) => {
            return sum + getTestPeopleByTeamId(team.id).length;
          }, 0),
        };

        expect(divisionMetrics.teamCount).toBeGreaterThan(0);
        expect(divisionMetrics.totalPeople).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have consistent team data', () => {
      testData.teams.forEach(team => {
        expect(typeof team.name).toBe('string');
        expect(typeof team.divisionId).toBe('string');
        expect(typeof team.divisionName).toBe('string');
        expect(typeof team.capacity).toBe('number');
        expect(team.capacity).toBe(160); // Standard team capacity
      });
    });

    it('should have people with valid team assignments', () => {
      testData.people.forEach(person => {
        const team = getTestTeamById(person.teamId);
        expect(team).toBeDefined();
        expect(person.isActive).toBe(true);
      });
    });
  });
});
