import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useScenarios } from './ScenarioContext';
import { useTeams } from './TeamContext';
import { useProjects } from './ProjectContext';
import { usePlanning } from './PlanningContext';
import { useSettings } from './SettingsContext';
import { useGoals } from './GoalContext';
import { useSkills } from './SkillsContext';
import { useScenarioAwareOperations } from '@/hooks/useScenarioAwareOperations';
import {
  Person,
  Team,
  TeamMember,
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
  DivisionLeadershipRole,
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
  addPerson: (personData: Omit<Person, 'id'>) => Promise<Person>;
  updatePerson: (
    personId: string,
    personData: Partial<Person>
  ) => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  addTeam: (
    teamData: Omit<Team, 'id' | 'createdDate' | 'lastModified'>
  ) => Promise<Team>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  teamMembers: TeamMember[];
  setTeamMembers: (
    teamMembers: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])
  ) => void;
  addTeamMember: (teamMemberData: Omit<TeamMember, 'id'>) => TeamMember;
  updateTeamMember: (
    teamMemberId: string,
    teamMemberData: Partial<TeamMember>
  ) => void;
  removeTeamMember: (teamMemberId: string) => void;
  getTeamMembers: (teamId: string) => TeamMember[];
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
  addProject: (projectData: Omit<Project, 'id'>) => Promise<Project>;
  updateProject: (
    projectId: string,
    projectData: Partial<Project>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
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
  addAllocation: (
    allocationData: Omit<Allocation, 'id'>
  ) => Promise<Allocation>;
  updateAllocation: (
    allocationId: string,
    allocationData: Partial<Allocation>
  ) => Promise<void>;
  deleteAllocation: (allocationId: string) => Promise<void>;
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

  // Division Leadership Roles
  divisionLeadershipRoles: DivisionLeadershipRole[];
  setDivisionLeadershipRoles: (
    roles:
      | DivisionLeadershipRole[]
      | ((prev: DivisionLeadershipRole[]) => DivisionLeadershipRole[])
  ) => void;
  addDivisionLeadershipRole: (
    roleData: Omit<DivisionLeadershipRole, 'id'>
  ) => DivisionLeadershipRole;
  updateDivisionLeadershipRole: (
    roleId: string,
    roleData: Partial<DivisionLeadershipRole>
  ) => void;
  removeDivisionLeadershipRole: (roleId: string) => void;
  getDivisionLeadershipRoles: (personId: string) => DivisionLeadershipRole[];

  // Skills Management
  skills: Skill[];
  setSkills: (skills: Skill[] | ((prev: Skill[]) => Skill[])) => void;
  personSkills: PersonSkill[];
  setPersonSkills: (
    personSkills: PersonSkill[] | ((prev: PersonSkill[]) => PersonSkill[])
  ) => void;
  addSkill: (skillData: Omit<Skill, 'id' | 'createdDate'>) => Skill;
  updateSkill: (skillId: string, skillData: Partial<Skill>) => void;
  deleteSkill: (skillId: string) => void;
  addPersonSkill: (personSkillData: Omit<PersonSkill, 'id'>) => PersonSkill;
  updatePersonSkill: (
    personSkillId: string,
    personSkillData: Partial<PersonSkill>
  ) => void;
  deletePersonSkill: (personSkillId: string) => void;
  getPersonSkills: (personId: string) => PersonSkill[];

  // Computed properties that were commonly used
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

// Internal context to bridge scenario data to AppProvider
const ScenarioContextBridge = React.createContext<any>(null);

// Hook to access scenario context from within AppProvider
export const useScenarioContextBridge = () => {
  return React.useContext(ScenarioContextBridge);
};

// Internal provider that handles the actual context aggregation
const AppProviderInternal: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Get scenario context from bridge if available
  const scenarioContext = useScenarioContextBridge();
  const teamContext = useTeams();
  const projectContext = useProjects();
  const planningContext = usePlanning();
  const settingsContext = useSettings();
  const goalContext = useGoals();
  const skillsContext = useSkills();

  // Get scenario-aware operations
  const scenarioAwareOps = useScenarioAwareOperations();

  // Get current data (either live or scenario)
  const currentData = useMemo(() => {
    if (scenarioContext?.isInScenarioMode && scenarioContext?.getCurrentData) {
      return scenarioContext.getCurrentData();
    }

    // Return live data
    return {
      people: teamContext.people,
      teams: teamContext.teams,
      teamMembers: teamContext.teamMembers,
      divisions: teamContext.divisions,
      roles: teamContext.roles,
      unmappedPeople: teamContext.unmappedPeople,
      divisionLeadershipRoles: teamContext.divisionLeadershipRoles,
      projects: projectContext.projects,
      epics: projectContext.epics,
      releases: projectContext.releases,
      projectSolutions: projectContext.projectSolutions,
      projectSkills: projectContext.projectSkills,
      allocations: planningContext.allocations,
      actualAllocations: planningContext.actualAllocations,
      iterationSnapshots: planningContext.iterationSnapshots,
      runWorkCategories: planningContext.runWorkCategories,
      goals: goalContext.goals,
      goalEpics: goalContext.goalEpics,
      goalMilestones: goalContext.goalMilestones,
      goalTeams: goalContext.goalTeams,
      skills: skillsContext.skills,
      personSkills: skillsContext.personSkills,
      config: settingsContext.config,
    };
  }, [
    scenarioContext?.isInScenarioMode,
    scenarioContext?.getCurrentData,
    teamContext.people,
    teamContext.teams,
    teamContext.teamMembers,
    teamContext.divisions,
    teamContext.roles,
    teamContext.unmappedPeople,
    teamContext.divisionLeadershipRoles,
    projectContext.projects,
    projectContext.epics,
    projectContext.releases,
    projectContext.projectSolutions,
    projectContext.projectSkills,
    planningContext.allocations,
    planningContext.actualAllocations,
    planningContext.iterationSnapshots,
    planningContext.runWorkCategories,
    goalContext.goals,
    goalContext.goalEpics,
    goalContext.goalMilestones,
    goalContext.goalTeams,
    skillsContext.skills,
    skillsContext.personSkills,
    settingsContext.config,
  ]);

  // Skills are now provided from currentData, no need for separate computed properties

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
    // Use scenario-aware data
    people: currentData.people,
    teams: currentData.teams,
    teamMembers: currentData.teamMembers,
    divisions: currentData.divisions,
    roles: currentData.roles,
    unmappedPeople: currentData.unmappedPeople,
    divisionLeadershipRoles: currentData.divisionLeadershipRoles,
    projects: currentData.projects,
    epics: currentData.epics,
    releases: currentData.releases,
    projectSolutions: currentData.projectSolutions,
    projectSkills: currentData.projectSkills,
    allocations: currentData.allocations,
    actualAllocations: currentData.actualAllocations,
    iterationSnapshots: currentData.iterationSnapshots,
    runWorkCategories: currentData.runWorkCategories,
    cycles: planningContext.cycles, // Always live data
    goals: currentData.goals,
    goalEpics: currentData.goalEpics,
    goalMilestones: currentData.goalMilestones,
    goalTeams: currentData.goalTeams,
    config: currentData.config,

    // Scenario-aware setters (implement key ones)
    setPeople: teamContext.setPeople,
    setTeams: teamContext.setTeams,
    setAllocations: planningContext.setAllocations,
    setProjects: projectContext.setProjects,
    setEpics: projectContext.setEpics,
    setGoals: goalContext.setGoals,

    // Scenario-aware CRUD operations
    addPerson: scenarioAwareOps.person.add,
    updatePerson: scenarioAwareOps.person.update,
    deletePerson: scenarioAwareOps.person.delete,
    addTeam: scenarioAwareOps.team.add,
    updateTeam: scenarioAwareOps.team.update,
    deleteTeam: scenarioAwareOps.team.delete,
    addProject: scenarioAwareOps.project.add,
    updateProject: scenarioAwareOps.project.update,
    deleteProject: scenarioAwareOps.project.delete,
    addAllocation: scenarioAwareOps.allocation.add,
    updateAllocation: scenarioAwareOps.allocation.update,
    deleteAllocation: scenarioAwareOps.allocation.delete,

    // Pass through other setters for now (they'll work on live data)
    setRoles: teamContext.setRoles,
    setTeamMembers: teamContext.setTeamMembers,
    addTeamMember: teamContext.addTeamMember,
    updateTeamMember: teamContext.updateTeamMember,
    removeTeamMember: teamContext.removeTeamMember,
    getTeamMembers: teamContext.getTeamMembers,
    setDivisions: teamContext.setDivisions,
    setUnmappedPeople: teamContext.setUnmappedPeople,
    addUnmappedPerson: teamContext.addUnmappedPerson,
    removeUnmappedPerson: teamContext.removeUnmappedPerson,
    setDivisionLeadershipRoles: teamContext.setDivisionLeadershipRoles,
    addDivisionLeadershipRole: teamContext.addDivisionLeadershipRole,
    updateDivisionLeadershipRole: teamContext.updateDivisionLeadershipRole,
    removeDivisionLeadershipRole: teamContext.removeDivisionLeadershipRole,
    getDivisionLeadershipRoles: teamContext.getDivisionLeadershipRoles,
    setReleases: projectContext.setReleases,
    setProjectSkills: projectContext.setProjectSkills,
    setProjectSolutions: projectContext.setProjectSolutions,
    setCycles: planningContext.setCycles,
    setRunWorkCategories: planningContext.setRunWorkCategories,
    setActualAllocations: planningContext.setActualAllocations,
    setIterationReviews: planningContext.setIterationReviews,
    setIterationSnapshots: planningContext.setIterationSnapshots,
    setConfig: settingsContext.setConfig,
    isSetupComplete: settingsContext.isSetupComplete,
    setIsSetupComplete: settingsContext.setIsSetupComplete,
    setNorthStar: goalContext.setNorthStar,
    setGoalEpics: goalContext.setGoalEpics,
    setGoalMilestones: goalContext.setGoalMilestones,
    setGoalTeams: goalContext.setGoalTeams,
    addGoal: goalContext.addGoal,
    updateGoal: goalContext.updateGoal,
    northStar: goalContext.northStar,
    iterationReviews: planningContext.iterationReviews,
    solutions: currentData.solutions,
    setSolutions: scenarioAwareOps.solution.set,

    // Skills Management
    skills: currentData.skills,
    setSkills: skillsContext.setSkills,
    personSkills: currentData.personSkills,
    setPersonSkills: skillsContext.setPersonSkills,
    addSkill: skillsContext.addSkill,
    updateSkill: skillsContext.updateSkill,
    deleteSkill: skillsContext.deleteSkill,
    addPersonSkill: skillsContext.addPersonSkill,
    updatePersonSkill: skillsContext.updatePersonSkill,
    deletePersonSkill: skillsContext.deletePersonSkill,
    getPersonSkills: skillsContext.getPersonSkills,

    // Computed properties
    milestones,
    isDataLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Higher-order component that conditionally uses ScenarioContext
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <AppProviderInternal>{children}</AppProviderInternal>;
};

// Scenario-aware wrapper that should be used when scenarios are needed
export const ScenarioAwareAppProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const scenarioContext = useScenarios();

  return (
    <ScenarioContextBridge.Provider value={scenarioContext}>
      <AppProviderInternal>{children}</AppProviderInternal>
    </ScenarioContextBridge.Provider>
  );
};
