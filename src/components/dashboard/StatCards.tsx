import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FolderOpen,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { Person, Team, Project, Allocation } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  calculateAllocationCost,
  getDefaultConfig,
} from '@/utils/financialCalculations';
import { getCurrentQuarterByDate } from '@/utils/dateUtils';

interface StatCardsProps {
  people: Person[];
  teams: Team[];
  projects: Project[];
  allocations: Allocation[];
}

const StatCards: React.FC<StatCardsProps> = ({
  people,
  teams,
  projects,
  allocations,
}) => {
  const {
    skills,
    personSkills,
    cycles,
    actualAllocations,
    roles,
    config,
    epics,
  } = useApp();

  const enhancedStats = useMemo(() => {
    const currentQuarterCycle = getCurrentQuarterByDate(
      cycles.filter(c => c.type === 'quarterly')
    );
    const currentQuarterCycles = currentQuarterCycle
      ? cycles.filter(
          cycle =>
            cycle.quarter === currentQuarterCycle.quarter &&
            cycle.financialYear === currentQuarterCycle.financialYear
        )
      : [];

    // Calculate financial metrics
    const currentQuarterAllocations = allocations.filter(allocation =>
      currentQuarterCycles.some(cycle => cycle.id === allocation.cycleId)
    );

    const totalSpend = currentQuarterAllocations.reduce((sum, allocation) => {
      const cycle = currentQuarterCycles.find(c => c.id === allocation.cycleId);
      if (cycle) {
        const teamMembers = people.filter(
          p => p.teamId === allocation.teamId && p.isActive
        );
        return (
          sum +
          calculateAllocationCost(
            allocation,
            cycle,
            teamMembers,
            roles,
            config || getDefaultConfig()
          )
        );
      }
      return sum;
    }, 0);

    // Calculate skills coverage
    const peopleWithSkills = people.filter(
      person =>
        person.isActive && personSkills.some(ps => ps.personId === person.id)
    );
    const skillsCoverage =
      people.length > 0
        ? (peopleWithSkills.length / people.filter(p => p.isActive).length) *
          100
        : 0;

    // Calculate project health
    const activeProjects = projects.filter(p => p.status === 'active');
    const projectsWithIssues = activeProjects.filter(project => {
      // Check if project has epics
      const projectEpics = epics.filter(e => e.projectId === project.id);
      const overdueMilestones = projectEpics.filter(
        epic =>
          epic.targetDate &&
          new Date(epic.targetDate) < new Date() &&
          epic.status !== 'completed'
      );
      return overdueMilestones.length > 0;
    });

    // Calculate capacity utilization
    const totalCapacity = people.filter(p => p.isActive).length * 100; // Assuming 100% capacity per person
    const allocatedCapacity = allocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0
    );
    const utilizationRate =
      totalCapacity > 0 ? (allocatedCapacity / totalCapacity) * 100 : 0;

    return [
      {
        title: 'Active People',
        value: people.filter(p => p.isActive).length,
        total: people.length,
        icon: Users,
        color: 'text-blue-600',
        subtitle: `${skillsCoverage.toFixed(0)}% with skills`,
        trend:
          skillsCoverage > 80
            ? 'positive'
            : skillsCoverage > 60
              ? 'neutral'
              : 'negative',
      },
      {
        title: 'Teams',
        value: teams.filter(t => t.status === 'active').length,
        total: teams.length,
        icon: Users,
        color: 'text-green-600',
        subtitle: `${Math.round(teams.length > 0 ? people.filter(p => p.isActive).length / teams.filter(t => t.status === 'active').length : 0)} avg size`,
        trend: 'neutral',
      },
      {
        title: 'Active Projects',
        value: activeProjects.length,
        total: projects.length,
        icon: FolderOpen,
        color: 'text-purple-600',
        subtitle:
          projectsWithIssues.length > 0
            ? `${projectsWithIssues.length} at risk`
            : 'All on track',
        trend:
          projectsWithIssues.length === 0
            ? 'positive'
            : projectsWithIssues.length < activeProjects.length * 0.2
              ? 'neutral'
              : 'negative',
      },
      {
        title: 'Quarter Spend',
        value: totalSpend,
        icon: DollarSign,
        color: 'text-orange-600',
        subtitle: `${allocations.length} allocations`,
        trend:
          utilizationRate > 90
            ? 'negative'
            : utilizationRate > 70
              ? 'positive'
              : 'neutral',
        format: 'currency',
      },
    ];
  }, [
    people,
    teams,
    projects,
    allocations,
    skills,
    personSkills,
    cycles,
    actualAllocations,
    roles,
    config,
    epics,
  ]);

  const stats = enhancedStats;

  const formatValue = (value: number, format?: string) => {
    if (format === 'currency') {
      // Handle NaN, null, undefined values
      const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: (config && config.currencySymbol) || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(safeValue);
    }
    return (isNaN(value) || !isFinite(value) ? 0 : value).toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return CheckCircle;
      case 'negative':
        return AlertTriangle;
      default:
        return TrendingUp;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = getTrendIcon(stat.trend);
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(stat.value, stat.format)}
                {stat.total && (
                  <span className="text-sm text-gray-500 font-normal">
                    /{stat.total}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                <TrendIcon className={`h-3 w-3 ${getTrendColor(stat.trend)}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatCards;
