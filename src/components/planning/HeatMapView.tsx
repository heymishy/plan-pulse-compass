import React, { useMemo, useState } from 'react';
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
  Thermometer,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Info,
  ChevronDown,
  ChevronRight,
  Building2,
} from 'lucide-react';
import {
  generateHeatMapData,
  getHeatMapColors,
  getHeatMapLegend,
  getHeatMapStats,
  HeatMapCell,
} from '@/utils/heatMapUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getDivisionName } from '@/utils/teamUtils';
import { useApp } from '@/context/AppContext';

interface HeatMapViewProps {
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
}

const HeatMapView: React.FC<HeatMapViewProps> = ({
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
}) => {
  const { people } = useApp();
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set()
  );
  const heatMapData = useMemo(() => {
    return generateHeatMapData(teams, iterations, allocations);
  }, [teams, iterations, allocations]);

  const filteredTeams = useMemo(() => {
    if (!hideEmptyRows) return teams;

    return teams.filter(team => {
      return heatMapData.some(
        cell => cell.teamId === team.id && cell.level !== 'empty'
      );
    });
  }, [teams, heatMapData, hideEmptyRows]);

  const stats = useMemo(() => {
    const relevantData = heatMapData.filter(cell =>
      filteredTeams.some(team => team.id === cell.teamId)
    );
    return getHeatMapStats(relevantData);
  }, [heatMapData, filteredTeams]);

  const legend = getHeatMapLegend();

  const getHeatMapCell = (
    teamId: string,
    iterationNumber: number
  ): HeatMapCell | undefined => {
    return heatMapData.find(
      cell => cell.teamId === teamId && cell.iterationNumber === iterationNumber
    );
  };

  const getTeamIterationAllocations = (
    teamId: string,
    iterationNumber: number
  ) => {
    return allocations.filter(
      a => a.teamId === teamId && a.iterationNumber === iterationNumber
    );
  };

  const getEpicName = (epicId: string) => {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return 'Unknown Epic';
    const project = projects.find(p => p.id === epic?.projectId);
    return `${project?.name || 'Unknown'} - ${epic.name}`;
  };

  const getRunWorkCategoryName = (categoryId: string) => {
    const category = runWorkCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const handleCellClick = (teamId: string, iterationNumber: number) => {
    const cellAllocations = getTeamIterationAllocations(
      teamId,
      iterationNumber
    );
    if (cellAllocations.length === 1) {
      onEditAllocation(cellAllocations[0]);
    } else if (cellAllocations.length === 0) {
      onCreateAllocation(teamId, iterationNumber);
    } else {
      // Multiple allocations - for now, edit the first one
      onEditAllocation(cellAllocations[0]);
    }
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

    const effectiveTeams =
      teamsWithMembers.length > 0 ? teamsWithMembers : teams;

    effectiveTeams.forEach(team => {
      const divisionKey = team.divisionId || 'no-division';
      if (!grouped.has(divisionKey)) {
        grouped.set(divisionKey, []);
      }
      grouped.get(divisionKey)!.push(team);
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

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.healthScore}%</div>
            <p className="text-sm text-gray-600">Optimal allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
            <p className="text-sm text-gray-600">Teams with allocations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Optimal Cells
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.optimal + stats.nearFull}
            </div>
            <p className="text-sm text-gray-600">
              of {stats.total} total cells
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.over + stats.critical}
            </div>
            <p className="text-sm text-gray-600">Over-allocated cells</p>
          </CardContent>
        </Card>
      </div>

      {/* Heat Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Thermometer className="h-5 w-5 mr-2" />
              Capacity Heat Map
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm max-w-xs">
                    Visual representation of team capacity utilization. Colors
                    indicate allocation levels - click cells to edit
                    allocations.
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
                      className="text-center p-3 border-b font-semibold min-w-24 bg-white"
                    >
                      <div className="text-sm">Iter {index + 1}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        {new Date(iteration.startDate).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(teamsByDivision.entries()).map(
                  ([divisionKey, teamsInDivision]) => {
                    const filteredTeamsInDivision =
                      getFilteredTeamsForDivision(teamsInDivision);
                    const isExpanded = expandedDivisions.has(divisionKey);
                    const divisionName = getDivisionDisplayName(divisionKey);

                    if (filteredTeamsInDivision.length === 0 && hideEmptyRows) {
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
                                ({filteredTeamsInDivision.length} teams)
                              </span>
                            </button>
                          </td>
                        </tr>

                        {/* Teams in Division */}
                        {isExpanded &&
                          filteredTeamsInDivision.map(team => (
                            <tr
                              key={team.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3 font-medium pl-8">
                                <div>
                                  <div className="text-sm">{team.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {team.capacity}h/week
                                  </div>
                                </div>
                              </td>
                              {iterations.map((iteration, index) => {
                                const iterationNumber = index + 1;
                                const heatMapCell = getHeatMapCell(
                                  team.id,
                                  iterationNumber
                                );
                                const colors = heatMapCell
                                  ? getHeatMapColors(
                                      heatMapCell.level,
                                      heatMapCell.intensity
                                    )
                                  : getHeatMapColors('empty', 0);

                                const cellAllocations =
                                  getTeamIterationAllocations(
                                    team.id,
                                    iterationNumber
                                  );

                                return (
                                  <TooltipProvider key={iteration.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <td
                                          className="p-1 text-center cursor-pointer transition-all duration-200 hover:scale-105"
                                          style={{
                                            backgroundColor:
                                              colors.backgroundColor,
                                            borderColor: colors.borderColor,
                                            color: colors.textColor,
                                          }}
                                          onClick={() =>
                                            handleCellClick(
                                              team.id,
                                              iterationNumber
                                            )
                                          }
                                        >
                                          <div className="h-16 w-full flex flex-col items-center justify-center rounded border-2">
                                            {heatMapCell &&
                                            heatMapCell.percentage > 0 ? (
                                              <>
                                                <div className="text-sm font-bold">
                                                  {Math.round(
                                                    heatMapCell.percentage
                                                  )}
                                                  %
                                                </div>
                                                <div className="text-xs opacity-75">
                                                  {cellAllocations.length}{' '}
                                                  allocation
                                                  {cellAllocations.length !== 1
                                                    ? 's'
                                                    : ''}
                                                </div>
                                              </>
                                            ) : (
                                              <div className="text-xs opacity-50">
                                                Click to add
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-sm space-y-1">
                                          <div className="font-medium">
                                            {team.name} - Iteration{' '}
                                            {iterationNumber}
                                          </div>
                                          <div>
                                            Allocation:{' '}
                                            {heatMapCell
                                              ? Math.round(
                                                  heatMapCell.percentage
                                                )
                                              : 0}
                                            %
                                          </div>
                                          <div>
                                            Capacity: {team.capacity}h/week
                                          </div>
                                          {cellAllocations.length > 0 && (
                                            <div className="border-t pt-1 mt-1">
                                              <div className="text-xs text-gray-600">
                                                Allocations:
                                              </div>
                                              {cellAllocations
                                                .slice(0, 3)
                                                .map(allocation => (
                                                  <div
                                                    key={allocation.id}
                                                    className="text-xs"
                                                  >
                                                    •{' '}
                                                    {Math.round(
                                                      allocation.percentage
                                                    )}
                                                    % -{' '}
                                                    {allocation.epicId
                                                      ? getEpicName(
                                                          allocation.epicId
                                                        )
                                                      : getRunWorkCategoryName(
                                                          allocation.runWorkCategoryId!
                                                        )}
                                                  </div>
                                                ))}
                                              {cellAllocations.length > 3 && (
                                                <div className="text-xs text-gray-500">
                                                  ...and{' '}
                                                  {cellAllocations.length - 3}{' '}
                                                  more
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          <div className="text-xs text-gray-500 border-t pt-1">
                                            Click to{' '}
                                            {cellAllocations.length > 0
                                              ? 'edit'
                                              : 'add'}{' '}
                                            allocation
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm font-medium mb-3">Capacity Levels</div>
            <div className="flex flex-wrap gap-3">
              {legend.map(item => {
                const colors = getHeatMapColors(item.level, 80);
                return (
                  <div key={item.level} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border-2"
                      style={{
                        backgroundColor: colors.backgroundColor,
                        borderColor: colors.borderColor,
                      }}
                    />
                    <div className="text-xs">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-500 ml-1">({item.range})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(HeatMapView);
