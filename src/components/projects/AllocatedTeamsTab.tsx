import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currency';
import {
  calculateTeamAllocations,
  findRelatedProjects,
  aggregateTeamAllocationsToQuarterly,
  TeamAllocationSummary,
  RelatedProject,
  TeamQuarterlyAllocation,
} from '@/utils/teamAllocationCalculations';
import { Progress } from '@/components/ui/progress';
import ProjectTeamRecommendations from '@/components/skills/ProjectTeamRecommendations';

interface AllocatedTeamsTabProps {
  project: Project;
}

// Component for quarterly allocation display
const QuarterlyTeamCard: React.FC<{ team: TeamQuarterlyAllocation }> = ({
  team,
}) => {
  const getQuarterColor = (allocation: number) => {
    if (allocation === 0) return 'bg-gray-100';
    if (allocation < 25) return 'bg-green-100 border-green-200';
    if (allocation < 50) return 'bg-yellow-100 border-yellow-200';
    if (allocation < 75) return 'bg-orange-100 border-orange-200';
    return 'bg-red-100 border-red-200';
  };

  const getProgressColor = (allocation: number) => {
    if (allocation < 25) return 'bg-green-500';
    if (allocation < 50) return 'bg-yellow-500';
    if (allocation < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{team.teamName}</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {team.financialYear}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {formatCurrency(team.totalCost)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quarterly Timeline */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Quarterly Allocation
            </span>
            <span className="text-sm text-gray-500">
              {team.totalAllocation}% total
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(quarter => {
              const q = team.quarters[quarter];
              return (
                <div key={quarter} className="text-center">
                  <div
                    className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm ${getQuarterColor(q.allocation)}`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {quarter}
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {q.hasAllocation ? `${q.allocation}%` : '—'}
                    </div>
                    {q.hasAllocation && (
                      <div className="text-xs text-gray-600">
                        {formatCurrency(q.cost)}
                      </div>
                    )}
                  </div>
                  {q.hasAllocation && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getProgressColor(q.allocation)}`}
                          style={{ width: `${Math.min(q.allocation, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Active Quarters:</span>
              <span className="ml-2 font-medium">
                {
                  Object.values(team.quarters).filter(q => q.hasAllocation)
                    .length
                }
                /4
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg per Quarter:</span>
              <span className="ml-2 font-medium">
                {Math.round(
                  team.totalAllocation /
                    Object.values(team.quarters).filter(q => q.hasAllocation)
                      .length || 0
                )}
                %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

  // Aggregate to quarterly view for clean UX
  const quarterlyAllocations = useMemo(() => {
    return aggregateTeamAllocationsToQuarterly(
      teamSummaries,
      financialYears,
      cycles
    );
  }, [teamSummaries, financialYears, cycles]);

  // Find related projects
  const relatedProjects = useMemo(() => {
    return findRelatedProjects(project, projects, projectSkills, teamSummaries);
  }, [project, projects, projectSkills, teamSummaries]);

  return (
    <div data-testid="allocated-teams-tab" className="space-y-6">
      <div className="mb-8">
        <ProjectTeamRecommendations selectedProjectId={project.id} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Team Allocations & Cost Analysis
        </h3>

        {/* Quarterly Team Allocations - Modern UX */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-3">
            Team Allocations by Quarter
          </h4>
          {quarterlyAllocations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No team allocations found for this project.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {quarterlyAllocations.map((team: TeamQuarterlyAllocation) => (
                <QuarterlyTeamCard key={team.teamId} team={team} />
              ))}
            </div>
          )}
        </div>

        {/* Project Summary */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-3">Project Summary</h4>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {quarterlyAllocations.length}
                  </div>
                  <div className="text-sm text-gray-600">Teams Involved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      quarterlyAllocations.reduce(
                        (sum, team) => sum + team.totalCost,
                        0
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(
                      quarterlyAllocations.reduce(
                        (sum, team) => sum + team.totalAllocation,
                        0
                      ) / (quarterlyAllocations.length || 1)
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg Team Allocation
                  </div>
                </div>
              </div>
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
