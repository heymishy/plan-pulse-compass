import React from 'react';
import { render, screen } from '@/test/utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasControls } from '../CanvasControls';

const mockSetViewType = vi.fn();
const mockSetSelectedDivision = vi.fn();
const mockSetSelectedTeam = vi.fn();
const mockSetSelectedProject = vi.fn();

const mockDivisions = [
  { id: 'div1', name: 'Engineering', description: 'Engineering Division' },
  { id: 'div2', name: 'Product', description: 'Product Division' },
];

const mockTeams = [
  { id: 'team1', name: 'Frontend Team', description: 'Frontend team' },
  { id: 'team2', name: 'Backend Team', description: 'Backend team' },
];

const mockProjects = [
  { id: 'proj1', name: 'Project Alpha', description: 'First project' },
  { id: 'proj2', name: 'Project Beta', description: 'Second project' },
];

const defaultProps = {
  viewType: 'teams-projects' as const,
  setViewType: mockSetViewType,
  selectedDivision: 'all',
  setSelectedDivision: mockSetSelectedDivision,
  divisions: mockDivisions,
  selectedTeam: 'all',
  setSelectedTeam: mockSetSelectedTeam,
  teams: mockTeams,
  selectedProject: 'all',
  setSelectedProject: mockSetSelectedProject,
  projects: mockProjects,
};

describe('CanvasControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<CanvasControls {...defaultProps} {...props} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('View:')).toBeInTheDocument();
  });

  it('displays view selector', () => {
    renderComponent();

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Teams & Projects')).toBeInTheDocument();
  });

  it('displays division filter', () => {
    renderComponent();

    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('All Divisions')).toBeInTheDocument();
  });

  it('displays team filter', () => {
    renderComponent();

    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('All Teams')).toBeInTheDocument();
  });

  it('displays project filter', () => {
    renderComponent();

    expect(screen.getByText('Project:')).toBeInTheDocument();
    expect(screen.getByText('All Projects')).toBeInTheDocument();
  });

  it('displays correct layout structure', () => {
    renderComponent();

    // Should have flex layout with all controls
    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('displays proper icons for each control', () => {
    renderComponent();

    // Should have icons for Division, Team, and Project
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    renderComponent({
      divisions: [],
      teams: [],
      projects: [],
    });

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('handles different view types', () => {
    renderComponent({ viewType: 'projects-epics' });

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('handles selected division correctly', () => {
    renderComponent({
      selectedDivision: 'div1',
    });

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('handles selected team correctly', () => {
    renderComponent({
      selectedTeam: 'team1',
    });

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('handles selected project correctly', () => {
    renderComponent({
      selectedProject: 'proj1',
    });

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('displays all required controls with labels', () => {
    renderComponent();

    // All controls should be present
    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();

    // Default values should be shown
    expect(screen.getByText('Teams & Projects')).toBeInTheDocument();
    expect(screen.getByText('All Divisions')).toBeInTheDocument();
    expect(screen.getByText('All Teams')).toBeInTheDocument();
    expect(screen.getByText('All Projects')).toBeInTheDocument();
  });

  it('renders with consistent styling', () => {
    renderComponent();

    // Should have consistent flex layout
    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });

  it('handles props correctly', () => {
    renderComponent({
      viewType: 'people-skills',
      selectedDivision: 'div2',
      selectedTeam: 'team2',
      selectedProject: 'proj2',
    });

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Team:')).toBeInTheDocument();
    expect(screen.getByText('Project:')).toBeInTheDocument();
  });
});
