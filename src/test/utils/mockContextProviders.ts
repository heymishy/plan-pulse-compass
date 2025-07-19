/**
 * Standardized Context Mocking Utilities
 *
 * This file provides consistent mock implementations for all context providers
 * to prevent test interference and ensure proper isolation between test files.
 */

import { vi } from 'vitest';
import type {
  Team,
  Person,
  Epic,
  Project,
  Cycle,
  Division,
  Role,
  Allocation,
  RunWorkCategory,
  Skill,
  TeamMember,
} from '@/types';

// Default mock data that can be reused across tests
export const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team1',
  name: 'Test Team',
  description: 'Test team description',
  type: 'permanent',
  status: 'active',
  divisionId: 'div1',
  capacity: 100,
  productOwnerId: 'person1',
  targetSkills: ['React'],
  projectIds: ['project1'],
  duration: { start: '2024-01-01', end: '2024-12-31' },
  ...overrides,
});

export const createMockPerson = (overrides: Partial<Person> = {}): Person => ({
  id: 'person1',
  name: 'Test Person',
  email: 'test@example.com',
  roleId: 'role1',
  skills: [],
  ...overrides,
});

export const createMockProject = (
  overrides: Partial<Project> = {}
): Project => ({
  id: 'project1',
  name: 'Test Project',
  description: 'Test project description',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'active',
  budget: 100000,
  milestones: [],
  ...overrides,
});

export const createMockEpic = (overrides: Partial<Epic> = {}): Epic => ({
  id: 'epic1',
  name: 'Test Epic',
  projectId: 'project1',
  description: 'Test epic description',
  status: 'active',
  points: 21,
  ...overrides,
});

export const createMockCycle = (overrides: Partial<Cycle> = {}): Cycle => ({
  id: 'cycle1',
  name: 'Q1 2024',
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  type: 'quarter',
  status: 'planning',
  ...overrides,
});

export const createMockDivision = (
  overrides: Partial<Division> = {}
): Division => ({
  id: 'div1',
  name: 'Engineering',
  description: 'Engineering Division',
  ...overrides,
});

export const createMockRole = (overrides: Partial<Role> = {}): Role => ({
  id: 'role1',
  name: 'Developer',
  baseSalary: 100000,
  ...overrides,
});

export const createMockAllocation = (
  overrides: Partial<Allocation> = {}
): Allocation => ({
  id: 'allocation1',
  teamId: 'team1',
  epicId: 'epic1',
  cycleId: 'cycle1',
  allocation: 50,
  ...overrides,
});

export const createMockRunWorkCategory = (
  overrides: Partial<RunWorkCategory> = {}
): RunWorkCategory => ({
  id: 'category1',
  name: 'Development',
  description: 'Development work',
  color: '#3b82f6',
  ...overrides,
});

export const createMockSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 'skill1',
  name: 'React',
  category: 'Frontend',
  ...overrides,
});

export const createMockTeamMember = (
  overrides: Partial<TeamMember> = {}
): TeamMember => ({
  id: 'member1',
  teamId: 'team1',
  personId: 'person1',
  role: 'developer',
  allocation: 100,
  ...overrides,
});

// Standardized App Context Mock
export const createMockAppData = (overrides: any = {}) => ({
  // Data arrays
  teams: [createMockTeam()],
  people: [createMockPerson()],
  projects: [createMockProject()],
  epics: [createMockEpic()],
  cycles: [createMockCycle()],
  divisions: [createMockDivision()],
  roles: [createMockRole()],
  allocations: [createMockAllocation()],
  runWorkCategories: [createMockRunWorkCategory()],
  skills: [createMockSkill()],
  teamMembers: [createMockTeamMember()],

  // State flags
  isSetupComplete: true,
  isDataLoading: false,

  // Action functions
  addTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  setTeams: vi.fn(),
  setPeople: vi.fn(),
  setProjects: vi.fn(),
  setEpics: vi.fn(),
  setCycles: vi.fn(),
  setDivisions: vi.fn(),
  setRoles: vi.fn(),
  setAllocations: vi.fn(),
  setRunWorkCategories: vi.fn(),
  setSkills: vi.fn(),
  setTeamMembers: vi.fn(),

  // Utility functions
  getTeamMembers: vi.fn(() => [createMockTeamMember()]),

  ...overrides,
});

