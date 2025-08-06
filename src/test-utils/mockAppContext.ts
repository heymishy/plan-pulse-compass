/**
 * Mock AppContext for testing
 * Provides minimal mock implementation of AppContextType
 */

import { vi } from 'vitest';
import type { AppContextType } from '@/context/AppContext';
import type {
  Person,
  Team,
  Project,
  Solution,
  Skill,
  PersonSkill,
  ProjectSkill,
  ProjectSolution,
  Division,
  Role,
  TeamMember,
  Allocation,
  Cycle,
  RunWorkCategory,
  ActualAllocation,
  IterationReview,
  IterationSnapshot,
  Epic,
  Release,
  UnmappedPerson,
  Milestone,
  DivisionLeadershipRole,
  AppConfig,
} from '@/types';
import {
  Goal,
  NorthStar,
  GoalEpic,
  GoalMilestone,
  GoalTeam,
} from '@/types/goalTypes';

export const mockAppContext: AppContextType = {
  // Teams Context
  people: [],
  setPeople: vi.fn(),
  addPerson: vi.fn().mockResolvedValue({} as Person),
  updatePerson: vi.fn().mockResolvedValue(undefined),
  deletePerson: vi.fn().mockResolvedValue(undefined),
  roles: [],
  setRoles: vi.fn(),
  teams: [],
  setTeams: vi.fn(),
  addTeam: vi.fn().mockResolvedValue({} as Team),
  updateTeam: vi.fn().mockResolvedValue(undefined),
  deleteTeam: vi.fn().mockResolvedValue(undefined),
  teamMembers: [],
  setTeamMembers: vi.fn(),
  addTeamMember: vi.fn().mockReturnValue({} as TeamMember),
  updateTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamMembers: vi.fn().mockReturnValue([]),
  divisions: [],
  setDivisions: vi.fn(),
  unmappedPeople: [],
  setUnmappedPeople: vi.fn(),
  addUnmappedPerson: vi.fn(),
  removeUnmappedPerson: vi.fn(),

  // Projects Context
  projects: [],
  setProjects: vi.fn(),
  addProject: vi.fn().mockResolvedValue({} as Project),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  epics: [],
  setEpics: vi.fn(),
  releases: [],
  setReleases: vi.fn(),
  solutions: [],
  setSolutions: vi.fn(),
  projectSkills: [],
  setProjectSkills: vi.fn(),
  projectSolutions: [],
  setProjectSolutions: vi.fn(),

  // Planning Context
  allocations: [],
  setAllocations: vi.fn(),
  addAllocation: vi.fn().mockResolvedValue({} as Allocation),
  updateAllocation: vi.fn().mockResolvedValue(undefined),
  deleteAllocation: vi.fn().mockResolvedValue(undefined),
  cycles: [],
  setCycles: vi.fn(),
  runWorkCategories: [],
  setRunWorkCategories: vi.fn(),
  actualAllocations: [],
  setActualAllocations: vi.fn(),
  iterationReviews: [],
  setIterationReviews: vi.fn(),
  iterationSnapshots: [],
  setIterationSnapshots: vi.fn(),
  milestones: [],
  setMilestones: vi.fn(),

  // Skills Management
  skills: [],
  setSkills: vi.fn(),
  personSkills: [],
  setPersonSkills: vi.fn(),

  // Settings Context
  appConfig: {} as AppConfig,
  setAppConfig: vi.fn(),

  // Goals Context
  goals: [],
  setGoals: vi.fn(),
  northStars: [],
  setNorthStars: vi.fn(),
  goalEpics: [],
  setGoalEpics: vi.fn(),
  goalMilestones: [],
  setGoalMilestones: vi.fn(),
  goalTeams: [],
  setGoalTeams: vi.fn(),

  // Division Leadership
  divisionLeadershipRoles: [],
  setDivisionLeadershipRoles: vi.fn(),

  // Scenario Operations
  createScenario: vi.fn().mockResolvedValue(''),
  updateScenario: vi.fn().mockResolvedValue(undefined),
  deleteScenario: vi.fn().mockResolvedValue(undefined),
  currentScenarioId: null,
  setCurrentScenarioId: vi.fn(),

  // Utility functions
  clearAllData: vi.fn(),
  exportData: vi.fn().mockReturnValue(''),
  importData: vi.fn().mockResolvedValue(undefined),
};
