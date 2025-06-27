import { vi } from 'vitest';
import { testData } from '../data/testData';
import {
  Division,
  Team,
  Person,
  Role,
  Cycle,
  RunWorkCategory,
  Skill,
  PersonSkill,
  Solution,
  AppConfig,
} from '../../types';

// Import custom test interfaces
interface TestProject {
  id: string;
  name: string;
  description: string;
  teamId: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  budget: number;
}

interface TestWorkItem {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'feature' | 'bug' | 'task' | 'story';
  estimatedHours: number;
  actualHours: number;
}

/**
 * Test data loader utility for CI and unit testing
 * Provides consistent test data across all test runs
 */

export interface TestDataLoaderOptions {
  loadDivisions?: boolean;
  loadTeams?: boolean;
  loadPeople?: boolean;
  loadRoles?: boolean;
  loadCycles?: boolean;
  loadRunWorkCategories?: boolean;
  loadSkills?: boolean;
  loadPersonSkills?: boolean;
  loadSolutions?: boolean;
  loadProjects?: boolean;
  loadWorkItems?: boolean;
  loadConfig?: boolean;
}

export interface TestDataResult {
  divisions: Division[];
  teams: Team[];
  people: Person[];
  roles: Role[];
  cycles: Cycle[];
  runWorkCategories: RunWorkCategory[];
  skills: Skill[];
  personSkills: PersonSkill[];
  solutions: Solution[];
  projects: TestProject[];
  workItems: TestWorkItem[];
  config: AppConfig;
}

/**
 * Load test data with specified options
 */
export const loadTestData = (
  options: TestDataLoaderOptions = {}
): TestDataResult => {
  const {
    loadDivisions = true,
    loadTeams = true,
    loadPeople = true,
    loadRoles = true,
    loadCycles = true,
    loadRunWorkCategories = true,
    loadSkills = true,
    loadPersonSkills = true,
    loadSolutions = true,
    loadProjects = true,
    loadWorkItems = true,
    loadConfig = true,
  } = options;

  return {
    divisions: loadDivisions ? [...testData.divisions] : [],
    teams: loadTeams ? [...testData.teams] : [],
    people: loadPeople ? [...testData.people] : [],
    roles: loadRoles ? [...testData.roles] : [],
    cycles: loadCycles ? [...testData.cycles] : [],
    runWorkCategories: loadRunWorkCategories
      ? [...testData.runWorkCategories]
      : [],
    skills: loadSkills ? [...testData.skills] : [],
    personSkills: loadPersonSkills ? [...testData.personSkills] : [],
    solutions: loadSolutions ? [...testData.solutions] : [],
    projects: loadProjects ? [...testData.projects] : [],
    workItems: loadWorkItems ? [...testData.workItems] : [],
    config: loadConfig ? { ...testData.config } : ({} as AppConfig),
  };
};

/**
 * Load minimal test data for basic tests
 */
export const loadMinimalTestData = (): TestDataResult => {
  return loadTestData({
    loadDivisions: true,
    loadTeams: true,
    loadPeople: false,
    loadRoles: true,
    loadCycles: false,
    loadRunWorkCategories: false,
    loadSkills: false,
    loadPersonSkills: false,
    loadSolutions: false,
    loadProjects: false,
    loadWorkItems: false,
    loadConfig: false,
  });
};

/**
 * Load people-focused test data
 */
export const loadPeopleTestData = (): TestDataResult => {
  return loadTestData({
    loadDivisions: true,
    loadTeams: true,
    loadPeople: true,
    loadRoles: true,
    loadCycles: false,
    loadRunWorkCategories: false,
    loadSkills: true,
    loadPersonSkills: true,
    loadSolutions: false,
    loadProjects: false,
    loadWorkItems: false,
    loadConfig: false,
  });
};

/**
 * Load full test data for comprehensive tests
 */
export const loadFullTestData = (): TestDataResult => {
  return loadTestData({
    loadDivisions: true,
    loadTeams: true,
    loadPeople: true,
    loadRoles: true,
    loadCycles: true,
    loadRunWorkCategories: true,
    loadSkills: true,
    loadPersonSkills: true,
    loadSolutions: true,
    loadProjects: true,
    loadWorkItems: true,
    loadConfig: true,
  });
};

/**
 * Mock context setter functions for testing
 */