// Standardized Theme Context Mock
export const createMockThemeData = (overrides: any = {}) => ({
  theme: 'light' as const,
  setTheme: vi.fn(),
  resolvedTheme: 'light' as const,
  themes: [],
  isSystemTheme: false,
  ...overrides,
});

// Standardized Settings Context Mock
export const createMockSettingsData = (overrides: any = {}) => ({
  isSetupComplete: true,
  config: {},
  setConfig: vi.fn(),
  ...overrides,
});

// Standardized Teams Context Mock
export const createMockTeamsData = (overrides: any = {}) => ({
  teams: [createMockTeam()],
  people: [createMockPerson()],
  divisions: [createMockDivision()],
  setTeams: vi.fn(),
  setPeople: vi.fn(),
  setDivisions: vi.fn(),
  ...overrides,
});

// Standardized Toast Mock
export const createMockToastData = (overrides: any = {}) => ({
  toast: vi.fn(),
  ...overrides,
});

/**
 * Reset all context mocks to clean state
 * Call this in beforeEach to ensure clean mock state between tests
 */
export const resetAllContextMocks = () => {
  // Clear all mock function calls
  vi.clearAllMocks();

  // Reset modules to ensure clean imports
  vi.resetModules();
};

/**
 * Create standardized context mock setup for tests
 * Use this function to set up consistent mocks across test files
 */
export const setupStandardContextMocks = (
  customOverrides: {
    appData?: any;
    themeData?: any;
    settingsData?: any;
    teamsData?: any;
    toastData?: any;
  } = {}
) => {
  const mockAppData = createMockAppData(customOverrides.appData);
  const mockThemeData = createMockThemeData(customOverrides.themeData);
  const mockSettingsData = createMockSettingsData(customOverrides.settingsData);
  const mockTeamsData = createMockTeamsData(customOverrides.teamsData);
  const mockToastData = createMockToastData(customOverrides.toastData);

  // Store mock functions for later access
  const mockAppHook = vi.fn(() => mockAppData);
  const mockThemeHook = vi.fn(() => mockThemeData);
  const mockSettingsHook = vi.fn(() => mockSettingsData);
  const mockTeamsHook = vi.fn(() => mockTeamsData);
  const mockToastHook = vi.fn(() => mockToastData);

  // Mock all context providers
  vi.mock('@/context/AppContext', () => ({
    AppProvider: ({ children }: { children: React.ReactNode }) => children,
    useApp: mockAppHook,
  }));

  vi.mock('@/context/ThemeContext', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: mockThemeHook,
  }));

  vi.mock('@/context/SettingsContext', () => ({
    SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
    useSettings: mockSettingsHook,
  }));

  vi.mock('@/context/TeamContext', () => ({
    TeamProvider: ({ children }: { children: React.ReactNode }) => children,
    useTeams: mockTeamsHook,
  }));

  vi.mock('@/context/ProjectContext', () => ({
    ProjectProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  vi.mock('@/context/PlanningContext', () => ({
    PlanningProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  vi.mock('@/context/GoalContext', () => ({
    GoalProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  vi.mock('@/hooks/use-toast', () => ({
    useToast: mockToastHook,
  }));

  return {
    mockAppData,
    mockThemeData,
    mockSettingsData,
    mockTeamsData,
    mockToastData,
    // Also return the mock functions for direct access
    mockAppHook,
    mockThemeHook,
    mockSettingsHook,
    mockTeamsHook,
    mockToastHook,
  };
};
