import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Team, Allocation, ActualAllocation, IterationReview, Project, Epic, Cycle } from '@/types';
import { TrendingUp, CheckCircle2, AlertTriangle, Target, Users } from 'lucide-react';

interface TrackingDashboardProps {
  cycleId: string;
  teams: Team[];
  allocations: Allocation[];
  actualAllocations: ActualAllocation[];
  iterationReviews: IterationReview[];
  projects: Project[];
  epics: Epic[];
  iterations: Cycle[];
}

const TrackingDashboard: React.FC<TrackingDashboardProps> = ({
  cycleId,
  teams,
  allocations,
  actualAllocations,
  iterationReviews,
  projects,
  epics,
  iterations
}) => {
  const dashboardData = useMemo(() => {
    const quarterAllocations = allocations.filter(a => a.cycleId === cycleId);
    const quarterActuals = actualAllocations.filter(a => a.cycleId === cycleId);
    const quarterReviews = iterationReviews.filter(r => r.cycleId === cycleId);
    
    // Get all iteration numbers
    const allIterationsNumbers = Array.from(new Set([
      ...quarterAllocations.map(a => a.iterationNumber),
      ...quarterActuals.map(a => a.iterationNumber)
    ])).sort();
    
    // Team utilization trends
    const teamUtilizationData = teams.map(team => {
      const teamData = {
        team: team.name,
        capacity: team.capacity,
        plannedAvg: 0,
        actualAvg: 0,
        iterations: 0,
      };
      
      allIterationsNumbers.forEach(iterationNumber => {
        const planned = quarterAllocations
          .filter(a => a.teamId === team.id && a.iterationNumber === iterationNumber)
          .reduce((sum, a) => sum + a.percentage, 0);
        const actual = quarterActuals
          .filter(a => a.teamId === team.id && a.iterationNumber === iterationNumber)
          .reduce((sum, a) => sum + a.actualPercentage, 0);
        
        if (planned > 0 || actual > 0) {
          teamData.plannedAvg += planned;
          teamData.actualAvg += actual;
          teamData.iterations++;
        }
      });
      
      if (teamData.iterations > 0) {
        teamData.plannedAvg /= teamData.iterations;
        teamData.actualAvg /= teamData.iterations;
      }
      
      return teamData;
    }).filter(data => data.iterations > 0);
    
    // Iteration progress data
    const iterationProgressData = allIterationsNumbers.map(iterationNumber => {
      const review = quarterReviews.find(r => r.iterationNumber === iterationNumber);
      const planned = quarterAllocations
        .filter(a => a.iterationNumber === iterationNumber)
        .reduce((sum, a) => sum + a.percentage, 0);
      const actual = quarterActuals
        .filter(a => a.iterationNumber === iterationNumber)
        .reduce((sum, a) => sum + a.actualPercentage, 0);
      
      return {
        iteration: `Iter ${iterationNumber}`,
        iterationNumber,
        planned,
        actual,
        completed: review?.status === 'completed',
        completedEpics: review?.completedEpics.length || 0,
      };
    });
    
    // Epic completion data
    const epicCompletionData = projects.map(project => {
      const projectEpics = epics.filter(e => e.projectId === project.id);
      const completedEpicsInQuarter = quarterReviews
        .flatMap(r => r.completedEpics)
        .filter(epicId => projectEpics.some(e => e.id === epicId));
      
      return {
        project: project.name,
        total: projectEpics.length,
        completed: new Set(completedEpicsInQuarter).size,
        percentage: projectEpics.length > 0 ? (new Set(completedEpicsInQuarter).size / projectEpics.length) * 100 : 0,
      };
    }).filter(data => data.total > 0);
    
    // Variance distribution
    const varianceDistribution = quarterActuals.map(actual => {
      const planned = quarterAllocations.find(a => 
        a.teamId === actual.teamId && 
        a.iterationNumber === actual.iterationNumber &&
        ((a.epicId && a.epicId === actual.actualEpicId) || 
         (a.runWorkCategoryId && a.runWorkCategoryId === actual.actualRunWorkCategoryId))
      );
      
      if (planned) {
        const variance = actual.actualPercentage - planned.percentage;
        return {
          variance,
          type: variance > 5 ? 'Over' : variance < -5 ? 'Under' : 'On Track',
        };
      }
      return null;
    }).filter(Boolean as any);
    
    const varianceTypes = varianceDistribution.reduce((acc, item) => {
      if (item) {
        acc[item.type] = (acc[item.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const varianceChartData = Object.entries(varianceTypes).map(([type, count]) => ({
      name: type,
      value: count,
      color: type === 'On Track' ? '#10b981' : type === 'Over' ? '#ef4444' : '#f59e0b',
    }));
    
    // Consolidated Summary Stats
    const completedReviews = quarterReviews.filter(r => r.status === 'completed').length;
    const totalIterations = iterations.length;
    
    return {
      teamUtilizationData,
      iterationProgressData,
      epicCompletionData,
      varianceChartData,
      summaryStats: {
        reviewProgress: totalIterations > 0 ? Math.round((completedReviews / totalIterations) * 100) : 0,
        completedReviews,
        totalIterations,
        teamsWithActuals: new Set(quarterActuals.map(a => a.teamId)).size,
        totalTeams: teams.length,
        totalEpics: epics.length,
        completedEpics: new Set(quarterReviews.flatMap(r => r.completedEpics)).size,
        avgVariance: varianceDistribution.length > 0 
          ? varianceDistribution.reduce((sum, item) => sum + Math.abs(item!.variance), 0) / varianceDistribution.length 
          : 0,
      }
    };
  }, [cycleId, teams, allocations, actualAllocations, iterationReviews, projects, epics, iterations]);

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Review Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summaryStats.reviewProgress}%</div>
            <p className="text-sm text-gray-600">
              {dashboardData.summaryStats.completedReviews}/{dashboardData.summaryStats.totalIterations} iterations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Team Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summaryStats.teamsWithActuals}/{dashboardData.summaryStats.totalTeams}
            </div>
            <p className="text-sm text-gray-600">Teams with actuals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Epic Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summaryStats.completedEpics}/{dashboardData.summaryStats.totalEpics}
            </div>
            <Progress 
              value={dashboardData.summaryStats.totalEpics > 0 ? (dashboardData.summaryStats.completedEpics / dashboardData.summaryStats.totalEpics) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Avg Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summaryStats.avgVariance.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Average deviation</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Team Utilization: Planned vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                planned: { label: "Planned %", color: "#3b82f6" },
                actual: { label: "Actual %", color: "#10b981" },
              }}
            >
              <BarChart data={dashboardData.teamUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="plannedAvg" fill="var(--color-planned)" name="Planned %" />
                <Bar dataKey="actualAvg" fill="var(--color-actual)" name="Actual %" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Variance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <ChartContainer
              config={{
                value: { label: "Count" },
              }}
              className="w-full"
            >
              <PieChart>
                <Pie
                  data={dashboardData.varianceChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {dashboardData.varianceChartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Iteration Progress Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Iteration Progress Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ChartContainer
            config={{
              planned: { label: "Planned Total %", color: "#3b82f6" },
              actual: { label: "Actual Total %", color: "#10b981" },
            }}
          >
            <LineChart data={dashboardData.iterationProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="planned" stroke="var(--color-planned)" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Epic Completion by Project */}
      <Card>
        <CardHeader>
          <CardTitle>Epic Completion by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.epicCompletionData.map(project => (
              <div key={project.project} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{project.project}</span>
                  <span className="text-sm text-gray-600">
                    {project.completed}/{project.total} epics ({project.percentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={project.percentage} className="h-2" />
              </div>
            ))}
            {dashboardData.epicCompletionData.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No projects with epics to display.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingDashboard;
