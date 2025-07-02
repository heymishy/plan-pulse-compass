import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

const TeamPortfolioInsights = () => {
  const {
    teams,
    people,
    divisions,
    allocations,
    cycles,
    epics,
    runWorkCategories,
  } = useApp();

  const teamInsights = useMemo(() => {
    // Get current quarter
    const currentQuarter = cycles.find(
      c => c.type === 'quarterly' && c.status === 'active'
    );
    const currentIterations = currentQuarter
      ? cycles.filter(
          c => c.type === 'iteration' && c.parentCycleId === currentQuarter.id
        )
      : [];

    // Calculate team metrics
    const teamMetrics = teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const teamAllocations = allocations.filter(a => a.teamId === team.id);

      // Calculate run vs project work
      const runWorkAllocations = teamAllocations.filter(
        a => a.runWorkCategoryId
      );
      const runWorkPercentage =
        teamAllocations.length > 0
          ? (runWorkAllocations.length / teamAllocations.length) * 100
          : 0;

      // Calculate utilization
      let totalUtilization = 0;
      if (currentIterations.length > 0) {
        currentIterations.forEach((_, index) => {
          const capacity = calculateTeamCapacity(
            team,
            index + 1,
            allocations,
            currentIterations
          );
          totalUtilization += capacity.allocatedPercentage;
        });
        totalUtilization = totalUtilization / currentIterations.length;
      }

      return {
        teamId: team.id,
        teamName: team.name,
        memberCount: teamMembers.length,
        utilization: Math.round(totalUtilization),
        runWorkPercentage: Math.round(runWorkPercentage),
        isOverAllocated: totalUtilization > 100,
        isUnderAllocated: totalUtilization < 80,
        isHighRunBurden: runWorkPercentage > 50,
        isOptimalRunBurden: runWorkPercentage >= 30 && runWorkPercentage <= 50,
      };
    });

    // Calculate summary metrics
    const totalTeams = teams.length;
    const avgUtilization =
      teamMetrics.length > 0
        ? teamMetrics.reduce((sum, t) => sum + t.utilization, 0) /
          teamMetrics.length
        : 0;
    const avgRunWork =
      teamMetrics.length > 0
        ? teamMetrics.reduce((sum, t) => sum + t.runWorkPercentage, 0) /
          teamMetrics.length
        : 0;
    const overAllocatedTeams = teamMetrics.filter(
      t => t.isOverAllocated
    ).length;
    const underAllocatedTeams = teamMetrics.filter(
      t => t.isUnderAllocated
    ).length;
    const highRunBurdenTeams = teamMetrics.filter(
      t => t.isHighRunBurden
    ).length;
    const optimalRunBurdenTeams = teamMetrics.filter(
      t => t.isOptimalRunBurden
    ).length;

    // Get teams requiring attention
    const teamsRequiringAttention = teamMetrics
      .filter(team => team.isOverAllocated || team.isHighRunBurden)
      .sort((a, b) => {
        // Prioritize over-allocated teams, then high run burden
        if (a.isOverAllocated && !b.isOverAllocated) return -1;
        if (!a.isOverAllocated && b.isOverAllocated) return 1;
        return b.runWorkPercentage - a.runWorkPercentage;
      })
      .slice(0, 5);

    return {
      summary: {
        totalTeams,
        avgUtilization: Math.round(avgUtilization),
        avgRunWork: Math.round(avgRunWork),
        overAllocatedTeams,
        underAllocatedTeams,
        highRunBurdenTeams,
        optimalRunBurdenTeams,
      },
      teamsRequiringAttention,
    };
  }, [teams, people, divisions, allocations, cycles, epics, runWorkCategories]);

  const { summary, teamsRequiringAttention } = teamInsights;

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600';
    if (utilization >= 80) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getRunWorkStatusColor = (percentage: number) => {
    if (percentage > 50) return 'text-red-600';
    if (percentage >= 30) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Portfolio Insights</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/teams">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getUtilizationColor(summary.avgUtilization)}`}
            >
              {summary.avgUtilization}%
            </div>
            <div className="text-sm text-gray-600">Avg Utilization</div>
            <Progress value={summary.avgUtilization} className="mt-2" />
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getRunWorkStatusColor(summary.avgRunWork)}`}
            >
              {summary.avgRunWork}%
            </div>
            <div className="text-sm text-gray-600">Run Work Burden</div>
            <Progress value={summary.avgRunWork} className="mt-2" />
          </div>
        </div>

        {/* Health Indicators */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {summary.overAllocatedTeams}
            </div>
            <div className="text-xs text-gray-600">Over Allocated</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {summary.optimalRunBurdenTeams}
            </div>
            <div className="text-xs text-gray-600">Optimal Run</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {summary.highRunBurdenTeams}
            </div>
            <div className="text-xs text-gray-600">High Run Burden</div>
          </div>
        </div>

        {/* Teams Requiring Attention */}
        {teamsRequiringAttention.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-900">
                Teams Requiring Attention
              </span>
            </div>
            <div className="space-y-1">
              {teamsRequiringAttention.map(team => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium truncate">{team.teamName}</span>
                  <div className="flex items-center space-x-2">
                    {team.isOverAllocated && (
                      <Badge variant="destructive" className="text-xs">
                        {team.utilization}% util
                      </Badge>
                    )}
                    {team.isHighRunBurden && (
                      <Badge variant="secondary" className="text-xs">
                        {team.runWorkPercentage}% run
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link to="/teams?tab=run-work">
                <Target className="h-4 w-4 mr-1" />
                Run Work
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link to="/teams?tab=utilization">
                <Activity className="h-4 w-4 mr-1" />
                Utilization
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPortfolioInsights;
