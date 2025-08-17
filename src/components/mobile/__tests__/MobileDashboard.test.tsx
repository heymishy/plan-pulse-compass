import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MobileDashboard from '../MobileDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/usePWA';
import { Users, FolderOpen, Calendar, BarChart3 } from 'lucide-react';

// Mock hooks
vi.mock('@/hooks/use-mobile');
vi.mock('@/hooks/usePWA');

const mockUseIsMobile = vi.mocked(useIsMobile);
const mockUsePWA = vi.mocked(usePWA);

const mockStats = {
  totalPeople: 25,
  totalTeams: 5,
  totalProjects: 12,
  currentIteration: 'Sprint 24.1',
  attentionItemsCount: 3,
  quarterProgress: 65,
};

const mockQuickActions = [
  {
    label: 'Teams',
    href: '/teams',
    icon: <Users className="h-5 w-5" />,
    variant: 'default' as const,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <FolderOpen className="h-5 w-5" />,
    variant: 'default' as const,
  },
  {
    label: 'Planning',
    href: '/planning',
    icon: <Calendar className="h-5 w-5" />,
    variant: 'default' as const,
  },
  {
    label: 'Tracking',
    href: '/tracking',
    icon: <BarChart3 className="h-5 w-5" />,
    variant: 'default' as const,
  },
];

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <MobileDashboard
        stats={mockStats}
        quickActions={mockQuickActions}
        {...props}
      />
    </BrowserRouter>
  );
};

describe('MobileDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(true);
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isOffline: false,
      installPrompt: null,
      install: vi.fn(),
      isSupported: true,
    });
  });

  it('should not render when not on mobile', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = renderComponent();

    expect(container.firstChild).toBeNull();
  });

  it('should render mobile dashboard with stats', () => {
    renderComponent();

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();
  });

  it('should render current status information', () => {
    renderComponent();

    expect(screen.getByText('Current Status')).toBeInTheDocument();
    expect(screen.getByText('Sprint 24.1')).toBeInTheDocument();
    expect(screen.getByText('Quarter Progress')).toBeInTheDocument();
  });

  it('should show attention items when present', () => {
    renderComponent();

    expect(screen.getByText('Attention Needed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should not show attention items when count is zero', () => {
    const statsWithNoAttention = { ...mockStats, attentionItemsCount: 0 };

    renderComponent({ stats: statsWithNoAttention });

    expect(screen.queryByText('Attention Needed')).not.toBeInTheDocument();
  });

  it('should render quick actions', () => {
    renderComponent();

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: /tracking/i })).toHaveAttribute(
      'href',
      '/tracking'
    );
  });

  it('should show PWA install banner when installable', () => {
    const mockInstall = vi.fn();
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOffline: false,
      installPrompt: {} as any,
      install: mockInstall,
      isSupported: true,
    });

    renderComponent();

    expect(screen.getByText('Install App')).toBeInTheDocument();
    expect(
      screen.getByText('Get faster access and offline support')
    ).toBeInTheDocument();

    const installButton = screen.getByRole('button', { name: /install/i });
    fireEvent.click(installButton);

    expect(mockInstall).toHaveBeenCalled();
  });

  it('should show offline status when offline', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isOffline: true,
      installPrompt: null,
      install: vi.fn(),
      isSupported: true,
    });

    renderComponent();

    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(
      screen.getByText('Some features may be limited')
    ).toBeInTheDocument();
    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
  });

  it('should show online status when connected', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isOffline: false,
      installPrompt: null,
      install: vi.fn(),
      isSupported: true,
    });

    renderComponent();

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('PWA Ready')).toBeInTheDocument();
  });

  it('should display progress bar with correct percentage', () => {
    renderComponent();

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 65%');
  });

  it('should handle quick actions with different variants', () => {
    const actionsWithVariants = [
      ...mockQuickActions,
      {
        label: 'Settings',
        href: '/settings',
        icon: <Calendar className="h-5 w-5" />,
        variant: 'destructive' as const,
      },
    ];

    renderComponent({ quickActions: actionsWithVariants });

    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  it('should handle missing PWA features gracefully', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isOffline: false,
      installPrompt: null,
      install: vi.fn(),
      isSupported: false,
    });

    renderComponent();

    expect(screen.queryByText('PWA Ready')).not.toBeInTheDocument();
  });

  it('should be accessible', () => {
    renderComponent();

    // Check for semantic structure
    expect(screen.getByText('Current Status')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();

    // Check links are accessible
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });

    // Check buttons are accessible when present
    if (screen.queryByRole('button')) {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    }
  });
});
