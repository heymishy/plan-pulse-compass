import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFullTestData,
  validateTestData,
} from '@/test/utils/testDataLoader';
import {
  getTestTeamById,
  getTestDivisionById,
  getTestRoleById,
  getTestProjectById,
  getTestPeopleByTeamId,
  getTestTeamsByDivisionId,
  getTestWorkItemsByProjectId,
  getTestWorkItemsByTeamId,
} from '@/test/data/testData';

describe('End-to-End Integration Tests', () => {
  let testData: ReturnType<typeof loadFullTestData>;

  beforeEach(() => {
    testData = loadFullTestData();
    const validation = validateTestData(testData);
    expect(validation.isValid).toBe(true);
  });

  describe('Complete Data Ecosystem Validation', () => {
    it('should have a complete organizational hierarchy', () => {
      // Validate divisions
      expect(testData.divisions).toHaveLength(2);
      expect(testData.divisions[0].name).toBe('Consumer Lending');
      expect(testData.divisions[1].name).toBe('Business Lending');

      // Validate teams per division
      testData.divisions.forEach(division => {
        const divisionTeams = getTestTeamsByDivisionId(division.id);
        expect(divisionTeams).toHaveLength(2);
        divisionTeams.forEach(team => {
          expect(team.divisionId).toBe(division.id);
          expect(team.divisionName).toBe(division.name);
        });
      });

      // Validate total teams
      expect(testData.teams).toHaveLength(4);
    });

    it('should have complete people assignments', () => {
      // Validate people are assigned to teams
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        expect(teamPeople).toHaveLength(4); // Each test team has 4 people
        teamPeople.forEach(person => {
          expect(person.teamId).toBe(team.id);
          expect(person.isActive).toBe(true);
        });
      });

      // Validate total people
      expect(testData.people).toHaveLength(16); // 4 teams * 4 people
    });

    it('should have complete project assignments', () => {
      // Validate projects are assigned to teams
      testData.teams.forEach(team => {
        const teamProjects = testData.projects.filter(
          project => project.teamId === team.id
        );
        expect(teamProjects).toHaveLength(1); // Each test team has 1 project
        teamProjects.forEach(project => {
          expect(project.teamId).toBe(team.id);
        });
      });

      // Validate total projects
      expect(testData.projects).toHaveLength(4); // 4 teams * 1 project
    });

    it('should have complete work item assignments', () => {
      // Validate work items are assigned to projects
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        expect(projectWorkItems.length).toBeGreaterThan(0);
        expect(projectWorkItems.length).toBeLessThanOrEqual(3); // Max 3 work items per test project
        projectWorkItems.forEach(workItem => {
          expect(workItem.projectId).toBe(project.id);
        });
      });

      // Validate total work items
      expect(testData.workItems.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Entity Relationship Validation', () => {
    it('should maintain referential integrity across all entities', () => {
      // Check all foreign key references are valid
      testData.people.forEach(person => {
        expect(getTestRoleById(person.roleId)).toBeDefined();
        expect(getTestTeamById(person.teamId)).toBeDefined();
      });

      testData.teams.forEach(team => {
        expect(getTestDivisionById(team.divisionId!)).toBeDefined();
      });

      testData.projects.forEach(project => {
        expect(getTestTeamById(project.teamId)).toBeDefined();
      });

      testData.workItems.forEach(workItem => {
        expect(getTestProjectById(workItem.projectId)).toBeDefined();
      });

      testData.personSkills.forEach(personSkill => {
        expect(
          testData.people.find(p => p.id === personSkill.personId)
        ).toBeDefined();
        expect(
          testData.skills.find(s => s.id === personSkill.skillId)
        ).toBeDefined();
      });
    });

    it('should have consistent naming patterns across related entities', () => {
      // Check team names align with division domains
      const consumerTeams = getTestTeamsByDivisionId('div-test-001');
      consumerTeams.forEach(team => {
        expect(team.name).toMatch(/^(Mortgage|Personal)/);
      });

      const businessTeams = getTestTeamsByDivisionId('div-test-002');
      businessTeams.forEach(team => {
        expect(team.name).toMatch(/^(Commercial|Business)/);
      });

      // Check project names align with team domains
      testData.teams.forEach(team => {
        const teamProjects = testData.projects.filter(
          project => project.teamId === team.id
        );
        teamProjects.forEach(project => {
          const teamDomain = team.name.toLowerCase().split(' ')[0];
          expect(project.name.toLowerCase()).toContain(teamDomain);
        });
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should have realistic team compositions', () => {
      testData.teams.forEach(team => {
        const teamPeople = getTestPeopleByTeamId(team.id);
        const roleCounts = teamPeople.reduce(
          (acc, person) => {
            const role = getTestRoleById(person.roleId);
            acc[role?.name || 'Unknown'] =
              (acc[role?.name || 'Unknown'] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Each team should have exactly one Product Owner
        expect(roleCounts['Product Owner']).toBe(1);

        // Should have technical roles
        const technicalRoles =
          roleCounts['Software Engineer'] ||
          roleCounts['Quality Engineer'] ||
          roleCounts['Platform Engineer'];
        expect(technicalRoles).toBeGreaterThan(0);

        // Team size should be reasonable
        expect(teamPeople.length).toBe(4);
      });
    });

    it('should have realistic project portfolios', () => {
      const portfolioMetrics = {
        totalBudget: testData.projects.reduce(
          (sum, project) => sum + project.budget,
          0
        ),
        avgBudget:
          testData.projects.reduce((sum, project) => sum + project.budget, 0) /
          testData.projects.length,
        statusDistribution: testData.projects.reduce(
          (acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      // Portfolio should have reasonable total budget
      expect(portfolioMetrics.totalBudget).toBeGreaterThan(500000);
      expect(portfolioMetrics.avgBudget).toBeGreaterThan(100000);

      // Should have a mix of project statuses
      expect(
        Object.keys(portfolioMetrics.statusDistribution).length
      ).toBeGreaterThan(1);
    });

    it('should have realistic skill distributions', () => {
      // Check that people have appropriate skills for their roles
      testData.people.forEach(person => {
        const role = getTestRoleById(person.roleId);
        const personSkills = testData.personSkills
          .filter(ps => ps.personId === person.id)
          .map(ps => {
            const skill = testData.skills.find(s => s.id === ps.skillId);
            return skill?.name;
          });

        if (role?.name === 'Product Owner') {
          expect(personSkills).toContain('Lending & Credit');
        } else if (role?.name === 'Software Engineer') {
          expect(personSkills).toContain('JavaScript/TypeScript');
          expect(personSkills).toContain('React');
        } else if (role?.name === 'Platform Engineer') {
          expect(personSkills).toContain('AWS');
        }
      });
    });
  });

  describe('Data Quality Validation', () => {
    it('should have no orphaned records', () => {
      // Check no orphaned people
      testData.people.forEach(person => {
        expect(getTestTeamById(person.teamId)).toBeDefined();
        expect(getTestRoleById(person.roleId)).toBeDefined();
      });

      // Check no orphaned teams
      testData.teams.forEach(team => {
        expect(getTestDivisionById(team.divisionId!)).toBeDefined();
      });

      // Check no orphaned projects
      testData.projects.forEach(project => {
        expect(getTestTeamById(project.teamId)).toBeDefined();
      });

      // Check no orphaned work items
      testData.workItems.forEach(workItem => {
        expect(getTestProjectById(workItem.projectId)).toBeDefined();
      });

      // Check no orphaned person skills
      testData.personSkills.forEach(personSkill => {
        expect(
          testData.people.find(p => p.id === personSkill.personId)
        ).toBeDefined();
        expect(
          testData.skills.find(s => s.id === personSkill.skillId)
        ).toBeDefined();
      });
    });

    it('should have consistent data formats', () => {
      // Check email formats
      testData.people.forEach(person => {
        expect(person.email).toMatch(/^[a-z]+\.[a-z]+@bankcorp\.com$/);
      });

      // Check date formats
      testData.people.forEach(person => {
        expect(person.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      testData.projects.forEach(project => {
        expect(project.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(project.endDate).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      });

      // Check numeric values
      testData.people.forEach(person => {
        expect(typeof person.annualSalary).toBe('number');
        expect(person.annualSalary).toBeGreaterThan(0);
      });

      testData.projects.forEach(project => {
        expect(typeof project.budget).toBe('number');
        expect(project.budget).toBeGreaterThan(0);
      });

      testData.workItems.forEach(workItem => {
        expect(typeof workItem.estimatedHours).toBe('number');
        expect(typeof workItem.actualHours).toBe('number');
        expect(workItem.estimatedHours).toBeGreaterThan(0);
        expect(workItem.actualHours).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have no duplicate identifiers', () => {
      // Check unique IDs within each entity type
      const divisionIds = testData.divisions.map(d => d.id);
      const teamIds = testData.teams.map(t => t.id);
      const peopleIds = testData.people.map(p => p.id);
      const projectIds = testData.projects.map(p => p.id);
      const workItemIds = testData.workItems.map(w => w.id);
      const roleIds = testData.roles.map(r => r.id);
      const skillIds = testData.skills.map(s => s.id);

      expect(divisionIds.length).toBe(new Set(divisionIds).size);
      expect(teamIds.length).toBe(new Set(teamIds).size);
      expect(peopleIds.length).toBe(new Set(peopleIds).size);
      expect(projectIds.length).toBe(new Set(projectIds).size);
      expect(workItemIds.length).toBe(new Set(workItemIds).size);
      expect(roleIds.length).toBe(new Set(roleIds).size);
      expect(skillIds.length).toBe(new Set(skillIds).size);
    });
  });

  describe('Performance and Scalability Validation', () => {
    it('should handle data queries efficiently', () => {
      // Test lookup performance
      const startTime = performance.now();

      // Perform multiple lookups
      for (let i = 0; i < 100; i++) {
        testData.teams.forEach(team => {
          getTestPeopleByTeamId(team.id);
          getTestWorkItemsByTeamId(team.id);
        });

        testData.projects.forEach(project => {
          getTestWorkItemsByProjectId(project.id);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should maintain data consistency under load', () => {
      // Simulate concurrent access patterns
      const results = [];

      for (let i = 0; i < 50; i++) {
        const team = testData.teams[i % testData.teams.length];
        const people = getTestPeopleByTeamId(team.id);
        const workItems = getTestWorkItemsByTeamId(team.id);

        results.push({
          teamId: team.id,
          peopleCount: people.length,
          workItemCount: workItems.length,
          totalSalary: people.reduce(
            (sum, person) => sum + (person.annualSalary || 0),
            0
          ),
        });
      }

      // All results should be consistent
      results.forEach(result => {
        expect(result.peopleCount).toBe(4);
        expect(result.totalSalary).toBeGreaterThan(400000);
      });
    });
  });

  describe('Business Intelligence Validation', () => {
    it('should calculate accurate organizational metrics', () => {
      const orgMetrics = {
        totalDivisions: testData.divisions.length,
        totalTeams: testData.teams.length,
        totalPeople: testData.people.length,
        totalProjects: testData.projects.length,
        totalWorkItems: testData.workItems.length,
        totalBudget: testData.projects.reduce(
          (sum, project) => sum + project.budget,
          0
        ),
        totalSalary: testData.people.reduce(
          (sum, person) => sum + (person.annualSalary || 0),
          0
        ),
        avgTeamSize: testData.people.length / testData.teams.length,
        avgProjectBudget:
          testData.projects.reduce((sum, project) => sum + project.budget, 0) /
          testData.projects.length,
        avgPersonSalary:
          testData.people.reduce(
            (sum, person) => sum + (person.annualSalary || 0),
            0
          ) / testData.people.length,
      };

      // Validate expected values
      expect(orgMetrics.totalDivisions).toBe(2);
      expect(orgMetrics.totalTeams).toBe(4);
      expect(orgMetrics.totalPeople).toBe(16);
      expect(orgMetrics.totalProjects).toBe(4);
      expect(orgMetrics.totalWorkItems).toBeGreaterThan(0);
      expect(orgMetrics.avgTeamSize).toBe(4);
      expect(orgMetrics.totalBudget).toBeGreaterThan(500000);
      expect(orgMetrics.totalSalary).toBeGreaterThan(1500000);
      expect(orgMetrics.avgProjectBudget).toBeGreaterThan(100000);
      expect(orgMetrics.avgPersonSalary).toBeGreaterThan(90000);
    });

    it('should provide meaningful division comparisons', () => {
      const divisionMetrics = testData.divisions.map(division => {
        const divisionTeams = getTestTeamsByDivisionId(division.id);
        const divisionPeople = divisionTeams.flatMap(team =>
          getTestPeopleByTeamId(team.id)
        );
        const divisionProjects = testData.projects.filter(project =>
          divisionTeams.some(team => team.id === project.teamId)
        );

        return {
          divisionName: division.name,
          teamCount: divisionTeams.length,
          peopleCount: divisionPeople.length,
          projectCount: divisionProjects.length,
          totalBudget: divisionProjects.reduce(
            (sum, project) => sum + project.budget,
            0
          ),
          totalSalary: divisionPeople.reduce(
            (sum, person) => sum + (person.annualSalary || 0),
            0
          ),
          avgTeamSize: divisionPeople.length / divisionTeams.length,
        };
      });

      expect(divisionMetrics).toHaveLength(2);
      divisionMetrics.forEach(metrics => {
        expect(metrics.teamCount).toBe(2);
        expect(metrics.peopleCount).toBe(8);
        expect(metrics.projectCount).toBe(2);
        expect(metrics.avgTeamSize).toBe(4);
        expect(metrics.totalBudget).toBeGreaterThan(200000);
        expect(metrics.totalSalary).toBeGreaterThan(700000);
      });
    });
  });
});
