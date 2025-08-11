import React, { useState, useMemo } from 'react';
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
  Division,
} from '@/types';
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Users,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Building2,
  DollarSign,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';
import { getDisplayName } from '@/utils/shortnameUtils';
import { getDivisionName, getRoleCompositionLegend } from '@/utils/teamUtils';
import { BulkSelection } from './BulkOperationsPanel';
import { ClipboardControls } from './AllocationClipboard';
import {
  calculateTeamCostBreakdown,
  formatCurrency,
  type TeamCostBreakdown,
} from '@/utils/financialImpactUtils';
import { useApp } from '@/context/AppContext';
import RoleComposition from '../teams/RoleComposition';

interface PlanningMatrixProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  onEditAllocation: (allocation: Allocation) => void;
  onCreateAllocation: (teamId: string, iterationNumber: number) => void;
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  divisions: Division[];
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
  divisions,
  hideEmptyRows = false,
  bulkSelection,
  onBulkSelectionChange,
  isBulkMode = false,
}) => {
  const { people, roles, config } = useApp();
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set()
  );
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
    const projectName = project ? getDisplayName(project, true) : 'Unknown';
    const epicName = getDisplayName(epic, true);
    return `${projectName} - ${epicName}`;
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

  // Group teams by division, filtering out empty default teams when real teams exist
  const teamsByDivision = useMemo(() => {
    const grouped = new Map<string, Team[]>();

    // Check if there are teams with active members
    const teamsWithMembers = teams.filter(team => {
      const activeMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      return activeMembers.length > 0;
    });

    // Default team names that should be hidden when real teams exist
    const defaultTeamNames = ['Engineering', 'Product', 'Design', 'Marketing'];

    // If there are teams with members, filter out empty default teams
    const filteredTeams =
      teamsWithMembers.length > 0
        ? teams.filter(team => {
            const activeMembers = people.filter(
              p => p.teamId === team.id && p.isActive
            );
            // Keep teams that either have members or aren't default teams
            return (
              activeMembers.length > 0 || !defaultTeamNames.includes(team.name)
            );
          })
        : teams; // If no teams have members, show all teams

    filteredTeams.forEach(team => {
      const divisionKey = team.divisionId || 'no-division';
      if (!grouped.has(divisionKey)) {
        grouped.set(divisionKey, []);
      }
      grouped.get(divisionKey)!.push(team);
    });

    // Sort teams within each division
    grouped.forEach(teamsInDivision => {
      teamsInDivision.sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [teams, people]);

  // Get division display name
  const getDivisionDisplayName = (divisionKey: string) => {
    if (divisionKey === 'no-division') return 'Unassigned Teams';
    return getDivisionName(divisionKey, divisions);
  };

  // Toggle division expansion
  const toggleDivision = (divisionKey: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionKey)) {
        newSet.delete(divisionKey);
      } else {
        newSet.add(divisionKey);
      }
      return newSet;
    });
  };

  // Initialize all divisions as expanded on first render
  React.useEffect(() => {
    setExpandedDivisions(new Set(Array.from(teamsByDivision.keys())));
  }, [teamsByDivision]);

  // Filter teams based on hideEmptyRows
  const getFilteredTeamsForDivision = (teamsInDivision: Team[]) => {
    if (!hideEmptyRows) return teamsInDivision;

    return teamsInDivision.filter(team => {
      // Check if team has any allocations across all iterations
      return iterations.some((_, index) => {
        const iterationAllocations = getTeamIterationAllocations(
          team.id,
          index + 1
        );
        return iterationAllocations.length > 0;
      });
    });
  };

  // Get a sample team for legend (first team with members)
  const sampleTeam = teams.find(team => {
    const members = people.filter(p => p.teamId === team.id && p.isActive);
    return members.length > 0;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Allocation Matrix</CardTitle>

          {/* Role Composition Legend */}
          {sampleTeam && (
            <div className="flex items-center gap-6 text-xs border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-700">Role Types:</span>
              {getRoleCompositionLegend(sampleTeam.id, people, roles).map(
                role => (
                  <div key={role.roleName} className="flex items-center gap-1">
                    <div className={`w-3 h-2 rounded-full ${role.color}`}></div>
                    <span>{role.roleName}</span>
                  </div>
                )
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 border-b font-semibold bg-white sticky left-0 z-20">
                    Team
                  </th>
                  {iterations.map((iteration, index) => (
                    <th
                      key={iteration.id}
                      className="text-center p-3 border-b font-semibold min-w-32 bg-white"
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
                {Array.from(teamsByDivision.entries()).map(
                  ([divisionKey, teamsInDivision]) => {
                    const filteredTeams =
                      getFilteredTeamsForDivision(teamsInDivision);
                    const isExpanded = expandedDivisions.has(divisionKey);
                    const divisionName = getDivisionDisplayName(divisionKey);

                    if (filteredTeams.length === 0 && hideEmptyRows) {
                      return null;
                    }

                    return (
                      <React.Fragment key={divisionKey}>
                        {/* Division Header Row */}
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <td colSpan={iterations.length + 1} className="p-2">
                            <button
                              onClick={() => toggleDivision(divisionKey)}
                              className="flex items-center space-x-2 w-full text-left hover:bg-gray-100 rounded p-2 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              )}
                              <Building2 className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-800">
                                {divisionName}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({filteredTeams.length} teams)
                              </span>
                            </button>
                          </td>
                        </tr>

                        {/* Teams in Division */}
                        {isExpanded &&
                          filteredTeams.map(team => {
                            const teamCostBreakdown =
                              calculateTeamCostBreakdown(
                                team,
                                people,
                                roles,
                                config
                              );
                            return (
                              <tr
                                key={team.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3 font-medium pl-8">
                                  <div>
                                    {team.name}
                                    <div className="text-xs text-gray-500">
                                      {team.capacity}h/week capacity
                                    </div>
                                    <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                      <DollarSign className="w-3 h-3" />
                                      {formatCurrency(
                                        teamCostBreakdown.totalQuarterlyCost,
                                        config.currencySymbol
                                      )}
                                      /qtr
                                    </div>
                                    {people.filter(
                                      p => p.teamId === team.id && p.isActive
                                    ).length > 0 && (
                                      <div className="mt-1">
                                        <RoleComposition
                                          team={team}
                                          size="sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {iterations.map((iteration, index) => {
                                  const iterationAllocations =
                                    getTeamIterationAllocations(
                                      team.id,
                                      index + 1
                                    );
                                  const capacityCheck = calculateTeamCapacity(
                                    team,
                                    index + 1,
                                    allocations,
                                    iterations
                                  );

                                  const isSelected = isCellSelected(
                                    team.id,
                                    index + 1
                                  );

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
                                            {iterationAllocations.map(
                                              allocation => {
                                                const epic = allocation.epicId
                                                  ? epics.find(
                                                      e =>
                                                        e.id ===
                                                        allocation.epicId
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
                                                        onEditAllocation(
                                                          allocation
                                                        );
                                                      }
                                                    }}
                                                  >
                                                    <div className="font-medium">
                                                      {Math.round(
                                                        allocation.percentage
                                                      )}
                                                      %
                                                    </div>
                                                    <div className="text-gray-600">
                                                      {allocation.epicId
                                                        ? getEpicName(
                                                            allocation.epicId
                                                          )
                                                        : getRunWorkCategoryName(
                                                            allocation.runWorkCategoryId!
                                                          )}
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            )}

                                            {/* Clipboard Controls */}
                                            {!isBulkMode && (
                                              <div className="mt-1 flex justify-center">
                                                <ClipboardControls
                                                  teamId={team.id}
                                                  teamName={team.name}
                                                  iterationNumber={index + 1}
                                                  allocations={
                                                    iterationAllocations
                                                  }
                                                  compact={true}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <div
                                              className="min-h-12 border-2 border-dashed border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors"
                                              onClick={() =>
                                                handleEmptyCellClick(
                                                  team.id,
                                                  index + 1
                                                )
                                              }
                                            >
                                              <Plus className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                            </div>

                                            {/* Clipboard Controls for Empty Cells */}
                                            {!isBulkMode && (
                                              <div className="flex justify-center">
                                                <ClipboardControls
                                                  teamId={team.id}
                                                  teamName={team.name}
                                                  iterationNumber={index + 1}
                                                  allocations={[]}
                                                  compact={true}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  }
                )}
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