export const createMockContextSetters = () => {
  const mockSetters = {
    setDivisions: vi.fn(),
    setTeams: vi.fn(),
    setPeople: vi.fn(),
    setRoles: vi.fn(),
    setCycles: vi.fn(),
    setRunWorkCategories: vi.fn(),
    setSkills: vi.fn(),
    setPersonSkills: vi.fn(),
    setSolutions: vi.fn(),
    setProjects: vi.fn(),
    setWorkItems: vi.fn(),
    setConfig: vi.fn(),
    setIsSetupComplete: vi.fn(),
  };

  return mockSetters;
};

/**
 * Apply test data to mock context setters
 */
export const applyTestDataToContext = (
  testData: TestDataResult,
  mockSetters: ReturnType<typeof createMockContextSetters>
) => {
  if (testData.divisions.length > 0) {
    mockSetters.setDivisions(testData.divisions);
  }
  if (testData.teams.length > 0) {
    mockSetters.setTeams(testData.teams);
  }
  if (testData.people.length > 0) {
    mockSetters.setPeople(testData.people);
  }
  if (testData.roles.length > 0) {
    mockSetters.setRoles(testData.roles);
  }
  if (testData.cycles.length > 0) {
    mockSetters.setCycles(testData.cycles);
  }
  if (testData.runWorkCategories.length > 0) {
    mockSetters.setRunWorkCategories(testData.runWorkCategories);
  }
  if (testData.skills.length > 0) {
    mockSetters.setSkills(testData.skills);
  }
  if (testData.personSkills.length > 0) {
    mockSetters.setPersonSkills(testData.personSkills);
  }
  if (testData.solutions.length > 0) {
    mockSetters.setSolutions(testData.solutions);
  }
  if (testData.projects.length > 0) {
    mockSetters.setProjects(testData.projects);
  }
  if (testData.workItems.length > 0) {
    mockSetters.setWorkItems(testData.workItems);
  }
  if (testData.config) {
    mockSetters.setConfig(testData.config);
  }

  mockSetters.setIsSetupComplete(true);
};

/**
 * Validate test data consistency
 */
export const validateTestData = (
  data: TestDataResult
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for required relationships
  if (data.teams.length > 0 && data.divisions.length === 0) {
    errors.push('Teams exist but no divisions loaded');
  }

  if (data.people.length > 0 && data.teams.length === 0) {
    errors.push('People exist but no teams loaded');
  }

  if (data.people.length > 0 && data.roles.length === 0) {
    errors.push('People exist but no roles loaded');
  }

  // Check team-division relationships
  data.teams.forEach(team => {
    if (!data.divisions.find(div => div.id === team.divisionId)) {
      errors.push(
        `Team ${team.name} references non-existent division ${team.divisionId}`
      );
    }
  });

  // Check person-team relationships
  data.people.forEach(person => {
    if (!data.teams.find(team => team.id === person.teamId)) {
      errors.push(
        `Person ${person.name} references non-existent team ${person.teamId}`
      );
    }
    if (!data.roles.find(role => role.id === person.roleId)) {
      errors.push(
        `Person ${person.name} references non-existent role ${person.roleId}`
      );
    }
  });

  // Check person-skill relationships
  data.personSkills.forEach(personSkill => {
    if (!data.people.find(person => person.id === personSkill.personId)) {
      errors.push(
        `PersonSkill references non-existent person ${personSkill.personId}`
      );
    }
    if (!data.skills.find(skill => skill.id === personSkill.skillId)) {
      errors.push(
        `PersonSkill references non-existent skill ${personSkill.skillId}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get test data summary
 */
export const getTestDataSummary = (data: TestDataResult) => {
  return {
    divisions: data.divisions.length,
    teams: data.teams.length,
    people: data.people.length,
    roles: data.roles.length,
    cycles: data.cycles.length,
    runWorkCategories: data.runWorkCategories.length,
    skills: data.skills.length,
    personSkills: data.personSkills.length,
    solutions: data.solutions.length,
    projects: data.projects.length,
    workItems: data.workItems.length,
  };
};

/**
 * Create a test data fixture for specific test scenarios
 */
export const createTestFixture = (
  scenario: 'minimal' | 'people' | 'full'
): TestDataResult => {
  switch (scenario) {
    case 'minimal':
      return loadMinimalTestData();
    case 'people':
      return loadPeopleTestData();
    case 'full':
      return loadFullTestData();
    default:
      return loadMinimalTestData();
  }
};
