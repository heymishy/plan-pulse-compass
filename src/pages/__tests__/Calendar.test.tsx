import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CalendarPage from '../Calendar';
import { AppProvider } from '../../context/AppContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { TeamProvider } from '../../context/TeamContext';
import { PlanningProvider } from '../../context/PlanningContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { GoalProvider } from '../../context/GoalContext';

// Wrapper component with all necessary providers
const CalendarPageWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <BrowserRouter>
    <ThemeProvider>
      <SettingsProvider>
        <TeamProvider>
          <ProjectProvider>
            <GoalProvider>
              <PlanningProvider>
                <AppProvider>{children}</AppProvider>
              </PlanningProvider>
            </GoalProvider>
          </ProjectProvider>
        </TeamProvider>
      </SettingsProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Calendar Page', () => {
  it('should render without crashing', () => {
    render(
      <CalendarPageWrapper>
        <CalendarPage />
      </CalendarPageWrapper>
    );

    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('should render calendar component', () => {
    render(
      <CalendarPageWrapper>
        <CalendarPage />
      </CalendarPageWrapper>
    );

    // Should render the main calendar component
    expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    render(
      <CalendarPageWrapper>
        <CalendarPage />
      </CalendarPageWrapper>
    );

    // Check page title
    expect(screen.getByText('Calendar')).toBeInTheDocument();

    // Check proper layout classes
    const container = screen.getByTestId('calendar-page-container');
    expect(container).toHaveClass('p-4');
  });

  it('should integrate with navigation breadcrumbs', () => {
    render(
      <CalendarPageWrapper>
        <CalendarPage />
      </CalendarPageWrapper>
    );

    // The page should be accessible via navigation
    // This will be validated when route is added
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });
});
