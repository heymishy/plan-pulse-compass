import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderOpen,
  Target,
  Calendar,
  BarChart3,
  Settings,
  Activity,
  GitBranch,
  DollarSign,
  UserCheck,
  Network,
  Search,
  Map,
} from 'lucide-react';
import { VersionInfo } from './ui/version-info';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/squad-management', icon: UserPlus, label: 'Team Builder' },
    { path: '/people', icon: UserCheck, label: 'People' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/epics', icon: Target, label: 'Epics' },
    { path: '/milestones', icon: Calendar, label: 'Milestones' },
    { path: '/planning', icon: GitBranch, label: 'Planning' },
    { path: '/advanced-planning', icon: Network, label: 'Advanced Planning' },
    { path: '/journey-planning', icon: Map, label: 'Journey Planning' },
    { path: '/allocations', icon: Activity, label: 'Allocations' },
    { path: '/tracking', icon: BarChart3, label: 'Tracking' },
    { path: '/scenario-analysis', icon: Search, label: 'Scenario Analysis' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/financials', icon: DollarSign, label: 'Financials' },
    { path: '/skills', icon: Target, label: 'Skills' },
    { path: '/canvas', icon: Network, label: 'Canvas' },
    { path: '/ocr', icon: Search, label: 'OCR' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Resource Planner
          </h1>
          <SidebarTrigger className="md:hidden" />
        </div>
        <VersionInfo variant="compact" className="w-full justify-start" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
};

export default Navigation;
