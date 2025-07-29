import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTeams } from './TeamContext';
import { useProjects } from './ProjectContext';
import { usePlanning } from './PlanningContext';
import { useSettings } from './SettingsContext';
import { useGoals } from './GoalContext';
import {
  Scenario,
  ScenarioData,
  ScenarioContextType,
  CreateScenarioParams,
  ScenarioTemplate,
  ScenarioComparison,
  ScenarioModification,
  BUILTIN_SCENARIO_TEMPLATES,
  SCENARIO_STORAGE_KEYS,
} from '@/types/scenarioTypes';
import { useToast } from '@/hooks/use-toast';

/**
 * ScenarioContext provides scenario planning capabilities
 *
 * When in scenario mode, this context proxies all AppContext data
 * through the active scenario's data instead of live data.
 */

const ScenarioContext = createContext<ScenarioContextType | undefined>(
  undefined
);

export const useScenarios = () => {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenarios must be used within a ScenarioProvider');
  }
  return context;
};

export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use individual context hooks instead of useApp() to avoid circular dependency
  const teamContext = useTeams();
  const projectContext = useProjects();
  const planningContext = usePlanning();
  const settingsContext = useSettings();
  const goalContext = useGoals();
  const { toast } = useToast();

  // Scenario storage
  const [scenarios, setScenarios] = useLocalStorage<Scenario[]>(
    SCENARIO_STORAGE_KEYS.SCENARIOS,
    []
  );
  const [activeScenarioId, setActiveScenarioId] = useLocalStorage<
    string | null
  >(SCENARIO_STORAGE_KEYS.ACTIVE_SCENARIO, null);
  const [templates, setTemplates] = useLocalStorage<ScenarioTemplate[]>(
    SCENARIO_STORAGE_KEYS.SCENARIO_TEMPLATES,
    []
  );

  // State management
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize templates on first load
  useEffect(() => {
    if (!isInitialized && templates.length === 0) {
      const builtinTemplates = BUILTIN_SCENARIO_TEMPLATES.map(template => ({
        ...template,
        usageCount: 0,
        lastUsed: undefined,
      }));
      setTemplates(builtinTemplates);
      setIsInitialized(true);
    }
  }, [templates, isInitialized, setTemplates]);

  // Check if we're in scenario mode
  const isInScenarioMode = Boolean(activeScenarioId);

  // Get current active scenario
  const activeScenario = useMemo(() => {
    if (!activeScenarioId) return null;
    return scenarios.find(s => s.id === activeScenarioId) || null;
  }, [activeScenarioId, scenarios]);

  // Create a deep clone of application state for scenarios
  const cloneCurrentState = useCallback((): ScenarioData => {
    return {
      people: structuredClone(teamContext.people),
      teams: structuredClone(teamContext.teams),
      projects: structuredClone(projectContext.projects),
      epics: structuredClone(projectContext.epics),
      allocations: structuredClone(planningContext.allocations),
      divisions: structuredClone(teamContext.divisions),
      roles: structuredClone(teamContext.roles),
      releases: structuredClone(projectContext.releases),
      projectSolutions: structuredClone(projectContext.projectSolutions),
      projectSkills: structuredClone(projectContext.projectSkills),
      runWorkCategories: structuredClone(planningContext.runWorkCategories),
      teamMembers: structuredClone(teamContext.teamMembers),
      divisionLeadershipRoles: structuredClone(
        teamContext.divisionLeadershipRoles
      ),
      unmappedPeople: structuredClone(teamContext.unmappedPeople),
      actualAllocations: structuredClone(planningContext.actualAllocations),
      iterationSnapshots: structuredClone(planningContext.iterationSnapshots),
      goals: structuredClone(goalContext.goals),
      goalEpics: structuredClone(goalContext.goalEpics),
      goalMilestones: structuredClone(goalContext.goalMilestones),
      goalTeams: structuredClone(goalContext.goalTeams),
      config: structuredClone(settingsContext.config || {}),
    };
  }, [
    teamContext.people,
    teamContext.teams,
    teamContext.divisions,
    teamContext.roles,
    teamContext.teamMembers,
    teamContext.divisionLeadershipRoles,
    teamContext.unmappedPeople,
    projectContext.projects,
    projectContext.epics,
    projectContext.releases,
    projectContext.projectSolutions,
    projectContext.projectSkills,
    planningContext.allocations,
    planningContext.runWorkCategories,
    planningContext.actualAllocations,
    planningContext.iterationSnapshots,
    goalContext.goals,
    goalContext.goalEpics,
    goalContext.goalMilestones,
    goalContext.goalTeams,
    settingsContext.config,
  ]);

  // Create a new scenario
  const createScenario = useCallback(
    async (params: CreateScenarioParams): Promise<string> => {
      const {
        name,
        description,
        templateId,
        templateParameters,
        expiresAt: customExpiresAt,
      } = params;

      try {
        const scenarioId = crypto.randomUUID();
        const now = new Date().toISOString();
        const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
        const expiresAt =
          customExpiresAt || new Date(Date.now() + sixtyDaysInMs).toISOString();

        const scenarioData = cloneCurrentState();
        const modifications: ScenarioModification[] = [];

        // Apply template if specified
        if (templateId && templateParameters) {
          const template = templates.find(t => t.id === templateId);
          if (template) {
            // TODO: Apply template modifications to scenarioData
            // This would involve processing template.config.modifications
            // and applying them based on templateParameters

            // Update template usage
            setTemplates(prev =>
              prev.map(t =>
                t.id === templateId
                  ? { ...t, usageCount: t.usageCount + 1, lastUsed: now }
                  : t
              )
            );
          }
        }

        const newScenario: Scenario = {
          id: scenarioId,
          name,
          description,
          createdDate: now,
          lastModified: now,
          expiresAt,
          templateId,
          templateName: templateId
            ? templates.find(t => t.id === templateId)?.name
            : undefined,
          data: scenarioData,
          modifications,
          metadata: {
            createdFromLiveState: true,
            liveStateSnapshotDate: now,
            totalModifications: 0,
            lastAccessDate: now,
          },
        };

        setScenarios(prev => [...prev, newScenario]);

        toast({
          title: 'Scenario Created',
          description: `"${name}" scenario has been created successfully.`,
        });

        return scenarioId;
      } catch (error) {
        console.error('Error creating scenario:', error);
        toast({
          title: 'Error',
          description: 'Failed to create scenario. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [cloneCurrentState, templates, setScenarios, setTemplates, toast]
  );

  // Create scenario from template
  const createScenarioFromTemplate = useCallback(
    async (
      templateId: string,
      parameters: Record<string, unknown>
    ): Promise<string> => {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      return createScenario({
        name: `${template.name} Scenario`,
        description: `Created from ${template.name} template`,
        templateId,
        templateParameters: parameters,
      });
    },
    [templates, createScenario]
  );

  // Switch to a scenario
  const switchToScenario = useCallback(
    async (scenarioId: string): Promise<void> => {
      try {
        const scenario = scenarios.find(s => s.id === scenarioId);
        if (!scenario) {
          throw new Error('Scenario not found');
        }

        setActiveScenarioId(scenarioId);
        setHasUnsavedChanges(false);

        // Update last access date
        setScenarios(prev =>
          prev.map(s =>
            s.id === scenarioId
              ? {
                  ...s,
                  metadata: {
                    ...s.metadata,
                    lastAccessDate: new Date().toISOString(),
                  },
                }
              : s
          )
        );

        toast({
          title: 'Scenario Activated',
          description: `Switched to "${scenario.name}" scenario.`,
        });
      } catch (error) {
        console.error('Error switching to scenario:', error);
        toast({
          title: 'Error',
          description: 'Failed to switch to scenario. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [scenarios, setActiveScenarioId, setScenarios, toast]
  );

  // Switch back to live mode
  const switchToLive = useCallback(() => {
    setActiveScenarioId(null);
    setHasUnsavedChanges(false);

    toast({
      title: 'Live Mode',
      description: 'Switched back to live planning mode.',
    });
  }, [setActiveScenarioId, toast]);

  // Update scenario
  const updateScenario = useCallback(
    async (scenarioId: string, updates: Partial<Scenario>): Promise<void> => {
      try {
        setScenarios(prev =>
          prev.map(scenario =>
            scenario.id === scenarioId
              ? {
                  ...scenario,
                  ...updates,
                  lastModified: new Date().toISOString(),
                  metadata: {
                    ...scenario.metadata,
                    lastAccessDate: new Date().toISOString(),
                  },
                }
              : scenario
          )
        );

        if (scenarioId === activeScenarioId) {
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Error updating scenario:', error);
        throw error;
      }
    },
    [setScenarios, activeScenarioId]
  );

  // Delete scenario
  const deleteScenario = useCallback(
    async (scenarioId: string): Promise<void> => {
      try {
        const scenario = scenarios.find(s => s.id === scenarioId);
        if (!scenario) return;

        setScenarios(prev => prev.filter(s => s.id !== scenarioId));

        // If deleting active scenario, switch to live mode
        if (scenarioId === activeScenarioId) {
          setActiveScenarioId(null);
          setHasUnsavedChanges(false);
        }

        toast({
          title: 'Scenario Deleted',
          description: `"${scenario.name}" has been deleted.`,
        });
      } catch (error) {
        console.error('Error deleting scenario:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete scenario. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [scenarios, setScenarios, activeScenarioId, setActiveScenarioId, toast]
  );

  // Get scenario comparison with live data
  const getScenarioComparison = useCallback(
    async (scenarioId: string): Promise<ScenarioComparison> => {
      // TODO: Implement comprehensive comparison logic
      // This would analyze differences between scenario data and live data
      // and generate detailed comparison metrics

      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // For now, return a basic comparison structure
      return {
        scenarioId,
        scenarioName: scenario.name,
        comparedAt: new Date().toISOString(),
        summary: {
          totalChanges: scenario.modifications.length,
          categorizedChanges: {
            financial: 0,
            resources: 0,
            timeline: 0,
            scope: 0,
            organizational: 0,
          },
          impactLevel: 'medium',
        },
        changes: [],
        financialImpact: {
          totalCostDifference: 0,
          budgetVariance: 0,
          projectCostChanges: [],
        },
        resourceImpact: {
          teamCapacityChanges: [],
          peopleChanges: {
            added: 0,
            removed: 0,
            reallocated: 0,
          },
        },
        timelineImpact: {
          projectDateChanges: [],
        },
      };
    },
    [scenarios]
  );

  // Get current data (proxy to scenario data when in scenario mode)
  const getCurrentData = useCallback((): ScenarioData => {
    if (isInScenarioMode && activeScenario) {
      return activeScenario.data;
    }

    // Return live data when not in scenario mode
    return cloneCurrentState();
  }, [isInScenarioMode, activeScenario, cloneCurrentState]);

  // Save current scenario
  const saveCurrentScenario = useCallback(async (): Promise<void> => {
    if (!activeScenarioId || !activeScenario) return;

    try {
      await updateScenario(activeScenarioId, {
        data: getCurrentData(),
        lastModified: new Date().toISOString(),
      });

      setHasUnsavedChanges(false);

      toast({
        title: 'Scenario Saved',
        description: `"${activeScenario.name}" has been saved.`,
      });
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to save scenario. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [activeScenarioId, activeScenario, getCurrentData, updateScenario, toast]);

  // Discard changes
  const discardChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    // TODO: Reload scenario data from storage
    toast({
      title: 'Changes Discarded',
      description: 'Unsaved changes have been discarded.',
    });
  }, [toast]);

  // Cleanup expired scenarios
  const cleanupExpiredScenarios = useCallback(async (): Promise<void> => {
    const now = new Date();
    const expiredScenarios = scenarios.filter(
      scenario => new Date(scenario.expiresAt) < now
    );

    if (expiredScenarios.length > 0) {
      setScenarios(prev =>
        prev.filter(scenario => new Date(scenario.expiresAt) >= now)
      );

      // If active scenario was expired, switch to live mode
      const wasActiveExpired = expiredScenarios.some(
        s => s.id === activeScenarioId
      );
      if (wasActiveExpired) {
        setActiveScenarioId(null);
        setHasUnsavedChanges(false);
      }

      toast({
        title: 'Scenarios Cleaned Up',
        description: `${expiredScenarios.length} expired scenario(s) have been removed.`,
      });
    }
  }, [scenarios, setScenarios, activeScenarioId, setActiveScenarioId, toast]);

  // Refresh templates
  const refreshTemplates = useCallback(async (): Promise<void> => {
    // Re-initialize built-in templates
    const builtinTemplates = BUILTIN_SCENARIO_TEMPLATES.map(template => {
      const existing = templates.find(t => t.id === template.id);
      return {
        ...template,
        usageCount: existing?.usageCount || 0,
        lastUsed: existing?.lastUsed,
      };
    });

    setTemplates(builtinTemplates);
  }, [templates, setTemplates]);

  // Use ref to store the latest cleanup function to avoid stale closures
  const cleanupRef = useRef(cleanupExpiredScenarios);
  cleanupRef.current = cleanupExpiredScenarios;

  // Auto-cleanup on mount and periodically
  useEffect(() => {
    // Initial cleanup on mount
    cleanupRef.current();

    // Set up periodic cleanup (every hour)
    const interval = setInterval(
      () => {
        cleanupRef.current();
      },
      60 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  const value: ScenarioContextType = {
    // State
    scenarios,
    activeScenarioId,
    isInScenarioMode,
    templates,

    // Actions
    createScenario,
    createScenarioFromTemplate,
    switchToScenario,
    switchToLive,
    updateScenario,
    deleteScenario,

    // Analysis
    getScenarioComparison,

    // Data access
    getCurrentData,

    // Lifecycle
    cleanupExpiredScenarios,
    refreshTemplates,

    // Change management
    hasUnsavedChanges,
    saveCurrentScenario,
    discardChanges,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};
