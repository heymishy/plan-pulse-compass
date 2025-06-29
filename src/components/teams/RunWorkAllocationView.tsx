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
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Clock,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

const RunWorkAllocationView = () => {
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

  const runWorkData = useMemo(() => {
    // Get current quarter and iterations
    const currentQuarter = cycles.find(
      c => c.type === 'quarterly' && c.status === 'active'
    );
    const currentIterations = currentQuarter
      ? cycles.filter(
          c => c.type === 'iteration' && c.parentCycleId === currentQuarter.id
        )
      : [];

    // Calculate run work metrics for each team
    const teamRunWorkMetrics = teams.map(team => {
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

      // Calculate run work by category
      const runWorkByCategory = runWorkCategories.map(category => {
        const categoryAllocations = runWorkAllocations.filter(
          a => a.runWorkCategoryId === category.id
        );
        const categoryPercentage =
          runWorkAllocations.length > 0
            ? (categoryAllocations.length / runWorkAllocations.length) *
              runWorkPercentage
            : 0;

        return {
          categoryId: category.id,
          categoryName: category.name,
          percentage: categoryPercentage,
          allocationCount: categoryAllocations.length,
        };
      });

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
        runWorkByCategory,
        isHighRunBurden: runWorkPercentage > 50,
        isOptimalRunBurden: runWorkPercentage >= 30 && runWorkPercentage <= 50,
        isLowRunBurden: runWorkPercentage < 30,
        isOverAllocated: totalUtilization > 100,
      };
    });

    // Filter by division if selected
    const filteredTeamMetrics =
      selectedDivision === 'all'
        ? teamRunWorkMetrics
        : teamRunWorkMetrics.filter(t => t.divisionId === selectedDivision);

    // Calculate summary metrics
    const totalTeams = filteredTeamMetrics.length;
    const avgRunWork =
      totalTeams > 0
        ? filteredTeamMetrics.reduce((sum, t) => sum + t.runWorkPercentage, 0) /
          totalTeams
        : 0;
    const highRunBurdenTeams = filteredTeamMetrics.filter(
      t => t.isHighRunBurden
    ).length;
    const optimalRunBurdenTeams = filteredTeamMetrics.filter(
      t => t.isOptimalRunBurden
    ).length;
    const lowRunBurdenTeams = filteredTeamMetrics.filter(
      t => t.isLowRunBurden
    ).length;

    // Run work category breakdown
    const runWorkCategoryBreakdown = runWorkCategories.map(category => {
      const totalCategoryAllocations = filteredTeamMetrics.reduce(
        (sum, team) => {
          const categoryData = team.runWorkByCategory.find(
            c => c.categoryId === category.id
          );
          return sum + (categoryData?.allocationCount || 0);
        },
        0
      );

      const categoryPercentage =
        filteredTeamMetrics.reduce((sum, team) => {
          const categoryData = team.runWorkByCategory.find(
            c => c.categoryId === category.id
          );
          return sum + (categoryData?.percentage || 0);
        }, 0) / totalTeams;

      return {
        categoryId: category.id,
        categoryName: category.name,
        totalAllocations: totalCategoryAllocations,
        avgPercentage: Math.round(categoryPercentage),
      };
    });

    // Division rollups for run work
    const divisionRunWorkRollups = divisions.map(division => {
      const divisionTeams = filteredTeamMetrics.filter(
        t => t.divisionId === division.id
      );
      const divisionAvgRunWork =
        divisionTeams.length > 0
          ? divisionTeams.reduce((sum, t) => sum + t.runWorkPercentage, 0) /
            divisionTeams.length
          : 0;
      const highBurdenTeams = divisionTeams.filter(
        t => t.isHighRunBurden
      ).length;
      const optimalBurdenTeams = divisionTeams.filter(
        t => t.isOptimalRunBurden
      ).length;

      return {
        divisionId: division.id,
        divisionName: division.name,
        totalTeams: divisionTeams.length,
        avgRunWork: Math.round(divisionAvgRunWork),
        highBurdenTeams,
        optimalBurdenTeams,
        isOptimal: divisionAvgRunWork >= 30 && divisionAvgRunWork <= 50,
      };
    });

    return {
      teamRunWorkMetrics: filteredTeamMetrics,
      summary: {
        totalTeams,
        avgRunWork: Math.round(avgRunWork),
        highRunBurdenTeams,
        optimalRunBurdenTeams,
        lowRunBurdenTeams,
      },
      runWorkCategoryBreakdown,
      divisionRunWorkRollups,
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

  const {
    teamRunWorkMetrics,
    summary,
    runWorkCategoryBreakdown,
    divisionRunWorkRollups,
  } = runWorkData;

  // Chart data for run work burden distribution
  const runWorkBurdenData = [
    {
      category: 'High Burden (>50%)',
      count: summary.highRunBurdenTeams,
      color: '#ef4444',
    },
    {
      category: 'Optimal (30-50%)',
      count: summary.optimalRunBurdenTeams,
      color: '#10b981',
    },
    {
      category: 'Low Burden (<30%)',
      count: summary.lowRunBurdenTeams,
      color: '#f59e0b',
    },
  ];

  // Chart data for run work categories
  const runWorkCategoriesData = runWorkCategoryBreakdown.map(cat => ({
    name: cat.categoryName,
    percentage: cat.avgPercentage,
    allocations: cat.totalAllocations,
  }));

  // Chart data for division run work comparison
  const divisionRunWorkData = divisionRunWorkRollups.map(div => ({
    name: div.divisionName,
    runWork: div.avgRunWork,
    teams: div.totalTeams,
    optimal: div.isOptimal ? 1 : 0,
  }));

  const getRunWorkStatusColor = (percentage: number) => {
    if (percentage > 50) return 'text-red-600';
    if (percentage >= 30) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getRunWorkBadgeVariant = (percentage: number) => {
    if (percentage > 50) return 'destructive';
    if (percentage >= 30) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Run Work Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Run Work</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getRunWorkStatusColor(summary.avgRunWork)}`}
            >
              {summary.avgRunWork}%
            </div>
            <p className="text-xs text-gray-500">Target: 40%</p>
            <Progress value={summary.avgRunWork} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimal Teams</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.optimalRunBurdenTeams}
            </div>
            <p className="text-xs text-gray-500">
              {summary.highRunBurdenTeams} high, {summary.lowRunBurdenTeams} low
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Burden Teams
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.highRunBurdenTeams}
            </div>
            <p className="text-xs text-gray-500">
              {summary.totalTeams > 0
                ? Math.round(
                    (summary.highRunBurdenTeams / summary.totalTeams) * 100
                  )
                : 0}
              % of teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTeams}</div>
            <p className="text-xs text-gray-500">Analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
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
              <label className="text-sm font-medium">Timeframe:</label>
              <Select
                value={selectedTimeframe}
                onValueChange={setSelectedTimeframe}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Quarter</SelectItem>
                  <SelectItem value="last">Last Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Run Work Burden Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Run Work Burden Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={runWorkBurdenData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Number of Teams" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Run Work Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Run Work Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={runWorkCategoriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" name="Avg %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Division Run Work Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Division Run Work Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={divisionRunWorkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="runWork" fill="#f59e0b" name="Run Work %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Teams at Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teams at Risk - High Run Work Burden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Team</th>
                  <th className="text-left py-2">Division</th>
                  <th className="text-left py-2">Run Work %</th>
                  <th className="text-left py-2">Utilization</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {teamRunWorkMetrics
                  .filter(team => team.isHighRunBurden)
                  .sort((a, b) => b.runWorkPercentage - a.runWorkPercentage)
                  .map(team => (
                    <tr key={team.teamId} className="border-b">
                      <td className="py-2 font-medium">{team.teamName}</td>
                      <td className="py-2">{team.divisionName}</td>
                      <td className="py-2">
                        <Badge
                          variant={getRunWorkBadgeVariant(
                            team.runWorkPercentage
                          )}
                        >
                          {team.runWorkPercentage}%
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            team.isOverAllocated ? 'destructive' : 'default'
                          }
                        >
                          {team.utilization}%
                        </Badge>
                      </td>
                      <td className="py-2">
                        {team.isOverAllocated ? (
                          <Badge variant="destructive">Over Allocated</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </td>
                      <td className="py-2">
                        <Badge variant="destructive">High Risk</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Run Work Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Run Work Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {runWorkCategoryBreakdown.map(category => (
              <Card key={category.categoryId} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{category.categoryName}</h4>
                  <Badge variant="outline">{category.avgPercentage}%</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {category.totalAllocations} allocations across{' '}
                  {summary.totalTeams} teams
                </p>
                <Progress value={category.avgPercentage} className="mt-2" />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunWorkAllocationView;
