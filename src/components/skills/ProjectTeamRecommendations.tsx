import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { recommendTeamsForProject } from '@/utils/skillBasedPlanning';
import { Project, Team } from '@/types';

interface ProjectTeamRecommendationsProps {
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  maxRecommendations?: number;
  showDetailedAnalysis?: boolean;
}

const ProjectTeamRecommendations: React.FC<ProjectTeamRecommendationsProps> = ({
  selectedProjectId,
  onProjectChange,
  maxRecommendations = 5,
  showDetailedAnalysis = true,
}) => {
  const {
    projects,
    teams,
    skills,
    solutions,
    projectSkills,
    projectSolutions,
  } = useApp();
  const [localSelectedProjectId, setLocalSelectedProjectId] = useState<string>(
    selectedProjectId || ''
  );

  const currentProjectId = onProjectChange
    ? selectedProjectId
    : localSelectedProjectId;
  const selectedProject = projects.find(p => p.id === currentProjectId);

  // Get team recommendations for the selected project
  const teamRecommendations = useMemo(() => {
    if (!selectedProject) return [];

    const relevantProjectSkills = projectSkills.filter(
      ps => ps.projectId === selectedProject.id
    );

    return recommendTeamsForProject(
      selectedProject,
      teams,
      relevantProjectSkills,
      solutions,
      skills,
      projectSolutions,
      maxRecommendations
    );
  }, [
    selectedProject,
    teams,
    projectSkills,
    solutions,
    skills,
    projectSolutions,
    maxRecommendations,
  ]);

  const handleProjectChange = (projectId: string) => {
    if (onProjectChange) {
      onProjectChange(projectId);
    } else {
      setLocalSelectedProjectId(projectId);
    }
  };

  const getRecommendationIcon = (rank: number, score: number) => {
    if (rank === 1 && score > 0.8)
      return <Award className="h-4 w-4 text-yellow-500" />;
    if (score > 0.7) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score > 0.5) return <Info className="h-4 w-4 text-blue-500" />;
    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'text-green-600';
    if (score > 0.6) return 'text-blue-600';
    if (score > 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score > 0.8) return 'bg-green-500';
    if (score > 0.6) return 'bg-blue-500';
    if (score > 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Team Recommendations for Project
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Project</label>
          <Select value={currentProjectId} onValueChange={handleProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project to analyze..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span>{project.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {project.priority}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProject && (
          <>
            {/* Project Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{selectedProject.name}</div>
              {selectedProject.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {selectedProject.description}
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Priority: {selectedProject.priority}</span>
                <span>Status: {selectedProject.status}</span>
                {selectedProject.budgetAllocated && (
                  <span>
                    Budget: ${selectedProject.budgetAllocated.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Team Recommendations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recommended Teams</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{teamRecommendations.length} recommendations</span>
                </div>
              </div>

              {teamRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {teamRecommendations.map(
                    ({ team, compatibility, rank, recommendation }) => (
                      <div
                        key={team.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          rank === 1
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {/* Team Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {rank === 1 && (
                                <Star className="h-4 w-4 text-blue-600" />
                              )}
                              <span className="font-medium text-sm text-gray-500">
                                #{rank}
                              </span>
                            </div>
                            <div className="font-semibold">{team.name}</div>
                            {getRecommendationIcon(
                              rank,
                              compatibility.compatibilityScore
                            )}
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-lg font-bold ${getScoreColor(compatibility.compatibilityScore)}`}
                            >
                              {Math.round(
                                compatibility.compatibilityScore * 100
                              )}
                              %
                            </div>
                            <div className="text-xs text-gray-500">Match</div>
                          </div>
                        </div>

                        {/* Compatibility Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Skill Compatibility</span>
                            <span>
                              {compatibility.skillsMatched}/
                              {compatibility.skillsRequired} skills
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(compatibility.compatibilityScore)}`}
                              style={{
                                width: `${compatibility.compatibilityScore * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Skills Analysis */}
                        {showDetailedAnalysis && (
                          <div className="space-y-3">
                            {/* Matching Skills */}
                            {compatibility.skillsMatched > 0 && (
                              <div>
                                <div className="text-sm font-medium text-green-700 mb-1">
                                  ✓ Matching Skills (
                                  {compatibility.skillsMatched})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {compatibility.skillMatches
                                    .filter(
                                      match => match.matchType === 'exact'
                                    )
                                    .map(match => (
                                      <Badge
                                        key={match.skillId}
                                        variant="default"
                                        className="text-xs bg-green-100 text-green-800"
                                      >
                                        {match.skillName}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Category Matches */}
                            {compatibility.skillMatches.some(
                              match => match.matchType === 'category'
                            ) && (
                              <div>
                                <div className="text-sm font-medium text-blue-700 mb-1">
                                  ~ Related Skills
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {compatibility.skillMatches
                                    .filter(
                                      match => match.matchType === 'category'
                                    )
                                    .map(match => (
                                      <Badge
                                        key={match.skillId}
                                        variant="outline"
                                        className="text-xs border-blue-300 text-blue-700"
                                      >
                                        {match.skillName}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Missing Skills */}
                            {compatibility.skillsGap > 0 && (
                              <div>
                                <div className="text-sm font-medium text-orange-700 mb-1">
                                  ⚠ Missing Skills ({compatibility.skillsGap})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {compatibility.skillMatches
                                    .filter(
                                      match => match.matchType === 'missing'
                                    )
                                    .map(match => (
                                      <Badge
                                        key={match.skillId}
                                        variant="outline"
                                        className="text-xs border-orange-300 text-orange-700"
                                      >
                                        {match.skillName}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recommendation Text */}
                        <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                          <div className="font-medium mb-1">
                            Recommendation:
                          </div>
                          <div>{recommendation}</div>
                        </div>

                        {/* Reasoning */}
                        {compatibility.reasoning.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            {compatibility.reasoning.join(' • ')}
                          </div>
                        )}

                        {/* Team Details */}
                        {team.description && (
                          <div className="mt-3 text-sm text-gray-600 border-t pt-2">
                            <strong>Team:</strong> {team.description}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No team recommendations available</p>
                  <p className="text-sm mt-2">
                    This project may not have skill requirements defined
                  </p>
                </div>
              )}
            </div>

            {/* Summary Statistics */}
            {teamRecommendations.length > 0 && (
              <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {teamRecommendations.length}
                    </div>
                    <div className="text-sm text-gray-600">Teams Analyzed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        teamRecommendations[0]?.compatibility
                          .compatibilityScore * 100 || 0
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Best Match</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {teamRecommendations[0]?.compatibility.skillsRequired ||
                        0}
                    </div>
                    <div className="text-sm text-gray-600">Skills Needed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {
                        teamRecommendations.filter(
                          rec => rec.compatibility.compatibilityScore > 0.7
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Good Matches</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {!selectedProject && (
          <div className="text-center py-12 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select a project to see team recommendations</p>
            <p className="text-sm mt-2">
              Get AI-powered team suggestions based on skill compatibility
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTeamRecommendations;
