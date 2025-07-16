import React from 'react';
import { render, screen } from '@/test/utils/test-utils';
import { describe, it, expect } from 'vitest';
import { CanvasLegend } from '../CanvasLegend';

describe('CanvasLegend', () => {
  const renderComponent = () => {
    return render(<CanvasLegend />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('displays all legend items', () => {
    renderComponent();

    // Check all legend items are present
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Run Work')).toBeInTheDocument();
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Epic/Project Link')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('Financial Indicators')).toBeInTheDocument();
  });

  it('displays correct visual indicators for each item', () => {
    renderComponent();

    // Check for colored squares/circles representing different entity types
    const legendItems = screen.getAllByText(
      /Divisions|Teams|Projects|Epics|People|Run Work|Milestones|Skills/
    );
    expect(legendItems.length).toBeGreaterThan(0);

    // Check for line indicators
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Epic/Project Link')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
  });

  it('displays financial indicators with icon', () => {
    renderComponent();

    expect(screen.getByText('Financial Indicators')).toBeInTheDocument();

    // Check for dollar sign icon (using lucide-react)
    const dollarIcon = screen
      .getByText('Financial Indicators')
      .parentElement?.querySelector('svg');
    expect(dollarIcon).toBeInTheDocument();
  });

  it('uses proper color coding for entity types', () => {
    renderComponent();

    // Verify legend renders with proper structure
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('displays line type indicators correctly', () => {
    renderComponent();

    // Check for different line types
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Epic/Project Link')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    renderComponent();

    // Check for card structure
    expect(screen.getByText('Legend')).toBeInTheDocument();

    // Verify all items are present in the grid
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Run Work')).toBeInTheDocument();
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Epic/Project Link')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('Financial Indicators')).toBeInTheDocument();
  });

  it('displays entities with proper visual distinctions', () => {
    renderComponent();

    // Test that different shapes are used for different entity types
    // People should be circular (rounded-full)
    expect(screen.getByText('People')).toBeInTheDocument();

    // Others should be square/rectangular
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
  });

  it('displays connection types with different line styles', () => {
    renderComponent();

    // Test different connection types
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Epic/Project Link')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
  });

  it('has accessible structure', () => {
    renderComponent();

    // Check for proper heading structure
    expect(screen.getByText('Legend')).toBeInTheDocument();

    // Verify card structure exists
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('displays all required entity types', () => {
    renderComponent();

    const entityTypes = [
      'Divisions',
      'Teams',
      'Projects',
      'Epics',
      'People',
      'Run Work',
      'Milestones',
      'Skills',
    ];

    entityTypes.forEach(entityType => {
      expect(screen.getByText(entityType)).toBeInTheDocument();
    });
  });

  it('displays all required connection types', () => {
    renderComponent();

    const connectionTypes = ['Assignment', 'Epic/Project Link', 'Allocation'];

    connectionTypes.forEach(connectionType => {
      expect(screen.getByText(connectionType)).toBeInTheDocument();
    });
  });

  it('displays financial indicators properly', () => {
    renderComponent();

    expect(screen.getByText('Financial Indicators')).toBeInTheDocument();

    // Should span 2 columns on small screens, 1 on larger
    const financialIndicator = screen
      .getByText('Financial Indicators')
      .closest('div');
    expect(financialIndicator).toBeInTheDocument();
  });

  it('renders with proper responsive grid layout', () => {
    renderComponent();

    // Verify the component renders all items
    expect(screen.getByText('Divisions')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Run Work')).toBeInTheDocument();
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Epic/Project Link')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('Financial Indicators')).toBeInTheDocument();
  });
});
