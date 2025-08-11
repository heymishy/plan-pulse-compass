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
import {
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { calculateTeamCapacity } from '@/utils/capacityUtils';
import { useApp } from '@/context/AppContext';
import { toast } from '@/components/ui/use-toast';
import { getRoleCompositionLegend } from '@/utils/teamUtils';
import RoleComposition from '../teams/RoleComposition';
import QuickAllocationDialog from './QuickAllocationDialog';
import { ClipboardControls } from './AllocationClipboard';
import {
  calculateQuarterlyFinancialSummary,
  calculateTeamCostBreakdown,
  calculateAllocationCostImpact,
  formatCurrency,
  getBudgetStatus,
  type QuarterlyFinancialSummary,
} from '@/utils/financialImpactUtils';

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
  const { addAllocation, divisions, people, roles, config } = useApp();
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(divisions.map(d => d.id)) // Expand all divisions by default
  );

  // Get a sample team for legend (first team with members)
  const sampleTeam = teams.find(team => {
    const members = people.filter(p => p.teamId === team.id && p.isActive);
    return members.length > 0;
  });

  // Group teams by division, filtering out empty default teams when real teams exist
  const teamsByDivision = useMemo(() => {
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

    const grouped = filteredTeams.reduce(
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
  }, [teams, people]);

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

  // Calculate financial summaries for each quarter
  const quarterlyFinancialSummaries = quarters.map(quarter => {
    const quarterBudget = 0; // TODO: Get from project budgets or configuration
    return calculateQuarterlyFinancialSummary(
      quarter,
      allocations,
      teams,
      people,
      roles,
      projects,
      epics,
      config,
      quarterBudget
    );
  });

  // Get allocations for a specific team and quarter, aggregating iteration allocations
  const getTeamQuarterAllocations = (teamId: string, quarterId: string) => {
    // First, get all iterations that belong to this quarter
    const iterationsInQuarter = cycles.filter(
      cycle => cycle.type === 'iteration' && cycle.parentCycleId === quarterId
    );
    const iterationIds = iterationsInQuarter.map(iter => iter.id);

    // Get all allocations for this team in this quarter or its iterations
    const teamAllocations = allocations.filter(a => a.teamId === teamId);

    // Separate iteration and direct quarter allocations
    const iterationAllocations = teamAllocations.filter(a =>
      iterationIds.includes(a.cycleId)
    );
    const directQuarterAllocations = teamAllocations.filter(
      a => a.cycleId === quarterId
    );

    // If no proper parent relationships exist, try to identify iterations by checking
    // if they're cycles that aren't quarters and have allocations in the same time range
    let effectiveIterationAllocations = iterationAllocations;
    if (iterationIds.length === 0 && directQuarterAllocations.length === 0) {
      // Get the quarter date range
      const quarter = cycles.find(c => c.id === quarterId);
      if (quarter) {
        const quarterStart = new Date(quarter.startDate);
        const quarterEnd = new Date(quarter.endDate);

        // Find iteration-type cycles that fall within the quarter timeframe
        const possibleIterations = cycles.filter(cycle => {
          if (cycle.type !== 'iteration') return false;
          const cycleStart = new Date(cycle.startDate);
          return cycleStart >= quarterStart && cycleStart <= quarterEnd;
        });

        const possibleIterationIds = possibleIterations.map(iter => iter.id);
        effectiveIterationAllocations = teamAllocations.filter(a =>
          possibleIterationIds.includes(a.cycleId)
        );
      }
    }

    // Combine all relevant allocations
    const allAllocations = [
      ...effectiveIterationAllocations,
      ...directQuarterAllocations,
    ];

    // Group allocations by key and calculate proper quarterly percentages
    const allocationGroups = new Map<
      string,
      {
        allocations: Allocation[];
        key: string;
        baseAllocation: Allocation;
      }
    >();

    allAllocations.forEach(allocation => {
      let key: string;

      if (allocation.runWorkCategoryId) {
        key = `run-${allocation.runWorkCategoryId}`;
      } else if (allocation.epicId) {
        const epic = epics.find(e => e.id === allocation.epicId);
        const project = epic
          ? projects.find(p => p.id === epic.projectId)
          : null;
        key = project ? `project-${project.id}` : `epic-${allocation.epicId}`;
      } else {
        const noteMatch = allocation.notes?.match(/Quick allocation to (.+)/);
        if (noteMatch) {
          key = `project-${noteMatch[1]}`;
        } else {
          key = `allocation-${allocation.id}`;
        }
      }

      if (!allocationGroups.has(key)) {
        allocationGroups.set(key, {
          allocations: [],
          key,
          baseAllocation: allocation,
        });
      }
      allocationGroups.get(key)!.allocations.push(allocation);
    });

    // Convert groups to aggregated allocations
    const aggregatedAllocations: Allocation[] = [];

    allocationGroups.forEach(({ allocations, key, baseAllocation }) => {
      // Determine if these are iteration or quarter allocations
      const iterationAllocs = allocations.filter(
        a =>
          iterationIds.includes(a.cycleId) ||
          (iterationIds.length === 0 &&
            effectiveIterationAllocations.some(ia => ia.id === a.id))
      );
      const quarterAllocs = allocations.filter(a => a.cycleId === quarterId);

      let quarterlyPercentage: number;

      if (iterationAllocs.length > 0 && quarterAllocs.length === 0) {
        // Pure iteration allocations - calculate average (this is the key fix)
        // 6 iterations × 100% = 600% total, but shows 100% average capacity per iteration
        const totalPercentage = iterationAllocs.reduce(
          (sum, a) => sum + a.percentage,
          0
        );
        quarterlyPercentage = Math.round(
          totalPercentage / iterationAllocs.length
        );
      } else if (quarterAllocs.length > 0 && iterationAllocs.length === 0) {
        // SPECIAL CASE: Check if we have 6 quarter allocations that should be treated as iteration allocations
        // This happens when Planning Matrix creates allocations with quarter IDs instead of iteration IDs
        if (quarterAllocs.length === 6 && iterationIds.length === 6) {
          // 6 allocations to same project at quarter level = likely iteration allocations stored incorrectly
          const totalPercentage = quarterAllocs.reduce(
            (sum, a) => sum + a.percentage,
            0
          );
          quarterlyPercentage = Math.round(
            totalPercentage / quarterAllocs.length
          );
        } else {
          // Pure quarter allocations - sum them up (from Quick Add)
          quarterlyPercentage = quarterAllocs.reduce(
            (sum, a) => sum + a.percentage,
            0
          );
        }
      } else if (iterationAllocs.length > 0 && quarterAllocs.length > 0) {
        // Mixed - average iterations, sum quarters
        const iterationAvg =
          iterationAllocs.reduce((sum, a) => sum + a.percentage, 0) /
          iterationAllocs.length;
        const quarterSum = quarterAllocs.reduce(
          (sum, a) => sum + a.percentage,
          0
        );
        quarterlyPercentage = Math.round(iterationAvg + quarterSum);
      } else {
        quarterlyPercentage = 0;
      }

      aggregatedAllocations.push({
        ...baseAllocation,
        id: key,
        percentage: quarterlyPercentage,
        notes: baseAllocation.notes,
      });
    });

    return aggregatedAllocations;
  };

  // Calculate team capacity for a quarter
  const getTeamQuarterCapacity = (team: Team, quarter: Cycle) => {
    const quarterAllocations = getTeamQuarterAllocations(team.id, quarter.id);

    // The total percentage should be the sum of aggregated allocations
    // Since getTeamQuarterAllocations already averages iteration allocations,
    // we can safely sum the returned percentages
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
    const teamCostBreakdown = calculateTeamCostBreakdown(
      team,
      people,
      roles,
      config
    );

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

          // Calculate cost impact for this allocation
          const costImpact = calculateAllocationCostImpact(
            allocation,
            team,
            quarter,
            teamCostBreakdown,
            projects,
            epics
          );

          return (
            <div
              key={allocation.id}
              className={`flex flex-col cursor-pointer hover:opacity-90 p-1 rounded-r ${getAllocationColor(allocation)}`}
              onClick={() => onEditAllocation?.(allocation)}
            >
              <div className="flex items-center justify-between">
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
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(costImpact.cycleCost, config.currencySymbol)}
                </div>
                <div className="text-xs text-gray-500">
                  {costImpact.cycleLength}w
                </div>
              </div>
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

        {/* Clipboard Controls */}
        <div className="flex justify-center mb-1">
          <ClipboardControls
            teamId={team.id}
            teamName={team.name}
            iterationNumber={1}
            allocations={capacity.allocations}
            compact={true}
          />
        </div>

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
            {sampleTeam && (
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium text-gray-700">Role Types:</span>
                {getRoleCompositionLegend(sampleTeam.id, people, roles).map(
                  role => (
                    <div
                      key={role.roleName}
                      className="flex items-center gap-1"
                    >
                      <div
                        className={`w-3 h-2 rounded-full ${role.color}`}
                      ></div>
                      <span>{role.roleName}</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
          <Badge variant="outline">
            {selectedFinancialYear !== 'all'
              ? financialYearOptions.find(
                  fy => fy.value === selectedFinancialYear
                )?.label
              : 'All Years'}
          </Badge>
        </div>

        {/* Financial Summary Header */}
        {quarterlyFinancialSummaries.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Impact Summary
              </h3>
              <div className="text-xs text-gray-500">
                Quarterly allocation costs
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quarterlyFinancialSummaries.map(summary => {
                const budgetStatus = getBudgetStatus(
                  summary.utilizationPercentage
                );
                const statusColor =
                  budgetStatus === 'under'
                    ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                    : budgetStatus === 'optimal'
                      ? 'text-green-600 bg-green-50 border-green-200'
                      : 'text-red-600 bg-red-50 border-red-200';

                return (
                  <div
                    key={summary.quarterId}
                    className={`border rounded-lg p-3 ${statusColor}`}
                  >
                    <div className="font-medium text-sm mb-1">
                      {summary.quarterName}
                    </div>
                    <div className="text-lg font-bold">
                      {formatCurrency(
                        summary.allocatedCost,
                        config.currencySymbol
                      )}
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {summary.utilizationPercentage.toFixed(0)}% utilized
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {summary.teamBreakdown.length} teams allocated
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                          const teamCostBreakdown = calculateTeamCostBreakdown(
                            team,
                            people,
                            roles,
                            config
                          );
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
                                  <div className="text-xs text-gray-600 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {formatCurrency(
                                      teamCostBreakdown.totalQuarterlyCost,
                                      config.currencySymbol
                                    )}
                                    /qtr
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
