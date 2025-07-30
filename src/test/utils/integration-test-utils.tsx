import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { TeamProvider } from '@/context/TeamContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { PlanningProvider } from '@/context/PlanningContext';
import { GoalProvider } from '@/context/GoalContext';
import { ScenarioProvider } from '@/context/ScenarioContext';
import { SafeScenarioAwareAppProvider } from '@/context/SafeScenarioAwareAppProvider';
import { vi } from 'vitest';

// Mock the Toaster component to avoid issues in tests
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Full wrapper with all providers for integration tests
const IntegrationProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <TeamProvider>
          <ProjectProvider>
            <PlanningProvider>
              <GoalProvider>
                <ScenarioProvider>
                  <SafeScenarioAwareAppProvider>
                    <BrowserRouter>{children}</BrowserRouter>
                  </SafeScenarioAwareAppProvider>
                </ScenarioProvider>
              </GoalProvider>
            </PlanningProvider>
          </ProjectProvider>
        </TeamProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

// Full render with AppProvider for integration tests
const integrationRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: IntegrationProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Export integration render
export { integrationRender as render };
