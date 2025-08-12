import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  FolderOpen,
  Target,
  DollarSign,
  Network,
  Search,
  FileText,
  Brain,
  Settings,
} from 'lucide-react';

const QuickActionsCard = () => {
  const primaryActions = [
    {
      to: '/planning',
      icon: Calendar,
      label: 'Plan Current Quarter',
      variant: 'default' as const,
    },
    {
      to: '/allocations',
      icon: Users,
      label: 'Manage Allocations',
      variant: 'outline' as const,
    },
  ];

  const secondaryActions = [
    {
      to: '/skills',
      icon: Target,
      label: 'Skills Analysis',
    },
    {
      to: '/financials',
      icon: DollarSign,
      label: 'Financial Overview',
    },
    {
      to: '/canvas',
      icon: Network,
      label: 'Strategy Canvas',
    },
    {
      to: '/scenario-analysis',
      icon: Search,
      label: 'Scenario Analysis',
    },
  ];

  const utilityActions = [
    {
      to: '/reports',
      icon: FileText,
      label: 'Reports',
    },
    {
      to: '/ocr',
      icon: Brain,
      label: 'OCR Import',
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary Actions */}
        <div className="space-y-2">
          {primaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                asChild
                variant={action.variant}
                className="w-full justify-start"
              >
                <Link to={action.to}>
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Secondary Actions */}
        <div className="space-y-1">
          {secondaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
              >
                <Link to={action.to}>
                  <Icon className="mr-2 h-3 w-3" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Utility Actions */}
        <div className="grid grid-cols-3 gap-1">
          {utilityActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                asChild
                variant="outline"
                size="sm"
                className="h-8 px-2"
              >
                <Link to={action.to} className="flex flex-col items-center">
                  <Icon className="h-3 w-3" />
                  <span className="text-xs mt-0.5">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
