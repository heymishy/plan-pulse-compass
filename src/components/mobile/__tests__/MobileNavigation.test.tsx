import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import MobileNavigation from '../MobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock hooks
vi.mock('@/hooks/use-mobile');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
  };
});

const mockUseIsMobile = vi.mocked(useIsMobile);
const mockUseLocation = vi.mocked(useLocation);

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <MobileNavigation {...props} />
    </BrowserRouter>
  );
};

describe('MobileNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(true);
    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  it('should not render when not on mobile', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = renderComponent();

    expect(container.firstChild).toBeNull();
  });

  it('should render navigation items', () => {
    renderComponent();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /teams/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planning/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /canvas/i })).toBeInTheDocument();
  });

  it('should have correct href attributes', () => {
    renderComponent();

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: /teams/i })).toHaveAttribute(
      'href',
      '/teams'
    );
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(screen.getByRole('link', { name: /planning/i })).toHaveAttribute(
      'href',
      '/planning'
    );
    expect(screen.getByRole('link', { name: /canvas/i })).toHaveAttribute(
      'href',
      '/canvas'
    );
  });

  it('should highlight active route - home page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    renderComponent();

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('text-blue-600');
  });

  it('should highlight active route - dashboard page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    renderComponent();

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('text-blue-600');
  });

  it('should highlight active route - teams page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/teams',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    renderComponent();

    const teamsLink = screen.getByRole('link', { name: /teams/i });
    expect(teamsLink).toHaveClass('text-blue-600');
  });

  it('should show attention badge when attention items present', () => {
    renderComponent({ attentionItemsCount: 5 });

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 9+ for attention items over 9', () => {
    renderComponent({ attentionItemsCount: 15 });

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('should not show badge when no attention items', () => {
    renderComponent({ attentionItemsCount: 0 });

    const badges = screen.queryAllByText(/\d/);
    expect(badges).toHaveLength(0);
  });

  it('should be positioned fixed at bottom', () => {
    const { container } = renderComponent();

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'bottom-0');
  });

  it('should have proper z-index for overlay', () => {
    const { container } = renderComponent();

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('z-50');
  });

  it('should handle nested routes correctly', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/teams/create',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    renderComponent();

    const teamsLink = screen.getByRole('link', { name: /teams/i });
    expect(teamsLink).toHaveClass('text-blue-600');
  });

  it('should show active indicator for current route', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/projects',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    renderComponent();

    const projectsLink = screen.getByRole('link', { name: /projects/i });
    expect(projectsLink).toHaveClass('text-blue-600');

    // Check for active indicator (blue bar)
    expect(projectsLink.querySelector('.bg-blue-600')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    renderComponent();

    const nav = screen.getByRole('navigation', { hidden: true });
    expect(nav).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(5);

    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAccessibleName();
    });
  });

  it('should have proper responsive spacing', () => {
    const { container } = renderComponent();

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('px-2', 'py-1');
  });

  it('should handle undefined attention items count', () => {
    renderComponent({ attentionItemsCount: undefined });

    // Should not show any badge
    const badges = screen.queryAllByText(/\d/);
    expect(badges).toHaveLength(0);
  });
});
