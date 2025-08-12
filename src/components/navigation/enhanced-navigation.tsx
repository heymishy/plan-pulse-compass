/**
 * Enhanced Navigation Component
 *
 * Features:
 * - Organized navigation groups with logical categorization
 * - Quick search functionality for navigation items
 * - Keyboard shortcuts support
 * - Favorites/bookmarks system
 * - Recent items tracking
 * - Breadcrumb integration
 * - Progressive disclosure for advanced features
 * - Accessibility improvements
 */

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderOpen,
  Target,
  Calendar,
  CalendarDays,
  BarChart3,
  Settings,
  Activity,
  GitBranch,
  DollarSign,
  UserCheck,
  Network,
  Search,
  Map,
  FileText,
  Star,
  Clock,
  ChevronRight,
  ChevronDown,
  Command,
  Heart,
  Zap,
  Filter,
  Plus,
  History,
  BookOpen,
  Briefcase,
  TrendingUp,
  Cog,
} from 'lucide-react';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInput,
  SidebarMenuBadge,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { spacing, typography } from '@/design-tokens';

// Navigation item type definitions
export interface NavigationItem {
  id: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  keywords?: string[];
  badge?: string | number;
  isNew?: boolean;
  isPro?: boolean;
  shortcut?: string;
  subItems?: NavigationItem[];
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  description?: string;
}

