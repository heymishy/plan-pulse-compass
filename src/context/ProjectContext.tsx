import React, { createContext, useContext, ReactNode } from 'react';
import {
  useEncryptedLocalStorage,
  useLocalStorage,
} from '@/hooks/useLocalStorage';
import {
  Project,
  Epic,
  Release,
  Solution,
  ProjectSkill,
  ProjectSolution,
} from '@/types';

interface ProjectContextType {
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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useEncryptedLocalStorage<Project[]>(
    'planning-projects',
    []
  );
  const [epics, setEpics] = useLocalStorage<Epic[]>('planning-epics', []);
  const [releases, setReleases] = useLocalStorage<Release[]>(
    'planning-releases',
    []
  );
  const [solutions, setSolutions] = useLocalStorage<Solution[]>(
    'planning-solutions',
    []
  );
  const [projectSkills, setProjectSkills] = useLocalStorage<ProjectSkill[]>(
    'planning-project-skills',
    []
  );
  const [projectSolutions, setProjectSolutions] = useLocalStorage<
    ProjectSolution[]
  >('planning-project-solutions', []);

  const updateProject = (projectId: string, updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === projectId ? updatedProject : p))
    );
  };

  const value: ProjectContextType = {
    projects,
    setProjects,
    updateProject,
    epics,
    setEpics,
    releases,
    setReleases,
    solutions,
    setSolutions,
    projectSkills,
    setProjectSkills,
    projectSolutions,
    setProjectSolutions,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
