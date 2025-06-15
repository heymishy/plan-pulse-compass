
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useEncryptedLocalStorage, useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Person, Role, Team, Project, Allocation, Cycle, AppConfig, Division, Epic, RunWorkCategory,
  ActualAllocation, IterationReview, IterationSnapshot, Skill, PersonSkill
} from '@/types';

interface AppContextType {
  // Data
  people: Person[];
  setPeople: (people: Person[] | ((prev: Person[]) => Person[])) => void;
  roles: Role[];
  setRoles: (roles: Role[] | ((prev: Role[]) => Role[])) => void;
  teams: Team[];
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
  divisions: Division[];
  setDivisions: (divisions: Division[] | ((prev: Division[]) => Division[])) => void;
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  epics: Epic[];
  setEpics: (epics: Epic[] | ((prev: Epic[]) => Epic[])) => void;
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
  
  // Setup state
  isSetupComplete: boolean;
  setIsSetupComplete: (complete: boolean) => void;
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
  const [people, setPeople] = useEncryptedLocalStorage<Person[]>('planning-people', []);
  const [projects, setProjects] = useEncryptedLocalStorage<Project[]>('planning-projects', []);
  
  // Non-sensitive configuration data
  const [roles, setRoles] = useLocalStorage<Role[]>('planning-roles', []);
  const [teams, setTeams] = useLocalStorage<Team[]>('planning-teams', []);
  const [divisions, setDivisions] = useLocalStorage<Division[]>('planning-divisions', []);
  const [epics, setEpics] = useLocalStorage<Epic[]>('planning-epics', []);
  const [allocations, setAllocations] = useLocalStorage<Allocation[]>('planning-allocations', []);
  const [cycles, setCycles] = useLocalStorage<Cycle[]>('planning-cycles', []);
  const [runWorkCategories, setRunWorkCategories] = useLocalStorage<RunWorkCategory[]>('planning-run-categories', []);
  const [config, setConfig] = useLocalStorage<AppConfig | null>('planning-config', null);
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>('planning-setup-complete', false);

  // Skills data
  const [skills, setSkills] = useLocalStorage<Skill[]>('planning-skills', []);
  const [personSkills, setPersonSkills] = useLocalStorage<PersonSkill[]>('planning-person-skills', []);

  // Tracking data
  const [actualAllocations, setActualAllocations] = useLocalStorage<ActualAllocation[]>('planning-actual-allocations', []);
  const [iterationReviews, setIterationReviews] = useLocalStorage<IterationReview[]>('planning-iteration-reviews', []);
  const [iterationSnapshots, setIterationSnapshots] = useLocalStorage<IterationSnapshot[]>('planning-iteration-snapshots', []);

  // Debug logging for context state changes
  useEffect(() => {
    console.log('AppProvider: Context state updated:', {
      peopleCount: people.length,
      projectsCount: projects.length,
      rolesCount: roles.length,
      teamsCount: teams.length,
      divisionsCount: divisions.length,
      epicsCount: epics.length,
      allocationsCount: allocations.length,
      cyclesCount: cycles.length,
      runWorkCategoriesCount: runWorkCategories.length,
      skillsCount: skills.length,
      personSkillsCount: personSkills.length,
      actualAllocationsCount: actualAllocations.length,
      iterationReviewsCount: iterationReviews.length,
      iterationSnapshotsCount: iterationSnapshots.length,
      hasConfig: !!config,
      isSetupComplete,
    });
  }, [people, projects, roles, teams, divisions, epics, allocations, cycles, runWorkCategories, skills, personSkills, actualAllocations, iterationReviews, iterationSnapshots, config, isSetupComplete]);

  const value: AppContextType = {
    people, setPeople,
    roles, setRoles,
    teams, setTeams,
    divisions, setDivisions,
    projects, setProjects,
    epics, setEpics,
    allocations, setAllocations,
    cycles, setCycles,
    runWorkCategories, setRunWorkCategories,
    skills, setSkills,
    personSkills, setPersonSkills,
    actualAllocations, setActualAllocations,
    iterationReviews, setIterationReviews,
    iterationSnapshots, setIterationSnapshots,
    config, setConfig,
    isSetupComplete, setIsSetupComplete,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
