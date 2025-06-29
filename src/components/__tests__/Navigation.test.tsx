import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import Navigation from '../Navigation';

describe('Navigation', () => {
  it('renders navigation component with proper structure', () => {
    render(<Navigation />);

    // Check for main navigation elements
    expect(screen.getByText('Resource Planner')).toBeInTheDocument();
  });

  it('contains all navigation links', () => {
    render(<Navigation />);

    // Check for common navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders version info component', () => {
    render(<Navigation />);

    // Check that version info is rendered (look for the button with version text)
    expect(screen.getByText(/v\s*0\.0\.20/)).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Navigation />);

    const expectedItems = [
      'Dashboard',
      'Teams',
      'People',
      'Projects',
      'Epics',
      'Milestones',
      'Planning',
      'Advanced Planning',
      'Journey Planning',
      'Allocations',
      'Tracking',
      'Scenario Analysis',
      'Reports',
      'Financials',
      'Skills',
      'Canvas',
      'Settings',
    ];

    expectedItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('has proper link structure for navigation items', () => {
    render(<Navigation />);

    // Check that links have proper structure
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});
