import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  AlertTriangle,
  Clock,
  Target,
  Activity,
  Download,
  Filter,
} from 'lucide-react';
import { Team, Allocation, Cycle, Epic, Project } from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

export type ChartType = 'bar' | 'pie' | 'donut' | 'line';
export type MetricType =
  | 'allocation'
  | 'capacity'
  | 'efficiency'
  | 'utilization';
export type TimeRange = 'current' | 'next' | 'all';

interface WorkloadMetrics {
  teamId: string;
  teamName: string;
  totalAllocation: number;
  averageAllocation: number;
  capacityUtilization: number;
  iterationCount: number;
  epicCount: number;
  projectCount: number;
  variance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  healthScore: number;
  overallocationRisk: 'low' | 'medium' | 'high' | 'critical';
}

interface WorkloadDistributionChartsProps {
  teams: Team[];
  allocations: Allocation[];
  iterations: Cycle[];
  epics: Epic[];
  projects: Project[];
  selectedCycleId: string;
}

const WorkloadDistributionCharts: React.FC<WorkloadDistributionChartsProps> = ({
  teams,
  allocations,
  iterations,
  epics,
  projects,
  selectedCycleId,
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metricType, setMetricType] = useState<MetricType>('allocation');
  const [timeRange, setTimeRange] = useState<TimeRange>('current');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);

  // Calculate workload metrics for each team
  const workloadMetrics = useMemo(() => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const metrics: WorkloadMetrics[] = [];

    teams.forEach(team => {
      const teamAllocations = relevantAllocations.filter(
        a => a.teamId === team.id
      );

      // Calculate basic metrics
      const totalAllocation = teamAllocations.reduce(
        (sum, alloc) => sum + alloc.percentage,
        0
      );
      const iterationAllocations = iterations.map((_, index) => {
        const iterationNumber = index + 1;
        const iterAllocations = teamAllocations.filter(
          a => a.iterationNumber === iterationNumber
        );
        return iterAllocations.reduce(
          (sum, alloc) => sum + alloc.percentage,
          0
        );
      });

      const averageAllocation =
        iterationAllocations.length > 0
          ? iterationAllocations.reduce((sum, val) => sum + val, 0) /
            iterationAllocations.length
          : 0;

      // Calculate capacity utilization
      const capacityData = iterations.map((_, index) => {
        const iterationNumber = index + 1;
        return calculateTeamCapacity(
          team,
          iterationNumber,
          relevantAllocations,
          iterations
        );
      });

      const averageCapacityUtilization =
        capacityData.length > 0
          ? capacityData.reduce(
              (sum, data) => sum + data.allocatedPercentage,
              0
            ) / capacityData.length
          : 0;

      // Calculate variance (how uneven the workload is across iterations)
      const variance =
        iterationAllocations.length > 0
          ? Math.sqrt(
              iterationAllocations.reduce(
                (sum, val) => sum + Math.pow(val - averageAllocation, 2),
                0
              ) / iterationAllocations.length
            )
          : 0;

      // Determine trend
      const firstHalf = iterationAllocations.slice(
        0,
        Math.ceil(iterationAllocations.length / 2)
      );
      const secondHalf = iterationAllocations.slice(
        Math.ceil(iterationAllocations.length / 2)
      );
      const firstHalfAvg =
        firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (secondHalfAvg > firstHalfAvg + 10) trend = 'increasing';
      else if (secondHalfAvg < firstHalfAvg - 10) trend = 'decreasing';

      // Calculate health score (0-100)
      let healthScore = 100;
      if (averageCapacityUtilization > 100)
        healthScore -= (averageCapacityUtilization - 100) * 2;
      if (averageCapacityUtilization < 40)
        healthScore -= (40 - averageCapacityUtilization) * 1.5;
      if (variance > 30) healthScore -= variance;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Determine overallocation risk
      let overallocationRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const maxCapacity = Math.max(
        ...capacityData.map(d => d.allocatedPercentage)
      );
      if (maxCapacity > 150) overallocationRisk = 'critical';
      else if (maxCapacity > 120) overallocationRisk = 'high';
      else if (maxCapacity > 100) overallocationRisk = 'medium';

      // Count unique epics and projects
      const uniqueEpics = new Set(
        teamAllocations.filter(a => a.epicId).map(a => a.epicId)
      );
      const epicProjects = new Set(
        epics.filter(e => uniqueEpics.has(e.id)).map(e => e.projectId)
      );

      metrics.push({
        teamId: team.id,
        teamName: team.name,
        totalAllocation,
        averageAllocation,
        capacityUtilization: averageCapacityUtilization,
        iterationCount: iterations.length,
        epicCount: uniqueEpics.size,
        projectCount: epicProjects.size,
        variance,
        trend,
        healthScore,
        overallocationRisk,
      });
    });

    return metrics.sort((a, b) => b.totalAllocation - a.totalAllocation);
  }, [teams, allocations, iterations, epics, selectedCycleId]);

  // Filter metrics based on selections
  const filteredMetrics = useMemo(() => {
    let filtered = workloadMetrics;

    if (selectedDivisions.length > 0) {
      const divisionTeamIds = new Set(
        teams
          .filter(t => selectedDivisions.includes(t.divisionId))
          .map(t => t.id)
      );
      filtered = filtered.filter(m => divisionTeamIds.has(m.teamId));
    }

    return filtered;
  }, [workloadMetrics, selectedDivisions, teams]);

  // Get unique divisions
  const divisions = useMemo(() => {
    const divisionSet = new Set(teams.map(t => t.divisionId).filter(Boolean));
    return Array.from(divisionSet).map(divId => {
      const team = teams.find(t => t.divisionId === divId);
      return { id: divId, name: team?.divisionName || divId };
    });
  }, [teams]);

  // Chart data preparation
  const chartData = useMemo(() => {
    return filteredMetrics.map(metric => {
      let value = 0;
      switch (metricType) {
        case 'allocation':
          value = metric.averageAllocation;
          break;
        case 'capacity':
          value = metric.capacityUtilization;
          break;
        case 'efficiency':
          value = metric.healthScore;
          break;
        case 'utilization':
          value = metric.totalAllocation;
          break;
      }

      return {
        name: metric.teamName,
        value: Math.round(value),
        fullData: metric,
      };
    });
  }, [filteredMetrics, metricType]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (filteredMetrics.length === 0) return null;

    const totalTeams = filteredMetrics.length;
    const averageUtilization =
      filteredMetrics.reduce((sum, m) => sum + m.capacityUtilization, 0) /
      totalTeams;
    const overallocatedTeams = filteredMetrics.filter(
      m => m.capacityUtilization > 100
    ).length;
    const underutilizedTeams = filteredMetrics.filter(
      m => m.capacityUtilization < 60
    ).length;
    const healthyTeams = totalTeams - overallocatedTeams - underutilizedTeams;
    const averageHealthScore =
      filteredMetrics.reduce((sum, m) => sum + m.healthScore, 0) / totalTeams;

    return {
      totalTeams,
      averageUtilization,
      overallocatedTeams,
      underutilizedTeams,
      healthyTeams,
      averageHealthScore,
    };
  }, [filteredMetrics]);

  const getMetricColor = (value: number, type: MetricType) => {
    switch (type) {
      case 'allocation':
      case 'capacity':
        if (value > 100) return 'text-red-600 bg-red-50';
        if (value > 90) return 'text-orange-600 bg-orange-50';
        if (value > 60) return 'text-green-600 bg-green-50';
        return 'text-blue-600 bg-blue-50';
      case 'efficiency':
        if (value > 80) return 'text-green-600 bg-green-50';
        if (value > 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={`${colors[risk as keyof typeof colors]} text-xs`}>
        {risk}
      </Badge>
    );
  };

  if (!selectedCycleId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Please select a cycle to view workload distribution charts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Team Workload Distribution
            </CardTitle>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Metric:</label>
              <Select
                value={metricType}
                onValueChange={(value: MetricType) => setMetricType(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allocation">Allocation %</SelectItem>
                  <SelectItem value="capacity">Capacity Usage</SelectItem>
                  <SelectItem value="efficiency">Health Score</SelectItem>
                  <SelectItem value="utilization">Total Utilization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Chart:</label>
              <Select
                value={chartType}
                onValueChange={(value: ChartType) => setChartType(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="donut">Donut Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {divisions.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Division:</label>
                <Select
                  value={
                    selectedDivisions.length === 1
                      ? selectedDivisions[0]
                      : 'all'
                  }
                  onValueChange={value =>
                    setSelectedDivisions(value === 'all' ? [] : [value])
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {divisions.map(div => (
                      <SelectItem key={div.id} value={div.id}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {summaryStats.totalTeams}
              </div>
              <div className="text-sm text-gray-600">Total Teams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Math.round(summaryStats.averageUtilization)}%
              </div>
              <div className="text-sm text-gray-600">Avg Utilization</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {summaryStats.healthyTeams}
              </div>
              <div className="text-sm text-gray-600">Healthy Teams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {summaryStats.overallocatedTeams}
              </div>
              <div className="text-sm text-gray-600">Over-allocated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Math.round(summaryStats.averageHealthScore)}
              </div>
              <div className="text-sm text-gray-600">Health Score</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="table">Detailed View</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <Card>
            <CardContent className="p-6">
              {chartData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="font-medium">No data to display</div>
                  <div className="text-sm">
                    Try adjusting your filters or selecting a different cycle.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Simple Bar Chart Implementation */}
                  {chartType === 'bar' && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-4">
                        {metricType === 'allocation' &&
                          'Average Allocation Percentage'}
                        {metricType === 'capacity' &&
                          'Capacity Utilization Percentage'}
                        {metricType === 'efficiency' && 'Team Health Score'}
                        {metricType === 'utilization' &&
                          'Total Utilization Percentage'}
                      </div>
                      {chartData.map((item, index) => (
                        <div key={item.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              {getTrendIcon(item.fullData.trend)}
                              {getRiskBadge(item.fullData.overallocationRisk)}
                            </div>
                            <div
                              className={`text-sm font-medium px-2 py-1 rounded ${getMetricColor(item.value, metricType)}`}
                            >
                              {item.value}%
                            </div>
                          </div>
                          <Progress
                            value={Math.min(item.value, 150)}
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pie Chart Implementation */}
                  {chartType === 'pie' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Team Distribution
                        </div>
                        {chartData.map((item, index) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: `hsl(${index * 45}, 70%, 50%)`,
                                }}
                              />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {item.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <PieChart className="h-24 w-24 mx-auto mb-2" />
                          <div className="text-sm">
                            Interactive pie chart would be rendered here
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Team</th>
                      <th className="text-left p-4 font-medium">
                        Avg Allocation
                      </th>
                      <th className="text-left p-4 font-medium">
                        Capacity Usage
                      </th>
                      <th className="text-left p-4 font-medium">
                        Health Score
                      </th>
                      <th className="text-left p-4 font-medium">Trend</th>
                      <th className="text-left p-4 font-medium">Risk Level</th>
                      <th className="text-left p-4 font-medium">Projects</th>
                      <th className="text-left p-4 font-medium">Epics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMetrics.map((metric, index) => (
                      <tr
                        key={metric.teamId}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="p-4 font-medium">{metric.teamName}</td>
                        <td className="p-4">
                          {Math.round(metric.averageAllocation)}%
                        </td>
                        <td className="p-4">
                          {Math.round(metric.capacityUtilization)}%
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span>{Math.round(metric.healthScore)}</span>
                            <Progress
                              value={metric.healthScore}
                              className="w-16 h-1"
                            />
                          </div>
                        </td>
                        <td className="p-4">{getTrendIcon(metric.trend)}</td>
                        <td className="p-4">
                          {getRiskBadge(metric.overallocationRisk)}
                        </td>
                        <td className="p-4">{metric.projectCount}</td>
                        <td className="p-4">{metric.epicCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Workload Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                      Teams at Risk
                    </h4>
                    {filteredMetrics
                      .filter(
                        m =>
                          m.overallocationRisk === 'high' ||
                          m.overallocationRisk === 'critical'
                      )
                      .map(metric => (
                        <div
                          key={metric.teamId}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {metric.teamName}
                            </span>
                            {getRiskBadge(metric.overallocationRisk)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {Math.round(metric.capacityUtilization)}% capacity
                            utilization
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Target className="h-4 w-4 mr-2 text-green-500" />
                      Well-Balanced Teams
                    </h4>
                    {filteredMetrics
                      .filter(
                        m =>
                          m.healthScore > 80 && m.overallocationRisk === 'low'
                      )
                      .slice(0, 5)
                      .map(metric => (
                        <div
                          key={metric.teamId}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {metric.teamName}
                            </span>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {Math.round(metric.healthScore)}% health
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {Math.round(metric.capacityUtilization)}% capacity
                            utilization
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <div className="space-y-2 text-sm">
                  {summaryStats && summaryStats.overallocatedTeams > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <strong>Critical:</strong>{' '}
                      {summaryStats.overallocatedTeams} team(s) are
                      over-allocated. Consider redistributing work or extending
                      timelines.
                    </div>
                  )}
                  {summaryStats && summaryStats.underutilizedTeams > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <strong>Opportunity:</strong>{' '}
                      {summaryStats.underutilizedTeams} team(s) are
                      under-utilized. Consider adding more work or reallocating
                      resources.
                    </div>
                  )}
                  {summaryStats && summaryStats.averageHealthScore < 70 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <strong>Warning:</strong> Overall team health is below
                      optimal. Review workload distribution and capacity
                      planning.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkloadDistributionCharts;
