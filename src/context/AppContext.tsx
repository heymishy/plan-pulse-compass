
import React, { createContext, useContext, ReactNode } from 'react';
import { useEncryptedLocalStorage, useLocalStorage } from '@/hooks/useLocalStorage';
import { Person, Role, Team, Project, Allocation, Cycle, AppConfig, Division, Epic, RunWorkCategory } from '@/types';

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
    config, setConfig,
    isSetupComplete, setIsSetupComplete,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
