import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CalendarPage from '../Calendar';
import { SafeScenarioAwareAppProvider } from '../../context/SafeScenarioAwareAppProvider';
import { ProjectProvider } from '../../context/ProjectContext';
import { TeamProvider } from '../../context/TeamContext';
import { PlanningProvider } from '../../context/PlanningContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { GoalProvider } from '../../context/GoalContext';
import { ScenarioProvider } from '../../context/ScenarioContext';

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (!date) return '';
      if (formatStr === 'MMMM yyyy') return 'January 2024';
      if (formatStr === 'd') return new Date(date).getDate().toString();
      if (formatStr === 'PPPP') return 'Sunday, January 14th, 2024';
      if (formatStr === 'PPP') return 'Jan 14, 2024';
      return `${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString()}`;
    }),
    parseISO: vi.fn(dateString => new Date(dateString)),
    startOfMonth: vi.fn(
      date => new Date(date.getFullYear(), date.getMonth(), 1)
    ),
    endOfMonth: vi.fn(
      date => new Date(date.getFullYear(), date.getMonth() + 1, 0)
    ),
    startOfWeek: vi.fn(date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }),
    endOfWeek: vi.fn(date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? 0 : 7);
      return new Date(d.setDate(diff));
    }),
    startOfQuarter: vi.fn(date => {
      const q = Math.floor(date.getMonth() / 3);
      return new Date(date.getFullYear(), q * 3, 1);
    }),
    endOfQuarter: vi.fn(date => {
      const q = Math.floor(date.getMonth() / 3);
      return new Date(date.getFullYear(), q * 3 + 3, 0);
    }),
    eachDayOfInterval: vi.fn(({ start, end }) => {
      const days = [];
      const current = new Date(start);
      while (current <= end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return days;
    }),
    isSameDay: vi.fn((date1, date2) => {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    }),
    isSameMonth: vi.fn((date1, date2) => date1.getMonth() === date2.getMonth()),
    isSameQuarter: vi.fn((date1, date2) => {
      const q1 = Math.floor(date1.getMonth() / 3);
      const q2 = Math.floor(date2.getMonth() / 3);
      return q1 === q2;
    }),
    isToday: vi.fn(date => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }),
    addMonths: vi.fn((date, amount) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    }),
    subMonths: vi.fn((date, amount) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() - amount);
      return newDate;
    }),
    addQuarters: vi.fn((date, amount) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + amount * 3);
      return newDate;
    }),
    subQuarters: vi.fn((date, amount) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() - amount * 3);
      return newDate;
    }),
    getQuarter: vi.fn(date => Math.floor(date.getMonth() / 3) + 1),
    getYear: vi.fn(date => date.getFullYear()),
    isWithinInterval: vi.fn(
      (date, interval) => date >= interval.start && date <= interval.end
    ),
  };
});

// Wrapper component with all necessary providers
const CalendarPageWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <BrowserRouter>
    <ThemeProvider>
      <SettingsProvider>
        <TeamProvider>
          <ProjectProvider>
            <PlanningProvider>
              <GoalProvider>
                <ScenarioProvider>
                  <SafeScenarioAwareAppProvider>
                    {children}
                  </SafeScenarioAwareAppProvider>
                </ScenarioProvider>
              </GoalProvider>
            </PlanningProvider>
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

    // Check for the page title specifically
    const pageTitle = screen.getByRole('heading', { level: 3 });
    expect(pageTitle).toHaveTextContent('Calendar');
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
    const pageTitle = screen.getByRole('heading', { level: 3 });
    expect(pageTitle).toHaveTextContent('Calendar');

    // Check proper layout classes
    const container = screen.getByTestId('calendar-page-container');
    expect(container).toHaveClass('p-6');
  });

  it('should integrate with navigation breadcrumbs', () => {
    render(
      <CalendarPageWrapper>
        <CalendarPage />
      </CalendarPageWrapper>
    );

    // The page should be accessible via navigation
    // This will be validated when route is added
    const pageTitle = screen.getByRole('heading', { level: 3 });
    expect(pageTitle).toHaveTextContent('Calendar');
  });
});
