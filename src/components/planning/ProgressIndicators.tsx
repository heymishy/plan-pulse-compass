import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
} from 'lucide-react';
import { Team, Cycle, Allocation, Project, Epic } from '@/types';

interface ProgressIndicatorsProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  selectedCycleId: string;
}

interface PlanningProgress {
  totalCells: number;
  allocatedCells: number;
  completionPercentage: number;
  teamCoverage: number;
  iterationCoverage: number;
  averageAllocation: number;
  overAllocatedCells: number;
  optimalCells: number;
  epicsCovered: number;
  totalEpics: number;
}

const ProgressIndicators: React.FC<ProgressIndicatorsProps> = ({
  teams,
  iterations,
  allocations,
  projects,
  epics,
  selectedCycleId,
}) => {
  const calculateProgress = (): PlanningProgress => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const totalCells = teams.length * iterations.length;

    // Calculate allocated cells (unique team-iteration combinations)
    const allocatedCellsSet = new Set(
      relevantAllocations.map(a => `${a.teamId}-${a.iterationNumber}`)
    );
    const allocatedCells = allocatedCellsSet.size;

    // Calculate team coverage
    const teamsWithAllocations = new Set(
      relevantAllocations.map(a => a.teamId)
    );
    const teamCoverage = (teamsWithAllocations.size / teams.length) * 100;

    // Calculate iteration coverage
    const iterationsWithAllocations = new Set(
      relevantAllocations.map(a => a.iterationNumber)
    );
    const iterationCoverage =
      (iterationsWithAllocations.size / iterations.length) * 100;

    // Calculate average allocation percentage
    const totalAllocation = relevantAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );
    const averageAllocation =
      allocatedCells > 0 ? totalAllocation / allocatedCells : 0;

    // Calculate over-allocated and optimal cells
    const cellAllocations = Array.from(allocatedCellsSet).map(cellKey => {
      const [teamId, iterationNumber] = cellKey.split('-');
      const cellAllocs = relevantAllocations.filter(
        a =>
          a.teamId === teamId && a.iterationNumber === parseInt(iterationNumber)
      );
      return cellAllocs.reduce((sum, a) => sum + a.percentage, 0);
    });

    const overAllocatedCells = cellAllocations.filter(p => p > 100).length;
    const optimalCells = cellAllocations.filter(
      p => p >= 80 && p <= 100
    ).length;

    // Calculate epic coverage
    const epicsWithAllocations = new Set(
      relevantAllocations.filter(a => a.epicId).map(a => a.epicId)
    );
    const totalEpics = epics.length;
    const epicsCovered = epicsWithAllocations.size;

    return {
      totalCells,
      allocatedCells,
      completionPercentage: (allocatedCells / totalCells) * 100,
      teamCoverage,
      iterationCoverage,
      averageAllocation,
      overAllocatedCells,
      optimalCells,
      epicsCovered,
      totalEpics,
    };
  };

  const progress = calculateProgress();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (percentage >= 70) return <Clock className="h-4 w-4 text-blue-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Planning Progress</span>
            </div>
            <Badge
              variant={
                progress.completionPercentage >= 80 ? 'default' : 'secondary'
              }
            >
              {Math.round(progress.completionPercentage)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Completion</span>
              <span className="font-medium">
                {progress.allocatedCells} of {progress.totalCells} cells
              </span>
            </div>
            <Progress value={progress.completionPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>Team Coverage</span>
                </span>
                <span className="font-medium">
                  {Math.round(progress.teamCoverage)}%
                </span>
              </div>
              <Progress value={progress.teamCoverage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Iteration Coverage</span>
                </span>
                <span className="font-medium">
                  {Math.round(progress.iterationCoverage)}%
                </span>
              </div>
              <Progress value={progress.iterationCoverage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              {getStatusIcon(progress.averageAllocation)}
              <span className="ml-2">Average Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(progress.averageAllocation)}%
            </div>
            <p className="text-sm text-gray-600">Per allocated cell</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="ml-2">Optimal Cells</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {progress.optimalCells}
            </div>
            <p className="text-sm text-gray-600">80-100% allocated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="ml-2">Over-allocated</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {progress.overAllocatedCells}
            </div>
            <p className="text-sm text-gray-600">
              {progress.overAllocatedCells > 0
                ? 'Needs attention'
                : 'All good!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Epic Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Target className="h-4 w-4 text-purple-500" />
            <span className="ml-2">Epic Coverage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Epics with allocations</span>
            <span className="text-sm font-medium">
              {progress.epicsCovered} of {progress.totalEpics}
            </span>
          </div>
          <Progress
            value={
              progress.totalEpics > 0
                ? (progress.epicsCovered / progress.totalEpics) * 100
                : 0
            }
            className="h-2"
          />
          <div className="mt-2 text-xs text-gray-600">
            {progress.totalEpics - progress.epicsCovered} epics not yet planned
          </div>
        </CardContent>
      </Card>

      {/* Planning Health Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="ml-2">Planning Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(progress.completionPercentage)}%
              </div>
              <div className="text-xs text-gray-600">Planned</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {progress.optimalCells}
              </div>
              <div className="text-xs text-gray-600">Optimal</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {progress.overAllocatedCells}
              </div>
              <div className="text-xs text-gray-600">Issues</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {Math.round(
                  (progress.epicsCovered / Math.max(progress.totalEpics, 1)) *
                    100
                )}
                %
              </div>
              <div className="text-xs text-gray-600">Epic Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressIndicators;
