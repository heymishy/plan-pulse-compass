
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  CalendarCheck,
  Home,
  Settings,
  BarChart3,
  Users,
  FolderOpen,
  Target,
  Share2,
  UserCheck,
  TrendingUp,
  DollarSign,
  Layers,
  Star
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/people', icon: UserCheck, label: 'People' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/epics', icon: Layers, label: 'Epics' },
    { path: '/skills', icon: Star, label: 'Skills' },
    { path: '/financials', icon: DollarSign, label: 'Financials' },
    { path: '/planning', icon: Calendar, label: 'Planning' },
    { path: '/allocations', icon: CalendarCheck, label: 'Allocations' },
    { path: '/tracking', icon: TrendingUp, label: 'Tracking' },
    { path: '/milestones', icon: Target, label: 'Milestones' },
    { path: '/canvas', icon: Share2, label: 'Canvas' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <h1 className="text-xl font-bold text-gray-900 mr-6">Team Planning</h1>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to={item.path} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
