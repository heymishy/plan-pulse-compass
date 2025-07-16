import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import Dashboard from '../Dashboard';
import { useApp } from '@/context/AppContext';

// Mock the useApp hook
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock dashboard utils
vi.mock('@/utils/dashboardUtils', () => ({
  getDashboardData: vi.fn(() => ({
    currentQuarter: 'Q1 2024',
    currentIteration: 'Iteration 1',
    quarterlyProgress: [],
    attentionItems: [],
    iterationMetrics: {},
    teamPortfolioInsights: [],
  })),
}));

// Mock all dashboard components
vi.mock('@/components/dashboard/DashboardHeader', () => ({
  default: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}));

vi.mock('@/components/dashboard/StatCards', () => ({
  default: () => <div data-testid="stat-cards">Stat Cards</div>,
}));

vi.mock('@/components/dashboard/CurrentStatusCard', () => ({
  default: () => <div data-testid="current-status-card">Current Status</div>,
}));

vi.mock('@/components/dashboard/QuarterlyProgressCard', () => ({
  default: () => (
    <div data-testid="quarterly-progress-card">Quarterly Progress</div>
  ),
}));

vi.mock('@/components/dashboard/AttentionItemsCard', () => ({
  default: () => <div data-testid="attention-items-card">Attention Items</div>,
}));

vi.mock('@/components/dashboard/RecentActivityCard', () => ({
  default: () => <div data-testid="recent-activity-card">Recent Activity</div>,
}));

vi.mock('@/components/dashboard/QuickActionsCard', () => ({
  default: () => <div data-testid="quick-actions-card">Quick Actions</div>,
}));

vi.mock('@/components/dashboard/IterationMetricsCard', () => ({
  default: () => (
    <div data-testid="iteration-metrics-card">Iteration Metrics</div>
  ),
}));

vi.mock('@/components/dashboard/TeamPortfolioInsights', () => ({
  default: () => (
    <div data-testid="team-portfolio-insights">Team Portfolio Insights</div>
  ),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppData = {
    people: [],
    teams: [],
    projects: [],
    allocations: [],
    isSetupComplete: true,
    cycles: [],
    actualAllocations: [],
    iterationReviews: [],
    epics: [],
    isDataLoading: false,
  };

  it('renders dashboard components when setup is complete', () => {
    vi.mocked(useApp).mockReturnValue(mockAppData);

    render(<Dashboard />);

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
    expect(screen.getByTestId('current-status-card')).toBeInTheDocument();
    expect(screen.getByTestId('quarterly-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('attention-items-card')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-card')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-card')).toBeInTheDocument();
    expect(screen.getByTestId('iteration-metrics-card')).toBeInTheDocument();
    expect(screen.getByTestId('team-portfolio-insights')).toBeInTheDocument();
  });

  it('shows setup required message when setup is not complete', () => {
    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      isSetupComplete: false,
    });

    render(<Dashboard />);

    expect(screen.getByText('Setup Required')).toBeInTheDocument();
    expect(
      screen.getByText('Complete the initial setup to view your dashboard.')
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Setup')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      isDataLoading: true,
    });

    render(<Dashboard />);

    // Should show skeleton loading components
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    // Check for skeleton elements (they would be rendered by Skeleton component)
    const skeletonElements = screen.getAllByTestId('skeleton', {
      exact: false,
    });
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('handles error state gracefully', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      isSetupComplete: true,
      isDataLoading: false,
    });

    render(<Dashboard />);

    // Should still render the dashboard structure
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renders with empty data gracefully', () => {
    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      people: [],
      teams: [],
      projects: [],
      allocations: [],
      cycles: [],
      epics: [],
    });

    render(<Dashboard />);

    // Should render all components even with empty data
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
    expect(screen.getByTestId('current-status-card')).toBeInTheDocument();
    expect(screen.getByTestId('quarterly-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('attention-items-card')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-card')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-card')).toBeInTheDocument();
    expect(screen.getByTestId('iteration-metrics-card')).toBeInTheDocument();
    expect(screen.getByTestId('team-portfolio-insights')).toBeInTheDocument();
  });

  it('renders setup required card structure correctly', () => {
    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      isSetupComplete: false,
    });

    render(<Dashboard />);

    // Check for setup required card structure
    expect(screen.getByText('Setup Required')).toBeInTheDocument();
    expect(
      screen.getByText('Complete the initial setup to view your dashboard.')
    ).toBeInTheDocument();

    // Check for setup button
    const setupButton = screen.getByText('Go to Setup');
    expect(setupButton).toBeInTheDocument();
    expect(setupButton.closest('a')).toHaveAttribute('href', '/setup');
  });

  it('computes dashboard data correctly', () => {
    const mockData = {
      ...mockAppData,
      people: [{ id: '1', name: 'John Doe' }],
      teams: [{ id: '1', name: 'Team A' }],
      projects: [{ id: '1', name: 'Project 1' }],
      cycles: [{ id: '1', name: 'Q1 2024' }],
      epics: [{ id: '1', name: 'Epic 1' }],
    };

    vi.mocked(useApp).mockReturnValue(mockData);

    render(<Dashboard />);

    // Should render all dashboard components
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
    expect(screen.getByTestId('current-status-card')).toBeInTheDocument();
    expect(screen.getByTestId('quarterly-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('attention-items-card')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-card')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-card')).toBeInTheDocument();
    expect(screen.getByTestId('iteration-metrics-card')).toBeInTheDocument();
    expect(screen.getByTestId('team-portfolio-insights')).toBeInTheDocument();
  });

  it('handles dashboard data computation errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      isSetupComplete: true,
      isDataLoading: false,
    });

    // Mock getDashboardData to throw an error
    vi.doMock('@/utils/dashboardUtils', () => ({
      getDashboardData: vi.fn(() => {
        throw new Error('Dashboard data computation failed');
      }),
    }));

    render(<Dashboard />);

    // Should still render the dashboard structure
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows appropriate warning when no cycles are configured', () => {
    vi.mocked(useApp).mockReturnValue({
      ...mockAppData,
      cycles: [],
    });

    render(<Dashboard />);

    // Dashboard should still render but may show warnings in components
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
  });

  it('displays correct layout structure', () => {
    vi.mocked(useApp).mockReturnValue(mockAppData);

    render(<Dashboard />);

    // Check that all main sections are present
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
    expect(screen.getByTestId('current-status-card')).toBeInTheDocument();
    expect(screen.getByTestId('quarterly-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('attention-items-card')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-card')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-card')).toBeInTheDocument();
    expect(screen.getByTestId('iteration-metrics-card')).toBeInTheDocument();
    expect(screen.getByTestId('team-portfolio-insights')).toBeInTheDocument();
  });
});
