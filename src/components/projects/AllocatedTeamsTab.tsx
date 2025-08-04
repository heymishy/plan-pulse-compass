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
import { formatCurrency } from '@/utils/currency';
import {
  calculateTeamAllocations,
  calculateTimePeriodTotals,
  findRelatedProjects,
  TeamAllocationSummary,
  TimePeriodTotals,
  RelatedProject,
} from '@/utils/teamAllocationCalculations';

interface AllocatedTeamsTabProps {
  project: Project;
}

const AllocatedTeamsTab: React.FC<AllocatedTeamsTabProps> = ({ project }) => {
  const {
    epics,
    allocations,
    teams,
    people,
    roles,
    cycles,
    financialYears,
    projects,
    projectSkills,
    config,
  } = useApp();

  // Calculate team allocation data
  const teamSummaries = useMemo(() => {
    return calculateTeamAllocations(
      project,
      epics,
      allocations,
      teams,
      people,
      roles,
      cycles,
      financialYears,
      config
    );
  }, [
    project,
    epics,
    allocations,
    teams,
    people,
    roles,
    cycles,
    financialYears,
    config,
  ]);

  // Calculate time period totals
  const periodTotals = useMemo(() => {
    return calculateTimePeriodTotals(teamSummaries);
  }, [teamSummaries]);

  // Find related projects
  const relatedProjects = useMemo(() => {
    return findRelatedProjects(project, projects, projectSkills, teamSummaries);
  }, [project, projects, projectSkills, teamSummaries]);

  return (
    <div data-testid="allocated-teams-tab" className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Team Allocations & Cost Analysis
        </h3>

        {/* Team Allocation Summaries */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-3">
            Team Allocation Summaries
          </h4>
          {teamSummaries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No team allocations found for this project.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamSummaries.map((team: TeamAllocationSummary) => (
                <Card key={team.teamId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{team.teamName}</span>
                      <Badge variant="outline">
                        {formatCurrency(team.totalCost)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Allocation:</span>
                        <span className="font-medium">
                          {team.totalAllocatedPercentage}%
                        </span>
                      </div>

                      {/* Time Period Breakdown */}
                      <div className="space-y-1">
                        {team.allocations.map(period => (
                          <div
                            key={period.periodId}
                            className="text-xs border-l-2 border-blue-200 pl-2"
                          >
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {period.periodName}
                              </span>
                              <div className="space-x-2">
                                <span>{period.allocatedPercentage}%</span>
                                <span className="font-mono">
                                  {formatCurrency(period.cost)}
                                </span>
                              </div>
                            </div>

                            {/* Team Members */}
                            <div className="mt-1 space-y-1">
                              {period.teamMembers.map(member => (
                                <div
                                  key={member.personId}
                                  className="flex justify-between items-center"
                                >
                                  <div className="flex-1">
                                    <span className="text-gray-700">
                                      {member.personName}
                                    </span>
                                    <span className="ml-2 text-gray-500">
                                      ({member.allocatedPercentage}%)
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {member.skills.slice(0, 2).map(skill => (
                                      <Badge
                                        key={skill}
                                        variant="secondary"
                                        className="text-xs py-0 px-1"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                    {member.skills.length > 2 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs py-0 px-1"
                                      >
                                        +{member.skills.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Time Period Totals */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-3">
            Cost Totals by Time Period
          </h4>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Teams</TableHead>
                    <TableHead className="text-right">
                      Total Allocation
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodTotals.map((period: TimePeriodTotals) => (
                    <TableRow key={period.periodId}>
                      <TableCell className="font-medium">
                        {period.periodName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {period.periodType === 'financial-year'
                            ? 'FY'
                            : period.periodType === 'quarter'
                              ? 'Quarter'
                              : 'Iteration'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(period.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {period.teamsCount} teams
                      </TableCell>
                      <TableCell className="text-right">
                        {period.totalAllocatedPercentage}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Related Projects Analysis */}
        <div>
          <h4 className="text-md font-medium mb-3">
            Related Projects Analysis
          </h4>
          {relatedProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No related projects found based on skill requirements.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {relatedProjects.map((relatedProject: RelatedProject) => (
                <Card key={relatedProject.projectId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">
                        {relatedProject.projectName}
                      </h5>
                      <Badge
                        variant={
                          relatedProject.matchPercentage > 70
                            ? 'default'
                            : relatedProject.matchPercentage > 40
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {relatedProject.matchPercentage}% match
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Required Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {relatedProject.requiredSkills.map(skill => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Matching:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {relatedProject.matchingSkills.map(skill => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {relatedProject.conflictingTeams.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                        <span className="text-yellow-800 font-medium">
                          Team Conflicts:
                        </span>
                        <div className="mt-1">
                          {relatedProject.conflictingTeams.map(teamId => {
                            const team = teams.find(t => t.id === teamId);
                            return team ? (
                              <Badge
                                key={teamId}
                                variant="secondary"
                                className="text-xs mr-1"
                              >
                                {team.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllocatedTeamsTab;
