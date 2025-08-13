import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { useApp } from './AppContext';
import { Person, Team, Project, Skill, Role } from '@/types';

// Separate contexts for different data types to prevent unnecessary re-renders
interface PeopleContextType {
  people: Person[];
  addPerson: (person: Omit<Person, 'id'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
}

interface TeamsContextType {
  teams: Team[];
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
}

interface ProjectsContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

interface SkillsContextType {
  skills: Skill[];
  roles: Role[];
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
}

// Create separate contexts
const PeopleContext = createContext<PeopleContextType | null>(null);
const TeamsContext = createContext<TeamsContextType | null>(null);
const ProjectsContext = createContext<ProjectsContextType | null>(null);
const SkillsContext = createContext<SkillsContextType | null>(null);

// Memoized provider components
const PeopleProvider = React.memo<{ children: ReactNode }>(({ children }) => {
  const { people, addPerson, updatePerson, setPeople } = useApp();

  const deletePerson = useCallback(
    (id: string) => {
      setPeople(prev => prev.filter(p => p.id !== id));
    },
    [setPeople]
  );

  const value = useMemo(
    () => ({
      people,
      addPerson,
      updatePerson,
      deletePerson,
    }),
    [people, addPerson, updatePerson, deletePerson]
  );

  return (
    <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>
  );
});

const TeamsProvider = React.memo<{ children: ReactNode }>(({ children }) => {
  const { teams, setTeams } = useApp();

  const addTeam = useCallback(
    (team: Omit<Team, 'id'>) => {
      const newTeam = {
        ...team,
        id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      } as Team;

      setTeams(prev => [...prev, newTeam]);
    },
    [setTeams]
  );

  const updateTeam = useCallback(
    (id: string, updates: Partial<Team>) => {
      setTeams(prev =>
        prev.map(team =>
          team.id === id
            ? { ...team, ...updates, lastModified: new Date().toISOString() }
            : team
        )
      );
    },
    [setTeams]
  );

  const deleteTeam = useCallback(
    (id: string) => {
      setTeams(prev => prev.filter(t => t.id !== id));
    },
    [setTeams]
  );

  const value = useMemo(
    () => ({
      teams,
      addTeam,
      updateTeam,
      deleteTeam,
    }),
    [teams, addTeam, updateTeam, deleteTeam]
  );

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
});

const ProjectsProvider = React.memo<{ children: ReactNode }>(({ children }) => {
  const { projects, setProjects } = useApp();

  const addProject = useCallback(
    (project: Omit<Project, 'id'>) => {
      const newProject = {
        ...project,
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      } as Project;

      setProjects(prev => [...prev, newProject]);
    },
    [setProjects]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      setProjects(prev =>
        prev.map(project =>
          project.id === id
            ? { ...project, ...updates, lastModified: new Date().toISOString() }
            : project
        )
      );
    },
    [setProjects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
    },
    [setProjects]
  );

  const value = useMemo(
    () => ({
      projects,
      addProject,
      updateProject,
      deleteProject,
    }),
    [projects, addProject, updateProject, deleteProject]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
});

const SkillsProvider = React.memo<{ children: ReactNode }>(({ children }) => {
  const { skills, roles, setSkills } = useApp();

  const addSkill = useCallback(
    (skill: Omit<Skill, 'id'>) => {
      const newSkill = {
        ...skill,
        id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      } as Skill;

      setSkills(prev => [...prev, newSkill]);
    },
    [setSkills]
  );

  const updateSkill = useCallback(
    (id: string, updates: Partial<Skill>) => {
      setSkills(prev =>
        prev.map(skill => (skill.id === id ? { ...skill, ...updates } : skill))
      );
    },
    [setSkills]
  );

  const deleteSkill = useCallback(
    (id: string) => {
      setSkills(prev => prev.filter(s => s.id !== id));
    },
    [setSkills]
  );

  const value = useMemo(
    () => ({
      skills,
      roles,
      addSkill,
      updateSkill,
      deleteSkill,
    }),
    [skills, roles, addSkill, updateSkill, deleteSkill]
  );

  return (
    <SkillsContext.Provider value={value}>{children}</SkillsContext.Provider>
  );
});

// Combined provider
export const OptimizedAppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <PeopleProvider>
      <TeamsProvider>
        <ProjectsProvider>
          <SkillsProvider>{children}</SkillsProvider>
        </ProjectsProvider>
      </TeamsProvider>
    </PeopleProvider>
  );
};

// Custom hooks for each context
export const usePeople = (): PeopleContextType => {
  const context = useContext(PeopleContext);
  if (!context) {
    throw new Error('usePeople must be used within OptimizedAppProvider');
  }
  return context;
};

export const useTeams = (): TeamsContextType => {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within OptimizedAppProvider');
  }
  return context;
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within OptimizedAppProvider');
  }
  return context;
};

export const useSkills = (): SkillsContextType => {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error('useSkills must be used within OptimizedAppProvider');
  }
  return context;
};

PeopleProvider.displayName = 'PeopleProvider';
TeamsProvider.displayName = 'TeamsProvider';
ProjectsProvider.displayName = 'ProjectsProvider';
SkillsProvider.displayName = 'SkillsProvider';
