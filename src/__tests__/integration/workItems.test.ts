import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFullTestData,
  validateTestData,
} from '@/test/utils/testDataLoader';
import {
  getTestProjectById,
  getTestWorkItemsByProjectId,
  getTestWorkItemsByTeamId,
} from '@/test/data/testData';

describe('Work Items Integration Tests', () => {
  let testData: ReturnType<typeof loadFullTestData>;

  beforeEach(() => {
    testData = loadFullTestData();
    const validation = validateTestData(testData);
    expect(validation.isValid).toBe(true);
  });

  describe('Work Item-Project Integration', () => {
    it('should have work items assigned to valid projects', () => {
      testData.workItems.forEach(workItem => {
        const project = getTestProjectById(workItem.projectId);
        expect(project).toBeDefined();
        expect(project?.name).toMatch(
          /^(Digital Mortgage Platform|Personal Loan Automation|Commercial Credit Scoring|Business Lending Portal)$/
        );
      });
    });

    it('should have balanced work item distribution across projects', () => {
      const projectWorkItemCounts = testData.projects.map(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        return {
          projectId: project.id,
          projectName: project.name,
          workItemCount: projectWorkItems.length,
        };
      });

      projectWorkItemCounts.forEach(project => {
        expect(project.workItemCount).toBeGreaterThan(0);
        expect(project.workItemCount).toBeLessThanOrEqual(3); // Max 3 work items per test project
      });
    });
  });

  describe('Work Item Analytics Integration', () => {
    it('should calculate work item portfolio metrics', () => {
      const portfolioMetrics = {
        totalWorkItems: testData.workItems.length,
        totalEstimatedHours: testData.workItems.reduce(
          (sum, workItem) => sum + workItem.estimatedHours,
          0
        ),
        totalActualHours: testData.workItems.reduce(
          (sum, workItem) => sum + workItem.actualHours,
          0
        ),
        statusDistribution: testData.workItems.reduce(
          (acc, workItem) => {
            acc[workItem.status] = (acc[workItem.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      expect(portfolioMetrics.totalWorkItems).toBeGreaterThan(0);
      expect(portfolioMetrics.totalEstimatedHours).toBeGreaterThan(0);
      expect(
        Object.keys(portfolioMetrics.statusDistribution).length
      ).toBeGreaterThan(1);
    });

    it('should calculate project work item metrics', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        const projectMetrics = {
          workItemCount: projectWorkItems.length,
          totalEstimatedHours: projectWorkItems.reduce(
            (sum, workItem) => sum + workItem.estimatedHours,
            0
          ),
          completedWorkItems: projectWorkItems.filter(
            workItem => workItem.status === 'done'
          ).length,
        };

        expect(projectMetrics.workItemCount).toBeGreaterThan(0);
        expect(projectMetrics.totalEstimatedHours).toBeGreaterThan(0);
        expect(projectMetrics.completedWorkItems).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify high-effort work items', () => {
      const highEffortWorkItems = testData.workItems.filter(
        workItem => workItem.estimatedHours > 40
      );

      if (highEffortWorkItems.length > 0) {
        highEffortWorkItems.forEach(workItem => {
          expect(workItem.estimatedHours).toBeLessThan(80); // Max 2 weeks
          expect(workItem.priority).toMatch(/^(high|critical)$/);
        });
      }
    });

    it('should calculate team workload', () => {
      testData.teams.forEach(team => {
        const teamWorkItems = getTestWorkItemsByTeamId(team.id);
        const teamWorkload = {
          totalWorkItems: teamWorkItems.length,
          totalEstimatedHours: teamWorkItems.reduce(
            (sum, workItem) => sum + workItem.estimatedHours,
            0
          ),
          activeWorkItems: teamWorkItems.filter(
            workItem => workItem.status === 'in-progress'
          ).length,
        };

        expect(teamWorkload.totalWorkItems).toBeGreaterThanOrEqual(0);
        expect(teamWorkload.totalEstimatedHours).toBeGreaterThanOrEqual(0);
        expect(teamWorkload.activeWorkItems).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have no duplicate work item titles within projects', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        const titles = projectWorkItems.map(workItem => workItem.title);
        const uniqueTitles = new Set(titles);
        expect(titles.length).toBe(uniqueTitles.size);
      });
    });

    it('should have consistent data types', () => {
      testData.workItems.forEach(workItem => {
        expect(typeof workItem.title).toBe('string');
        expect(typeof workItem.description).toBe('string');
        expect(typeof workItem.projectId).toBe('string');
        expect(typeof workItem.status).toBe('string');
        expect(typeof workItem.priority).toBe('string');
        expect(typeof workItem.type).toBe('string');
        expect(typeof workItem.estimatedHours).toBe('number');
        expect(typeof workItem.actualHours).toBe('number');
      });
    });

    it('should have valid hour values', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.estimatedHours).toBeGreaterThan(0);
        expect(workItem.estimatedHours).toBeLessThan(80);
        expect(workItem.actualHours).toBeGreaterThanOrEqual(0);
        expect(workItem.actualHours).toBeLessThan(100);
        expect(Number.isInteger(workItem.estimatedHours)).toBe(true);
        expect(Number.isInteger(workItem.actualHours)).toBe(true);
      });
    });
  });
});
