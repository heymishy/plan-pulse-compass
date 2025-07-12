import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Team,
  Cycle,
  Allocation,
  Project,
  Epic,
  RunWorkCategory,
} from '@/types';
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';
import { BulkSelection } from './BulkOperationsPanel';

interface PlanningMatrixProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  onEditAllocation: (allocation: Allocation) => void;
  onCreateAllocation: (teamId: string, iterationNumber: number) => void;
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  hideEmptyRows?: boolean;
  bulkSelection?: BulkSelection;
  onBulkSelectionChange?: (selection: BulkSelection) => void;
  isBulkMode?: boolean;
}

const PlanningMatrix: React.FC<PlanningMatrixProps> = ({
  teams,
  iterations,
  allocations,
  onEditAllocation,
  onCreateAllocation,
  projects,
  epics,
  runWorkCategories,
  hideEmptyRows = false,
  bulkSelection,
  onBulkSelectionChange,
  isBulkMode = false,
}) => {
  const getTeamIterationAllocations = (
    teamId: string,
    iterationNumber: number
  ) => {
    return allocations.filter(
      a => a.teamId === teamId && a.iterationNumber === iterationNumber
    );
  };

  const getAllocationBadge = (percentage: number, capacityHours: number) => {
    if (percentage === 0) return null;
    const roundedPercentage = Math.round(percentage);
    if (percentage < 100)
      return (
        <Badge variant="secondary">
          {roundedPercentage}% ({Math.round(capacityHours * (percentage / 100))}
          h)
        </Badge>
      );
    if (percentage === 100)
      return (
        <Badge className="bg-green-500">
          {roundedPercentage}% ({Math.round(capacityHours)}h)
        </Badge>
      );
    return (
      <Badge variant="destructive">
        {roundedPercentage}% ({Math.round(capacityHours * (percentage / 100))}h)
      </Badge>
    );
  };

  const getAllocationStatus = (percentage: number) => {
    if (percentage === 0) return null;
    if (percentage < 100)
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (percentage === 100)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getEpicName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown Epic';
    const project = projects.find(p => p.id === epic.projectId);
    return `${project?.name || 'Unknown'} - ${epic.name}`;
  };

  const getRunWorkCategoryName = (categoryId: string) => {
    const category = runWorkCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const handleEmptyCellClick = (teamId: string, iterationNumber: number) => {
    if (isBulkMode && bulkSelection && onBulkSelectionChange) {
      handleCellSelection(teamId, iterationNumber);
    } else {
      onCreateAllocation(teamId, iterationNumber);
    }
  };

  const handleCellSelection = (teamId: string, iterationNumber: number) => {
    if (!bulkSelection || !onBulkSelectionChange) return;

    const newTeams = new Set(bulkSelection.teams);
    const newIterations = new Set(bulkSelection.iterations);

    const isTeamSelected = newTeams.has(teamId);
    const isIterationSelected = newIterations.has(iterationNumber);
    const isCellSelected = isTeamSelected && isIterationSelected;

    if (isCellSelected) {
      // Deselect this specific cell - more complex logic needed
      // For now, just toggle the team and iteration
      if (newTeams.size === 1) {
        newTeams.delete(teamId);
      }
      if (newIterations.size === 1) {
        newIterations.delete(iterationNumber);
      }
    } else {
      // Select this cell
      newTeams.add(teamId);
      newIterations.add(iterationNumber);
    }

    onBulkSelectionChange({
      teams: newTeams,
      iterations: newIterations,
    });
  };

  const isCellSelected = (teamId: string, iterationNumber: number) => {
    return (
      bulkSelection?.teams.has(teamId) &&
      bulkSelection?.iterations.has(iterationNumber)
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Allocation Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b font-semibold">Team</th>
                  {iterations.map((iteration, index) => (
                    <th
                      key={iteration.id}
                      className="text-center p-3 border-b font-semibold min-w-32"
                    >
                      Iteration {index + 1}
                      <div className="text-xs text-gray-500 font-normal">
                        {new Date(iteration.startDate).toLocaleDateString()} -
                        {new Date(iteration.endDate).toLocaleDateString()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams
                  .filter(team => {
                    if (!hideEmptyRows) return true;
                    // Check if team has any allocations across all iterations
                    return iterations.some((_, index) => {
                      const iterationAllocations = getTeamIterationAllocations(
                        team.id,
                        index + 1
                      );
                      return iterationAllocations.length > 0;
                    });
                  })
                  .map(team => {
                    return (
                      <tr key={team.id} className="border-b">
                        <td className="p-3 font-medium">
                          <div>
                            {team.name}
                            <div className="text-xs text-gray-500">
                              {team.capacity}h/week capacity
                            </div>
                          </div>
                        </td>
                        {iterations.map((iteration, index) => {
                          const iterationAllocations =
                            getTeamIterationAllocations(team.id, index + 1);
                          const capacityCheck = calculateTeamCapacity(
                            team,
                            index + 1,
                            allocations,
                            iterations
                          );

                          const isSelected = isCellSelected(team.id, index + 1);

                          return (
                            <td
                              key={iteration.id}
                              className={`p-3 text-center relative ${
                                isSelected
                                  ? 'bg-blue-50 ring-2 ring-blue-300'
                                  : ''
                              }`}
                            >
                              {isBulkMode && isSelected && (
                                <div className="absolute top-1 right-1">
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                              <div className="space-y-2">
                                <div className="flex items-center justify-center space-x-2">
                                  {getAllocationBadge(
                                    capacityCheck.allocatedPercentage,
                                    capacityCheck.capacityHours
                                  )}
                                  {getAllocationStatus(
                                    capacityCheck.allocatedPercentage
                                  )}
                                </div>

                                {iterationAllocations.length > 0 ? (
                                  <div className="space-y-1">
                                    {iterationAllocations.map(allocation => {
                                      const epic = allocation.epicId
                                        ? epics.find(
                                            e => e.id === allocation.epicId
                                          )
                                        : null;

                                      return (
                                        <div
                                          key={allocation.id}
                                          className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100 bg-gray-50"
                                          onClick={() => {
                                            if (isBulkMode) {
                                              handleCellSelection(
                                                team.id,
                                                index + 1
                                              );
                                            } else {
                                              onEditAllocation(allocation);
                                            }
                                          }}
                                        >
                                          <div className="font-medium">
                                            {Math.round(allocation.percentage)}%
                                          </div>
                                          <div className="text-gray-600">
                                            {allocation.epicId
                                              ? getEpicName(allocation.epicId)
                                              : getRunWorkCategoryName(
                                                  allocation.runWorkCategoryId!
                                                )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div
                                    className="min-h-12 border-2 border-dashed border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors"
                                    onClick={() =>
                                      handleEmptyCellClick(team.id, index + 1)
                                    }
                                  >
                                    <Plus className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>100% allocated</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Under allocated</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Over allocated</span>
            </div>
            <div className="flex items-center space-x-1">
              <Plus className="h-4 w-4 text-gray-400" />
              <span>Click empty cells to add allocation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningMatrix;
