import React, { useState, useMemo } from 'react';
import {
  Team,
  Cycle,
  Allocation,
  Project,
  Epic,
  RunWorkCategory,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';
import { useApp } from '@/context/AppContext';
import { toast } from '@/components/ui/use-toast';
import RoleComposition from '../teams/RoleComposition';
import QuickAllocationDialog from './QuickAllocationDialog';

interface FinancialYearMatrixProps {
  teams: Team[];
  cycles: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  selectedFinancialYear: string;
  financialYearOptions: {
    value: string;
    label: string;
    startDate: string;
    endDate: string;
  }[];
  onCreateAllocation?: (
    teamId: string,
    cycleId: string,
    projectId?: string
  ) => void;
  onEditAllocation?: (allocation: Allocation) => void;
}

const FinancialYearMatrix: React.FC<FinancialYearMatrixProps> = ({
  teams,
  cycles,
  allocations,
  projects,
  epics,
  runWorkCategories,
  selectedFinancialYear,
  financialYearOptions,
  onCreateAllocation,
  onEditAllocation,
}) => {
  const { addAllocation, divisions, people, roles } = useApp();
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(divisions.map(d => d.id)) // Expand all divisions by default
  );

  // Group teams by division
  const teamsByDivision = useMemo(() => {
    const grouped = teams.reduce(
      (acc, team) => {
        const divisionId = team.divisionId || 'unknown';
        if (!acc[divisionId]) {
          acc[divisionId] = [];
        }
        acc[divisionId].push(team);
        return acc;
      },
      {} as Record<string, Team[]>
    );

    // Sort teams within each division by name
    Object.keys(grouped).forEach(divisionId => {
      grouped[divisionId].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [teams]);

  // Get division name by ID
  const getDivisionName = (divisionId: string) => {
    if (divisionId === 'unknown') return 'Unknown Division';
    const division = divisions.find(d => d.id === divisionId);
    return division?.name || `Division ${divisionId}`;
  };

  // Get team members and role breakdown
  const getTeamInfo = (team: Team) => {
    const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);
    const roleBreakdown = teamMembers.reduce(
      (acc, member) => {
        const role = roles.find(r => r.id === member.roleId);
        const roleName = role?.name || 'Unknown';
        acc[roleName] = (acc[roleName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      memberCount: teamMembers.length,
      roleBreakdown,
    };
  };

  // Color scheme for different allocation types
  const getAllocationColor = (allocation: Allocation) => {
    if (
      allocation.runWorkCategoryId ||
      allocation.notes?.includes('Quick run work')
    ) {
      return 'bg-orange-100 border-l-4 border-orange-400'; // Run work - orange
    }
    return 'bg-blue-100 border-l-4 border-blue-400'; // Change work - blue
  };

  // Toggle division expansion
  const toggleDivisionExpansion = (divisionId: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  };
  const getQuartersForFinancialYear = () => {
    if (!selectedFinancialYear || selectedFinancialYear === 'all') {
      return [];
    }

    const selectedFY = financialYearOptions.find(
      fy => fy.value === selectedFinancialYear
    );

    if (!selectedFY) {
      return [];
    }

    const fyStart = new Date(selectedFY.startDate);
    const fyEnd = new Date(selectedFY.endDate);

    return cycles
      .filter(cycle => {
        if (cycle.type !== 'quarterly') {
          return false;
        }
        const cycleStart = new Date(cycle.startDate);
        return cycleStart >= fyStart && cycleStart <= fyEnd;
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  };

  const quarters = getQuartersForFinancialYear();

  // Get allocations for a specific team and quarter
  const getTeamQuarterAllocations = (teamId: string, quarterId: string) => {
    return allocations.filter(
      a => a.teamId === teamId && a.cycleId === quarterId
    );
  };

  // Calculate team capacity for a quarter
  const getTeamQuarterCapacity = (team: Team, quarter: Cycle) => {
    const quarterAllocations = getTeamQuarterAllocations(team.id, quarter.id);
    const totalPercentage = quarterAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0
    );

    return {
      allocated: totalPercentage,
      available: Math.max(0, 100 - totalPercentage),
      isOverAllocated: totalPercentage > 100,
      allocations: quarterAllocations,
    };
  };

  // Handle Quick Add button click
  const handleQuickAdd = (teamId: string, cycleId: string) => {
    setSelectedTeamId(teamId);
    setSelectedCycleId(cycleId);
    setQuickDialogOpen(true);
  };

  // Handle quick allocation creation
  const handleQuickAllocation = async (
    projectId: string,
    percentage: number
  ) => {
    try {
      // Skip 0% allocations
      if (percentage === 0) {
        setQuickDialogOpen(false);
        return;
      }

      // Create a project-level allocation directly
      const allocationData: Omit<Allocation, 'id'> = {
        teamId: selectedTeamId,
        cycleId: selectedCycleId,
        iterationNumber: 1, // Default to iteration 1 for financial year planning
        percentage,
        notes: `Quick allocation to ${projects.find(p => p.id === projectId)?.name || 'project'}`,
        // Leave epicId and runWorkCategoryId undefined for project-level allocation
      };

      await addAllocation(allocationData);
      setQuickDialogOpen(false);

      // Show success message
      const projectName =
        projects.find(p => p.id === projectId)?.name || 'Project';
      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      const quarterName =
        quarters.find(q => q.id === selectedCycleId)?.name || 'Quarter';

      toast({
        title: 'Allocation Created',
        description: `${teamName} allocated ${percentage}% to ${projectName} for ${quarterName}`,
      });
    } catch (error) {
      console.error('Failed to create quick allocation:', error);
      toast({
        title: 'Allocation Failed',
        description: 'Failed to create allocation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle quick run allocation creation
  const handleQuickRunAllocation = async (percentage: number) => {
    try {
      // Skip 0% allocations
      if (percentage === 0) {
        setQuickDialogOpen(false);
        return;
      }

      // Create a generic run work allocation
      const allocationData: Omit<Allocation, 'id'> = {
        teamId: selectedTeamId,
        cycleId: selectedCycleId,
        iterationNumber: 1,
        percentage,
        notes: `Quick run work allocation (${percentage}%)`,
        // Set runWorkCategoryId to null/undefined for generic run work
        runWorkCategoryId: undefined,
        epicId: undefined,
      };

      await addAllocation(allocationData);
      setQuickDialogOpen(false);

      // Show success message
      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      const quarterName =
        quarters.find(q => q.id === selectedCycleId)?.name || 'Quarter';

      toast({
        title: 'Run Allocation Created',
        description: `${teamName} allocated ${percentage}% to run work for ${quarterName}`,
      });
    } catch (error) {
      console.error('Failed to create run allocation:', error);
      toast({
        title: 'Allocation Failed',
        description: 'Failed to create run allocation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderAllocationCell = (team: Team, quarter: Cycle) => {
    const capacity = getTeamQuarterCapacity(team, quarter);

    return (
      <div className="min-h-[80px] p-2 flex flex-col gap-2">
        {/* Existing Allocations */}
        {capacity.allocations.map(allocation => {
          // Determine display name and type
          let displayName: string;
          let allocationLabel: string = '';

          if (allocation.runWorkCategoryId) {
            // Run work category allocation
            const runWorkCategory = runWorkCategories.find(
              r => r.id === allocation.runWorkCategoryId
            );
            displayName = runWorkCategory?.name || 'Run Work';
          } else if (allocation.epicId) {
            // Epic allocation - show project name + epic name
            const epic = epics.find(e => e.id === allocation.epicId);
            const project = epic
              ? projects.find(p => p.id === epic.projectId)
              : null;
            displayName = project?.name || epic?.name || 'Unknown Epic';
            if (project && epic && project.name !== epic.name) {
              allocationLabel = epic.name; // Show epic name as label if different from project
            }
          } else {
            // Project-level allocation (from Quick Add or elsewhere) OR run work without category
            const noteMatch = allocation.notes?.match(
              /Quick allocation to (.+)/
            );
            const runWorkMatch = allocation.notes?.match(
              /Quick run work allocation/
            );

            if (runWorkMatch) {
              displayName = 'Run Work';
            } else if (noteMatch) {
              displayName = noteMatch[1];
            } else {
              displayName = 'Project Allocation';
            }
          }

          return (
            <div
              key={allocation.id}
              className={`flex items-center justify-between cursor-pointer hover:opacity-90 p-1 rounded-r ${getAllocationColor(allocation)}`}
              onClick={() => onEditAllocation?.(allocation)}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-medium truncate"
                  title={displayName}
                >
                  {displayName}
                </div>
                {allocationLabel && (
                  <div
                    className="text-xs text-gray-500 truncate"
                    title={allocationLabel}
                  >
                    {allocationLabel}
                  </div>
                )}
              </div>
              <Badge
                variant={
                  capacity.isOverAllocated
                    ? 'destructive'
                    : allocation.percentage === 100
                      ? 'default'
                      : 'secondary'
                }
                className="text-xs"
              >
                {allocation.percentage}%
              </Badge>
            </div>
          );
        })}

        {/* Capacity Summary */}
        {capacity.allocated > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Total:</span>
            <div className="flex items-center gap-1">
              <Badge
                variant={capacity.isOverAllocated ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {capacity.allocated}%
              </Badge>
              {capacity.isOverAllocated && (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              )}
            </div>
          </div>
        )}

        {/* Available Capacity */}
        {capacity.available > 0 && (
          <div className="text-xs text-green-600">
            Available: {capacity.available}%
          </div>
        )}

        {/* Quick Add Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-6"
          onClick={() => handleQuickAdd(team.id, quarter.id)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Quick Add
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold">Financial Year Matrix</h2>

            {/* Allocation Type Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-gray-700">Work Types:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1 bg-blue-400 rounded"></div>
                <span>Change Work</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1 bg-orange-400 rounded"></div>
                <span>Run Work</span>
              </div>
            </div>

            {/* Role Composition Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-gray-700">Team Roles:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 bg-blue-500 rounded-full"></div>
                <span>Primary</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 bg-green-500 rounded-full"></div>
                <span>Secondary</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 bg-purple-500 rounded-full"></div>
                <span>Support</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 bg-orange-500 rounded-full"></div>
                <span>Other</span>
              </div>
            </div>
          </div>
          <Badge variant="outline">
            {selectedFinancialYear !== 'all'
              ? financialYearOptions.find(
                  fy => fy.value === selectedFinancialYear
                )?.label
              : 'All Years'}
          </Badge>
        </div>

        {quarters.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Please select a specific financial year to view the quarterly
            matrix.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left sticky left-0 bg-white z-10 min-w-[200px]">
                    Team
                  </th>
                  {quarters.map(quarter => (
                    <th key={quarter.id} className="border p-2 min-w-[200px]">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold">{quarter.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(quarter.startDate).toLocaleDateString()} -{' '}
                          {new Date(quarter.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(teamsByDivision).map(
                  ([divisionId, divisionTeams]) => (
                    <React.Fragment key={divisionId}>
                      {/* Division Header Row */}
                      <tr className="bg-gray-100 border-t-2 border-gray-300">
                        <td className="border p-3 font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">
                          <button
                            onClick={() => toggleDivisionExpansion(divisionId)}
                            className="flex items-center gap-2 w-full text-left hover:bg-gray-200 p-1 rounded"
                          >
                            {expandedDivisions.has(divisionId) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            {getDivisionName(divisionId)}
                            <span className="text-sm font-normal text-gray-500">
                              ({divisionTeams.length} team
                              {divisionTeams.length !== 1 ? 's' : ''})
                            </span>
                          </button>
                        </td>
                        {quarters.map(quarter => (
                          <td
                            key={quarter.id}
                            className="border p-3 bg-gray-100 text-center text-sm text-gray-600"
                          >
                            —
                          </td>
                        ))}
                      </tr>
                      {/* Team Rows */}
                      {expandedDivisions.has(divisionId) &&
                        divisionTeams.map(team => {
                          const teamInfo = getTeamInfo(team);
                          return (
                            <tr key={team.id} className="hover:bg-gray-50">
                              <td className="border p-2 pl-6 font-semibold sticky left-0 bg-white z-10">
                                <div className="flex flex-col gap-1">
                                  <div>{team.name}</div>
                                  <div className="text-xs text-gray-600">
                                    {teamInfo.memberCount} member
                                    {teamInfo.memberCount !== 1 ? 's' : ''}
                                  </div>
                                  {teamInfo.memberCount > 0 && (
                                    <RoleComposition team={team} size="sm" />
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Capacity: {team.capacity}h/week
                                  </div>
                                </div>
                              </td>
                              {quarters.map(quarter => (
                                <td
                                  key={quarter.id}
                                  className="border align-top"
                                >
                                  {renderAllocationCell(team, quarter)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Allocation Dialog */}
      {quickDialogOpen && (
        <QuickAllocationDialog
          open={quickDialogOpen}
          onOpenChange={setQuickDialogOpen}
          teamId={selectedTeamId}
          cycleId={selectedCycleId}
          team={teams.find(t => t.id === selectedTeamId)}
          quarter={quarters.find(q => q.id === selectedCycleId)}
          projects={projects}
          existingAllocations={getTeamQuarterAllocations(
            selectedTeamId,
            selectedCycleId
          )}
          onCreateAllocation={handleQuickAllocation}
          onCreateRunAllocation={handleQuickRunAllocation}
        />
      )}
    </>
  );
};

export default FinancialYearMatrix;
