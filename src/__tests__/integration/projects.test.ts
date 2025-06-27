import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFullTestData,
  validateTestData,
} from '@/test/utils/testDataLoader';
import {
  getTestTeamById,
  getTestProjectById,
  getTestWorkItemsByProjectId,
  getTestWorkItemsByTeamId,
} from '@/test/data/testData';

describe('Projects Integration Tests', () => {
  let testData: ReturnType<typeof loadFullTestData>;

  beforeEach(() => {
    testData = loadFullTestData();
    const validation = validateTestData(testData);
    expect(validation.isValid).toBe(true);
  });

  describe('Project Data Structure', () => {
    it('should have projects with complete information', () => {
      testData.projects.forEach(project => {
        expect(project.name).toBeDefined();
        expect(project.description).toBeDefined();
        expect(project.teamId).toBeDefined();
        expect(project.status).toBeDefined();
        expect(project.priority).toBeDefined();
        expect(project.startDate).toBeDefined();
        expect(project.endDate).toBeDefined();
        expect(project.budget).toBeDefined();
      });
    });

    it('should have realistic project names', () => {
      const projectNames = testData.projects.map(project => project.name);
      expect(projectNames).toContain('Digital Mortgage Platform');
      expect(projectNames).toContain('Personal Loan Automation');
      expect(projectNames).toContain('Commercial Credit Scoring');
      expect(projectNames).toContain('Business Lending Portal');
    });

    it('should have projects with proper status values', () => {
      testData.projects.forEach(project => {
        expect(project.status).toMatch(
          /^(planning|in-progress|completed|on-hold|cancelled)$/
        );
      });
    });

    it('should have projects with proper priority values', () => {
      testData.projects.forEach(project => {
        expect(project.priority).toMatch(/^(low|medium|high|critical)$/);
      });
    });
  });

  describe('Project-Team Relationships', () => {
    it('should have projects assigned to valid teams', () => {
      testData.projects.forEach(project => {
        const team = getTestTeamById(project.teamId);
        expect(team).toBeDefined();
        expect(team?.name).toMatch(
          /^(Mortgage Origination|Personal Loans Platform|Commercial Lending Platform|Business Credit Assessment)$/
        );
      });
    });

    it('should have balanced project distribution across teams', () => {
      const teamProjectCounts = testData.teams.map(team => {
        const teamProjects = testData.projects.filter(
          project => project.teamId === team.id
        );
        return {
          teamId: team.id,
          teamName: team.name,
          projectCount: teamProjects.length,
        };
      });

      teamProjectCounts.forEach(team => {
        expect(team.projectCount).toBe(1); // Each test team should have exactly 1 project
      });
    });

    it('should have projects aligned with team domains', () => {
      const mortgageTeam = getTestTeamById('team-test-001');
      const mortgageProjects = testData.projects.filter(
        project => project.teamId === 'team-test-001'
      );

      expect(mortgageProjects).toHaveLength(1);
      expect(mortgageProjects[0].name).toContain('Mortgage');
      expect(mortgageProjects[0].description).toContain('mortgage');
    });
  });

  describe('Project Timeline Validation', () => {
    it('should have realistic project timelines', () => {
      testData.projects.forEach(project => {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);

        expect(startDate.toString()).not.toBe('Invalid Date');
        expect(endDate.toString()).not.toBe('Invalid Date');
        expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());

        // Projects should be reasonable duration (3-12 months)
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = durationMs / (1000 * 60 * 60 * 24);
        expect(durationDays).toBeGreaterThan(90); // At least 3 months
        expect(durationDays).toBeLessThan(365); // Less than 1 year
      });
    });

    it('should have projects with consistent date formats', () => {
      testData.projects.forEach(project => {
        expect(project.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(project.endDate).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      });
    });

    it('should have projects with realistic budgets', () => {
      testData.projects.forEach(project => {
        expect(project.budget).toBeGreaterThan(50000); // Minimum reasonable budget
        expect(project.budget).toBeLessThan(2000000); // Maximum reasonable budget
      });
    });
  });

  describe('Project Status Analysis', () => {
    it('should have a mix of project statuses', () => {
      const statusCounts = testData.projects.reduce(
        (acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(Object.keys(statusCounts).length).toBeGreaterThan(1);
      expect(
        statusCounts['in-progress'] || statusCounts['planning']
      ).toBeGreaterThan(0);
    });

    it('should have projects with appropriate priorities', () => {
      const priorityCounts = testData.projects.reduce(
        (acc, project) => {
          acc[project.priority] = (acc[project.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(Object.keys(priorityCounts).length).toBeGreaterThan(1);
      expect(
        priorityCounts['high'] || priorityCounts['medium']
      ).toBeGreaterThan(0);
    });

    it('should have critical projects with high budgets', () => {
      const criticalProjects = testData.projects.filter(
        project => project.priority === 'critical'
      );

      if (criticalProjects.length > 0) {
        criticalProjects.forEach(project => {
          expect(project.budget).toBeGreaterThan(200000); // Critical projects should have higher budgets
        });
      }
    });
  });

  describe('Project Analytics', () => {
    it('should calculate project portfolio metrics', () => {
      const portfolioMetrics = {
        totalProjects: testData.projects.length,
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
        priorityDistribution: testData.projects.reduce(
          (acc, project) => {
            acc[project.priority] = (acc[project.priority] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      expect(portfolioMetrics.totalProjects).toBe(4);
      expect(portfolioMetrics.totalBudget).toBeGreaterThan(500000);
      expect(portfolioMetrics.avgBudget).toBeGreaterThan(100000);
      expect(
        Object.keys(portfolioMetrics.statusDistribution).length
      ).toBeGreaterThan(0);
      expect(
        Object.keys(portfolioMetrics.priorityDistribution).length
      ).toBeGreaterThan(0);
    });

    it('should calculate team project metrics', () => {
      const teamProjectMetrics = testData.teams.map(team => {
        const teamProjects = testData.projects.filter(
          project => project.teamId === team.id
        );
        const totalBudget = teamProjects.reduce(
          (sum, project) => sum + project.budget,
          0
        );
        const avgBudget =
          teamProjects.length > 0 ? totalBudget / teamProjects.length : 0;

        return {
          teamId: team.id,
          teamName: team.name,
          projectCount: teamProjects.length,
          totalBudget,
          avgBudget,
          projects: teamProjects.map(project => ({
            name: project.name,
            status: project.status,
            priority: project.priority,
            budget: project.budget,
          })),
        };
      });

      expect(teamProjectMetrics).toHaveLength(4);
      teamProjectMetrics.forEach(metrics => {
        expect(metrics.projectCount).toBe(1);
        expect(metrics.totalBudget).toBeGreaterThan(0);
        expect(metrics.avgBudget).toBeGreaterThan(0);
      });
    });

    it('should identify high-value projects', () => {
      const highValueProjects = testData.projects
        .filter(project => project.budget > 300000)
        .map(project => {
          const team = getTestTeamById(project.teamId);
          return {
            name: project.name,
            team: team?.name,
            budget: project.budget,
            priority: project.priority,
            status: project.status,
          };
        });

      expect(highValueProjects.length).toBeGreaterThan(0);
      highValueProjects.forEach(project => {
        expect(project.budget).toBeGreaterThan(300000);
        expect(project.team).toBeDefined();
      });
    });
  });

  describe('Project-Work Item Relationships', () => {
    it('should have projects with associated work items', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        expect(projectWorkItems.length).toBeGreaterThan(0);
        expect(projectWorkItems.length).toBeLessThanOrEqual(3); // Max 3 work items per test project
      });
    });

    it('should have work items with proper project assignments', () => {
      testData.workItems.forEach(workItem => {
        const project = getTestProjectById(workItem.projectId);
        expect(project).toBeDefined();
        expect(workItem.title).toBeDefined();
        expect(workItem.description).toBeDefined();
        expect(workItem.status).toBeDefined();
        expect(workItem.priority).toBeDefined();
      });
    });

    it('should have work items aligned with project scope', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        projectWorkItems.forEach(workItem => {
          // Work item should be related to project domain
          expect(workItem.title.toLowerCase()).toContain(
            project.name.toLowerCase().split(' ')[0]
          );
        });
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have no duplicate project names', () => {
      const projectNames = testData.projects.map(project => project.name);
      const uniqueNames = [...new Set(projectNames)];
      expect(projectNames.length).toBe(uniqueNames.length);
    });

    it('should have consistent data types', () => {
      testData.projects.forEach(project => {
        expect(typeof project.name).toBe('string');
        expect(typeof project.description).toBe('string');
        expect(typeof project.teamId).toBe('string');
        expect(typeof project.status).toBe('string');
        expect(typeof project.priority).toBe('string');
        expect(typeof project.startDate).toBe('string');
        expect(typeof project.endDate).toBe('string');
        expect(typeof project.budget).toBe('number');
      });
    });

    it('should have valid budget values', () => {
      testData.projects.forEach(project => {
        expect(project.budget).toBeGreaterThan(0);
        expect(Number.isInteger(project.budget)).toBe(true);
      });
    });
  });
});
