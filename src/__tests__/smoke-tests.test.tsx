/**
 * Smoke Tests - Basic Page Rendering
 *
 * Simple smoke tests to ensure core pages can render without throwing errors.
 * These are lightweight tests focused on basic functionality rather than
 * complex integration testing.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all context providers to be lightweight
vi.mock('@/context/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
  useApp: () => ({
    teams: [],
    people: [],
    projects: [],
    epics: [],
    cycles: [],
    divisions: [],
    roles: [],
    allocations: [],
    runWorkCategories: [],
    skills: [],
    teamMembers: [],
    isSetupComplete: true,
    isDataLoading: false,
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
    getTeamMembers: vi.fn(() => []),
  }),
}));

vi.mock('@/context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

vi.mock('@/context/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useSettings: () => ({ isSetupComplete: true, config: {} }),
}));

vi.mock('@/context/TeamContext', () => ({
  TeamProvider: ({ children }: { children: React.ReactNode }) => children,
  useTeams: () => ({
    teams: [],
    people: [],
    divisions: [],
    setTeams: vi.fn(),
    setPeople: vi.fn(),
    setDivisions: vi.fn(),
  }),
}));

vi.mock('@/context/ProjectContext', () => ({
  ProjectProvider: ({ children }: { children: React.ReactNode }) => children,
  useProjects: () => ({
    projects: [],
    epics: [],
    setProjects: vi.fn(),
    setEpics: vi.fn(),
  }),
}));

vi.mock('@/context/PlanningContext', () => ({
  PlanningProvider: ({ children }: { children: React.ReactNode }) => children,
  usePlanning: () => ({
    allocations: [],
    cycles: [],
    setAllocations: vi.fn(),
    setCycles: vi.fn(),
  }),
}));

vi.mock('@/context/GoalContext', () => ({
  GoalProvider: ({ children }: { children: React.ReactNode }) => children,
  useGoals: () => ({
    goals: [],
    setGoals: vi.fn(),
  }),
}));

vi.mock('@/context/ScenarioContext', () => ({
  ScenarioProvider: ({ children }: { children: React.ReactNode }) => children,
  useScenarios: () => ({
    scenarios: [],
    templates: [],
    activeScenario: null,
    createScenario: vi.fn(),
    createScenarioFromTemplate: vi.fn(),
  }),
}));

// Import pages
import Dashboard from '../pages/Dashboard';
import Teams from '../pages/Teams';
import Projects from '../pages/Projects';
import Planning from '../pages/Planning';
import Settings from '../pages/Settings';

// Mock console.error to catch rendering errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Lightweight wrapper for testing individual pages
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Smoke Tests - Core Page Rendering', () => {
  it('Dashboard page renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('Teams page renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <Teams />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('Projects page renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <Projects />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('Planning page renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <Planning />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('Settings page renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});
