/**
 * Breadcrumb System Component
 *
 * Features:
 * - Dynamic breadcrumb generation based on current route
 * - Hierarchical navigation with parent-child relationships
 * - Customizable breadcrumb items with icons and actions
 * - Keyboard navigation support
 * - Responsive design with overflow handling
 * - Integration with router for navigation
 * - Accessibility improvements with proper ARIA labels
 */

import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  LayoutDashboard,
  Users,
  UserCheck,
  FolderOpen,
  Target,
  Calendar,
  BarChart3,
  Settings,
  Activity,
  GitBranch,
  DollarSign,
  Network,
  Search,
  Map,
  FileText,
  MoreHorizontal,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { spacing, typography, colors } from '@/design-tokens';

// Breadcrumb item definition
export interface BreadcrumbItemData {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  parent?: string;
  description?: string;
  isClickable?: boolean;
}

// Define breadcrumb data structure
const breadcrumbData: Record<string, BreadcrumbItemData> = {
  '/': {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home,
    description: 'Application home',
  },
  '/dashboard': {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    parent: '/',
    description: 'Main overview dashboard',
  },
  '/teams': {
    id: 'teams',
    label: 'Teams',
    path: '/teams',
    icon: Users,
    parent: '/',
    description: 'Team management',
  },
  '/people': {
    id: 'people',
    label: 'People',
    path: '/people',
    icon: UserCheck,
    parent: '/teams',
    description: 'Individual team members',
  },
  '/skills': {
    id: 'skills',
    label: 'Skills',
    path: '/skills',
    icon: Target,
    parent: '/people',
    description: 'Skills and competencies',
  },
  '/projects': {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: FolderOpen,
    parent: '/',
    description: 'Project portfolio',
  },
  '/epics': {
    id: 'epics',
    label: 'Epics',
    path: '/epics',
    icon: Target,
    parent: '/projects',
    description: 'High-level work breakdown',
  },
  '/milestones': {
    id: 'milestones',
    label: 'Milestones',
    path: '/milestones',
    icon: Calendar,
    parent: '/projects',
    description: 'Key project milestones',
  },
  '/planning': {
    id: 'planning',
    label: 'Basic Planning',
    path: '/planning',
    icon: GitBranch,
    parent: '/',
    description: 'Resource planning',
  },
  '/advanced-planning': {
    id: 'advanced-planning',
    label: 'Advanced Planning',
    path: '/advanced-planning',
    icon: Network,
    parent: '/planning',
    description: 'Advanced resource optimization',
  },
  '/journey-planning': {
    id: 'journey-planning',
    label: 'Journey Planning',
    path: '/journey-planning',
    icon: Map,
    parent: '/planning',
    description: 'Long-term roadmap planning',
  },
  '/allocations': {
    id: 'allocations',
    label: 'Allocations',
    path: '/allocations',
    icon: Activity,
    parent: '/',
    description: 'Resource allocations',
  },
  '/tracking': {
    id: 'tracking',
    label: 'Progress Tracking',
    path: '/tracking',
    icon: BarChart3,
    parent: '/allocations',
    description: 'Progress monitoring',
  },
  '/reports': {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    parent: '/',
    description: 'Analytics and reporting',
  },
  '/financials': {
    id: 'financials',
    label: 'Financials',
    path: '/financials',
    icon: DollarSign,
    parent: '/reports',
    description: 'Financial analysis',
  },
  '/scenario-analysis': {
    id: 'scenario-analysis',
    label: 'Scenario Analysis',
    path: '/scenario-analysis',
    icon: Search,
    parent: '/reports',
    description: 'Scenario comparison',
  },
  '/canvas': {
    id: 'canvas',
    label: 'Strategy Canvas',
    path: '/canvas',
    icon: Network,
    parent: '/',
    description: 'Visual strategy planning',
  },
  '/ocr': {
    id: 'ocr',
    label: 'SteerCo OCR',
    path: '/ocr',
    icon: FileText,
    parent: '/',
    description: 'Document processing',
  },
  '/settings': {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    parent: '/',
    description: 'Application settings',
  },
};

interface BreadcrumbSystemProps {
  className?: string;
  maxItems?: number;
  showIcons?: boolean;
  showHome?: boolean;
  separator?: 'chevron' | 'slash';
}

