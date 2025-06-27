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

  describe('People Data Structure', () => {
    it('should have people with complete information', () => {
      testData.people.forEach(person => {
        expect(person.name).toBeDefined();
        expect(person.email).toBeDefined();
        expect(person.roleId).toBeDefined();
        expect(person.teamId).toBeDefined();
        expect(person.annualSalary).toBeDefined();
        expect(person.startDate).toBeDefined();
        expect(person.isActive).toBeDefined();
        expect(person.employmentType).toBeDefined();
      });
    });

    it('should have realistic email patterns', () => {
      testData.people.forEach(person => {
        expect(person.email).toMatch(/^[a-z]+\.[a-z]+@bankcorp\.com$/);
        const nameParts = person.name.toLowerCase().split(' ');
        expect(person.email).toContain(nameParts[0]);
        expect(person.email).toContain(nameParts[1]);
      });
    });

    it('should have people with realistic names', () => {
      const names = testData.people.map(person => person.name);
      expect(names).toContain('Sarah Johnson');
      expect(names).toContain('Michael Chen');
      expect(names).toContain('Emily Rodriguez');
      expect(names).toContain('David Kim');
    });
  });

  describe('People-Role Relationships', () => {
    it('should have people assigned to valid roles', () => {
      testData.people.forEach(person => {
        const role = getTestRoleById(person.roleId);
        expect(role).toBeDefined();
        expect(role?.name).toMatch(
          /^(Product Owner|Software Engineer|Quality Engineer|Platform Engineer)$/
        );
      });
    });

    it('should have realistic role distribution', () => {
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

    it('should have realistic salary ranges by role', () => {
      const roleSalaries = testData.roles.map(role => {
        const peopleWithRole = testData.people.filter(
          person => person.roleId === role.id
        );
        const salaries = peopleWithRole.map(person => person.annualSalary || 0);

        return {
          roleName: role.name,
          count: peopleWithRole.length,
          minSalary: Math.min(...salaries),
          maxSalary: Math.max(...salaries),
          avgSalary:
            salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length,
        };
      });

      roleSalaries.forEach(role => {
        expect(role.count).toBeGreaterThan(0);
        expect(role.minSalary).toBeGreaterThan(80000); // Minimum reasonable salary
        expect(role.maxSalary).toBeLessThan(200000); // Maximum reasonable salary
        expect(role.avgSalary).toBeGreaterThan(90000); // Average should be reasonable
      });
    });
  });

  describe('People-Team Relationships', () => {
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

  describe('Employment Data Validation', () => {
    it('should have consistent employment types', () => {
      testData.people.forEach(person => {
        expect(person.employmentType).toBe('permanent');
        expect(person.isActive).toBe(true);
      });
    });

    it('should have consistent start dates', () => {
      testData.people.forEach(person => {
        expect(person.startDate).toBe('2023-01-15');
      });
    });

    it('should have realistic salary progression', () => {
      const peopleByRole = testData.roles.map(role => {
        const peopleWithRole = testData.people.filter(
          person => person.roleId === role.id
        );
        return {
          roleName: role.name,
          people: peopleWithRole.map(person => ({
            name: person.name,
            salary: person.annualSalary || 0,
          })),
        };
      });

      // Product Owners should generally have higher salaries
      const productOwnerRole = peopleByRole.find(
        r => r.roleName === 'Product Owner'
      );
      const softwareEngineerRole = peopleByRole.find(
        r => r.roleName === 'Software Engineer'
      );

      if (productOwnerRole && softwareEngineerRole) {
        const poAvgSalary =
          productOwnerRole.people.reduce((sum, p) => sum + p.salary, 0) /
          productOwnerRole.people.length;
        const seAvgSalary =
          softwareEngineerRole.people.reduce((sum, p) => sum + p.salary, 0) /
          softwareEngineerRole.people.length;

        expect(poAvgSalary).toBeGreaterThan(seAvgSalary);
      }
    });
  });

  describe('People Analytics', () => {
    it('should calculate team composition metrics', () => {
      const teamCompositions = testData.teams.map(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const roleBreakdown = teamPeople.reduce(
          (acc, person) => {
            const role = getTestRoleById(person.roleId);
            acc[role?.name || 'Unknown'] =
              (acc[role?.name || 'Unknown'] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const totalSalary = teamPeople.reduce(
          (sum, person) => sum + (person.annualSalary || 0),
          0
        );
        const avgSalary = totalSalary / teamPeople.length;

        return {
          teamId: team.id,
          teamName: team.name,
          size: teamPeople.length,
          roleBreakdown,
          totalSalary,
          avgSalary,
        };
      });

      expect(teamCompositions).toHaveLength(4);
      teamCompositions.forEach(composition => {
        expect(composition.size).toBe(4);
        expect(composition.roleBreakdown['Product Owner']).toBe(1);
        expect(composition.totalSalary).toBeGreaterThan(400000);
        expect(composition.avgSalary).toBeGreaterThan(100000);
      });
    });

    it('should calculate division people metrics', () => {
      const divisionMetrics = testData.divisions.map(division => {
        const divisionTeams = testData.teams.filter(
          team => team.divisionId === division.id
        );
        const divisionPeople = divisionTeams.flatMap(team =>
          getTestPeopleByTeamId(team.id)
        );

        const totalSalary = divisionPeople.reduce(
          (sum, person) => sum + (person.annualSalary || 0),
          0
        );
        const avgSalary = totalSalary / divisionPeople.length;

        const roleDistribution = divisionPeople.reduce(
          (acc, person) => {
            const role = getTestRoleById(person.roleId);
            acc[role?.name || 'Unknown'] =
              (acc[role?.name || 'Unknown'] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return {
          divisionId: division.id,
          divisionName: division.name,
          peopleCount: divisionPeople.length,
          teamCount: divisionTeams.length,
          totalSalary,
          avgSalary,
          roleDistribution,
        };
      });

      expect(divisionMetrics).toHaveLength(2);
      divisionMetrics.forEach(metric => {
        expect(metric.peopleCount).toBe(8); // 2 teams * 4 people each
        expect(metric.teamCount).toBe(2);
        expect(metric.totalSalary).toBeGreaterThan(800000); // 8 people * ~100k average
        expect(metric.roleDistribution['Product Owner']).toBe(2); // 2 teams = 2 POs
      });
    });

    it('should identify high performers', () => {
      const highPerformers = testData.people
        .filter(person => (person.annualSalary || 0) > 130000)
        .map(person => {
          const role = getTestRoleById(person.roleId);
          const team = getTestTeamById(person.teamId);
          return {
            name: person.name,
            role: role?.name,
            team: team?.name,
            salary: person.annualSalary,
          };
        });

      expect(highPerformers.length).toBeGreaterThan(0);
      highPerformers.forEach(performer => {
        expect(performer.salary).toBeGreaterThan(130000);
        expect(performer.role).toBeDefined();
        expect(performer.team).toBeDefined();
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have no duplicate emails', () => {
      const emails = testData.people.map(person => person.email);
      const uniqueEmails = [...new Set(emails)];
      expect(emails.length).toBe(uniqueEmails.length);
    });

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

    it('should have valid date formats', () => {
      testData.people.forEach(person => {
        expect(person.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const date = new Date(person.startDate);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });
});
