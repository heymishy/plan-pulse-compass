import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getProjectRequiredSkills } from '@/utils/skillBasedPlanning';
import { Users, CheckCircle, AlertTriangle, X, Info } from 'lucide-react';

interface AllocatedTeamsTabProps {
  project: Project;
}

const AllocatedTeamsTab: React.FC<AllocatedTeamsTabProps> = ({ project }) => {
  const {
    epics,
    allocations,
    teams,
    people,
    cycles,
    projects,
    projectSkills,
    projectSolutions,
    solutions,
    skills,
    personSkills,
  } = useApp();

  // Get all required skills for this project (from solutions and manual skills)
  const allProjectSkillsInfo = useMemo(() => {
    if (!project) return [];
    return getProjectRequiredSkills(
      project,
      projectSkills,
      solutions,
      skills,
      projectSolutions
    );
  }, [project, projectSkills, solutions, skills, projectSolutions]);

  // Team allocation analysis for all teams
  const teamAllocationAnalysis = useMemo(() => {
    if (!project) return [];

    return teams.map(team => {
      // Get current quarter allocations for this team
      const now = new Date();
      const currentQuarterCycles = (cycles || []).filter(c => {
        const cycleStart = new Date(c.startDate);
        const cycleEnd = new Date(c.endDate);
        // Include cycles that overlap with current time or are in current quarter
        return (
          (now >= cycleStart && now <= cycleEnd) ||
          (cycleStart.getFullYear() === now.getFullYear() &&
            Math.floor(cycleStart.getMonth() / 3) ===
              Math.floor(now.getMonth() / 3))
        );
      });

      const currentQuarterCycleIds = currentQuarterCycles.map(c => c.id);

      const teamAllocations = (allocations || []).filter(
        alloc =>
          alloc.teamId === team.id &&
          currentQuarterCycleIds.includes(alloc.cycleId)
      );

      // Group by project/epic and create detailed breakdown
      const allocationsByProject = new Map<
        string,
        {
          projectId: string;
          projectName: string;
          isCurrentProject: boolean;
          allocationType: string;
          allocations: Array<{ cycleId: string; percentage: number }>;
        }
      >();

      // Process each allocation
      teamAllocations.forEach(alloc => {
        let allocationType = 'unknown';
        let displayName = 'Unknown';
        let targetProjectId = '';

        if (alloc.epicId) {
          // Epic-based allocation
          const epic = (epics || []).find(e => e.id === alloc.epicId);
          if (epic) {
            const epicProject = (projects || []).find(
              p => p.id === epic.projectId
            );
            if (epicProject) {
              allocationType = 'project';
              displayName = epicProject.name;
              targetProjectId = epicProject.id;
            }
          }
        } else if (alloc.projectId) {
          // Direct project allocation
          const directProject = (projects || []).find(
            p => p.id === alloc.projectId
          );
          if (directProject) {
            allocationType = 'project';
            displayName = directProject.name;
            targetProjectId = directProject.id;
          }
        } else {
          // Run work or other allocation types
          allocationType = 'runwork';
          displayName = 'Run Work';
          targetProjectId = 'runwork';
        }

        if (allocationType === 'unknown') return;

        const key = `${targetProjectId}-${allocationType}`;
        if (!allocationsByProject.has(key)) {
          allocationsByProject.set(key, {
            projectId: targetProjectId,
            projectName: displayName,
            isCurrentProject: targetProjectId === project.id,
            allocationType,
            allocations: [],
          });
        }

        allocationsByProject.get(key)!.allocations.push({
          cycleId: alloc.cycleId,
          percentage: alloc.percentage,
        });
      });

      // Calculate total run work and project percentages for this team
      const totalRunWork = teamAllocations
        .filter(alloc => !alloc.epicId && !alloc.projectId)
        .reduce((sum, alloc) => sum + alloc.percentage, 0);
      const totalProject = teamAllocations
        .filter(alloc => alloc.epicId || alloc.projectId)
        .reduce((sum, alloc) => sum + alloc.percentage, 0);

      // Convert to final format with iteration breakdown
      const currentAllocations = Array.from(allocationsByProject.values()).map(
        allocation => {
          // Create iteration breakdown for all cycles in quarter
          const iterationBreakdown = currentQuarterCycles.map(cycle => {
            const cycleAllocation = allocation.allocations.find(
              a => a.cycleId === cycle.id
            );
            return {
              cycleId: cycle.id,
              cycleName:
                cycle.name || `I${currentQuarterCycles.indexOf(cycle) + 1}`,
              percentage: cycleAllocation?.percentage || 0,
            };
          });

          const totalPercentage = allocation.allocations.reduce(
            (sum, a) => sum + a.percentage,
            0
          );

          return {
            projectId: allocation.projectId,
            projectName: allocation.projectName,
            percentage: totalPercentage,
            cycleId: allocation.allocations[0]?.cycleId || '',
            isCurrentProject: allocation.isCurrentProject,
            allocationType: allocation.allocationType,
            iterationBreakdown,
            totalRunWork,
            totalProject,
          };
        }
      );

      // Check if team has skills needed for this project
      const teamSkillIds = new Set<string>();
      const teamMemberIds = new Set(
        people.filter(p => p.teamId === team.id).map(p => p.id)
      );
      const personSkillsForTeam = personSkills.filter(ps =>
        teamMemberIds.has(ps.personId)
      );

      if (personSkillsForTeam.length > 0) {
        personSkillsForTeam.forEach(ps => teamSkillIds.add(ps.skillId));
      } else if (team.targetSkills && team.targetSkills.length > 0) {
        team.targetSkills.forEach(skillId => teamSkillIds.add(skillId));
      }

      const requiredSkillIds = allProjectSkillsInfo.map(skill => skill.skillId);
      const matchingSkillsCount = requiredSkillIds.filter(skillId =>
        teamSkillIds.has(skillId)
      ).length;
      const skillCompatibility =
        requiredSkillIds.length > 0
          ? matchingSkillsCount / requiredSkillIds.length
          : 0;

      return {
        id: team.id,
        name: team.name,
        memberCount: (people || []).filter(p => p.teamId === team.id).length,
        currentAllocations,
        skillCompatibility,
        matchingSkillsCount,
        totalRequiredSkills: requiredSkillIds.length,
        hasCurrentProjectAllocation: currentAllocations.some(
          alloc => alloc.isCurrentProject
        ),
        totalAllocationPercentage: totalRunWork + totalProject,
      };
    });
  }, [
    teams,
    project,
    cycles,
    allocations,
    epics,
    projects,
    people,
    personSkills,
    allProjectSkillsInfo,
  ]);

  const getGapIcon = (hasAllocation: boolean, skillCompatibility: number) => {
    if (hasAllocation && skillCompatibility > 0.7) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (hasAllocation || skillCompatibility > 0.5) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <X className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div data-testid="allocated-teams-tab" className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Allocation Analysis - {project.name}
        </h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {
                      teamAllocationAnalysis.filter(
                        t => t.hasCurrentProjectAllocation
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Allocated Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      teamAllocationAnalysis.filter(
                        t => t.skillCompatibility > 0.5
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Skill Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      teamAllocationAnalysis.filter(
                        t => t.totalAllocationPercentage > 80
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">High Utilization</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {
                      teamAllocationAnalysis.filter(
                        t => t.totalAllocationPercentage === 0
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Available Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Analysis Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Team</TableHead>
                  <TableHead className="w-32">Skill Match</TableHead>
                  <TableHead>Current Quarter Allocations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamAllocationAnalysis
                  .sort((a, b) => {
                    // Sort by: current project allocation, then skill compatibility, then availability
                    if (
                      a.hasCurrentProjectAllocation !==
                      b.hasCurrentProjectAllocation
                    ) {
                      return a.hasCurrentProjectAllocation ? -1 : 1;
                    }
                    if (a.skillCompatibility !== b.skillCompatibility) {
                      return b.skillCompatibility - a.skillCompatibility;
                    }
                    return (
                      a.totalAllocationPercentage - b.totalAllocationPercentage
                    );
                  })
                  .map(team => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getGapIcon(
                              team.hasCurrentProjectAllocation,
                              team.skillCompatibility
                            )}
                            <div className="font-medium">{team.name}</div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {team.memberCount} members
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div
                            className={`text-sm font-medium ${
                              team.skillCompatibility > 0.7
                                ? 'text-green-600'
                                : team.skillCompatibility > 0.5
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {Math.round(team.skillCompatibility * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">
                            {team.matchingSkillsCount}/
                            {team.totalRequiredSkills} skills
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {/* Summary: Run Work vs Project Split */}
                          {team.currentAllocations.length > 0 ? (
                            <>
                              <div className="p-2 bg-gray-50 rounded border text-xs">
                                <div className="font-semibold text-gray-700 mb-1">
                                  Quarter Summary:
                                </div>
                                <div className="flex justify-between">
                                  <span>
                                    Run Work:{' '}
                                    {team.currentAllocations[0]?.totalRunWork ||
                                      0}
                                    %
                                  </span>
                                  <span>
                                    Projects:{' '}
                                    {team.currentAllocations[0]?.totalProject ||
                                      0}
                                    %
                                  </span>
                                </div>
                              </div>

                              {/* Individual Project/RunWork Allocations */}
                              {team.currentAllocations.map(alloc => (
                                <div
                                  key={`${alloc.projectId}-${alloc.allocationType}`}
                                  className={`p-2 rounded border text-xs space-y-2 ${
                                    alloc.isCurrentProject
                                      ? 'bg-green-50 border-green-200'
                                      : alloc.allocationType === 'runwork'
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-blue-50 border-blue-200'
                                  }`}
                                >
                                  {/* Project/RunWork Name and Total */}
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {alloc.isCurrentProject
                                        ? 'Current project allocated'
                                        : alloc.allocationType === 'runwork'
                                          ? 'Run Work'
                                          : alloc.projectName}
                                    </span>
                                    <Badge
                                      variant={
                                        alloc.isCurrentProject
                                          ? 'default'
                                          : alloc.allocationType === 'runwork'
                                            ? 'secondary'
                                            : 'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {alloc.percentage}%
                                    </Badge>
                                  </div>

                                  {/* Iteration Breakdown */}
                                  <div className="text-xs text-gray-600">
                                    <div className="grid grid-cols-3 gap-1">
                                      {alloc.iterationBreakdown.map(iter => (
                                        <div
                                          key={iter.cycleId}
                                          className={`text-center p-1 rounded ${
                                            iter.percentage > 0
                                              ? 'bg-white border'
                                              : 'bg-gray-100'
                                          }`}
                                        >
                                          <div className="font-mono">
                                            {iter.cycleName}:
                                          </div>
                                          <div
                                            className={
                                              iter.percentage > 0
                                                ? 'font-semibold'
                                                : ''
                                            }
                                          >
                                            {iter.percentage}%
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                              No current allocations - Available
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllocatedTeamsTab;
