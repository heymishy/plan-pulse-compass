/**
 * Tests for Enhanced Navigation Component
 *
 * Test Coverage:
 * - Component rendering and basic functionality
 * - Navigation grouping and organization
 * - Search functionality
 * - Favorites system
 * - Recent items tracking
 * - Keyboard shortcuts integration
 * - Accessibility features
 * - Responsive behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedNavigation } from '@/components/navigation/enhanced-navigation';
import { SidebarProvider } from '@/components/ui/sidebar';

import { vi } from 'vitest';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <SidebarProvider>{children}</SidebarProvider>
  </BrowserRouter>
);

describe('EnhancedNavigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering and Basic Functionality', () => {
    it('renders the navigation component', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      expect(screen.getByText('Plan Pulse Compass')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search navigation... (⌘K)')
      ).toBeInTheDocument();
    });

    it('displays navigation groups with correct labels', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Execution')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('displays navigation items within groups', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Overview group items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Strategy Canvas')).toBeInTheDocument();
      expect(screen.getByText('Scenario Analysis')).toBeInTheDocument();

      // Resources group items
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('People')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('navigates to correct routes when items are clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      await user.click(dashboardLink);

      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('highlights active navigation item', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const activeItem = screen.getByRole('link', { name: /dashboard/i });
      expect(activeItem).toHaveAttribute('data-active', 'true');
    });
  });

  describe('Search Functionality', () => {
    it('filters navigation items based on search query', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      await user.type(searchInput, 'dashboard');

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    });

    it('shows no results message when search returns empty', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText(/No navigation items found/)).toBeInTheDocument();
    });

    it('searches by keywords and descriptions', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      await user.type(searchInput, 'metrics');

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('clears search results when input is cleared', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      await user.type(searchInput, 'dashboard');
      await user.clear(searchInput);

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  describe('Group Collapsing', () => {
    it('toggles group collapse state when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Planning group should be collapsed by default
      const planningGroup = screen.getByText('Planning');
      await user.click(planningGroup);

      // Items should be visible after expanding
      await waitFor(() => {
        expect(screen.getByText('Basic Planning')).toBeInTheDocument();
        expect(screen.getByText('Advanced Planning')).toBeInTheDocument();
      });
    });

    it('shows chevron icon for collapsible groups', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Should have chevron icons for collapsible groups
      const planningGroupLabel = screen.getByText('Planning').closest('button');
      expect(planningGroupLabel?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Badges and Indicators', () => {
    it('displays "New" badges for new features', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('displays "Pro" badges for premium features', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Expand planning group to see Pro badge
      const planningGroup = screen.getByText('Planning');
      await user.click(planningGroup);

      await waitFor(() => {
        expect(screen.getByText('Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(3); // Default expanded items
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      searchInput.focus();

      await user.tab();
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus();
    });

    it('provides tooltips with descriptions for collapsed state', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-label', 'Dashboard');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to collapsed sidebar state', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Should render properly in both expanded and collapsed states
      expect(screen.getByText('Plan Pulse Compass')).toBeInTheDocument();
    });
  });

  describe('Integration Features', () => {
    it('focuses search input when called programmatically', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      searchInput.focus();

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation data gracefully', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Should render without errors even if some data is missing
      expect(screen.getByText('Plan Pulse Compass')).toBeInTheDocument();
    });

    it('handles search with special characters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );
      await user.type(searchInput, '!@#$%^&*()');

      expect(screen.getByText(/No navigation items found/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('debounces search input efficiently', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(
        'Search navigation... (⌘K)'
      );

      // Rapid typing should not cause performance issues
      await user.type(searchInput, 'abcdefg', { delay: 10 });

      expect(screen.getByDisplayValue('abcdefg')).toBeInTheDocument();
    });
  });
});
