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

  describe('Organizational Hierarchy Integration', () => {
    it('should have complete organizational hierarchy', () => {
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
  });

  describe('Business Logic Integration', () => {
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

    it('should have realistic work item distribution', () => {
      const workItemMetrics = {
        totalWorkItems: testData.workItems.length,
        totalEstimatedHours: testData.workItems.reduce(
          (sum, workItem) => sum + workItem.estimatedHours,
          0
        ),
        avgEstimatedHours:
          testData.workItems.reduce(
            (sum, workItem) => sum + workItem.estimatedHours,
            0
          ) / testData.workItems.length,
        statusDistribution: testData.workItems.reduce(
          (acc, workItem) => {
            acc[workItem.status] = (acc[workItem.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      expect(workItemMetrics.totalWorkItems).toBeGreaterThan(0);
      expect(workItemMetrics.totalEstimatedHours).toBeGreaterThan(0);
      expect(workItemMetrics.avgEstimatedHours).toBeGreaterThan(0);
      expect(
        Object.keys(workItemMetrics.statusDistribution).length
      ).toBeGreaterThan(1);
    });
  });

  describe('Data Consistency Integration', () => {
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

    it('should have consistent data across all entities', () => {
      // All people should be active
      expect(testData.people.every(person => person.isActive)).toBe(true);

      // All teams should have capacity
      expect(testData.teams.every(team => team.capacity > 0)).toBe(true);

      // All projects should have budgets
      expect(testData.projects.every(project => project.budget > 0)).toBe(true);

      // All work items should have estimates
      expect(
        testData.workItems.every(workItem => workItem.estimatedHours > 0)
      ).toBe(true);
    });
  });
});
