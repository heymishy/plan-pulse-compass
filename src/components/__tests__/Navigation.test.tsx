import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import Navigation from '../Navigation';

const renderWithProviders = (component: React.ReactElement) => {
  return render(<SidebarProvider>{component}</SidebarProvider>);
};

describe('Navigation', () => {
  it('renders navigation component with proper structure', () => {
    renderWithProviders(<Navigation />);

    // Check for main navigation elements
    expect(screen.getByText('Resource Planner')).toBeInTheDocument();
  });

  it('contains all navigation links', () => {
    renderWithProviders(<Navigation />);

    // Check for common navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('has proper sidebar styling classes', () => {
    renderWithProviders(<Navigation />);

    // Check that the sidebar header is present
    const sidebarHeader = document.querySelector('[data-sidebar="header"]');
    expect(sidebarHeader).toBeInTheDocument();
  });

  it('renders version info component', () => {
    renderWithProviders(<Navigation />);

    // Check that version info is rendered (look for the button with version text)
    expect(screen.getByText(/v\s*0\.0\.20/)).toBeInTheDocument();
  });

  it('has proper link structure for navigation items', () => {
    renderWithProviders(<Navigation />);

    // Check that navigation menu is present
    const sidebarMenu = document.querySelector('[data-sidebar="menu"]');
    expect(sidebarMenu).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderWithProviders(<Navigation />);

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
});
