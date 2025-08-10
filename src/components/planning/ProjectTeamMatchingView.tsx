import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  CheckCircle,
  Users,
  Search,
  Target,
  ArrowUpDown,
  Building2,
  Minus,
  Info,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Project, Team, Skill, Solution } from '@/types';
import {
  calculateTeamProjectCompatibility,
  getProjectRequiredSkills,
  TeamProjectCompatibility,
} from '@/utils/skillBasedPlanning';

interface ProjectTeamMatchingViewProps {
  projects: Project[];
  teams: Team[];
  skills: Skill[];
  solutions: Solution[];
  projectSolutions: any[];
  projectSkills: any[];
  people: any[];
  personSkills: any[];
  allocations: any[];
  cycles: any[];
}

interface MatrixCell {
  projectId: string;
  teamId: string;
  matchType: 'excellent' | 'good' | 'fair' | 'poor' | 'no-capacity';
  compatibilityScore: number;
  capacityStatus: 'available' | 'partial' | 'overloaded';
  skillsMatched: number;
  skillsRequired: number;
  reasoning: string[];
}

interface DivisionGroup {
  division: string;
  teams: Team[];
}

const ProjectTeamMatchingView: React.FC<ProjectTeamMatchingViewProps> = ({
  projects,
  teams,
  skills,
  solutions,
  projectSolutions,
  projectSkills,
  people,
  personSkills,
  allocations,
  cycles,
}) => {
  // Filter and sort states
  const [projectFilter, setProjectFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState('all');
  const [projectSortBy, setProjectSortBy] = useState('name');
  const [teamSortBy, setTeamSortBy] = useState('division');

  // Group teams by division
  const divisionGroups = useMemo((): DivisionGroup[] => {
    const divisionsMap = new Map<string, Team[]>();

    teams.forEach(team => {
      const division = team.division || 'Unassigned';
      if (!divisionsMap.has(division)) {
        divisionsMap.set(division, []);
      }
      divisionsMap.get(division)!.push(team);
    });

    return Array.from(divisionsMap.entries())
      .map(([division, teams]) => ({ division, teams }))
      .sort((a, b) => a.division.localeCompare(b.division));
  }, [teams]);

  // Calculate team capacity utilization
  const teamCapacityMap = useMemo(() => {
    const capacityMap = new Map<string, number>();

    // Get current quarter cycles
    const now = new Date();
    const currentQuarterCycles = cycles.filter((cycle: any) => {
      const cycleStart = new Date(cycle.startDate);
      const cycleEnd = new Date(cycle.endDate);
      return (
        (now >= cycleStart && now <= cycleEnd) ||
        (cycleStart.getFullYear() === now.getFullYear() &&
          Math.floor(cycleStart.getMonth() / 3) ===
            Math.floor(now.getMonth() / 3))
      );
    });

    const currentQuarterCycleIds = currentQuarterCycles.map((c: any) => c.id);

    teams.forEach(team => {
      const teamAllocations = allocations.filter(
        (alloc: any) =>
          alloc.teamId === team.id &&
          currentQuarterCycleIds.includes(alloc.cycleId)
      );

      const totalPercentage = teamAllocations.reduce(
        (sum: number, alloc: any) => sum + alloc.percentage,
        0
      );

      capacityMap.set(team.id, Math.min(totalPercentage, 100));
    });

    return capacityMap;
  }, [teams, allocations, cycles]);

  // Create matrix cells for all project-team combinations
  const matrixData = useMemo((): MatrixCell[] => {
    const cells: MatrixCell[] = [];

    projects.forEach(project => {
      teams.forEach(team => {
        const compatibility = calculateTeamProjectCompatibility(
          team,
          project,
          projectSkills,
          solutions,
          skills,
          projectSolutions,
          people,
          personSkills
        );

        const capacityPercentage = teamCapacityMap.get(team.id) || 0;
        let capacityStatus: 'available' | 'partial' | 'overloaded';
        let matchType: 'excellent' | 'good' | 'fair' | 'poor' | 'no-capacity';

        if (capacityPercentage <= 60) {
          capacityStatus = 'available';
        } else if (capacityPercentage <= 85) {
          capacityStatus = 'partial';
        } else {
          capacityStatus = 'overloaded';
        }

        // Determine match type based on compatibility and capacity
        if (
          capacityStatus === 'overloaded' &&
          compatibility.compatibilityScore < 0.7
        ) {
          matchType = 'no-capacity';
        } else {
          matchType = compatibility.recommendation as
            | 'excellent'
            | 'good'
            | 'fair'
            | 'poor';
        }

        cells.push({
          projectId: project.id,
          teamId: team.id,
          matchType,
          compatibilityScore: compatibility.compatibilityScore,
          capacityStatus,
          skillsMatched: compatibility.skillsMatched,
          skillsRequired: compatibility.skillsRequired,
          reasoning: compatibility.reasoning,
        });
      });
    });

    return cells;
  }, [
    projects,
    teams,
    skills,
    solutions,
    projectSolutions,
    projectSkills,
    people,
    personSkills,
    teamCapacityMap,
  ]);

  // Apply filters and get sorted projects and teams
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Project name filter
    if (projectFilter) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }

    // Apply project sorting
    if (projectSortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (projectSortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered = [...filtered].sort(
        (a, b) =>
          (priorityOrder as any)[b.priority || 'medium'] -
          (priorityOrder as any)[a.priority || 'medium']
      );
    }

    return filtered;
  }, [projects, projectFilter, projectSortBy]);

  const filteredDivisionGroups = useMemo(() => {
    let filtered = divisionGroups;

    // Division filter
    if (divisionFilter !== 'all') {
      filtered = filtered.filter(group => group.division === divisionFilter);
    }

    // Apply team sorting within divisions
    filtered = filtered.map(group => ({
      ...group,
      teams: [...group.teams].sort((a, b) => {
        if (teamSortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (teamSortBy === 'capacity') {
          const aCapacity = teamCapacityMap.get(a.id) || 0;
          const bCapacity = teamCapacityMap.get(b.id) || 0;
          return aCapacity - bCapacity;
        }
        return 0;
      }),
    }));

    return filtered;
  }, [divisionGroups, divisionFilter, teamSortBy, teamCapacityMap]);

  // Get cell data for project-team combination
  const getCellData = (
    projectId: string,
    teamId: string
  ): MatrixCell | null => {
    return (
      matrixData.find(
        cell => cell.projectId === projectId && cell.teamId === teamId
      ) || null
    );
  };

  // Get cell styling based on match type
  const getCellStyling = (
    matchType: MatrixCell['matchType'],
    capacityStatus: string
  ) => {
    const baseClasses =
      'w-12 h-8 border border-gray-200 cursor-pointer transition-all hover:scale-110 hover:z-10 relative';

    switch (matchType) {
      case 'excellent':
        return `${baseClasses} bg-green-500 hover:bg-green-600`;
      case 'good':
        return `${baseClasses} bg-blue-500 hover:bg-blue-600`;
      case 'fair':
        return `${baseClasses} bg-yellow-500 hover:bg-yellow-600`;
      case 'poor':
        return `${baseClasses} bg-red-300 hover:bg-red-400`;
      case 'no-capacity':
        return `${baseClasses} bg-red-700 hover:bg-red-800 opacity-80`;
      default:
        return `${baseClasses} bg-gray-200 hover:bg-gray-300`;
    }
  };

  // Get unique divisions for filter
  const uniqueDivisions = useMemo(() => {
    return Array.from(
      new Set(teams.map(team => team.division || 'Unassigned'))
    ).sort();
  }, [teams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project-Team Skills Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter projects..."
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {uniqueDivisions.map(division => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectSortBy} onValueChange={setProjectSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3 w-3" />
                    Name
                  </div>
                </SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={teamSortBy} onValueChange={setTeamSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="division">Division</SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3 w-3" />
                    Name
                  </div>
                </SelectItem>
                <SelectItem value="capacity">Capacity</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {filteredProjects.length} projects
            </div>

            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {filteredDivisionGroups.reduce(
                (sum, group) => sum + group.teams.length,
                0
              )}{' '}
              teams
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Skill Match:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs">Excellent (90%+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-xs">Good (70-89%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs">Fair (50-69%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-300 rounded"></div>
                  <span className="text-xs">Poor (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-700 rounded opacity-80"></div>
                  <span className="text-xs">No Capacity</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 sticky left-0 bg-white z-20 border-r">
                    Teams / Projects
                  </TableHead>
                  {filteredProjects.map(project => (
                    <TableHead
                      key={project.id}
                      className="text-center min-w-16 px-1 h-32"
                    >
                      <div className="h-full flex flex-col items-center justify-end pb-2">
                        <div
                          className="transform -rotate-45 origin-bottom whitespace-nowrap text-xs font-medium mb-2"
                          style={{ transformOrigin: 'center bottom' }}
                        >
                          {project.name.length > 15
                            ? `${project.name.substring(0, 15)}...`
                            : project.name}
                        </div>
                        {project.priority && (
                          <Badge
                            variant={
                              project.priority === 'high'
                                ? 'destructive'
                                : project.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {project.priority.charAt(0).toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDivisionGroups.map(divisionGroup => (
                  <React.Fragment key={divisionGroup.division}>
                    {/* Division Header */}
                    <TableRow className="bg-gray-100">
                      <TableCell
                        colSpan={filteredProjects.length + 1}
                        className="font-semibold text-gray-700 sticky left-0 z-10"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {divisionGroup.division} ({divisionGroup.teams.length}{' '}
                          teams)
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Team Rows */}
                    {divisionGroup.teams.map(team => (
                      <TableRow key={team.id} className="hover:bg-gray-50">
                        <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{team.name}</span>
                            <div className="text-xs text-gray-500">
                              {teamCapacityMap.get(team.id) || 0}%
                            </div>
                          </div>
                        </TableCell>

                        {filteredProjects.map(project => {
                          const cellData = getCellData(project.id, team.id);

                          return (
                            <TableCell
                              key={`${team.id}-${project.id}`}
                              className="p-1 text-center"
                            >
                              {cellData ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={getCellStyling(
                                          cellData.matchType,
                                          cellData.capacityStatus
                                        )}
                                      >
                                        <div className="text-xs text-white font-semibold leading-none pt-1">
                                          {Math.round(
                                            cellData.compatibilityScore * 100
                                          )}
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                      <div className="space-y-2">
                                        <div className="font-medium">
                                          {team.name} × {project.name}
                                        </div>
                                        <div className="text-sm">
                                          <div>Match: {cellData.matchType}</div>
                                          <div>
                                            Skills: {cellData.skillsMatched}/
                                            {cellData.skillsRequired}
                                          </div>
                                          <div>
                                            Compatibility:{' '}
                                            {Math.round(
                                              cellData.compatibilityScore * 100
                                            )}
                                            %
                                          </div>
                                          <div>
                                            Capacity:{' '}
                                            {teamCapacityMap.get(team.id) || 0}%
                                            ({cellData.capacityStatus})
                                          </div>
                                          <div className="mt-2 text-xs text-gray-600">
                                            {cellData.reasoning.join('. ')}
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <div className="w-12 h-8 bg-gray-100"></div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {(filteredProjects.length === 0 ||
        filteredDivisionGroups.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2" />
              No data matches your current filters.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default React.memo(ProjectTeamMatchingView);
