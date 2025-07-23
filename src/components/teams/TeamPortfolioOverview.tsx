import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building,
  Target,
  Activity,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

const TeamPortfolioOverview = () => {
  const {
    teams,
    people,
    divisions,
    allocations,
    cycles,
    epics,
    runWorkCategories,
    projects,
  } = useApp();

  const portfolioData = useMemo(() => {
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
      const projectAllocations = teamAllocations.filter(a => a.epicId);

      const runWorkPercentage =
        teamAllocations.length > 0
          ? (runWorkAllocations.length / teamAllocations.length) * 100
          : 0;

      const projectWorkPercentage =
        teamAllocations.length > 0
          ? (projectAllocations.length / teamAllocations.length) * 100
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

      // Get division info
      const division = divisions.find(d => d.id === team.divisionId);

      return {
        teamId: team.id,
        teamName: team.name,
        divisionName: division?.name || 'Unknown',
        divisionId: team.divisionId,
        memberCount: teamMembers.length,
        capacity: team.capacity,
        utilization: Math.round(totalUtilization),
        runWorkPercentage: Math.round(runWorkPercentage),
        projectWorkPercentage: Math.round(projectWorkPercentage),
        isOverAllocated: totalUtilization > 100,
        isUnderAllocated: totalUtilization < 80,
        isHealthy: totalUtilization >= 80 && totalUtilization <= 100,
      };
    });

    // Division rollups
    const divisionRollups = divisions.map(division => {
      const divisionTeams = teamMetrics.filter(
        t => t.divisionId === division.id
      );
      const totalTeams = divisionTeams.length;
      const avgUtilization =
        divisionTeams.length > 0
          ? divisionTeams.reduce((sum, t) => sum + t.utilization, 0) /
            divisionTeams.length
          : 0;
      const avgRunWork =
        divisionTeams.length > 0
          ? divisionTeams.reduce((sum, t) => sum + t.runWorkPercentage, 0) /
            divisionTeams.length
          : 0;
      const overAllocatedTeams = divisionTeams.filter(
        t => t.isOverAllocated
      ).length;
      const underAllocatedTeams = divisionTeams.filter(
        t => t.isUnderAllocated
      ).length;

      return {
        divisionId: division.id,
        divisionName: division.name,
        totalTeams,
        avgUtilization: Math.round(avgUtilization),
        avgRunWork: Math.round(avgRunWork),
        overAllocatedTeams,
        underAllocatedTeams,
        healthyTeams: totalTeams - overAllocatedTeams - underAllocatedTeams,
      };
    });

    // Overall portfolio metrics
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
    const healthyTeams = teamMetrics.filter(t => t.isHealthy).length;

    return {
      teamMetrics,
      divisionRollups,
      portfolio: {
        totalTeams,
        avgUtilization: Math.round(avgUtilization),
        avgRunWork: Math.round(avgRunWork),
        overAllocatedTeams,
        underAllocatedTeams,
        healthyTeams,
      },
    };
  }, [teams, people, divisions, allocations, cycles]);

  const { teamMetrics, divisionRollups, portfolio } = portfolioData;

  // Chart data for division utilization heat map
  const divisionUtilizationData = divisionRollups.map(div => ({
    name: div.divisionName,
    utilization: div.avgUtilization,
    teams: div.totalTeams,
    runWork: div.avgRunWork,
  }));

  // Chart data for team size distribution
  const teamSizeData = [
    {
      size: 'Small (5-7)',
      count: teamMetrics.filter(t => t.memberCount >= 5 && t.memberCount <= 7)
        .length,
    },
    {
      size: 'Medium (8-10)',
      count: teamMetrics.filter(t => t.memberCount >= 8 && t.memberCount <= 10)
        .length,
    },
    {
      size: 'Large (11+)',
      count: teamMetrics.filter(t => t.memberCount >= 11).length,
    },
  ];

  // Chart data for run vs project work
  const workDistributionData = [
    {
      name: 'Project Work',
      value: 100 - portfolio.avgRunWork,
      fill: '#3b82f6',
    },
    { name: 'Run Work', value: portfolio.avgRunWork, fill: '#6b7280' },
  ];

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600';
    if (utilization >= 80) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getUtilizationBadgeVariant = (utilization: number) => {
    if (utilization > 100) return 'destructive';
    if (utilization >= 80) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.totalTeams}</div>
            <p className="text-xs text-gray-500">
              Across {divisions.length} divisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Utilization
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getUtilizationColor(portfolio.avgUtilization)}`}
            >
              {portfolio.avgUtilization}%
            </div>
            <Progress value={portfolio.avgUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Run Work Burden
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.avgRunWork}%</div>
            <p className="text-xs text-gray-500">Target: 40%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Teams</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.healthyTeams}</div>
            <p className="text-xs text-gray-500">
              {portfolio.overAllocatedTeams} over,{' '}
              {portfolio.underAllocatedTeams} under
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Division Utilization Heat Map */}
        <Card>
          <CardHeader>
            <CardTitle>Division Utilization Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={divisionUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="utilization"
                  fill="#3b82f6"
                  name="Utilization %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Run vs Project Work Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Size Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Team Size Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamSizeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Number of Teams" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Division Rollup Table */}
      <Card>
        <CardHeader>
          <CardTitle>Division Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Division</th>
                  <th className="text-left py-2">Teams</th>
                  <th className="text-left py-2">Avg Utilization</th>
                  <th className="text-left py-2">Run Work %</th>
                  <th className="text-left py-2">Health Status</th>
                </tr>
              </thead>
              <tbody>
                {divisionRollups.map(division => (
                  <tr key={division.divisionId} className="border-b">
                    <td className="py-2 font-medium">
                      {division.divisionName}
                    </td>
                    <td className="py-2">{division.totalTeams}</td>
                    <td className="py-2">
                      <Badge
                        variant={getUtilizationBadgeVariant(
                          division.avgUtilization
                        )}
                      >
                        {division.avgUtilization}%
                      </Badge>
                    </td>
                    <td className="py-2">{division.avgRunWork}%</td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600">
                          {division.healthyTeams} healthy
                        </Badge>
                        {division.overAllocatedTeams > 0 && (
                          <Badge variant="destructive">
                            {division.overAllocatedTeams} over
                          </Badge>
                        )}
                        {division.underAllocatedTeams > 0 && (
                          <Badge variant="secondary">
                            {division.underAllocatedTeams} under
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPortfolioOverview;