// Define navigation structure with logical grouping
const navigationGroups: NavigationGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    defaultExpanded: true,
    description: 'High-level insights and dashboards',
    items: [
      {
        id: 'dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        description: 'Main overview dashboard',
        keywords: ['overview', 'summary', 'metrics', 'kpi'],
        shortcut: 'Cmd+1',
      },
      {
        id: 'canvas',
        path: '/canvas',
        icon: Network,
        label: 'Strategy Canvas',
        description: 'Visual strategy planning',
        keywords: ['strategy', 'visual', 'canvas', 'planning'],
        isNew: true,
      },
      {
        id: 'scenario-analysis',
        path: '/scenario-analysis',
        icon: Search,
        label: 'Scenario Analysis',
        description: 'Compare different planning scenarios',
        keywords: ['scenario', 'analysis', 'compare', 'what-if'],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Users,
    defaultExpanded: true,
    description: 'People, teams, and skill management',
    items: [
      {
        id: 'teams',
        path: '/teams',
        icon: Users,
        label: 'Teams',
        description: 'Manage teams and structure',
        keywords: ['teams', 'groups', 'organization'],
        shortcut: 'Cmd+2',
      },
      {
        id: 'people',
        path: '/people',
        icon: UserCheck,
        label: 'People',
        description: 'Individual team members',
        keywords: ['people', 'employees', 'members', 'individuals'],
      },
      {
        id: 'skills',
        path: '/skills',
        icon: Target,
        label: 'Skills',
        description: 'Skills and competency management',
        keywords: ['skills', 'competencies', 'capabilities', 'expertise'],
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: GitBranch,
    defaultExpanded: false,
    description: 'Project and resource planning tools',
    items: [
      {
        id: 'projects',
        path: '/projects',
        icon: FolderOpen,
        label: 'Projects',
        description: 'Project portfolio management',
        keywords: ['projects', 'portfolio', 'initiatives'],
        shortcut: 'Cmd+3',
      },
      {
        id: 'epics',
        path: '/epics',
        icon: Target,
        label: 'Epics',
        description: 'High-level work breakdown',
        keywords: ['epics', 'features', 'initiatives', 'themes'],
      },
      {
        id: 'milestones',
        path: '/milestones',
        icon: Calendar,
        label: 'Milestones',
        description: 'Key project milestones',
        keywords: ['milestones', 'deadlines', 'checkpoints', 'goals'],
      },
      {
        id: 'calendar',
        path: '/calendar',
        icon: CalendarDays,
        label: 'Calendar',
        description: 'Calendar view of projects and milestones',
        keywords: ['calendar', 'schedule', 'timeline', 'dates'],
      },
      {
        id: 'planning-basic',
        path: '/planning',
        icon: GitBranch,
        label: 'Basic Planning',
        description: 'Standard resource planning',
        keywords: ['planning', 'allocation', 'scheduling'],
      },
      {
        id: 'advanced-planning',
        path: '/advanced-planning',
        icon: Network,
        label: 'Advanced Planning',
        description: 'Complex resource optimization',
        keywords: ['advanced', 'optimization', 'complex', 'algorithms'],
        isPro: true,
      },
      {
        id: 'journey-planning',
        path: '/journey-planning',
        icon: Map,
        label: 'Journey Planning',
        description: 'Long-term roadmap planning',
        keywords: ['journey', 'roadmap', 'long-term', 'timeline'],
      },
      {
        id: 'fy-planning',
        path: '/fy-planning',
        icon: TrendingUp,
        label: 'FY Portfolio Planning',
        description: 'Strategic portfolio planning for financial year',
        keywords: [
          'fy',
          'portfolio',
          'strategic',
          'capacity',
          'hiring',
          'bottlenecks',
        ],
        isPro: true,
      },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: Activity,
    defaultExpanded: false,
    description: 'Track progress and allocations',
    items: [
      {
        id: 'allocations',
        path: '/allocations',
        icon: Activity,
        label: 'Allocations',
        description: 'Current resource allocations',
        keywords: ['allocations', 'assignments', 'workload', 'capacity'],
        shortcut: 'Cmd+4',
      },
      {
        id: 'tracking',
        path: '/tracking',
        icon: BarChart3,
        label: 'Progress Tracking',
        description: 'Monitor project progress',
        keywords: ['tracking', 'progress', 'monitoring', 'status'],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: TrendingUp,
    defaultExpanded: false,
    description: 'Analytics and reporting',
    items: [
      {
        id: 'reports',
        path: '/reports',
        icon: BarChart3,
        label: 'Reports',
        description: 'Generate detailed reports',
        keywords: ['reports', 'analytics', 'insights', 'data'],
        shortcut: 'Cmd+5',
      },
      {
        id: 'financials',
        path: '/financials',
        icon: DollarSign,
        label: 'Financials',
        description: 'Cost and budget analysis',
        keywords: ['financials', 'budget', 'cost', 'money', 'roi'],
      },
      {
        id: 'ocr',
        path: '/ocr',
        icon: FileText,
        label: 'SteerCo OCR',
        description: 'Document processing and analysis',
        keywords: ['ocr', 'documents', 'processing', 'steerco'],
        isNew: true,
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Cog,
    defaultExpanded: false,
    description: 'System configuration and settings',
    items: [
      {
        id: 'settings',
        path: '/settings',
        icon: Settings,
        label: 'Settings',
        description: 'Application settings',
        keywords: ['settings', 'configuration', 'preferences', 'admin'],
        shortcut: 'Cmd+,',
      },
    ],
  },
];

interface EnhancedNavigationProps {
  className?: string;
}

interface NavigationState {
  favorites: string[];
  recentItems: string[];
  collapsedGroups: string[];
}

export function EnhancedNavigation({ className }: EnhancedNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationState, setNavigationState] = useState<NavigationState>({
    favorites: [],
    recentItems: [],
    collapsedGroups: ['planning', 'execution', 'insights', 'administration'],
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track recent items when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const allItems = navigationGroups.flatMap(group => group.items);
    const currentItem = allItems.find(item => item.path === currentPath);

    if (currentItem) {
      setNavigationState(prev => ({
        ...prev,
        recentItems: [
          currentItem.id,
          ...prev.recentItems.filter(id => id !== currentItem.id),
        ].slice(0, 5),
      }));
    }
  }, [location.pathname]);

  // Filter navigation items based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return navigationGroups;
    }

    const query = searchQuery.toLowerCase();
    return navigationGroups
      .map(group => ({
        ...group,
        items: group.items.filter(
          item =>
            item.label.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.keywords?.some(keyword =>
              keyword.toLowerCase().includes(query)
            )
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery]);

  // Get recent items for quick access
  const recentItems = useMemo(() => {
    const allItems = navigationGroups.flatMap(group => group.items);
    return navigationState.recentItems
      .map(id => allItems.find(item => item.id === id))
      .filter(Boolean) as NavigationItem[];
  }, [navigationState.recentItems]);

  // Get favorite items
  const favoriteItems = useMemo(() => {
    const allItems = navigationGroups.flatMap(group => group.items);
    return navigationState.favorites
      .map(id => allItems.find(item => item.id === id))
      .filter(Boolean) as NavigationItem[];
  }, [navigationState.favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback((itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(itemId)
        ? prev.favorites.filter(id => id !== itemId)
        : [...prev.favorites, itemId],
    }));
  }, []);

  // Toggle group collapse
  const toggleGroupCollapse = useCallback((groupId: string) => {
    setNavigationState(prev => ({
      ...prev,
      collapsedGroups: prev.collapsedGroups.includes(groupId)
        ? prev.collapsedGroups.filter(id => id !== groupId)
        : [...prev.collapsedGroups, groupId],
    }));
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      // Handle navigation shortcuts
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key >= '1' &&
        event.key <= '9'
      ) {
        const allItems = navigationGroups.flatMap(group => group.items);
        const itemWithShortcut = allItems.find(
          item =>
            item.shortcut === `Cmd+${event.key}` ||
            item.shortcut === `Ctrl+${event.key}`
        );
        if (itemWithShortcut) {
          event.preventDefault();
          navigate(itemWithShortcut.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Render navigation item
  const renderNavItem = useCallback(
    (item: NavigationItem, isSubItem = false) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      const isFavorite = navigationState.favorites.includes(item.id);
      const isRecent = navigationState.recentItems.includes(item.id);

      const menuButton = (
        <SidebarMenuButton
          asChild
          isActive={isActive}
          size={isSubItem ? 'sm' : 'default'}
          className={cn(
            'group relative',
            isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
            isSubItem && 'ml-2'
          )}
        >
          <Link
            to={item.path}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                className={cn('shrink-0', isSubItem ? 'h-3 w-3' : 'h-4 w-4')}
              />
              <span className="truncate">{item.label}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {item.isNew && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  New
                </Badge>
              )}

              {item.isPro && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  Pro
                </Badge>
              )}

              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}

              {!isSubItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0',
                    isFavorite && 'opacity-100'
                  )}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  aria-label={
                    isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                >
                  <Star
                    className={cn(
                      'h-3 w-3',
                      isFavorite
                        ? 'fill-current text-yellow-500'
                        : 'text-muted-foreground'
                    )}
                  />
                </Button>
              )}
            </div>
          </Link>
        </SidebarMenuButton>
      );

      if (item.shortcut || item.description) {
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">
                    {item.description}
                  </div>
                )}
                {item.shortcut && (
                  <div className="text-xs font-mono bg-muted px-1 rounded">
                    {item.shortcut}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      }

      return menuButton;
    },
    [
      location.pathname,
      navigationState.favorites,
      navigationState.recentItems,
      toggleFavorite,
    ]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex flex-col h-full', className)}>
        {/* Header with search */}
        <SidebarHeader
          className={cn('space-y-2', `p-${spacing.semantic.component.md}`)}
        >
          <div className="flex items-center justify-between">
            <h2
              className={cn(
                'font-semibold text-sidebar-foreground',
                `font-size: ${typography.textStyles['heading-md'].fontSize}`,
                `line-height: ${typography.textStyles['heading-md'].lineHeight}`
              )}
            >
              Plan Pulse Compass
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput
              ref={searchInputRef}
              placeholder="Search navigation... (⌘K)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
              data-search-input="true"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-auto">
          {/* Quick Access Section */}
          {(favoriteItems.length > 0 || recentItems.length > 0) &&
            !searchQuery && (
              <>
                {favoriteItems.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>
                      <Heart className="h-4 w-4" />
                      Favorites
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {favoriteItems.map(item => (
                          <SidebarMenuItem key={`fav-${item.id}`}>
                            {renderNavItem(item)}
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {recentItems.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>
                      <Clock className="h-4 w-4" />
                      Recent
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {recentItems.slice(0, 3).map(item => (
                          <SidebarMenuItem key={`recent-${item.id}`}>
                            {renderNavItem(item)}
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                <SidebarSeparator />
              </>
            )}

          {/* Main Navigation Groups */}
          {filteredGroups.map(group => {
            const GroupIcon = group.icon;
            const isCollapsed = navigationState.collapsedGroups.includes(
              group.id
            );
            const isCollapsible = group.isCollapsible !== false;

            return (
              <SidebarGroup key={group.id}>
                <Collapsible
                  open={!isCollapsed}
                  onOpenChange={() =>
                    isCollapsible && toggleGroupCollapse(group.id)
                  }
                >
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        'group flex items-center justify-between w-full',
                        isCollapsible &&
                          'hover:bg-sidebar-accent/50 cursor-pointer'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4" />
                        <span>{group.label}</span>
                      </div>
                      {isCollapsible && (
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform',
                            !isCollapsed && 'rotate-90'
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map(item => (
                          <SidebarMenuItem key={item.id}>
                            {renderNavItem(item)}

                            {/* Render subitems if any */}
                            {item.subItems && (
                              <SidebarMenuSub>
                                {item.subItems.map(subItem => (
                                  <SidebarMenuSubItem key={subItem.id}>
                                    <SidebarMenuSubButton asChild>
                                      <Link to={subItem.path}>
                                        <subItem.icon className="h-3 w-3" />
                                        {subItem.label}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            )}
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            );
          })}

          {/* No results message */}
          {searchQuery && filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No navigation items found for "{searchQuery}"
              </p>
            </div>
          )}
        </SidebarContent>
      </div>
    </TooltipProvider>
  );
}

export default EnhancedNavigation;
