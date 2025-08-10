import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { VersionInfo } from './ui/version-info';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';

const Navigation = () => {
  const location = useLocation();
  const [planningExpanded, setPlanningExpanded] = useState(true); // Expanded by default

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/people', icon: UserCheck, label: 'People' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/epics', icon: Target, label: 'Epics' },
    { path: '/milestones', icon: Calendar, label: 'Milestones' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  ];

  const planningItems = [
    { path: '/planning', icon: GitBranch, label: 'Matrix Planning' },
    { path: '/advanced-planning', icon: Network, label: 'Advanced Planning' },
    { path: '/journey-planning', icon: Map, label: 'Journey Planning' },
  ];

  const otherNavItems = [
    { path: '/allocations', icon: Activity, label: 'Allocations' },
    { path: '/tracking', icon: BarChart3, label: 'Tracking' },
    { path: '/scenario-analysis', icon: Search, label: 'Scenario Analysis' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/financials', icon: DollarSign, label: 'Financials' },
    { path: '/skills', icon: Target, label: 'Skills' },
    { path: '/canvas', icon: Network, label: 'Canvas' },
    { path: '/ocr', icon: FileText, label: 'SteerCo OCR' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isPlanningActive = planningItems.some(
    item => location.pathname === item.path
  );

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
          {/* Main Navigation Items */}
          {mainNavItems.map(item => {
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

          {/* Planning Section - Collapsible Group */}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isPlanningActive}
              onClick={() => setPlanningExpanded(!planningExpanded)}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span>Planning</span>
              </div>
              {planningExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarMenuButton>
            {planningExpanded && (
              <SidebarMenuSub>
                {planningItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <SidebarMenuSubItem key={item.path}>
                      <SidebarMenuSubButton asChild isActive={isActive}>
                        <Link to={item.path}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>

          {/* Other Navigation Items */}
          {otherNavItems.map(item => {
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
