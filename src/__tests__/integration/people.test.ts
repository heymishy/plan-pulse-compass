import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFullTestData,
  validateTestData,
} from '@/test/utils/testDataLoader';
import {
  getTestRoleById,
  getTestTeamById,
  getTestPeopleByTeamId,
} from '@/test/data/testData';

describe('People Integration Tests', () => {
  let testData: ReturnType<typeof loadFullTestData>;

  beforeEach(() => {
    testData = loadFullTestData();
    const validation = validateTestData(testData);
    expect(validation.isValid).toBe(true);
  });

  describe('People-Role Integration', () => {
    it('should have people assigned to valid roles', () => {
      testData.people.forEach(person => {
        const role = getTestRoleById(person.roleId);
        expect(role).toBeDefined();
        expect(role?.name).toMatch(
          /^(Product Owner|Software Engineer|Quality Engineer|Platform Engineer)$/
        );
      });
    });

    it('should have one Product Owner per team', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const productOwners = teamPeople.filter(person => {
          const role = getTestRoleById(person.roleId);
          return role?.name === 'Product Owner';
        });
        expect(productOwners).toHaveLength(1);
      });
    });
  });

  describe('People-Team Integration', () => {
    it('should have people assigned to valid teams', () => {
      testData.people.forEach(person => {
        const team = getTestTeamById(person.teamId);
        expect(team).toBeDefined();
        expect(team?.name).toMatch(
          /^(Mortgage Origination|Personal Loans Platform|Commercial Lending Platform|Business Credit Assessment)$/
        );
      });
    });

    it('should have balanced team sizes', () => {
      const teamSizes = testData.teams.map(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        return {
          teamId: team.id,
          teamName: team.name,
          size: teamPeople.length,
        };
      });

      teamSizes.forEach(team => {
        expect(team.size).toBe(4); // Each test team should have exactly 4 people
      });
    });
  });

  describe('People Analytics Integration', () => {
    it('should calculate role distribution metrics', () => {
      const roleCounts = testData.people.reduce(
        (acc, person) => {
          const role = getTestRoleById(person.roleId);
          acc[role?.name || 'Unknown'] =
            (acc[role?.name || 'Unknown'] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Should have one Product Owner per team (4 teams = 4 POs)
      expect(roleCounts['Product Owner']).toBe(4);

      // Should have some technical roles
      expect(
        roleCounts['Software Engineer'] ||
          roleCounts['Quality Engineer'] ||
          roleCounts['Platform Engineer']
      ).toBeGreaterThan(0);
    });

    it('should calculate team composition metrics', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const teamMetrics = {
          totalPeople: teamPeople.length,
          totalSalary: teamPeople.reduce((sum, person) => {
            return sum + (person.annualSalary || 0);
          }, 0),
          avgSalary:
            teamPeople.reduce((sum, person) => {
              return sum + (person.annualSalary || 0);
            }, 0) / teamPeople.length,
          roleDistribution: teamPeople.reduce(
            (acc, person) => {
              const role = getTestRoleById(person.roleId);
              acc[role?.name || 'Unknown'] =
                (acc[role?.name || 'Unknown'] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        };

        expect(teamMetrics.totalPeople).toBeGreaterThan(0);
        expect(teamMetrics.totalSalary).toBeGreaterThan(0);
        expect(teamMetrics.avgSalary).toBeGreaterThan(0);
        expect(
          Object.keys(teamMetrics.roleDistribution).length
        ).toBeGreaterThan(0);
      });
    });

    it('should calculate organization-wide metrics', () => {
      const orgMetrics = {
        totalPeople: testData.people.length,
        totalSalary: testData.people.reduce((sum, person) => {
          return sum + (person.annualSalary || 0);
        }, 0),
        avgSalary:
          testData.people.reduce((sum, person) => {
            return sum + (person.annualSalary || 0);
          }, 0) / testData.people.length,
        activePeople: testData.people.filter(person => person.isActive).length,
      };

      expect(orgMetrics.totalPeople).toBeGreaterThan(0);
      expect(orgMetrics.totalSalary).toBeGreaterThan(0);
      expect(orgMetrics.avgSalary).toBeGreaterThan(0);
      expect(orgMetrics.activePeople).toBe(orgMetrics.totalPeople);
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have consistent data types', () => {
      testData.people.forEach(person => {
        expect(typeof person.name).toBe('string');
        expect(typeof person.email).toBe('string');
        expect(typeof person.roleId).toBe('string');
        expect(typeof person.teamId).toBe('string');
        expect(typeof person.annualSalary).toBe('number');
        expect(typeof person.startDate).toBe('string');
        expect(typeof person.isActive).toBe('boolean');
        expect(typeof person.employmentType).toBe('string');
      });
    });

    it('should have valid salary ranges', () => {
      testData.people.forEach(person => {
        expect(person.annualSalary).toBeGreaterThan(80000); // Minimum reasonable salary
        expect(person.annualSalary).toBeLessThan(200000); // Maximum reasonable salary
      });
    });

    it('should have consistent employment data', () => {
      testData.people.forEach(person => {
        expect(person.employmentType).toBe('permanent');
        expect(person.isActive).toBe(true);
        expect(person.startDate).toBe('2023-01-15');
      });
    });
  });
});
