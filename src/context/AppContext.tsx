import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useEncryptedLocalStorage, useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Person, Role, Team, Project, Allocation, Cycle, AppConfig, Division, Epic, RunWorkCategory,
  ActualAllocation, IterationReview, IterationSnapshot, Skill, PersonSkill, Release,
  Solution, ProjectSkill, ProjectSolution
} from '@/types';

interface AppContextType {
  // Data
  people: Person[];
  setPeople: (people: Person[] | ((prev: Person[]) => Person[])) => void;
  addPerson: (personData: Omit<Person, 'id'>) => void;
  updatePerson: (personId: string, personData: Partial<Person>) => void;
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  divisions: Division[];
  setDivisions: (divisions: Division[] | ((prev: Division[]) => Division[])) => void;
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  updateProject: (projectId: string, updatedProject: Project) => void;
  epics: Epic[];
  setEpics: (epics: Epic[] | ((prev: Epic[]) => Epic[])) => void;
  releases: Release[];
  setReleases: (releases: Release[] | ((prev: Release[]) => Release[])) => void;
  allocations: Allocation[];
  setAllocations: (allocations: Allocation[] | ((prev: Allocation[]) => Allocation[])) => void;
  cycles: Cycle[];
  setCycles: (cycles: Cycle[] | ((prev: Cycle[]) => Cycle[])) => void;
  runWorkCategories: RunWorkCategory[];
  setRunWorkCategories: (categories: RunWorkCategory[] | ((prev: RunWorkCategory[]) => RunWorkCategory[])) => void;
  
  // Skills data
  skills: Skill[];
  setSkills: (skills: Skill[] | ((prev: Skill[]) => Skill[])) => void;
  personSkills: PersonSkill[];
  setPersonSkills: (personSkills: PersonSkill[] | ((prev: PersonSkill[]) => PersonSkill[])) => void;
  
  // NEW: Solutions data
  solutions: Solution[];
  setSolutions: (solutions: Solution[] | ((prev: Solution[]) => Solution[])) => void;
  projectSkills: ProjectSkill[];
  setProjectSkills: (skills: ProjectSkill[] | ((prev: ProjectSkill[]) => ProjectSkill[])) => void;
  projectSolutions: ProjectSolution[];
  setProjectSolutions: (solutions: ProjectSolution[] | ((prev: ProjectSolution[]) => ProjectSolution[])) => void;
  
  // Tracking data
  actualAllocations: ActualAllocation[];
  setActualAllocations: (allocations: ActualAllocation[] | ((prev: ActualAllocation[]) => ActualAllocation[])) => void;
  iterationReviews: IterationReview[];
  setIterationReviews: (reviews: IterationReview[] | ((prev: IterationReview[]) => IterationReview[])) => void;
  iterationSnapshots: IterationSnapshot[];
  setIterationSnapshots: (snapshots: IterationSnapshot[] | ((prev: IterationSnapshot[]) => IterationSnapshot[])) => void;
  
  // Config
  config: AppConfig | null;
  setConfig: (config: AppConfig | null | ((prev: AppConfig | null) => AppConfig | null)) => void;
  
  // Setup and loading state
  isSetupComplete: boolean;
  setIsSetupComplete: (complete: boolean) => void;
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('AppProvider: Initializing context...');

  // Encrypted sensitive data
  const [people, setPeople, isPeopleLoading] = useEncryptedLocalStorage<Person[]>('planning-people', []);
  const [projects, setProjects, isProjectsLoading] = useEncryptedLocalStorage<Project[]>('planning-projects', []);
  
  // Non-sensitive configuration data
  const [roles, setRoles] = useLocalStorage<Role[]>('planning-roles', []);
  const [teams, setTeams] = useLocalStorage<Team[]>('planning-teams', []);
  const [divisions, setDivisions] = useLocalStorage<Division[]>('planning-divisions', []);
  const [epics, setEpics] = useLocalStorage<Epic[]>('planning-epics', []);
  const [releases, setReleases] = useLocalStorage<Release[]>('planning-releases', []);
  const [allocations, setAllocations] = useLocalStorage<Allocation[]>('planning-allocations', []);
  const [cycles, setCycles] = useLocalStorage<Cycle[]>('planning-cycles', []);
  const [runWorkCategories, setRunWorkCategories] = useLocalStorage<RunWorkCategory[]>('planning-run-categories', []);
  const [config, setConfig] = useLocalStorage<AppConfig | null>('planning-config', null);
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>('planning-setup-complete', false);

