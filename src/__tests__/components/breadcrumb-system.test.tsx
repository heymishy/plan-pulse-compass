/**
 * Tests for Breadcrumb System Component
 *
 * Test Coverage:
 * - Breadcrumb trail generation and display
 * - Navigation functionality
 * - Hierarchical relationships
 * - Overflow handling with ellipsis
 * - Keyboard navigation support
 * - Accessibility compliance
 * - Integration with router
 * - Custom configurations and props
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import {
  BreadcrumbSystem,
  PageBreadcrumb,
  useBreadcrumb,
} from '@/components/navigation/breadcrumb-system';

import { vi } from 'vitest';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper
const TestWrapper = ({
  children,
  initialEntries = ['/dashboard'],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;

describe.skip('BreadcrumbSystem', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders breadcrumb for dashboard page', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders breadcrumb for nested page', () => {
      render(
        <TestWrapper initialEntries={['/people']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('People')).toBeInTheDocument();
    });

    it('renders breadcrumb for deeply nested page', () => {
      render(
        <TestWrapper initialEntries={['/advanced-planning']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Basic Planning')).toBeInTheDocument();
      expect(screen.getByText('Advanced Planning')).toBeInTheDocument();
    });

    it('does not render when page data is not found', () => {
      render(
        <TestWrapper initialEntries={['/nonexistent']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('navigates when breadcrumb items are clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper initialEntries={['/people']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      const homeLink = screen.getByRole('link', { name: /home/i });
      await user.click(homeLink);

      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('does not navigate for current page (last breadcrumb)', () => {
      render(
        <TestWrapper initialEntries={['/people']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      const currentPage = screen.getByText('People');
      expect(currentPage.closest('a')).not.toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper initialEntries={['/people']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      const homeLink = screen.getByRole('link', { name: /home/i });
      homeLink.focus();

      await user.keyboard('{Enter}');
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Icons and Visual Elements', () => {
    it('displays icons when showIcons is true', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem showIcons={true} />
        </TestWrapper>
      );

      // Should have SVG icons
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });

    it('hides icons when showIcons is false', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem showIcons={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('uses chevron separator by default', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      // Should have chevron separators (SVG elements)
      const separators = document.querySelectorAll(
        '[data-orientation="vertical"]'
      );
      expect(separators.length).toBeGreaterThan(0);
    });

    it('uses slash separator when specified', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem separator="slash" />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Home Display Control', () => {
    it('shows home breadcrumb when showHome is true', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem showHome={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('hides home breadcrumb when showHome is false', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem showHome={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Overflow Handling', () => {
    it('shows ellipsis when items exceed maxItems', () => {
      render(
        <TestWrapper initialEntries={['/financials']}>
          <BreadcrumbSystem maxItems={3} />
        </TestWrapper>
      );

      // Should show ellipsis dropdown for hidden items
      const ellipsisButton = screen.getByLabelText(
        'Show hidden breadcrumb items'
      );
      expect(ellipsisButton).toBeInTheDocument();
    });

    it('shows all items when under maxItems limit', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem maxItems={5} />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(
        screen.queryByLabelText('Show hidden breadcrumb items')
      ).not.toBeInTheDocument();
    });

    it('shows hidden items in dropdown', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper initialEntries={['/financials']}>
          <BreadcrumbSystem maxItems={2} />
        </TestWrapper>
      );

      const ellipsisButton = screen.getByLabelText(
        'Show hidden breadcrumb items'
      );
      await user.click(ellipsisButton);

      // Should show hidden items in dropdown menu
      await waitFor(() => {
        expect(screen.getByText('Reports')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA navigation label', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      expect(
        screen.getByLabelText('Breadcrumb navigation')
      ).toBeInTheDocument();
    });

    it('provides proper link attributes', () => {
      render(
        <TestWrapper initialEntries={['/people']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/');
      expect(homeLink).toHaveAttribute('title');
    });

    it('marks current page appropriately', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem />
        </TestWrapper>
      );

      const currentPage = screen.getByText('Dashboard');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('supports keyboard navigation for dropdown', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper initialEntries={['/financials']}>
          <BreadcrumbSystem maxItems={2} />
        </TestWrapper>
      );

      const ellipsisButton = screen.getByLabelText(
        'Show hidden breadcrumb items'
      );
      ellipsisButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('menuitem')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <TestWrapper initialEntries={['/dashboard']}>
          <BreadcrumbSystem className="custom-breadcrumb" />
        </TestWrapper>
      );

      const nav = screen.getByLabelText('Breadcrumb navigation');
      expect(nav).toHaveClass('custom-breadcrumb');
    });
  });
});

describe('PageBreadcrumb', () => {
  it('renders breadcrumb with description', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <PageBreadcrumb showDescription={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Main overview dashboard')).toBeInTheDocument();
  });

  it('hides description when showDescription is false', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <PageBreadcrumb showDescription={false} />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.queryByText('Main overview dashboard')
    ).not.toBeInTheDocument();
  });
});

describe('useBreadcrumb hook', () => {
  const TestComponent = () => {
    const breadcrumb = useBreadcrumb();
    return (
      <div>
        {breadcrumb ? (
          <div>
            <span data-testid="label">{breadcrumb.label}</span>
            <span data-testid="description">{breadcrumb.description}</span>
          </div>
        ) : (
          <span data-testid="no-breadcrumb">No breadcrumb</span>
        )}
      </div>
    );
  };

  it('returns current page breadcrumb data', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('label')).toHaveTextContent('Dashboard');
    expect(screen.getByTestId('description')).toHaveTextContent(
      'Main overview dashboard'
    );
  });

  it('returns null for unknown pages', () => {
    render(
      <TestWrapper initialEntries={['/unknown']}>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('no-breadcrumb')).toBeInTheDocument();
  });
});
