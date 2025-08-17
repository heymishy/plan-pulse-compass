/**
 * Comprehensive tests for scenario data isolation
 * Ensures live and scenario data remain completely separated
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ScenarioProvider, useScenarios } from '@/context/ScenarioContext';
import {
  useScenarioAwareTeams,
  useScenarioAwareProjects,
  useScenarioAwarePlanning,
} from '@/hooks/useScenarioAwareContext';
import {
  calculateTeamCosts,
  calculateProjectBurnAnalysis,
  compareScenarioFinancials,
} from '@/utils/scenarioFinancialCalculations';
import {
  executeScenarioTemplate,
  executeModification,
} from '@/utils/scenarioModificationEngine';
import type {
  Team,
  Person,
  Project,
  Allocation,
  TeamMember,
  Role,
} from '@/types';
import type {
  ScenarioData,
  ScenarioTemplate,
  CreateScenarioParams,
} from '@/types/scenarioTypes';
import type {
  EnhancedScenarioData,
  TeamCostCalculation,
  ProjectBurnAnalysis,
} from '@/types/scenarioFinancialTypes';

// Mock contexts
const mockTeamContext = {
  teams: [
    {
      id: 'team-1',
      name: 'Development Team A',
      capacity: 40,
      status: 'active',
      type: 'permanent' as const,
      divisionId: 'dev',
      description: 'Frontend development team',
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'team-2',
      name: 'Development Team B',
      capacity: 40,
      status: 'active',
      type: 'permanent' as const,
      divisionId: 'dev',
      description: 'Backend development team',
      targetSkills: [],
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ] as Team[],
  people: [
    {
      id: 'person-1',
      name: 'John Developer',
      email: 'john@company.com',
      roleId: 'senior-engineer',
      teamId: 'team-1',
      startDate: '2024-01-01',
      status: 'active',
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'person-2',
      name: 'Jane Lead',
      email: 'jane@company.com',
      roleId: 'tech-lead',
      teamId: 'team-1',
      startDate: '2024-01-01',
      status: 'active',
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ] as Person[],
  teamMembers: [
    { id: 'tm-1', personId: 'person-1', teamId: 'team-1' },
    { id: 'tm-2', personId: 'person-2', teamId: 'team-1' },
  ] as TeamMember[],
  roles: [
    {
      id: 'senior-engineer',
      name: 'Senior Engineer',
      description: 'Senior software engineer',
      color: '#3b82f6',
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tech-lead',
      name: 'Technical Lead',
      description: 'Technical team leader',
      color: '#10b981',
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ] as Role[],
  divisions: [],
  divisionLeadershipRoles: [],
  unmappedPeople: [],
};

const mockProjectContext = {
  projects: [
    {
      id: 'project-1',
      name: 'Mobile App Redesign',
      description: 'Complete redesign of mobile application',
      budget: 500000,
      status: 'active',
      priority: 'high',
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'project-2',
      name: 'API Modernization',
      description: 'Modernize legacy API infrastructure',
      budget: 300000,
      status: 'active',
      priority: 'medium',
      createdDate: '2024-01-01T00:00:00Z',
      lastModified: '2024-01-01T00:00:00Z',
    },
  ] as Project[],
  epics: [],
  releases: [],
  projectSolutions: [],
  projectSkills: [],
};

const mockPlanningContext = {
  allocations: [
    {
      id: 'alloc-1',
      personId: 'person-1',
      teamId: 'team-1',
      projectId: 'project-1',
      epicId: '',
      cycleId: 'cycle-1',
      percentage: 80,
      type: 'project' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      notes: '',
    },
    {
      id: 'alloc-2',
      personId: 'person-2',
      teamId: 'team-1',
      projectId: 'project-2',
      epicId: '',
      cycleId: 'cycle-1',
      percentage: 60,
      type: 'project' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      notes: '',
    },
  ] as Allocation[],
  runWorkCategories: [],
  actualAllocations: [],
  iterationSnapshots: [],
};

// Mock context hooks
vi.mock('@/context/TeamContext', () => ({
  useTeams: () => mockTeamContext,
}));

vi.mock('@/context/ProjectContext', () => ({
  useProjects: () => mockProjectContext,
}));

vi.mock('@/context/PlanningContext', () => ({
  usePlanning: () => mockPlanningContext,
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({ config: {} }),
}));

vi.mock('@/context/GoalContext', () => ({
  useGoals: () => ({
    goals: [],
    goalEpics: [],
    goalMilestones: [],
    goalTeams: [],
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ScenarioProvider, null, children);
}

describe('Scenario Data Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Live vs Scenario Data Separation', () => {
    it('should serve live data when not in scenario mode', async () => {
      const { result: scenarioResult } = renderHook(() => useScenarios(), {
        wrapper: TestWrapper,
      });
      const { result: teamsResult } = renderHook(
        () => useScenarioAwareTeams(),
        {
          wrapper: TestWrapper,
        }
      );

      expect(scenarioResult.current.isInScenarioMode).toBe(false);
      expect(teamsResult.current.teams).toEqual(mockTeamContext.teams);
      expect(teamsResult.current.people).toEqual(mockTeamContext.people);
    });

    it('should serve scenario data when in scenario mode', async () => {
      const { result: scenarioResult } = renderHook(() => useScenarios(), {
        wrapper: TestWrapper,
      });
      const { result: teamsResult } = renderHook(
        () => useScenarioAwareTeams(),
        {
          wrapper: TestWrapper,
        }
      );

      // Create a scenario
      await act(async () => {
        const scenarioId = await scenarioResult.current.createScenario({
          name: 'Test Scenario',
          description: 'Test scenario for data isolation',
        });
        await scenarioResult.current.switchToScenario(scenarioId);
      });

      expect(scenarioResult.current.isInScenarioMode).toBe(true);

      // Should still serve the same data initially (snapshot of live data)
      expect(teamsResult.current.teams).toEqual(mockTeamContext.teams);
      expect(teamsResult.current.people).toEqual(mockTeamContext.people);
    });

    it('should prevent direct modification of scenario data', async () => {
      const { result: scenarioResult } = renderHook(() => useScenarios(), {
        wrapper: TestWrapper,
      });
      const { result: teamsResult } = renderHook(
        () => useScenarioAwareTeams(),
        {
          wrapper: TestWrapper,
        }
      );

      // Create and switch to scenario
      await act(async () => {
        const scenarioId = await scenarioResult.current.createScenario({
          name: 'Test Scenario',
        });
        await scenarioResult.current.switchToScenario(scenarioId);
      });

      // Mock console.warn to verify warnings are shown
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Try to modify data - should show warnings
      await act(async () => {
        await teamsResult.current.addTeam({
          id: 'new-team',
          name: 'New Team',
          capacity: 40,
          status: 'active',
          type: 'permanent',
          divisionId: 'dev',
          description: 'Test team',
          targetSkills: [],
          createdDate: '2024-01-01T00:00:00Z',
          lastModified: '2024-01-01T00:00:00Z',
        });
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Cannot modify scenario data directly. Use scenario modification system.'
      );

      warnSpy.mockRestore();
    });

    it('should maintain live data integrity when scenario is modified', async () => {
      const { result: scenarioResult } = renderHook(() => useScenarios(), {
        wrapper: TestWrapper,
      });

      // Create scenario
      let scenarioId: string;
      await act(async () => {
        scenarioId = await scenarioResult.current.createScenario({
          name: 'Test Scenario',
        });
        await scenarioResult.current.switchToScenario(scenarioId);
      });

      // Get scenario data and modify it directly (simulating scenario modifications)
      const scenarioData = scenarioResult.current.getCurrentData();
      scenarioData.teams.push({
        id: 'scenario-team',
        name: 'Scenario Team',
        capacity: 40,
        status: 'active',
        type: 'permanent',
        divisionId: 'dev',
        description: 'Team only in scenario',
        targetSkills: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      });

      // Switch back to live mode
      await act(async () => {
        scenarioResult.current.switchToLive();
      });

      const { result: teamsResult } = renderHook(
        () => useScenarioAwareTeams(),
        {
          wrapper: TestWrapper,
        }
      );

      // Live data should remain unchanged
      expect(teamsResult.current.teams).toEqual(mockTeamContext.teams);
      expect(
        teamsResult.current.teams.find(t => t.id === 'scenario-team')
      ).toBeUndefined();
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate team costs accurately', () => {
      const teamCosts = calculateTeamCosts(
        mockTeamContext.teams,
        mockTeamContext.people,
        mockTeamContext.teamMembers,
        mockTeamContext.roles
      );

      expect(teamCosts).toHaveLength(2);

      const team1Cost = teamCosts.find(tc => tc.teamId === 'team-1');
      expect(team1Cost).toBeDefined();
      expect(team1Cost!.headcount).toBe(2);
      expect(team1Cost!.totalCost).toBeGreaterThan(0);
      expect(team1Cost!.costPerHour).toBeGreaterThan(0);
      expect(team1Cost!.costPerIteration).toBeGreaterThan(0);
      expect(team1Cost!.costPerQuarter).toBeGreaterThan(0);
    });

    it('should calculate project burn analysis accurately', () => {
      const teamCosts = calculateTeamCosts(
        mockTeamContext.teams,
        mockTeamContext.people,
        mockTeamContext.teamMembers,
        mockTeamContext.roles
      );

      const projectBurnAnalysis = calculateProjectBurnAnalysis(
        mockProjectContext.projects,
        mockPlanningContext.allocations,
        teamCosts
      );

      expect(projectBurnAnalysis).toHaveLength(2);

      const project1Analysis = projectBurnAnalysis.find(
        pba => pba.projectId === 'project-1'
      );
      expect(project1Analysis).toBeDefined();
      expect(project1Analysis!.totalBudget).toBe(500000);
      expect(project1Analysis!.allocatedTeamCosts).toBeGreaterThan(0);
      expect(project1Analysis!.burnRate.perIteration).toBeGreaterThan(0);
      expect(project1Analysis!.budgetUtilization.percentage).toBeGreaterThan(0);
    });

    it('should compare scenario vs live financial impact', () => {
      const teamCosts = calculateTeamCosts(
        mockTeamContext.teams,
        mockTeamContext.people,
        mockTeamContext.teamMembers,
        mockTeamContext.roles
      );

      const projectBurnAnalysis = calculateProjectBurnAnalysis(
        mockProjectContext.projects,
        mockPlanningContext.allocations,
        teamCosts
      );

      const liveData: EnhancedScenarioData = {
        ...mockTeamContext,
        ...mockProjectContext,
        ...mockPlanningContext,
        goals: [],
        goalEpics: [],
        goalMilestones: [],
        goalTeams: [],
        config: {},
        financialAnalysis: {
          teamCosts,
          projectBurnAnalysis,
          quarterlyTotals: [],
          roleCostConfig: [],
          teamCostConfig: [],
        },
      };

      // Create scenario data with budget reduction
      const scenarioData: EnhancedScenarioData = {
        ...liveData,
        projects: liveData.projects.map(p => ({
          ...p,
          budget: (p.budget || 0) * 0.9, // 10% budget reduction
        })),
      };

      // Recalculate scenario financials
      const scenarioTeamCosts = calculateTeamCosts(
        scenarioData.teams,
        scenarioData.people,
        scenarioData.teamMembers,
        scenarioData.roles
      );

      const scenarioProjectBurn = calculateProjectBurnAnalysis(
        scenarioData.projects,
        scenarioData.allocations,
        scenarioTeamCosts
      );

      scenarioData.financialAnalysis = {
        teamCosts: scenarioTeamCosts,
        projectBurnAnalysis: scenarioProjectBurn,
        quarterlyTotals: [],
        roleCostConfig: [],
        teamCostConfig: [],
      };

      const comparison = compareScenarioFinancials(
        scenarioData,
        liveData,
        'test-scenario'
      );

      expect(comparison.summary.totalBudgetVariance).not.toBe(0);
      expect(comparison.projectBurnChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Template Execution', () => {
    it('should execute budget reduction template correctly', async () => {
      const budgetReductionTemplate: ScenarioTemplate = {
        id: 'budget-cut-10',
        name: 'Budget Reduction',
        description: 'Reduce project budgets by 10%',
        category: 'budget',
        config: {
          modifications: [
            {
              entityType: 'projects',
              operation: 'bulk-update',
              filter: {
                field: 'budget',
                operator: 'greater-than',
                value: 0,
              },
              changes: [
                {
                  field: 'budget',
                  operation: 'multiply',
                  value: '{{budgetMultiplier}}',
                },
              ],
            },
          ],
          parameters: [
            {
              id: 'budgetReduction',
              name: 'Budget Reduction %',
              description: 'Percentage to reduce budgets by',
              type: 'percentage',
              required: true,
              defaultValue: 10,
              min: 0,
              max: 50,
            },
            {
              id: 'budgetMultiplier',
              name: 'Budget Multiplier',
              description: 'Calculated from budget reduction',
              type: 'number',
              required: false,
              defaultValue: 0.9,
            },
          ],
        },
        usageCount: 0,
      };

      const scenarioData: EnhancedScenarioData = {
        ...mockTeamContext,
        ...mockProjectContext,
        ...mockPlanningContext,
        goals: [],
        goalEpics: [],
        goalMilestones: [],
        goalTeams: [],
        config: {},
      };

      const result = await executeScenarioTemplate(
        budgetReductionTemplate,
        { budgetReduction: 10 },
        scenarioData
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.modifications).toHaveLength(2); // Two projects modified

      // Verify budget reduction
      const modifiedProject1 = result.modifiedData.projects.find(
        p => p.id === 'project-1'
      );
      const modifiedProject2 = result.modifiedData.projects.find(
        p => p.id === 'project-2'
      );

      expect(modifiedProject1?.budget).toBe(450000); // 500000 * 0.9
      expect(modifiedProject2?.budget).toBe(270000); // 300000 * 0.9
    });

    it('should execute conditional template logic', async () => {
      const conditionalTemplate: ScenarioTemplate = {
        id: 'conditional-test',
        name: 'Conditional Test',
        description: 'Template with conditional logic',
        category: 'strategic-planning',
        config: {
          modifications: [],
          parameters: [],
          conditionalLogic: [
            {
              id: 'high-budget-projects',
              condition: {
                entityType: 'projects',
                field: 'budget',
                operator: 'greater-than',
                value: 400000,
              },
              actions: [
                {
                  entityType: 'projects',
                  operation: 'bulk-update',
                  filter: {
                    field: 'budget',
                    operator: 'greater-than',
                    value: 400000,
                  },
                  changes: [
                    {
                      field: 'priority',
                      operation: 'set',
                      value: 'critical',
                    },
                  ],
                },
              ],
              description: 'Set high-budget projects to critical priority',
            },
          ],
        },
        usageCount: 0,
      };

      const scenarioData: EnhancedScenarioData = {
        ...mockTeamContext,
        ...mockProjectContext,
        ...mockPlanningContext,
        goals: [],
        goalEpics: [],
        goalMilestones: [],
        goalTeams: [],
        config: {},
      };

      const result = await executeScenarioTemplate(
        conditionalTemplate,
        {},
        scenarioData
      );

      expect(result.success).toBe(true);
      expect(result.modifications).toHaveLength(1); // Only project-1 has budget > 400000

      const modifiedProject1 = result.modifiedData.projects.find(
        p => p.id === 'project-1'
      );
      expect(modifiedProject1?.priority).toBe('critical');

      const modifiedProject2 = result.modifiedData.projects.find(
        p => p.id === 'project-2'
      );
      expect(modifiedProject2?.priority).toBe('medium'); // Unchanged
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle 100+ teams efficiently', () => {
      // Generate 100 teams
      const teams: Team[] = Array.from({ length: 100 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
        capacity: 40,
        status: 'active',
        type: 'permanent',
        divisionId: 'dev',
        description: `Team ${i} description`,
        targetSkills: [],
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      }));

      // Generate 500 people (5 per team)
      const people: Person[] = [];
      const teamMembers: TeamMember[] = [];

      teams.forEach((team, teamIndex) => {
        for (let i = 0; i < 5; i++) {
          const personId = `person-${teamIndex}-${i}`;
          people.push({
            id: personId,
            name: `Person ${teamIndex}-${i}`,
            email: `person${teamIndex}${i}@company.com`,
            roleId: 'senior-engineer',
            teamId: team.id,
            startDate: '2024-01-01',
            status: 'active',
            createdDate: '2024-01-01T00:00:00Z',
            lastModified: '2024-01-01T00:00:00Z',
          });

          teamMembers.push({
            id: `tm-${teamIndex}-${i}`,
            personId,
            teamId: team.id,
          });
        }
      });

      const startTime = performance.now();

      const teamCosts = calculateTeamCosts(
        teams,
        people,
        teamMembers,
        mockTeamContext.roles
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(teamCosts).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify first and last team calculations
      expect(teamCosts[0].headcount).toBe(5);
      expect(teamCosts[0].totalCost).toBeGreaterThan(0);
      expect(teamCosts[99].headcount).toBe(5);
      expect(teamCosts[99].totalCost).toBeGreaterThan(0);
    });

    it('should handle 150+ projects efficiently', () => {
      // Generate 150 projects
      const projects: Project[] = Array.from({ length: 150 }, (_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        description: `Project ${i} description`,
        budget: 100000 + i * 10000, // Varying budgets
        status: 'active',
        priority: 'medium',
        createdDate: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      }));

      // Generate allocations for projects
      const allocations: Allocation[] = [];
      projects.forEach((project, index) => {
        // Each project gets 2-3 allocations
        for (let i = 0; i < 2 + (index % 2); i++) {
          allocations.push({
            id: `alloc-${index}-${i}`,
            personId: `person-${index % 20}`, // Cycle through 20 people
            teamId: `team-${index % 10}`, // Cycle through 10 teams
            projectId: project.id,
            epicId: '',
            cycleId: 'cycle-1',
            percentage: 50 + i * 20, // Varying percentages
            type: 'project',
            startDate: '2024-01-01',
            endDate: '2024-01-14',
            notes: '',
          });
        }
      });

      // Use simplified team costs for performance test
      const teamCosts: TeamCostCalculation[] = Array.from(
        { length: 10 },
        (_, i) => ({
          teamId: `team-${i}`,
          teamName: `Team ${i}`,
          totalCost: 1000000,
          costBreakdown: {
            baseSalaries: 600000,
            overhead: 240000,
            projectManagement: 100000,
            licensing: 40000,
            other: 20000,
          },
          costPerHour: 500,
          costPerIteration: 40000,
          costPerQuarter: 250000,
          headcount: 5,
          averageRoleRate: 120000,
        })
      );

      const startTime = performance.now();

      const projectBurnAnalysis = calculateProjectBurnAnalysis(
        projects,
        allocations,
        teamCosts
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(projectBurnAnalysis).toHaveLength(150);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify calculations
      expect(projectBurnAnalysis[0].totalBudget).toBeGreaterThan(0);
      expect(projectBurnAnalysis[0].allocatedTeamCosts).toBeGreaterThan(0);
      expect(projectBurnAnalysis[149].totalBudget).toBeGreaterThan(0);
    });
  });
});
