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

  describe('Team Structure Validation', () => {
    it('should have teams with proper division assignments', () => {
      testData.teams.forEach(team => {
        const division = getTestDivisionById(team.divisionId!);
        expect(division).toBeDefined();
        expect(team.divisionName).toBe(division?.name);
        expect(team.capacity).toBe(160); // Standard team capacity
      });
    });

    it('should have teams with realistic names', () => {
      const teamNames = testData.teams.map(team => team.name);
      expect(teamNames).toContain('Mortgage Origination');
      expect(teamNames).toContain('Personal Loans Platform');
      expect(teamNames).toContain('Commercial Lending Platform');
      expect(teamNames).toContain('Business Credit Assessment');
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

  describe('Team-People Relationships', () => {
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

    it('should have realistic role distribution per team', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const roleCounts = teamPeople.reduce(
          (acc, person) => {
            const role = testData.roles.find(r => r.id === person.roleId);
            acc[role?.name || 'Unknown'] =
              (acc[role?.name || 'Unknown'] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Each team should have at least 1 Product Owner
        expect(roleCounts['Product Owner']).toBe(1);

        // Should have some technical roles
        expect(
          roleCounts['Software Engineer'] ||
            roleCounts['Quality Engineer'] ||
            roleCounts['Platform Engineer']
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Team Operations', () => {
    it('should be able to find teams by division', () => {
      const consumerTeams = getTestTeamsByDivisionId('div-test-001');
      const businessTeams = getTestTeamsByDivisionId('div-test-002');

      expect(consumerTeams).toHaveLength(2);
      expect(businessTeams).toHaveLength(2);

      consumerTeams.forEach(team => {
        expect(team.divisionId).toBe('div-test-001');
        expect(team.divisionName).toBe('Consumer Lending');
      });

      businessTeams.forEach(team => {
        expect(team.divisionId).toBe('div-test-002');
        expect(team.divisionName).toBe('Business Lending');
      });
    });

    it('should be able to find people by team', () => {
      const mortgageTeam = getTestTeamById('team-test-001');
      expect(mortgageTeam).toBeDefined();

      const mortgagePeople = getTestPeopleByTeamId('team-test-001');
      expect(mortgagePeople).toHaveLength(4);

      mortgagePeople.forEach(person => {
        expect(person.teamId).toBe('team-test-001');
        expect(person.isActive).toBe(true);
        expect(person.employmentType).toBe('permanent');
      });
    });

    it('should have realistic team capacity calculations', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const totalSalary = teamPeople.reduce((sum, person) => {
          return sum + (person.annualSalary || 0);
        }, 0);

        // Team should have reasonable total salary
        expect(totalSalary).toBeGreaterThan(400000); // 4 people * ~100k average
        expect(totalSalary).toBeLessThan(500000); // 4 people * ~120k max
      });
    });
  });

  describe('Team Data Consistency', () => {
    it('should have consistent email patterns', () => {
      testData.people.forEach(person => {
        expect(person.email).toMatch(/^[a-z]+\.[a-z]+@bankcorp\.com$/);
        expect(person.email).toContain(
          person.name.toLowerCase().replace(' ', '.')
        );
      });
    });

    it('should have realistic salary ranges by role', () => {
      const roleSalaries = testData.roles.reduce(
        (acc, role) => {
          const peopleWithRole = testData.people.filter(
            person => person.roleId === role.id
          );
          const salaries = peopleWithRole.map(
            person => person.annualSalary || 0
          );
          acc[role.name] = {
            min: Math.min(...salaries),
            max: Math.max(...salaries),
            avg:
              salaries.reduce((sum, salary) => sum + salary, 0) /
              salaries.length,
          };
          return acc;
        },
        {} as Record<string, { min: number; max: number; avg: number }>
      );

      // Product Owners should have highest salaries
      expect(roleSalaries['Product Owner'].avg).toBeGreaterThan(
        roleSalaries['Software Engineer'].avg
      );
      expect(roleSalaries['Product Owner'].avg).toBeGreaterThan(
        roleSalaries['Quality Engineer'].avg
      );
      expect(roleSalaries['Product Owner'].avg).toBeGreaterThan(
        roleSalaries['Platform Engineer'].avg
      );

      // Platform Engineers should have higher salaries than QEs
      expect(roleSalaries['Platform Engineer'].avg).toBeGreaterThan(
        roleSalaries['Quality Engineer'].avg
      );
    });

    it('should have consistent start dates', () => {
      testData.people.forEach(person => {
        expect(person.startDate).toBe('2023-01-15');
        expect(person.isActive).toBe(true);
      });
    });
  });

  describe('Team Performance Metrics', () => {
    it('should calculate team size metrics', () => {
      const teamSizes = testData.teams.map(team => {
        const people = getTestPeopleByTeamId(team.id);
        return {
          teamId: team.id,
          teamName: team.name,
          size: people.length,
          roles: people.map(person => {
            const role = testData.roles.find(r => r.id === person.roleId);
            return role?.name;
          }),
        };
      });

      expect(teamSizes).toHaveLength(4);
      teamSizes.forEach(team => {
        expect(team.size).toBeGreaterThan(0);
        expect(team.size).toBeLessThanOrEqual(4);
        expect(team.roles).toContain('Product Owner');
      });
    });

    it('should calculate division team counts', () => {
      const divisionStats = testData.divisions.map(division => {
        const teams = getTestTeamsByDivisionId(division.id);
        const people = teams.flatMap(team => getTestPeopleByTeamId(team.id));

        return {
          division: division.name,
          teamCount: teams.length,
          peopleCount: people.length,
          avgTeamSize: people.length / teams.length,
        };
      });

      expect(divisionStats).toHaveLength(2);
      divisionStats.forEach(stat => {
        expect(stat.teamCount).toBe(2);
        expect(stat.peopleCount).toBe(8); // 2 teams * 4 people each
        expect(stat.avgTeamSize).toBe(4);
      });
    });
  });
});
