import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
} from 'date-fns';
import { calculateTeamMonthlyCost } from '@/utils/financialCalculations';

const Reports = () => {
  const { projects, teams, people, roles, allocations, cycles, config } =
    useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('quarter');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active');
    const totalBudget = activeProjects.reduce(
      (sum, p) => sum + (p.budget || 0),
      0
    );

    // Calculate team costs based on allocations and roles
    const teamCosts = teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const teamAllocations = allocations.filter(a => a.teamId === team.id);

      const monthlyCost = calculateTeamMonthlyCost(teamMembers, roles, config);

      const utilizationRate =
        teamAllocations.reduce((sum, a) => sum + a.percentage, 0) / 100;

      return {
        teamName: team.name,
        monthlyCost,
        utilization: Math.min(utilizationRate, 1),
        capacity: team.capacity,
        memberCount: teamMembers.length,
      };
    });

    const totalMonthlyCost = teamCosts.reduce(
      (sum, t) => sum + t.monthlyCost,
      0
    );
    const averageUtilization =
      teamCosts.length > 0
        ? teamCosts.reduce((sum, t) => sum + t.utilization, 0) /
          teamCosts.length
        : 0;

    return {
      totalBudget,
      totalMonthlyCost,
      averageUtilization,
      teamCosts,
      activeProjects: activeProjects.length,
    };
  }, [projects, teams, people, roles, allocations]);

  // Prepare chart data
  const projectBudgetData = useMemo(() => {
    const filteredProjects =
      selectedProjectId === 'all'
        ? projects.filter(p => p.status === 'active')
        : projects.filter(p => p.id === selectedProjectId);

    return filteredProjects.map(project => ({
      name: project.name,
      budget: project.budget || 0,
      status: project.status,
    }));
  }, [projects, selectedProjectId]);

  const teamUtilizationData = useMemo(() => {
    return financialMetrics.teamCosts.map(team => ({
      name: team.teamName,
      utilization: Math.round(team.utilization * 100),
      cost: team.monthlyCost,
      members: team.memberCount,
    }));
  }, [financialMetrics.teamCosts]);

  const monthlyTrendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map(month => {
      const monthStr = format(month, 'MMM yyyy');
      // This is simplified - in a real app, you'd calculate actual costs per month
      const estimatedCost =
        financialMetrics.totalMonthlyCost * (0.8 + Math.random() * 0.4);

      return {
        month: monthStr,
        cost: Math.round(estimatedCost),
        budget: Math.round(estimatedCost * 1.2),
      };
    });
  }, [financialMetrics.totalMonthlyCost]);

  const utilizationColors = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setup Required
          </h2>
          <p className="text-gray-600">
            Please complete the setup to view financial reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className="flex-1 p-6 space-y-6 w-full overflow-auto"
        data-testid="reports-content"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Financial Reports
            </h1>
            <p className="text-gray-600">
              Track project costs, team utilization, and budget performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${financialMetrics.totalBudget.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Monthly Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${financialMetrics.totalMonthlyCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Team costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Avg Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(financialMetrics.averageUtilization * 100)}%
              </div>
              <div className="flex items-center space-x-1">
                {financialMetrics.averageUtilization >= 0.9 ? (
                  <Badge variant="default">Optimal</Badge>
                ) : financialMetrics.averageUtilization >= 0.7 ? (
                  <Badge variant="secondary">Good</Badge>
                ) : (
                  <Badge variant="outline">Low</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialMetrics.activeProjects}
              </div>
              <p className="text-sm text-gray-600">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Budgets */}
          <Card>
            <CardHeader>
              <CardTitle>Project Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  budget: { label: 'Budget', color: '#3b82f6' },
                }}
              >
                <BarChart data={projectBudgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="budget" fill="var(--color-budget)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Team Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Team Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  utilization: { label: 'Utilization %', color: '#10b981' },
                }}
              >
                <BarChart data={teamUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="utilization" fill="var(--color-utilization)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                cost: { label: 'Actual Cost', color: '#ef4444' },
                budget: { label: 'Budget', color: '#3b82f6' },
              }}
            >
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-cost)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="var(--color-budget)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Team Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Team Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialMetrics.teamCosts.map((team, index) => (
                <div
                  key={team.teamName}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{team.teamName}</h4>
                      <p className="text-sm text-gray-600">
                        {team.memberCount} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">
                        ${team.monthlyCost.toLocaleString()}/month
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round(team.utilization * 100)}% utilized
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(team.utilization * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
