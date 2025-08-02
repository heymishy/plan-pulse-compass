import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectSolutionsSkillsSection from '../ProjectSolutionsSkillsSection';
import { SettingsProvider } from '@/context/SettingsContext';
import { TeamProvider } from '@/context/TeamContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { PlanningProvider } from '@/context/PlanningContext';
import { GoalProvider } from '@/context/GoalContext';
import { ScenarioProvider } from '@/context/ScenarioContext';
import { AppProvider } from '@/context/AppContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const AllProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <SettingsProvider>
    <TeamProvider>
      <ProjectProvider>
        <PlanningProvider>
          <GoalProvider>
            <ScenarioProvider>
              <AppProvider>{children}</AppProvider>
            </ScenarioProvider>
          </GoalProvider>
        </PlanningProvider>
      </ProjectProvider>
    </TeamProvider>
  </SettingsProvider>
);

describe('ProjectSolutionsSkillsSection - Basic', () => {
  const defaultProps = {
    projectId: 'proj1',
    projectSolutions: [],
    projectSkills: [],
    onSolutionsChange: vi.fn(),
    onSkillsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render without crashing', () => {
    render(
      <AllProviders>
        <ProjectSolutionsSkillsSection {...defaultProps} />
      </AllProviders>
    );

    // Check that tabs are rendered
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Team Analysis')).toBeInTheDocument();
  });

  it('should display empty state messages', () => {
    render(
      <AllProviders>
        <ProjectSolutionsSkillsSection {...defaultProps} />
      </AllProviders>
    );

    // Should show empty state for solutions
    expect(screen.getByText(/No solutions selected/)).toBeInTheDocument();
  });

  it('should allow switching between tabs', async () => {
    const user = userEvent.setup();
    render(
      <AllProviders>
        <ProjectSolutionsSkillsSection {...defaultProps} />
      </AllProviders>
    );

    // Switch to Skills tab
    await user.click(screen.getByText('Skills'));
    expect(screen.getByText(/No skills defined/)).toBeInTheDocument();

    // Switch to Team Analysis tab
    await user.click(screen.getByText('Team Analysis'));
    expect(
      screen.getByText('Team Skill Coverage Analysis')
    ).toBeInTheDocument();

    // Switch back to Solutions tab
    await user.click(screen.getByText('Solutions'));
    expect(screen.getByText(/No solutions selected/)).toBeInTheDocument();
  });

  it('should handle props correctly', () => {
    const mockOnSolutionsChange = vi.fn();
    const mockOnSkillsChange = vi.fn();

    render(
      <AllProviders>
        <ProjectSolutionsSkillsSection
          projectId="test-project"
          projectSolutions={[]}
          projectSkills={[]}
          onSolutionsChange={mockOnSolutionsChange}
          onSkillsChange={mockOnSkillsChange}
        />
      </AllProviders>
    );

    // Component should render without errors
    expect(screen.getByText('Solutions')).toBeInTheDocument();
  });
});
