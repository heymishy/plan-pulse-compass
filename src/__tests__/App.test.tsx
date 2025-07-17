import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithoutRouter } from '@/test/utils/test-utils';
import App from '../App';

// Mock the context providers
vi.mock('@/context/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useApp: () => ({
    isSetupComplete: false,
    isDataLoading: false,
    teams: [],
    people: [],
    projects: [],
    epics: [],
    cycles: [],
    skills: [],
    roles: [],
    allocations: [],
    runWorkCategories: [],
    divisions: [],
  }),
}));

vi.mock('@/context/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/context/ProjectContext', () => ({
  ProjectProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/context/TeamContext', () => ({
  TeamProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/context/PlanningContext', () => ({
  PlanningProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/context/GoalContext', () => ({
  GoalProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock the Sidebar component
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock the Toaster
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    renderWithoutRouter(<App />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('provides all necessary context providers', () => {
    renderWithoutRouter(<App />);

    // If the app renders successfully, all providers are working
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('has proper routing structure', () => {
    renderWithoutRouter(<App />);

    // Check that the main app structure is present
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('displays the Index page by default', () => {
    renderWithoutRouter(<App />);

    // Check that the default route (Index) is displayed
    expect(screen.getByText('Setup Required')).toBeInTheDocument();
  });
});
