import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Users,
  FolderOpen,
  Calendar,
  Target,
  BarChart3,
  Settings,
} from 'lucide-react';
import { getDashboardData } from '@/utils/dashboardUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileDashboard from '@/components/mobile/MobileDashboard';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCards from '@/components/dashboard/StatCards';
import CurrentStatusCard from '@/components/dashboard/CurrentStatusCard';
import QuarterlyProgressCard from '@/components/dashboard/QuarterlyProgressCard';
import AttentionItemsCard from '@/components/dashboard/AttentionItemsCard';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import IterationMetricsCard from '@/components/dashboard/IterationMetricsCard';
import TeamPortfolioInsights from '@/components/dashboard/TeamPortfolioInsights';
import FinancialOverviewCard from '@/components/dashboard/FinancialOverviewCard';
import SkillsInsightsCard from '@/components/dashboard/SkillsInsightsCard';

const Dashboard = () => {
  const {
    people,
    teams,
    projects,
    allocations,
    isSetupComplete,
    cycles,
    actualAllocations,
    iterationReviews,
    epics,
    isDataLoading,
  } = useApp();

  const isMobile = useIsMobile();

  const dashboardData = useMemo(() => {
    if (!isSetupComplete || isDataLoading) {
      return null;
    }

    try {
      const data = getDashboardData(
        cycles,
        allocations,
        actualAllocations,
        iterationReviews,
        projects,
        epics
      );
      return data;
    } catch (error) {
      // Log errors to monitoring service in production
      return null;
    }
  }, [
    isSetupComplete,
    isDataLoading,
    cycles,
    allocations,
    actualAllocations,
    iterationReviews,
    projects,
    epics,
  ]);

  // Show setup required if not complete
  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to start using the planning app.
          </p>
          <Button asChild>
            <Link to="/setup">Go to Setup</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isDataLoading || !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-52" />
            </div>
            <Skeleton className="h-52" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        </div>
      </div>
    );
  }

  const {
    currentQuarter,
    currentIteration,
    quarterlyProgress,
    attentionItems,
    iterationMetrics,
  } = dashboardData;

  // Mobile dashboard data
  const mobileStats = {
    totalPeople: people.length,
    totalTeams: teams.length,
    totalProjects: projects.length,
    currentIteration: currentIteration?.name || 'N/A',
    attentionItemsCount: attentionItems?.length || 0,
    quarterProgress: quarterlyProgress?.percentage || 0,
  };

  const quickActions = [
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

  // Mobile-first approach
  if (isMobile) {
    return <MobileDashboard stats={mobileStats} quickActions={quickActions} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader />

      <StatCards
        people={people}
        teams={teams}
        projects={projects}
        allocations={allocations}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrentStatusCard
              currentQuarter={currentQuarter}
              currentIteration={currentIteration}
            />
            <IterationMetricsCard iterationMetrics={iterationMetrics} />
          </div>
          <QuarterlyProgressCard quarterlyProgress={quarterlyProgress} />
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <FinancialOverviewCard />
          <SkillsInsightsCard />
          <TeamPortfolioInsights />
          <AttentionItemsCard attentionItems={attentionItems} />
          <QuickActionsCard />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
