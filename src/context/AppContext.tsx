import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useTeams } from './TeamContext';
import { useProjects } from './ProjectContext';
import { usePlanning } from './PlanningContext';
import { useSettings } from './SettingsContext';
import { useGoals } from './GoalContext';
import {
  Person,
  Team,
  Division,
  Role,
  Project,
  Epic,
  Release,
  Solution,
  ProjectSkill,
  ProjectSolution,
  Allocation,
  Cycle,
  RunWorkCategory,
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
  AppConfig,
  UnmappedPerson,
  Skill,
  PersonSkill,
  Milestone,
} from '@/types';
import {
  Goal,
  NorthStar,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
} from '@/types/goalTypes';

// Combined interface that provides all context data and methods
export interface AppContextType {
  // From TeamContext
  people: Person[];
  setPeople: (people: Person[] | ((prev: Person[]) => Person[])) => void;
  addPerson: (personData: Omit<Person, 'id'>) => void;
  updatePerson: (personId: string, personData: Partial<Person>) => void;
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  addTeam: (
    teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>
  ) => void;
  updateTeam: (teamId: string, teamData: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  divisions: Division[];
  setDivisions: (
    divisions: Division[] | ((prev: Division[]) => Division[])
  ) => void;
  unmappedPeople: UnmappedPerson[];
  setUnmappedPeople: (
    people: UnmappedPerson[] | ((prev: UnmappedPerson[]) => UnmappedPerson[])
  ) => void;
  addUnmappedPerson: (
    personData: Omit<UnmappedPerson, 'id' | 'importedDate'>
  ) => void;
  removeUnmappedPerson: (personId: string) => void;

  // From ProjectContext
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  updateProject: (projectId: string, updatedProject: Project) => void;
  epics: Epic[];
  setEpics: (epics: Epic[] | ((prev: Epic[]) => Epic[])) => void;
  releases: Release[];
  setReleases: (releases: Release[] | ((prev: Release[]) => Release[])) => void;
  solutions: Solution[];
  setSolutions: (
    solutions: Solution[] | ((prev: Solution[]) => Solution[])
  ) => void;
  projectSkills: ProjectSkill[];
  setProjectSkills: (
    skills: ProjectSkill[] | ((prev: ProjectSkill[]) => ProjectSkill[])
  ) => void;
  projectSolutions: ProjectSolution[];
  setProjectSolutions: (
    solutions:
      | ProjectSolution[]
      | ((prev: ProjectSolution[]) => ProjectSolution[])
  ) => void;

  // From PlanningContext
  allocations: Allocation[];
  setAllocations: (
    allocations: Allocation[] | ((prev: Allocation[]) => Allocation[])
  ) => void;
  cycles: Cycle[];
  setCycles: (cycles: Cycle[] | ((prev: Cycle[]) => Cycle[])) => void;
  runWorkCategories: RunWorkCategory[];
  setRunWorkCategories: (
    categories:
      | RunWorkCategory[]
      | ((prev: RunWorkCategory[]) => RunWorkCategory[])
  ) => void;
  actualAllocations: ActualAllocation[];
  setActualAllocations: (
    allocations:
      | ActualAllocation[]
      | ((prev: ActualAllocation[]) => ActualAllocation[])
  ) => void;
  iterationReviews: IterationReview[];
  setIterationReviews: (
    reviews:
      | IterationReview[]
      | ((prev: IterationReview[]) => IterationReview[])
  ) => void;
  iterationSnapshots: IterationSnapshot[];
  setIterationSnapshots: (
    snapshots:
      | IterationSnapshot[]
      | ((prev: IterationSnapshot[]) => IterationSnapshot[])
  ) => void;

  // From SettingsContext
  config: AppConfig | null;
  setConfig: (
    config: AppConfig | null | ((prev: AppConfig | null) => AppConfig | null)
  ) => void;
  isSetupComplete: boolean;
  setIsSetupComplete: (complete: boolean) => void;

  // From GoalContext
  goals: Goal[];
  setGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  northStar: NorthStar | null;
  setNorthStar: (
    northStar: NorthStar | null | ((prev: NorthStar | null) => NorthStar | null)
  ) => void;
  goalEpics: GoalEpic[];
  setGoalEpics: (
    goalEpics: GoalEpic[] | ((prev: GoalEpic[]) => GoalEpic[])
  ) => void;
  goalMilestones: GoalMilestone[];
  setGoalMilestones: (
    goalMilestones:
      | GoalMilestone[]
      | ((prev: GoalMilestone[]) => GoalMilestone[])
  ) => void;
  goalTeams: GoalTeam[];
  setGoalTeams: (
    goalTeams: GoalTeam[] | ((prev: GoalTeam[]) => GoalTeam[])
  ) => void;
  addGoal: (goalData: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>) => void;
  updateGoal: (goalId: string, goalData: Partial<Goal>) => void;

  // Computed properties that were commonly used
  skills: Skill[];
  personSkills: PersonSkill[];
  milestones: Milestone[];
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const teamContext = useTeams();
  const projectContext = useProjects();
  const planningContext = usePlanning();
  const settingsContext = useSettings();
  const goalContext = useGoals();

  // Computed properties
  const skills = useMemo(() => {
    // For now, return empty array - this would need to be implemented
    // based on the actual skills data structure
    return [] as Skill[];
  }, []);

  const personSkills = useMemo(() => {
    // For now, return empty array - this would need to be implemented
    // based on the actual person skills data structure
    return [] as PersonSkill[];
  }, []);

  const milestones = useMemo(() => {
    // For now, return empty array - this would need to be implemented
    // based on the actual milestones data structure
    return [] as Milestone[];
  }, []);

  const isDataLoading = useMemo(() => {
    // For now, return false - this would need to be implemented
    // based on the actual loading states
    return false;
  }, []);

  const value: AppContextType = {
    // Team context
    ...teamContext,

    // Project context
    ...projectContext,

    // Planning context
    ...planningContext,

    // Settings context
    ...settingsContext,

    // Goal context
    ...goalContext,

    // Computed properties
    skills,
    personSkills,
    milestones,
    isDataLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
