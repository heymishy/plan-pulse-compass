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

  describe('Project-Team Integration', () => {
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
  });

  describe('Project Analytics Integration', () => {
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

      expect(portfolioMetrics.totalProjects).toBeGreaterThan(0);
      expect(portfolioMetrics.totalBudget).toBeGreaterThan(0);
      expect(portfolioMetrics.avgBudget).toBeGreaterThan(0);
      expect(
        Object.keys(portfolioMetrics.statusDistribution).length
      ).toBeGreaterThan(1);
      expect(
        Object.keys(portfolioMetrics.priorityDistribution).length
      ).toBeGreaterThan(1);
    });

    it('should calculate team project metrics', () => {
      testData.teams.forEach(team => {
        const teamProjects = testData.projects.filter(
          project => project.teamId === team.id
        );
        const teamMetrics = {
          projectCount: teamProjects.length,
          totalBudget: teamProjects.reduce(
            (sum, project) => sum + project.budget,
            0
          ),
          activeProjects: teamProjects.filter(
            project => project.status === 'in-progress'
          ).length,
        };

        expect(teamMetrics.projectCount).toBeGreaterThan(0);
        expect(teamMetrics.totalBudget).toBeGreaterThan(0);
        expect(teamMetrics.activeProjects).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify high-value projects', () => {
      const highValueProjects = testData.projects.filter(
        project => project.budget > 500000
      );

      if (highValueProjects.length > 0) {
        highValueProjects.forEach(project => {
          expect(project.budget).toBeLessThan(2000000); // Max reasonable budget
          expect(project.priority).toMatch(/^(high|critical)$/);
        });
      }
    });
  });

  describe('Project-Work Item Integration', () => {
    it('should have work items with proper project assignments', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        projectWorkItems.forEach(workItem => {
          expect(workItem.projectId).toBe(project.id);
        });
      });
    });

    it('should have projects with associated work items', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        expect(projectWorkItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Consistency Checks', () => {
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
        expect(project.budget).toBeGreaterThan(50000); // Minimum reasonable budget
        expect(project.budget).toBeLessThan(2000000); // Maximum reasonable budget
      });
    });

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
  });
});