export function BreadcrumbSystem({
  className,
  maxItems = 4,
  showIcons = true,
  showHome = true,
  separator = 'chevron',
}: BreadcrumbSystemProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Build breadcrumb trail from current location
  const breadcrumbTrail = useMemo(() => {
    const currentPath = location.pathname;
    const trail: BreadcrumbItemData[] = [];

    // Find current page data
    const currentPage = breadcrumbData[currentPath];
    if (!currentPage) {
      return [];
    }

    // Build trail by following parent relationships
    let current: BreadcrumbItemData | undefined = currentPage;
    while (current) {
      trail.unshift(current);
      current = current.parent ? breadcrumbData[current.parent] : undefined;
    }

    // Ensure home is included if showHome is true
    if (showHome && trail[0]?.path !== '/') {
      const home = breadcrumbData['/'];
      if (home) {
        trail.unshift(home);
      }
    }

    return trail;
  }, [location.pathname, showHome]);

  // Handle overflow when there are too many items
  const { visibleItems, hiddenItems } = useMemo(() => {
    if (breadcrumbTrail.length <= maxItems) {
      return { visibleItems: breadcrumbTrail, hiddenItems: [] };
    }

    // Always show first and last item, hide middle items
    const first = breadcrumbTrail[0];
    const last = breadcrumbTrail[breadcrumbTrail.length - 1];
    const remaining = breadcrumbTrail.slice(1, -1);

    if (maxItems <= 2) {
      return {
        visibleItems: [first, last],
        hiddenItems: remaining,
      };
    }

    // Show first item, ellipsis, and last few items
    const showCount = maxItems - 2; // Account for first item and ellipsis
    const visible = [first, ...remaining.slice(-showCount + 1), last];
    const hidden = remaining.slice(0, -(showCount - 1));

    return { visibleItems: visible, hiddenItems: hidden };
  }, [breadcrumbTrail, maxItems]);

  // Navigation handler
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigation(path);
    }
  };

  if (breadcrumbTrail.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      <Breadcrumb>
        <BreadcrumbList className="flex items-center">
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const isFirst = index === 0;
            const Icon = item.icon;

            // Show ellipsis if there are hidden items and this is not the first item
            const showEllipsis =
              hiddenItems.length > 0 && index === 1 && !isFirst;

            return (
              <React.Fragment key={item.id}>
                {showEllipsis && (
                  <>
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1"
                            aria-label="Show hidden breadcrumb items"
                          >
                            <BreadcrumbEllipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {hiddenItems.map(hiddenItem => {
                            const HiddenIcon = hiddenItem.icon;
                            return (
                              <DropdownMenuItem
                                key={hiddenItem.id}
                                onClick={() =>
                                  handleNavigation(hiddenItem.path)
                                }
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  {showIcons && HiddenIcon && (
                                    <HiddenIcon className="h-4 w-4" />
                                  )}
                                  <span>{hiddenItem.label}</span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                      {separator === 'chevron' ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        '/'
                      )}
                    </BreadcrumbSeparator>
                  </>
                )}

                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                      {showIcons && Icon && <Icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      <Link
                        to={item.path}
                        className="flex items-center gap-2"
                        onKeyDown={e => handleKeyDown(e, item.path)}
                        title={item.description}
                      >
                        {showIcons && Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && (
                  <BreadcrumbSeparator>
                    {separator === 'chevron' ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      '/'
                    )}
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}

// Hook to get current breadcrumb data
export function useBreadcrumb() {
  const location = useLocation();

  return useMemo(() => {
    const currentPath = location.pathname;
    return breadcrumbData[currentPath] || null;
  }, [location.pathname]);
}

// Component to show breadcrumb context in page headers
export function PageBreadcrumb({
  className,
  showDescription = true,
  ...props
}: BreadcrumbSystemProps & { showDescription?: boolean }) {
  const currentBreadcrumb = useBreadcrumb();

  return (
    <div className={cn('space-y-1', className)}>
      <BreadcrumbSystem {...props} />
      {showDescription && currentBreadcrumb?.description && (
        <p className="text-sm text-muted-foreground leading-5">
          {currentBreadcrumb.description}
        </p>
      )}
    </div>
  );
}

export default BreadcrumbSystem;
