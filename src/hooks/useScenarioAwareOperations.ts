import { useCallback } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import { useTeams } from '@/context/TeamContext';
import { useProjects } from '@/context/ProjectContext';
import { usePlanning } from '@/context/PlanningContext';
import { useGoals } from '@/context/GoalContext';
import { useToast } from '@/hooks/use-toast';
import type {
  Person,
  Team,
  Project,
  Epic,
  Allocation,
  Goal,
  TeamMember,
  Release,
  ProjectSolution,
  ProjectSkill,
  RunWorkCategory,
  ActualAllocation,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
} from '@/types';
import type { ScenarioModification } from '@/types/scenarioTypes';

/**
 * Hook that provides scenario-aware CRUD operations
 * When in scenario mode, operations modify scenario data and track changes
 * When not in scenario mode, operations work directly on live data
 */
export const useScenarioAwareOperations = () => {
  const scenarioContext = useScenarios();
  const teamContext = useTeams();
  const projectContext = useProjects();
  const planningContext = usePlanning();
  const goalContext = useGoals();
  const { toast } = useToast();

  const { isInScenarioMode, activeScenarioId, updateScenario } =
    scenarioContext;

  // Helper to create modification tracking
  const createModification = useCallback(
    (
      type: 'create' | 'update' | 'delete',
      entityType: keyof import('@/types/scenarioTypes').ScenarioData,
      entityId: string,
      entityName: string,
      description: string,
      changes?: ScenarioModification['changes']
    ): ScenarioModification => ({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      entityType,
      entityId,
      entityName,
      description,
      changes,
    }),
    []
  );

  // Helper to update scenario with modifications
  const updateScenarioData = useCallback(
    async (
      updater: (
        currentData: import('@/types/scenarioTypes').ScenarioData
      ) => import('@/types/scenarioTypes').ScenarioData,
      modification: ScenarioModification
    ) => {
      if (!isInScenarioMode || !activeScenarioId) return;

      try {
        const currentData = scenarioContext.getCurrentData();
        const updatedData = updater(currentData);

        const currentScenario = scenarioContext.scenarios.find(
          s => s.id === activeScenarioId
        );
        await updateScenario(activeScenarioId, {
          data: updatedData,
          modifications: [
            ...(currentScenario?.modifications || []),
            modification,
          ],
          metadata: {
            ...(currentScenario?.metadata || {}),
            totalModifications:
              (currentScenario?.metadata.totalModifications || 0) + 1,
            lastAccessDate: new Date().toISOString(),
          },
        });

        toast({
          title: 'Scenario Updated',
          description: modification.description,
        });
      } catch (error) {
        console.error('Error updating scenario:', error);
        toast({
          title: 'Error',
          description: 'Failed to update scenario. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [isInScenarioMode, activeScenarioId, scenarioContext, updateScenario, toast]
  );

  // Scenario-aware person operations
  const scenarioAwarePerson = {
    add: useCallback(
      async (personData: Omit<Person, 'id'>) => {
        if (!isInScenarioMode) {
          return teamContext.addPerson(personData);
        }

        const newPerson: Person = {
          ...personData,
          id: crypto.randomUUID(),
        };

        const modification = createModification(
          'create',
          'people',
          newPerson.id,
          newPerson.name,
          `Added person: ${newPerson.name}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            people: [...data.people, newPerson],
          }),
          modification
        );

        return newPerson;
      },
      [isInScenarioMode, teamContext, createModification, updateScenarioData]
    ),

    update: useCallback(
      async (personId: string, personData: Partial<Person>) => {
        if (!isInScenarioMode) {
          return teamContext.updatePerson(personId, personData);
        }

        const currentData = scenarioContext.getCurrentData();
        const existingPerson = currentData.people.find(p => p.id === personId);
        if (!existingPerson) return;

        const changes = Object.entries(personData).map(([field, newValue]) => ({
          field,
          oldValue: (existingPerson as any)[field],
          newValue,
        }));

        const modification = createModification(
          'update',
          'people',
          personId,
          existingPerson.name,
          `Updated person: ${existingPerson.name}`,
          changes
        );

        await updateScenarioData(
          data => ({
            ...data,
            people: data.people.map(p =>
              p.id === personId ? { ...p, ...personData } : p
            ),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        teamContext,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),

    delete: useCallback(
      async (personId: string) => {
        if (!isInScenarioMode) {
          // No direct delete in teamContext, would need to implement
          console.warn('Delete person not implemented in live mode');
          return;
        }

        const currentData = scenarioContext.getCurrentData();
        const existingPerson = currentData.people.find(p => p.id === personId);
        if (!existingPerson) return;

        const modification = createModification(
          'delete',
          'people',
          personId,
          existingPerson.name,
          `Deleted person: ${existingPerson.name}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            people: data.people.filter(p => p.id !== personId),
            // Also remove from team members
            teamMembers: data.teamMembers.filter(
              tm => tm.personId !== personId
            ),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),
  };

  // Scenario-aware team operations
  const scenarioAwareTeam = {
    add: useCallback(
      async (teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>) => {
        if (!isInScenarioMode) {
          return teamContext.addTeam(teamData);
        }

        const now = new Date().toISOString();
        const newTeam: Team = {
          ...teamData,
          id: crypto.randomUUID(),
          createdDate: now,
          lastModified: now,
        };

        const modification = createModification(
          'create',
          'teams',
          newTeam.id,
          newTeam.name,
          `Added team: ${newTeam.name}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            teams: [...data.teams, newTeam],
          }),
          modification
        );

        return newTeam;
      },
      [isInScenarioMode, teamContext, createModification, updateScenarioData]
    ),

    update: useCallback(
      async (teamId: string, teamData: Partial<Team>) => {
        if (!isInScenarioMode) {
          return teamContext.updateTeam(teamId, teamData);
        }

        const currentData = scenarioContext.getCurrentData();
        const existingTeam = currentData.teams.find(t => t.id === teamId);
        if (!existingTeam) return;

        const changes = Object.entries(teamData).map(([field, newValue]) => ({
          field,
          oldValue: (existingTeam as any)[field],
          newValue,
        }));

        const modification = createModification(
          'update',
          'teams',
          teamId,
          existingTeam.name,
          `Updated team: ${existingTeam.name}`,
          changes
        );

        await updateScenarioData(
          data => ({
            ...data,
            teams: data.teams.map(t =>
              t.id === teamId
                ? { ...t, ...teamData, lastModified: new Date().toISOString() }
                : t
            ),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        teamContext,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),

    delete: useCallback(
      async (teamId: string) => {
        if (!isInScenarioMode) {
          return teamContext.deleteTeam(teamId);
        }

        const currentData = scenarioContext.getCurrentData();
        const existingTeam = currentData.teams.find(t => t.id === teamId);
        if (!existingTeam) return;

        const modification = createModification(
          'delete',
          'teams',
          teamId,
          existingTeam.name,
          `Deleted team: ${existingTeam.name}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            teams: data.teams.filter(t => t.id !== teamId),
            // Also remove team members and allocations
            teamMembers: data.teamMembers.filter(tm => tm.teamId !== teamId),
            allocations: data.allocations.filter(a => a.teamId !== teamId),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        teamContext,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),
  };

  // Scenario-aware project operations
  const scenarioAwareProject = {
    add: useCallback(
      async (projectData: Omit<Project, 'id'>) => {
        if (!isInScenarioMode) {
          // No direct add in projectContext, would need to implement
          console.warn('Add project not implemented in live mode');
          return;
        }

        const newProject: Project = {
          ...projectData,
          id: crypto.randomUUID(),
        };

        const modification = createModification(
          'create',
          'projects',
          newProject.id,
          newProject.name,
          `Added project: ${newProject.name}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            projects: [...data.projects, newProject],
          }),
          modification
        );

        return newProject;
      },
      [isInScenarioMode, createModification, updateScenarioData]
    ),

    update: useCallback(
      async (projectId: string, projectData: Partial<Project>) => {
        if (!isInScenarioMode) {
          // projectContext.updateProject expects full Project, need adapter
          const currentProjects = projectContext.projects;
          const existingProject = currentProjects.find(p => p.id === projectId);
          if (existingProject) {
            return projectContext.updateProject(projectId, {
              ...existingProject,
              ...projectData,
            });
          }
          return;
        }

        const currentData = scenarioContext.getCurrentData();
        const existingProject = currentData.projects.find(
          p => p.id === projectId
        );
        if (!existingProject) return;

        const changes = Object.entries(projectData).map(
          ([field, newValue]) => ({
            field,
            oldValue: (existingProject as any)[field],
            newValue,
          })
        );

        const modification = createModification(
          'update',
          'projects',
          projectId,
          existingProject.name,
          `Updated project: ${existingProject.name}`,
          changes
        );

        await updateScenarioData(
          data => ({
            ...data,
            projects: data.projects.map(p =>
              p.id === projectId ? { ...p, ...projectData } : p
            ),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        projectContext,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),

    delete: useCallback(
      async (projectId: string) => {
        if (!isInScenarioMode) {
          console.warn('Delete project not implemented in live mode');
          return;
        }

        const currentData = scenarioContext.getCurrentData();
        const existingProject = currentData.projects.find(
          p => p.id === projectId
        );
        if (!existingProject) return;

        const modification = createModification(
          'delete',
          'projects',
          projectId,
          existingProject.name,
          `Deleted project: ${existingProject.name}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            projects: data.projects.filter(p => p.id !== projectId),
            // Also remove related epics and allocations
            epics: data.epics.filter(e => e.projectId !== projectId),
            allocations: data.allocations.filter(
              a => a.projectId !== projectId
            ),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),
  };

  // Scenario-aware allocation operations
  const scenarioAwareAllocation = {
    add: useCallback(
      async (allocationData: Omit<Allocation, 'id'>) => {
        if (!isInScenarioMode) {
          // No direct add in planningContext, would need to implement
          console.warn('Add allocation not implemented in live mode');
          return;
        }

        const newAllocation: Allocation = {
          ...allocationData,
          id: crypto.randomUUID(),
        };

        const modification = createModification(
          'create',
          'allocations',
          newAllocation.id,
          `${newAllocation.percentage}% allocation`,
          `Added allocation: ${newAllocation.percentage}% to ${newAllocation.projectId || 'project'}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            allocations: [...data.allocations, newAllocation],
          }),
          modification
        );

        return newAllocation;
      },
      [isInScenarioMode, createModification, updateScenarioData]
    ),

    update: useCallback(
      async (allocationId: string, allocationData: Partial<Allocation>) => {
        if (!isInScenarioMode) {
          // planningContext doesn't have direct update, would need to implement
          console.warn('Update allocation not implemented in live mode');
          return;
        }

        const currentData = scenarioContext.getCurrentData();
        const existingAllocation = currentData.allocations.find(
          a => a.id === allocationId
        );
        if (!existingAllocation) return;

        const changes = Object.entries(allocationData).map(
          ([field, newValue]) => ({
            field,
            oldValue: (existingAllocation as any)[field],
            newValue,
          })
        );

        const modification = createModification(
          'update',
          'allocations',
          allocationId,
          `${existingAllocation.percentage}% allocation`,
          `Updated allocation: ${allocationId}`,
          changes
        );

        await updateScenarioData(
          data => ({
            ...data,
            allocations: data.allocations.map(a =>
              a.id === allocationId ? { ...a, ...allocationData } : a
            ),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),

    delete: useCallback(
      async (allocationId: string) => {
        if (!isInScenarioMode) {
          console.warn('Delete allocation not implemented in live mode');
          return;
        }

        const currentData = scenarioContext.getCurrentData();
        const existingAllocation = currentData.allocations.find(
          a => a.id === allocationId
        );
        if (!existingAllocation) return;

        const modification = createModification(
          'delete',
          'allocations',
          allocationId,
          `${existingAllocation.percentage}% allocation`,
          `Deleted allocation: ${allocationId}`
        );

        await updateScenarioData(
          data => ({
            ...data,
            allocations: data.allocations.filter(a => a.id !== allocationId),
          }),
          modification
        );
      },
      [
        isInScenarioMode,
        scenarioContext,
        createModification,
        updateScenarioData,
      ]
    ),
  };

  return {
    isInScenarioMode,
    person: scenarioAwarePerson,
    team: scenarioAwareTeam,
    project: scenarioAwareProject,
    allocation: scenarioAwareAllocation,
    // Add more entity operations as needed
  };
};