  // Skills data
  const [skills, setSkills] = useLocalStorage<Skill[]>('planning-skills', []);
  const [personSkills, setPersonSkills] = useLocalStorage<PersonSkill[]>('planning-person-skills', []);

  // NEW: Solutions data
  const [solutions, setSolutions] = useLocalStorage<Solution[]>('planning-solutions', []);
  const [projectSkills, setProjectSkills] = useLocalStorage<ProjectSkill[]>('planning-project-skills', []);
  const [projectSolutions, setProjectSolutions] = useLocalStorage<ProjectSolution[]>('planning-project-solutions', []);

  // Tracking data
  const [actualAllocations, setActualAllocations] = useLocalStorage<ActualAllocation[]>('planning-actual-allocations', []);
  const [iterationReviews, setIterationReviews] = useLocalStorage<IterationReview[]>('planning-iteration-reviews', []);
  const [iterationSnapshots, setIterationSnapshots] = useLocalStorage<IterationSnapshot[]>('planning-iteration-snapshots', []);

  const addPerson = (personData: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...personData,
      id: Date.now().toString(), // Simple ID generation
    };
    setPeople(prevPeople => [...prevPeople, newPerson]);
  };

  const updatePerson = (personId: string, personData: Partial<Person>) => {
    setPeople(prevPeople => 
      prevPeople.map(person => 
        person.id === personId ? { ...person, ...personData } : person
      )
    );
  };

  const updateProject = (projectId: string, updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === projectId ? updatedProject : p)
    );
  };

  const isDataLoading = isPeopleLoading || isProjectsLoading;

  // Debug logging for context state changes
  useEffect(() => {
    if (!isDataLoading) {
      console.log('AppProvider: Context state updated:', {
        peopleCount: people.length,
        projectsCount: projects.length,
        rolesCount: roles.length,
        teamsCount: teams.length,
        divisionsCount: divisions.length,
        epicsCount: epics.length,
        releasesCount: releases.length,
        allocationsCount: allocations.length,
        cyclesCount: cycles.length,
        runWorkCategoriesCount: runWorkCategories.length,
        skillsCount: skills.length,
        personSkillsCount: personSkills.length,
        solutionsCount: solutions.length,
        projectSkillsCount: projectSkills.length,
        projectSolutionsCount: projectSolutions.length,
        actualAllocationsCount: actualAllocations.length,
        iterationReviewsCount: iterationReviews.length,
        iterationSnapshotsCount: iterationSnapshots.length,
        hasConfig: !!config,
        isSetupComplete,
      });
    }
  }, [people, projects, roles, teams, divisions, epics, releases, allocations, cycles, runWorkCategories, skills, personSkills, solutions, projectSkills, projectSolutions, actualAllocations, iterationReviews, iterationSnapshots, config, isSetupComplete, isDataLoading]);

  const value: AppContextType = {
    people, setPeople, addPerson, updatePerson,
    roles, setRoles,
    teams, setTeams,
    divisions, setDivisions,
    projects, setProjects,
    updateProject,
    epics, setEpics,
    releases, setReleases,
    allocations, setAllocations,
    cycles, setCycles,
    runWorkCategories, setRunWorkCategories,
    skills, setSkills,
    personSkills, setPersonSkills,
    solutions, setSolutions,
    projectSkills, setProjectSkills,
    projectSolutions, setProjectSolutions,
    actualAllocations, setActualAllocations,
    iterationReviews, setIterationReviews,
    iterationSnapshots, setIterationSnapshots,
    config, setConfig,
    isSetupComplete, setIsSetupComplete,
    isDataLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
