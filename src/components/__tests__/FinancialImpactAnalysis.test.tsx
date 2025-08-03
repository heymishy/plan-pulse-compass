import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FinancialImpactAnalysis from '../canvas/FinancialImpactAnalysis';
import { AppProvider } from '@/context/AppContext';
import { TeamProvider } from '@/context/TeamContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ScenarioProvider } from '@/context/ScenarioContext';
import { Person, Team } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPeople: Person[] = [
  {
    id: '1',
    name: 'Alice',
    teamId: 'team-1',
    annualSalary: 100000,
    email: 'alice@example.com',
    roleId: 'role-1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2023-01-01',
  },
  {
    id: '2',
    name: 'Bob',
    teamId: 'team-1',
    annualSalary: 120000,
    email: 'bob@example.com',
    roleId: 'role-1',
    isActive: true,
    employmentType: 'permanent',
    startDate: '2023-01-01',
  },
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team Alpha',
    capacity: 80,
    type: 'permanent',
    status: 'active',
    createdDate: '2023-01-01',
    lastModified: '2023-01-01',
    targetSkills: [],
  },
  {
    id: 'team-2',
    name: 'Team Bravo',
    capacity: 40,
    type: 'permanent',
    status: 'active',
    createdDate: '2023-01-01',
    lastModified: '2023-01-01',
    targetSkills: [],
  },
];

const queryClient = new QueryClient();

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ScenarioProvider>
        <SettingsProvider>
          <TeamProvider>
            <AppProvider>{children}</AppProvider>
          </TeamProvider>
        </SettingsProvider>
      </ScenarioProvider>
    </QueryClientProvider>
  );
};

const renderWithContext = (component: React.ReactElement) => {
  return render(component, { wrapper: AllTheProviders });
};

describe('FinancialImpactAnalysis', () => {
  it('renders the component with initial state', () => {
    renderWithContext(<FinancialImpactAnalysis />);
    expect(screen.getByText('Financial Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('Select a person')).toBeInTheDocument();
    expect(screen.getByText('Select a new team')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  });
});
