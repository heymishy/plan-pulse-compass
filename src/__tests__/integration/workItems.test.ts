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

  describe('Work Item Data Structure', () => {
    it('should have work items with complete information', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.title).toBeDefined();
        expect(workItem.description).toBeDefined();
        expect(workItem.projectId).toBeDefined();
        expect(workItem.status).toBeDefined();
        expect(workItem.priority).toBeDefined();
        expect(workItem.type).toBeDefined();
        expect(workItem.estimatedHours).toBeDefined();
        expect(workItem.actualHours).toBeDefined();
      });
    });

    it('should have realistic work item titles', () => {
      const titles = testData.workItems.map(workItem => workItem.title);
      expect(titles).toContain('Implement User Authentication');
      expect(titles).toContain('Design Database Schema');
      expect(titles).toContain('Create API Endpoints');
      expect(titles).toContain('Write Unit Tests');
    });

    it('should have work items with proper status values', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.status).toMatch(
          /^(todo|in-progress|review|done|blocked)$/
        );
      });
    });

    it('should have work items with proper priority values', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.priority).toMatch(/^(low|medium|high|critical)$/);
      });
    });

    it('should have work items with proper types', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.type).toMatch(/^(feature|bug|task|story|epic)$/);
      });
    });
  });

  describe('Work Item-Project Relationships', () => {
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

    it('should have work items aligned with project scope', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        projectWorkItems.forEach(workItem => {
          // Work item should be related to project domain
          const projectDomain = project.name.toLowerCase().split(' ')[0];
          expect(workItem.title.toLowerCase()).toContain(projectDomain);
        });
      });
    });
  });

  describe('Work Item Effort Tracking', () => {
    it('should have realistic estimated hours', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.estimatedHours).toBeGreaterThan(0);
        expect(workItem.estimatedHours).toBeLessThan(80); // Max 2 weeks of work
        expect(Number.isInteger(workItem.estimatedHours)).toBe(true);
      });
    });

    it('should have realistic actual hours', () => {
      testData.workItems.forEach(workItem => {
        expect(workItem.actualHours).toBeGreaterThanOrEqual(0);
        expect(workItem.actualHours).toBeLessThan(100); // Max 2.5 weeks of work
        expect(Number.isInteger(workItem.actualHours)).toBe(true);
      });
    });

    it('should have completed work items with actual hours', () => {
      const completedWorkItems = testData.workItems.filter(
        workItem => workItem.status === 'done'
      );

      if (completedWorkItems.length > 0) {
        completedWorkItems.forEach(workItem => {
          expect(workItem.actualHours).toBeGreaterThan(0);
        });
      }
    });

    it('should have reasonable effort variance', () => {
      const workItemsWithVariance = testData.workItems
        .filter(workItem => workItem.actualHours > 0)
        .map(workItem => {
          const variance = workItem.actualHours - workItem.estimatedHours;
          const variancePercentage = (variance / workItem.estimatedHours) * 100;
          return {
            title: workItem.title,
            estimated: workItem.estimatedHours,
            actual: workItem.actualHours,
            variance,
            variancePercentage,
          };
        });

      workItemsWithVariance.forEach(item => {
        // Variance should be reasonable (±50% of estimate)
        expect(item.variancePercentage).toBeGreaterThan(-50);
        expect(item.variancePercentage).toBeLessThan(50);
      });
    });
  });

  describe('Work Item Status Analysis', () => {
    it('should have a mix of work item statuses', () => {
      const statusCounts = testData.workItems.reduce(
        (acc, workItem) => {
          acc[workItem.status] = (acc[workItem.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(Object.keys(statusCounts).length).toBeGreaterThan(1);
      expect(
        statusCounts['todo'] || statusCounts['in-progress']
      ).toBeGreaterThan(0);
    });

    it('should have work items with appropriate priorities', () => {
      const priorityCounts = testData.workItems.reduce(
        (acc, workItem) => {
          acc[workItem.priority] = (acc[workItem.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(Object.keys(priorityCounts).length).toBeGreaterThan(1);
      expect(
        priorityCounts['high'] || priorityCounts['medium']
      ).toBeGreaterThan(0);
    });

    it('should have work items with appropriate types', () => {
      const typeCounts = testData.workItems.reduce(
        (acc, workItem) => {
          acc[workItem.type] = (acc[workItem.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(Object.keys(typeCounts).length).toBeGreaterThan(1);
      expect(typeCounts['feature'] || typeCounts['task']).toBeGreaterThan(0);
    });

    it('should have critical work items with high priority', () => {
      const criticalWorkItems = testData.workItems.filter(
        workItem => workItem.priority === 'critical'
      );

      if (criticalWorkItems.length > 0) {
        criticalWorkItems.forEach(workItem => {
          expect(workItem.estimatedHours).toBeGreaterThan(8); // Critical items should be substantial
        });
      }
    });
  });

  describe('Work Item Analytics', () => {
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
        typeDistribution: testData.workItems.reduce(
          (acc, workItem) => {
            acc[workItem.type] = (acc[workItem.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      expect(portfolioMetrics.totalWorkItems).toBeGreaterThan(0);
      expect(portfolioMetrics.totalEstimatedHours).toBeGreaterThan(0);
      expect(portfolioMetrics.avgEstimatedHours).toBeGreaterThan(0);
      expect(
        Object.keys(portfolioMetrics.statusDistribution).length
      ).toBeGreaterThan(0);
      expect(
        Object.keys(portfolioMetrics.typeDistribution).length
      ).toBeGreaterThan(0);
    });

    it('should calculate project work item metrics', () => {
      const projectWorkItemMetrics = testData.projects.map(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        const totalEstimatedHours = projectWorkItems.reduce(
          (sum, workItem) => sum + workItem.estimatedHours,
          0
        );
        const totalActualHours = projectWorkItems.reduce(
          (sum, workItem) => sum + workItem.actualHours,
          0
        );
        const avgEstimatedHours =
          projectWorkItems.length > 0
            ? totalEstimatedHours / projectWorkItems.length
            : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          workItemCount: projectWorkItems.length,
          totalEstimatedHours,
          totalActualHours,
          avgEstimatedHours,
          workItems: projectWorkItems.map(workItem => ({
            title: workItem.title,
            status: workItem.status,
            priority: workItem.priority,
            type: workItem.type,
            estimatedHours: workItem.estimatedHours,
            actualHours: workItem.actualHours,
          })),
        };
      });

      expect(projectWorkItemMetrics).toHaveLength(4);
      projectWorkItemMetrics.forEach(metrics => {
        expect(metrics.workItemCount).toBeGreaterThan(0);
        expect(metrics.totalEstimatedHours).toBeGreaterThan(0);
        expect(metrics.avgEstimatedHours).toBeGreaterThan(0);
      });
    });

    it('should identify high-effort work items', () => {
      const highEffortWorkItems = testData.workItems
        .filter(workItem => workItem.estimatedHours > 20)
        .map(workItem => {
          const project = getTestProjectById(workItem.projectId);
          return {
            title: workItem.title,
            project: project?.name,
            estimatedHours: workItem.estimatedHours,
            priority: workItem.priority,
            type: workItem.type,
          };
        });

      expect(highEffortWorkItems.length).toBeGreaterThan(0);
      highEffortWorkItems.forEach(workItem => {
        expect(workItem.estimatedHours).toBeGreaterThan(20);
        expect(workItem.project).toBeDefined();
      });
    });

    it('should calculate team workload', () => {
      const teamWorkload = testData.teams.map(team => {
        const teamWorkItems = getTestWorkItemsByTeamId(team.id);
        const totalEstimatedHours = teamWorkItems.reduce(
          (sum, workItem) => sum + workItem.estimatedHours,
          0
        );
        const totalActualHours = teamWorkItems.reduce(
          (sum, workItem) => sum + workItem.actualHours,
          0
        );
        const completedWorkItems = teamWorkItems.filter(
          workItem => workItem.status === 'done'
        );

        return {
          teamId: team.id,
          teamName: team.name,
          workItemCount: teamWorkItems.length,
          totalEstimatedHours,
          totalActualHours,
          completedCount: completedWorkItems.length,
          completionRate:
            teamWorkItems.length > 0
              ? (completedWorkItems.length / teamWorkItems.length) * 100
              : 0,
        };
      });

      expect(teamWorkload).toHaveLength(4);
      teamWorkload.forEach(workload => {
        expect(workload.workItemCount).toBeGreaterThan(0);
        expect(workload.totalEstimatedHours).toBeGreaterThan(0);
        expect(workload.completionRate).toBeGreaterThanOrEqual(0);
        expect(workload.completionRate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have no duplicate work item titles within projects', () => {
      testData.projects.forEach(project => {
        const projectWorkItems = getTestWorkItemsByProjectId(project.id);
        const titles = projectWorkItems.map(workItem => workItem.title);
        const uniqueTitles = [...new Set(titles)];
        expect(titles.length).toBe(uniqueTitles.length);
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
        expect(workItem.actualHours).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(workItem.estimatedHours)).toBe(true);
        expect(Number.isInteger(workItem.actualHours)).toBe(true);
      });
    });
  });
});
