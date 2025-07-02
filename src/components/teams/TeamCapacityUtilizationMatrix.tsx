import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

const TeamCapacityUtilizationMatrix = () => {
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
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('current');
  const [viewMode, setViewMode] = useState<'matrix' | 'chart' | 'scatter'>(
    'matrix'
  );

  const capacityData = useMemo(() => {
    // Get current quarter and iterations
    const currentQuarter = cycles.find(
      c => c.type === 'quarterly' && c.status === 'active'
    );
    const currentIterations = currentQuarter
      ? cycles.filter(
          c => c.type === 'iteration' && c.parentCycleId === currentQuarter.id
        )
      : [];

    // Calculate capacity metrics for each team
    const teamCapacityMetrics = teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const teamAllocations = allocations.filter(a => a.teamId === team.id);

      // Calculate utilization across iterations
      let totalUtilization = 0;
      let maxUtilization = 0;
      let minUtilization = 100;
      let overAllocatedIterations = 0;
      let underAllocatedIterations = 0;
      let healthyIterations = 0;

      if (currentIterations.length > 0) {
        currentIterations.forEach((_, index) => {
          const capacity = calculateTeamCapacity(
            team,
            index + 1,
            allocations,
            currentIterations
          );
          const utilization = capacity.allocatedPercentage;
          totalUtilization += utilization;
          maxUtilization = Math.max(maxUtilization, utilization);
          minUtilization = Math.min(minUtilization, utilization);

          if (utilization > 100) overAllocatedIterations++;
          else if (utilization < 80) underAllocatedIterations++;
          else healthyIterations++;
        });
        totalUtilization = totalUtilization / currentIterations.length;
      }

      // Calculate run vs project work
      const runWorkAllocations = teamAllocations.filter(
        a => a.runWorkCategoryId
      );
      const projectAllocations = teamAllocations.filter(a => a.epicId);

      const runWorkPercentage =
        teamAllocations.length > 0
          ? (runWorkAllocations.length / teamAllocations.length) * 100
          : 0;

      // Get division info
      const division = divisions.find(d => d.id === team.divisionId);

      // Calculate capacity health score
      const capacityHealthScore = Math.max(
        0,
        100 - Math.abs(totalUtilization - 90)
      );
      const utilizationStability = 100 - (maxUtilization - minUtilization);

      return {
        teamId: team.id,
        teamName: team.name,
        divisionName: division?.name || 'Unknown',
        divisionId: team.divisionId,
        memberCount: teamMembers.length,
        capacity: team.capacity,
        avgUtilization: Math.round(totalUtilization),
        maxUtilization: Math.round(maxUtilization),
        minUtilization: Math.round(minUtilization),
        utilizationStability: Math.round(utilizationStability),
        capacityHealthScore: Math.round(capacityHealthScore),
        overAllocatedIterations,
        underAllocatedIterations,
        healthyIterations,
        runWorkPercentage: Math.round(runWorkPercentage),
        isOverAllocated: totalUtilization > 100,
        isUnderAllocated: totalUtilization < 80,
        isHealthy: totalUtilization >= 80 && totalUtilization <= 100,
        isStable: utilizationStability >= 80,
        riskLevel:
          totalUtilization > 110
            ? 'critical'
            : totalUtilization > 100
              ? 'high'
              : totalUtilization < 60
                ? 'medium'
                : 'low',
      };
    });

    // Filter by division if selected
    const filteredTeamMetrics =
      selectedDivision === 'all'
        ? teamCapacityMetrics
        : teamCapacityMetrics.filter(t => t.divisionId === selectedDivision);

    // Calculate summary metrics
    const totalTeams = filteredTeamMetrics.length;
    const avgUtilization =
      totalTeams > 0
        ? filteredTeamMetrics.reduce((sum, t) => sum + t.avgUtilization, 0) /
          totalTeams
        : 0;
    const overAllocatedTeams = filteredTeamMetrics.filter(
      t => t.isOverAllocated
    ).length;
    const underAllocatedTeams = filteredTeamMetrics.filter(
      t => t.isUnderAllocated
    ).length;
    const healthyTeams = filteredTeamMetrics.filter(t => t.isHealthy).length;
    const stableTeams = filteredTeamMetrics.filter(t => t.isStable).length;

    // Calculate capacity efficiency
    const totalCapacity = filteredTeamMetrics.reduce(
      (sum, t) => sum + t.capacity,
      0
    );
    const totalUtilizedCapacity = filteredTeamMetrics.reduce(
      (sum, t) => sum + t.capacity * (t.avgUtilization / 100),
      0
    );
    const capacityEfficiency =
      totalCapacity > 0 ? (totalUtilizedCapacity / totalCapacity) * 100 : 0;

    // Division rollups
    const divisionCapacityRollups = divisions.map(division => {
      const divisionTeams = filteredTeamMetrics.filter(
        t => t.divisionId === division.id
      );
      const divisionAvgUtilization =
        divisionTeams.length > 0
          ? divisionTeams.reduce((sum, t) => sum + t.avgUtilization, 0) /
            divisionTeams.length
          : 0;
      const overAllocatedCount = divisionTeams.filter(
        t => t.isOverAllocated
      ).length;
      const underAllocatedCount = divisionTeams.filter(
        t => t.isUnderAllocated
      ).length;
      const healthyCount = divisionTeams.filter(t => t.isHealthy).length;

      return {
        divisionId: division.id,
        divisionName: division.name,
        totalTeams: divisionTeams.length,
        avgUtilization: Math.round(divisionAvgUtilization),
        overAllocatedTeams: overAllocatedCount,
        underAllocatedTeams: underAllocatedCount,
        healthyTeams: healthyCount,
        efficiency: Math.round(divisionAvgUtilization),
      };
    });

    return {
      teamCapacityMetrics: filteredTeamMetrics,
      summary: {
        totalTeams,
        avgUtilization: Math.round(avgUtilization),
        overAllocatedTeams,
        underAllocatedTeams,
        healthyTeams,
        stableTeams,
        capacityEfficiency: Math.round(capacityEfficiency),
      },
      divisionCapacityRollups,
    };
  }, [
    teams,
    people,
    divisions,
    allocations,
    cycles,
    epics,
    runWorkCategories,
    projects,
    selectedDivision,
  ]);

  const { teamCapacityMetrics, summary, divisionCapacityRollups } =
    capacityData;

  // Chart data for utilization distribution
  const utilizationDistributionData = [
    {
      category: 'Over Allocated (>100%)',
      count: summary.overAllocatedTeams,
      color: '#ef4444',
    },
    {
      category: 'Healthy (80-100%)',
      count: summary.healthyTeams,
      color: '#10b981',
    },
    {
      category: 'Under Allocated (<80%)',
      count: summary.underAllocatedTeams,
      color: '#f59e0b',
    },
  ];

  // Chart data for division utilization comparison
  const divisionUtilizationData = divisionCapacityRollups.map(div => ({
    name: div.divisionName,
    utilization: div.avgUtilization,
    teams: div.totalTeams,
    healthy: div.healthyTeams,
    overAllocated: div.overAllocatedTeams,
  }));

  // Scatter plot data for utilization vs stability
  const scatterData = teamCapacityMetrics.map(team => ({
    x: team.avgUtilization,
    y: team.utilizationStability,
    z: team.memberCount,
    name: team.teamName,
    division: team.divisionName,
    riskLevel: team.riskLevel,
  }));

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

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getRiskLevelBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Capacity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Utilization
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getUtilizationColor(summary.avgUtilization)}`}
            >
              {summary.avgUtilization}%
            </div>
            <p className="text-xs text-gray-500">Target: 90%</p>
            <Progress value={summary.avgUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Capacity Efficiency
            </CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.capacityEfficiency}%
            </div>
            <p className="text-xs text-gray-500">
              {summary.healthyTeams} healthy teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Over Allocated
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.overAllocatedTeams}
            </div>
            <p className="text-xs text-gray-500">
              {summary.totalTeams > 0
                ? Math.round(
                    (summary.overAllocatedTeams / summary.totalTeams) * 100
                  )
                : 0}
              % of teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stable Teams</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.stableTeams}</div>
            <p className="text-xs text-gray-500">
              {summary.totalTeams > 0
                ? Math.round((summary.stableTeams / summary.totalTeams) * 100)
                : 0}
              % of teams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Controls */}
      <Card>
        <CardHeader>
          <CardTitle>View Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Division:</label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map(division => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">View:</label>
              <Select
                value={viewMode}
                onValueChange={(value: 'matrix' | 'chart' | 'scatter') =>
                  setViewMode(value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matrix">Matrix View</SelectItem>
                  <SelectItem value="chart">Chart View</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilization Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Utilization Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Number of Teams" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Division Utilization Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Division Utilization Comparison</CardTitle>
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
        </div>
      )}

      {/* Scatter Plot */}
      {viewMode === 'scatter' && (
        <Card>
          <CardHeader>
            <CardTitle>Utilization vs Stability Scatter Plot</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Utilization %"
                  domain={[0, 120]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Stability %"
                  domain={[0, 100]}
                />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Teams" data={scatterData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <Card>
          <CardHeader>
            <CardTitle>Team Capacity Utilization Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Team</th>
                    <th className="text-left py-2">Division</th>
                    <th className="text-left py-2">Size</th>
                    <th className="text-left py-2">Avg Utilization</th>
                    <th className="text-left py-2">Stability</th>
                    <th className="text-left py-2">Health Score</th>
                    <th className="text-left py-2">Risk Level</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamCapacityMetrics
                    .sort((a, b) => b.avgUtilization - a.avgUtilization)
                    .map(team => (
                      <tr key={team.teamId} className="border-b">
                        <td className="py-2 font-medium">{team.teamName}</td>
                        <td className="py-2">{team.divisionName}</td>
                        <td className="py-2">{team.memberCount} people</td>
                        <td className="py-2">
                          <Badge
                            variant={getUtilizationBadgeVariant(
                              team.avgUtilization
                            )}
                          >
                            {team.avgUtilization}%
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={team.isStable ? 'default' : 'secondary'}
                          >
                            {team.utilizationStability}%
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge variant="outline">
                            {team.capacityHealthScore}/100
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={getRiskLevelBadgeVariant(team.riskLevel)}
                          >
                            {team.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center space-x-2">
                            {team.isOverAllocated && (
                              <Badge variant="destructive">
                                Over Allocated
                              </Badge>
                            )}
                            {team.isUnderAllocated && (
                              <Badge variant="secondary">Under Allocated</Badge>
                            )}
                            {team.isHealthy && (
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                Healthy
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
      )}

      {/* Teams at Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Teams Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Over Allocated Teams */}
            <Card className="p-4 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-red-800">Over Allocated</h4>
                <Badge variant="destructive">
                  {summary.overAllocatedTeams}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Teams with &gt;100% utilization
              </p>
              <div className="space-y-1">
                {teamCapacityMetrics
                  .filter(team => team.isOverAllocated)
                  .slice(0, 3)
                  .map(team => (
                    <div key={team.teamId} className="text-sm">
                      <span className="font-medium">{team.teamName}</span>
                      <span className="text-red-600 ml-2">
                        {team.avgUtilization}%
                      </span>
                    </div>
                  ))}
                {summary.overAllocatedTeams > 3 && (
                  <div className="text-sm text-gray-500">
                    +{summary.overAllocatedTeams - 3} more teams
                  </div>
                )}
              </div>
            </Card>

            {/* Under Allocated Teams */}
            <Card className="p-4 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-yellow-800">Under Allocated</h4>
                <Badge variant="secondary">{summary.underAllocatedTeams}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Teams with &lt;80% utilization
              </p>
              <div className="space-y-1">
                {teamCapacityMetrics
                  .filter(team => team.isUnderAllocated)
                  .slice(0, 3)
                  .map(team => (
                    <div key={team.teamId} className="text-sm">
                      <span className="font-medium">{team.teamName}</span>
                      <span className="text-yellow-600 ml-2">
                        {team.avgUtilization}%
                      </span>
                    </div>
                  ))}
                {summary.underAllocatedTeams > 3 && (
                  <div className="text-sm text-gray-500">
                    +{summary.underAllocatedTeams - 3} more teams
                  </div>
                )}
              </div>
            </Card>

            {/* Unstable Teams */}
            <Card className="p-4 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-orange-800">Unstable</h4>
                <Badge variant="secondary">
                  {summary.totalTeams - summary.stableTeams}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Teams with low utilization stability
              </p>
              <div className="space-y-1">
                {teamCapacityMetrics
                  .filter(team => !team.isStable)
                  .slice(0, 3)
                  .map(team => (
                    <div key={team.teamId} className="text-sm">
                      <span className="font-medium">{team.teamName}</span>
                      <span className="text-orange-600 ml-2">
                        {team.utilizationStability}% stable
                      </span>
                    </div>
                  ))}
                {summary.totalTeams - summary.stableTeams > 3 && (
                  <div className="text-sm text-gray-500">
                    +{summary.totalTeams - summary.stableTeams - 3} more teams
                  </div>
                )}
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCapacityUtilizationMatrix;
