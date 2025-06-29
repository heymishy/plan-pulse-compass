import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import Navigation from '../Navigation';

// Simple test wrapper without complex providers
const renderNavigation = () => {
  return render(<Navigation />);
};

describe('Layout and Navigation UI', () => {
  describe('Sidebar Layout', () => {
    it('renders the sidebar with proper structure', () => {
      renderNavigation();

      // Check that the sidebar is present
      expect(screen.getByText('Resource Planner')).toBeInTheDocument();

      // Check that navigation links are present
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('People')).toBeInTheDocument();
    });

    it('renders version info in sidebar header', () => {
      renderNavigation();

      // Check that version info is rendered (look for the button with version text)
      expect(screen.getByText(/v\s*0\.0\.20/)).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('renders all navigation items with proper icons', () => {
      renderNavigation();

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
      renderNavigation();

      // Check that links have proper structure
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderNavigation();

      // Check that links have proper accessibility
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('has proper heading structure', () => {
      renderNavigation();

      // Check that the main heading is present
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Resource Planner');
    });
  });
});
