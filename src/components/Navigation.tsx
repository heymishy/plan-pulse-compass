
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FolderOpen, Target, Calendar, 
  BarChart3, Settings, Activity, GitBranch, DollarSign,
  UserCheck, Network, Search
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/people', icon: UserCheck, label: 'People' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/epics', icon: Target, label: 'Epics' },
    { path: '/milestones', icon: Calendar, label: 'Milestones' },
    { path: '/planning', icon: GitBranch, label: 'Planning' },
    { path: '/advanced-planning', icon: Network, label: 'Advanced Planning' },
    { path: '/allocations', icon: Activity, label: 'Allocations' },
    { path: '/tracking', icon: BarChart3, label: 'Tracking' },
    { path: '/scenario-analysis', icon: Search, label: 'Scenario Analysis' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/financials', icon: DollarSign, label: 'Financials' },
    { path: '/skills', icon: Target, label: 'Skills' },
    { path: '/canvas', icon: Network, label: 'Canvas' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 w-64 flex-shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Resource Planner</h1>
      </div>
      <div className="px-3 pb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
