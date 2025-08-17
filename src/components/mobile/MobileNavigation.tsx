import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  FolderOpen,
  Calendar,
  BarChart3,
  Settings,
  Target,
  PieChart,
  Layers,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileNavigationProps {
  attentionItemsCount?: number;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  attentionItemsCount = 0,
}) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navigationItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      badge: attentionItemsCount > 0 ? attentionItemsCount : undefined,
    },
    {
      href: '/teams',
      icon: Users,
      label: 'Teams',
    },
    {
      href: '/projects',
      icon: FolderOpen,
      label: 'Projects',
    },
    {
      href: '/planning',
      icon: Calendar,
      label: 'Planning',
    },
    {
      href: '/canvas',
      icon: PieChart,
      label: 'Canvas',
    },
  ];

  const moreItems = [
    {
      href: '/tracking',
      icon: BarChart3,
      label: 'Tracking',
    },
    {
      href: '/goals',
      icon: Target,
      label: 'Goals',
    },
    {
      href: '/scenarios',
      icon: Layers,
      label: 'Scenarios',
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings',
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-2 py-1">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative',
                  'text-gray-600 hover:text-blue-600 transition-colors',
                  isActive && 'text-blue-600'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn('h-5 w-5 mb-1', isActive && 'fill-blue-100')}
                  />
                  {item.badge && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                      variant="destructive"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs truncate w-full text-center leading-tight',
                    isActive && 'font-medium'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-b" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu - Could be a slide-up drawer */}
      <div className="hidden">
        {moreItems.map(item => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 p-3 hover:bg-gray-50"
          >
            <item.icon className="h-5 w-5 text-gray-600" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
};

export default MobileNavigation;
