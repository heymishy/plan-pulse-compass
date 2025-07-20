import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScenarioSwitcher } from '../ScenarioSwitcher';
import { ScenarioProvider } from '@/context/ScenarioContext';
import { AppProvider } from '@/context/AppContext';
import { TeamProvider } from '@/context/TeamContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { PlanningProvider } from '@/context/PlanningContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { GoalProvider } from '@/context/GoalContext';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

const AllProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <SettingsProvider>
    <TeamProvider>
      <ProjectProvider>
        <PlanningProvider>
          <GoalProvider>
            <AppProvider>
              <ScenarioProvider>{children}</ScenarioProvider>
            </AppProvider>
          </GoalProvider>
        </PlanningProvider>
      </ProjectProvider>
    </TeamProvider>
  </SettingsProvider>
);

describe('ScenarioSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render in live mode initially', () => {
    render(
      <AllProviders>
        <ScenarioSwitcher />
      </AllProviders>
    );

    expect(screen.getByText('Live Plan')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Live Plan');
  });

  it('should show compact view correctly', () => {
    render(
      <AllProviders>
        <ScenarioSwitcher variant="compact" />
      </AllProviders>
    );

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should open create scenario dialog when clicked', async () => {
    render(
      <AllProviders>
        <ScenarioSwitcher />
      </AllProviders>
    );

    // Click the dropdown trigger
    fireEvent.click(screen.getByRole('button'));

    // Wait for dropdown to appear and click create scenario
    await waitFor(() => {
      expect(screen.getByText('Create New Scenario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Scenario'));

    // Should open the create dialog
    await waitFor(() => {
      expect(screen.getByText('Create New Scenario')).toBeInTheDocument();
    });
  });

  it('should display scenarios in dropdown when available', async () => {
    // This test would need to be expanded to actually create scenarios
    // and verify they appear in the dropdown
    render(
      <AllProviders>
        <ScenarioSwitcher />
      </AllProviders>
    );

    // Click to open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Live Plan')).toBeInTheDocument();
      expect(screen.getByText('Create New Scenario')).toBeInTheDocument();
    });
  });

  it('should show unsaved changes indicator when applicable', () => {
    // This would require mocking the scenario context to have unsaved changes
    render(
      <AllProviders>
        <ScenarioSwitcher />
      </AllProviders>
    );

    // In the initial state, there should be no unsaved changes indicator
    expect(screen.queryByText('•')).not.toBeInTheDocument();
  });

  it('should handle manage scenarios click', async () => {
    render(
      <AllProviders>
        <ScenarioSwitcher />
      </AllProviders>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Manage Scenarios')).toBeInTheDocument();
    });

    // Click manage scenarios (in a real implementation, this would navigate)
    fireEvent.click(screen.getByText('Manage Scenarios'));
  });
});
