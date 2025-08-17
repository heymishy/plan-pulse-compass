/**
 * Scenario-Aware Context Hooks
 * These hooks automatically serve scenario data when in scenario mode,
 * ensuring complete isolation between live and scenario data.
 */

import { useMemo } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import { useTeams } from '@/context/TeamContext';
import { useProjects } from '@/context/ProjectContext';
import { usePlanning } from '@/context/PlanningContext';
import { useSettings } from '@/context/SettingsContext';
import { useGoals } from '@/context/GoalContext';
import type {
  TeamContextType,
  ProjectContextType,
  PlanningContextType,
  SettingsContextType,
  GoalContextType,
} from '@/types';

/**
 * Scenario-aware Team Context
 * Returns scenario data when in scenario mode, live data otherwise
 */
export const useScenarioAwareTeams = (): TeamContextType => {
  const { isInScenarioMode, getCurrentData } = useScenarios();
  const liveTeamContext = useTeams();

  return useMemo(() => {
    if (!isInScenarioMode) {
      return liveTeamContext;
    }

    const scenarioData = getCurrentData();

    // Create scenario-aware context that overrides data arrays
    return {
      ...liveTeamContext,
      // Override with scenario data
      people: scenarioData.people,
      teams: scenarioData.teams,
      teamMembers: scenarioData.teamMembers,
      divisions: scenarioData.divisions,
      roles: scenarioData.roles,
      divisionLeadershipRoles: scenarioData.divisionLeadershipRoles,
      unmappedPeople: scenarioData.unmappedPeople,

      // Override functions to work with scenario data
      addPerson: person => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      updatePerson: (id, updates) => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      deletePerson: id => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      addTeam: team => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      updateTeam: (id, updates) => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      deleteTeam: id => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
    };
  }, [isInScenarioMode, getCurrentData, liveTeamContext]);
};

/**
 * Scenario-aware Project Context
 */
export const useScenarioAwareProjects = (): ProjectContextType => {
  const { isInScenarioMode, getCurrentData } = useScenarios();
  const liveProjectContext = useProjects();

  return useMemo(() => {
    if (!isInScenarioMode) {
      return liveProjectContext;
    }

    const scenarioData = getCurrentData();

    return {
      ...liveProjectContext,
      // Override with scenario data
      projects: scenarioData.projects,
      epics: scenarioData.epics,
      releases: scenarioData.releases,
      projectSolutions: scenarioData.projectSolutions,
      projectSkills: scenarioData.projectSkills,

      // Override functions to prevent modification
      addProject: project => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      updateProject: (id, updates) => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      deleteProject: id => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
    };
  }, [isInScenarioMode, getCurrentData, liveProjectContext]);
};

/**
 * Scenario-aware Planning Context
 */
export const useScenarioAwarePlanning = (): PlanningContextType => {
  const { isInScenarioMode, getCurrentData } = useScenarios();
  const livePlanningContext = usePlanning();

  return useMemo(() => {
    if (!isInScenarioMode) {
      return livePlanningContext;
    }

    const scenarioData = getCurrentData();

    return {
      ...livePlanningContext,
      // Override with scenario data
      allocations: scenarioData.allocations,
      runWorkCategories: scenarioData.runWorkCategories,
      actualAllocations: scenarioData.actualAllocations,
      iterationSnapshots: scenarioData.iterationSnapshots,

      // Override functions to prevent modification
      addAllocation: allocation => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      updateAllocation: (id, updates) => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      deleteAllocation: id => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
    };
  }, [isInScenarioMode, getCurrentData, livePlanningContext]);
};

/**
 * Scenario-aware Goals Context
 */
export const useScenarioAwareGoals = (): GoalContextType => {
  const { isInScenarioMode, getCurrentData } = useScenarios();
  const liveGoalContext = useGoals();

  return useMemo(() => {
    if (!isInScenarioMode) {
      return liveGoalContext;
    }

    const scenarioData = getCurrentData();

    return {
      ...liveGoalContext,
      // Override with scenario data
      goals: scenarioData.goals,
      goalEpics: scenarioData.goalEpics,
      goalMilestones: scenarioData.goalMilestones,
      goalTeams: scenarioData.goalTeams,

      // Override functions to prevent modification
      addGoal: goal => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      updateGoal: (id, updates) => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
      deleteGoal: id => {
        console.warn(
          'Cannot modify scenario data directly. Use scenario modification system.'
        );
        return Promise.resolve();
      },
    };
  }, [isInScenarioMode, getCurrentData, liveGoalContext]);
};

/**
 * Scenario-aware Settings Context
 * Settings are generally not modified in scenarios, but we maintain consistency
 */
export const useScenarioAwareSettings = (): SettingsContextType => {
  const { isInScenarioMode, getCurrentData } = useScenarios();
  const liveSettingsContext = useSettings();

  return useMemo(() => {
    if (!isInScenarioMode) {
      return liveSettingsContext;
    }

    const scenarioData = getCurrentData();

    return {
      ...liveSettingsContext,
      // Override with scenario config if available
      config: scenarioData.config || liveSettingsContext.config,
    };
  }, [isInScenarioMode, getCurrentData, liveSettingsContext]);
};

/**
 * Hook to check if we're currently viewing scenario data
 */
export const useIsScenarioData = () => {
  const { isInScenarioMode, activeScenarioId } = useScenarios();
  return { isInScenarioMode, activeScenarioId };
};

/**
 * Hook to get scenario-aware data status for UI indicators
 */
export const useScenarioDataStatus = () => {
  const { isInScenarioMode, activeScenarioId, scenarios } = useScenarios();

  return useMemo(() => {
    if (!isInScenarioMode || !activeScenarioId) {
      return {
        mode: 'live' as const,
        scenarioName: null,
        lastModified: null,
      };
    }

    const activeScenario = scenarios.find(s => s.id === activeScenarioId);

    return {
      mode: 'scenario' as const,
      scenarioName: activeScenario?.name || 'Unknown Scenario',
      lastModified: activeScenario?.lastModified || null,
    };
  }, [isInScenarioMode, activeScenarioId, scenarios]);
};
