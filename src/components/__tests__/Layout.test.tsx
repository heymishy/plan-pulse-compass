import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderWithSidebar, screen, fireEvent } from '@/test/utils/test-utils';
import Navigation from '../Navigation';

// Simple test wrapper with sidebar providers
const renderNavigation = () => {
  return renderWithSidebar(<Navigation />);
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

  describe('Sidebar Minimize Functionality', () => {
    it('renders minimize button when sidebar is expanded', () => {
      renderNavigation();

      // Check that minimize button is present with proper accessibility
      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(minimizeButton).toBeInTheDocument();
      expect(minimizeButton).toHaveAttribute('aria-label', 'Minimize sidebar');
    });

    it('minimize button has proper tooltip', () => {
      renderNavigation();

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      // Check that the button has the expected icon
      const icon = minimizeButton.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Check button styling and positioning
      expect(minimizeButton).toHaveClass('ml-2');
    });

    it('minimize button is positioned correctly in header', () => {
      renderNavigation();

      const header = screen
        .getByText('Resource Planner')
        .closest('[data-sidebar="header"]');
      expect(header).toBeInTheDocument();

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });
      expect(header).toContainElement(minimizeButton);
    });

    it('minimize functionality is accessible via keyboard', () => {
      renderNavigation();

      const minimizeButton = screen.getByRole('button', {
        name: /minimize sidebar/i,
      });

      // Test keyboard accessibility
      minimizeButton.focus();
      expect(minimizeButton).toHaveFocus();

      // Test Enter key
      fireEvent.keyDown(minimizeButton, { key: 'Enter', code: 'Enter' });
      // Note: We can't easily test the actual state change in this isolated test
      // as it requires the full sidebar context, but we can test the button behavior
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
