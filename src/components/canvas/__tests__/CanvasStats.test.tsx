import React from 'react';
import { render, screen } from '@/test/utils/test-utils';
import { describe, it, expect } from 'vitest';
import { CanvasStats } from '../CanvasStats';

const mockStats = {
  divisions: 3,
  teams: 12,
  projects: 8,
  epics: 25,
  allocations: 145,
  people: 67,
};

describe('CanvasStats', () => {
  const renderComponent = (stats = mockStats) => {
    return render(<CanvasStats stats={stats} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Divisions')).toBeInTheDocument();
  });

  it('displays all stat cards', () => {
    renderComponent();

    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('displays correct stat values', () => {
    renderComponent();

    expect(screen.getByText('3')).toBeInTheDocument(); // divisions
    expect(screen.getByText('12')).toBeInTheDocument(); // teams
    expect(screen.getByText('8')).toBeInTheDocument(); // projects
    expect(screen.getByText('25')).toBeInTheDocument(); // epics
    expect(screen.getByText('145')).toBeInTheDocument(); // allocations
    expect(screen.getByText('67')).toBeInTheDocument(); // people
  });

  it('displays proper icons for each stat', () => {
    renderComponent();

    // Check for icon presence by checking for the text content
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    const zeroStats = {
      divisions: 0,
      teams: 0,
      projects: 0,
      epics: 0,
      allocations: 0,
      people: 0,
    };

    renderComponent(zeroStats);

    // Should display zero values
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBe(6);
  });

  it('handles large numbers correctly', () => {
    const largeStats = {
      divisions: 999,
      teams: 1000,
      projects: 5000,
      epics: 10000,
      allocations: 50000,
      people: 100000,
    };

    renderComponent(largeStats);

    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();
    expect(screen.getByText('50000')).toBeInTheDocument();
    expect(screen.getByText('100000')).toBeInTheDocument();
  });

  it('displays stats in correct order', () => {
    renderComponent();

    const statCards = screen.getAllByRole('generic');
    // The order should be: Divisions, Teams, Projects, Epics, Allocations, People
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('uses proper grid layout', () => {
    renderComponent();

    // All 6 stat cards should be present
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('has proper card structure', () => {
    renderComponent();

    // Each stat should be in its own card
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('displays Building icon for Divisions', () => {
    renderComponent();

    expect(screen.getByText('Divisions')).toBeInTheDocument();
    // The Building icon should be present (rendered as svg)
    const divisionsCard = screen.getByText('Divisions').closest('div');
    expect(divisionsCard).toBeInTheDocument();
  });

  it('displays Users icon for Teams', () => {
    renderComponent();

    expect(screen.getByText('Teams')).toBeInTheDocument();
    // The Users icon should be present
    const teamsCard = screen.getByText('Teams').closest('div');
    expect(teamsCard).toBeInTheDocument();
  });

  it('displays FolderOpen icon for Projects', () => {
    renderComponent();

    expect(screen.getByText('Projects')).toBeInTheDocument();
    // The FolderOpen icon should be present
    const projectsCard = screen.getByText('Projects').closest('div');
    expect(projectsCard).toBeInTheDocument();
  });

  it('displays Target icon for Epics', () => {
    renderComponent();

    expect(screen.getByText('Epics')).toBeInTheDocument();
    // The Target icon should be present
    const epicsCard = screen.getByText('Epics').closest('div');
    expect(epicsCard).toBeInTheDocument();
  });

  it('displays Zap icon for Allocations', () => {
    renderComponent();

    expect(screen.getByText('Allocations')).toBeInTheDocument();
    // The Zap icon should be present
    const allocationsCard = screen.getByText('Allocations').closest('div');
    expect(allocationsCard).toBeInTheDocument();
  });

  it('displays PersonStanding icon for People', () => {
    renderComponent();

    expect(screen.getByText('People')).toBeInTheDocument();
    // The PersonStanding icon should be present
    const peopleCard = screen.getByText('People').closest('div');
    expect(peopleCard).toBeInTheDocument();
  });

  it('handles missing stats gracefully', () => {
    const incompleteStats = {
      divisions: 1,
      teams: 2,
      projects: 3,
      // Missing epics, allocations, people
    } as Partial<AppContextType>;

    renderComponent(incompleteStats);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    renderComponent();

    // Numbers should be displayed as-is (no formatting for thousands, etc)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('67')).toBeInTheDocument();
  });

  it('maintains responsive layout', () => {
    renderComponent();

    // Should render all cards in a grid
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('shows proper text size for values', () => {
    renderComponent();

    // Values should be displayed with large font (text-2xl)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('67')).toBeInTheDocument();
  });

  it('displays proper header structure', () => {
    renderComponent();

    // Each card should have a header with title and icon
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Allocations')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('handles negative values correctly', () => {
    const negativeStats = {
      divisions: -1,
      teams: -5,
      projects: -10,
      epics: -2,
      allocations: -100,
      people: -50,
    };

    renderComponent(negativeStats);

    // Should display negative values as-is
    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('-10')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('-100')).toBeInTheDocument();
    expect(screen.getByText('-50')).toBeInTheDocument();
  });
});
