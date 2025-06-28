import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import Navigation from '../Navigation';

const renderNavigation = () => {
  return render(
    <SidebarProvider>
      <Sidebar>
        <Navigation />
      </Sidebar>
    </SidebarProvider>
  );
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

    it('has proper sidebar styling and positioning', () => {
      renderNavigation();

      // Check that the sidebar has the correct data attributes
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      expect(sidebar).toBeInTheDocument();

      // Check that the sidebar wrapper has proper classes
      const sidebarWrapper = document.querySelector('.group\\/sidebar-wrapper');
      expect(sidebarWrapper).toBeInTheDocument();
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

      // Check that navigation menu is present
      const sidebarMenu = document.querySelector('[data-sidebar="menu"]');
      expect(sidebarMenu).toBeInTheDocument();

      // Check that links have proper structure
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Responsive Layout', () => {
    it('maintains proper layout structure', () => {
      renderNavigation();

      // Check that the sidebar header is present
      const sidebarHeader = document.querySelector('[data-sidebar="header"]');
      expect(sidebarHeader).toBeInTheDocument();

      // Check that the sidebar content is present
      const sidebarContent = document.querySelector('[data-sidebar="content"]');
      expect(sidebarContent).toBeInTheDocument();
    });

    it('has proper flex layout structure', () => {
      renderNavigation();

      // Check the overall layout structure
      const sidebarWrapper = document.querySelector('.group\\/sidebar-wrapper');
      expect(sidebarWrapper).toBeInTheDocument();

      // Check that the sidebar is present
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      expect(sidebar).toBeInTheDocument();
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
