import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  Info,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { analyzeSkillCoverage } from '@/utils/skillBasedPlanning';

interface SkillCoverageAnalysisProps {
  showCategoryBreakdown?: boolean;
  showRecommendations?: boolean;
  compactView?: boolean;
}

const SkillCoverageAnalysis: React.FC<SkillCoverageAnalysisProps> = ({
  showCategoryBreakdown = true,
  showRecommendations = true,
  compactView = false,
}) => {
  const { teams, skills } = useApp();

  // Analyze skill coverage across all teams
  const coverageAnalysis = useMemo(() => {
    return analyzeSkillCoverage(teams, skills);
  }, [teams, skills]);

  // Sort skills by coverage risk (least covered first)
  const sortedSkillCoverage = useMemo(() => {
    return [...coverageAnalysis.skillCoverage].sort((a, b) => {
      if (a.isAtRisk !== b.isAtRisk) {
        return a.isAtRisk ? -1 : 1; // At-risk skills first
      }
      return a.coverageCount - b.coverageCount; // Then by coverage count
    });
  }, [coverageAnalysis.skillCoverage]);

  // Get category summary
  const categorySummary = useMemo(() => {
    return Object.entries(coverageAnalysis.categoryAnalysis).sort(
      (a, b) => a[1].coveragePercentage - b[1].coveragePercentage
    );
  }, [coverageAnalysis.categoryAnalysis]);

  const getCoverageColor = (
    count: number,
    isAtRisk: boolean,
    isWellCovered: boolean
  ) => {
    if (isAtRisk) return 'text-red-600';
    if (isWellCovered) return 'text-green-600';
    if (count >= 2) return 'text-blue-600';
    return 'text-orange-600';
  };

  const getCoverageIcon = (
    count: number,
    isAtRisk: boolean,
    isWellCovered: boolean
  ) => {
    if (isAtRisk) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (isWellCovered)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (count >= 2) return <Shield className="h-4 w-4 text-blue-500" />;
    return <AlertCircle className="h-4 w-4 text-orange-500" />;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Skill Coverage Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Coverage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {coverageAnalysis.totalSkills}
            </div>
            <div className="text-sm text-gray-600">Total Skills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {coverageAnalysis.coveredSkills}
            </div>
            <div className="text-sm text-gray-600">Covered Skills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(coverageAnalysis.coveragePercentage)}%
            </div>
            <div className="text-sm text-gray-600">Coverage Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {coverageAnalysis.recommendations.skillsAtRisk.length}
            </div>
            <div className="text-sm text-gray-600">At Risk</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Skill Coverage</span>
            <span className="text-sm text-gray-600">
              {coverageAnalysis.coveredSkills}/{coverageAnalysis.totalSkills}{' '}
              skills
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${getProgressColor(coverageAnalysis.coveragePercentage)}`}
              style={{ width: `${coverageAnalysis.coveragePercentage}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Category Breakdown */}
        {showCategoryBreakdown && (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Coverage by Category
              </h3>

              <div className="space-y-3">
                {categorySummary.map(([category, data]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category}</span>
                        <Badge variant="outline" className="text-xs">
                          {data.coveredSkills}/{data.totalSkills}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round(data.coveragePercentage)}%
                        {data.averageTeamsPerSkill > 0 && (
                          <span className="ml-2">
                            ({data.averageTeamsPerSkill.toFixed(1)} teams/skill)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(data.coveragePercentage)}`}
                        style={{ width: `${data.coveragePercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Individual Skills Coverage */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Skills
          </h3>

          {compactView ? (
            /* Compact View */
            <div className="space-y-2">
              {sortedSkillCoverage.map(skill => (
                <div
                  key={skill.skillId}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-2">
                    {getCoverageIcon(
                      skill.coverageCount,
                      skill.isAtRisk,
                      skill.isWellCovered
                    )}
                    <span className="font-medium">{skill.skillName}</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.category}
                    </Badge>
                  </div>
                  <div
                    className={`text-sm font-medium ${getCoverageColor(skill.coverageCount, skill.isAtRisk, skill.isWellCovered)}`}
                  >
                    {skill.coverageCount} teams
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Detailed View */
            <div className="space-y-3">
              {sortedSkillCoverage.map(skill => (
                <div
                  key={skill.skillId}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCoverageIcon(
                        skill.coverageCount,
                        skill.isAtRisk,
                        skill.isWellCovered
                      )}
                      <span className="font-medium">{skill.skillName}</span>
                      <Badge variant="outline" className="text-xs">
                        {skill.category}
                      </Badge>
                    </div>
                    <div
                      className={`text-sm font-medium ${getCoverageColor(skill.coverageCount, skill.isAtRisk, skill.isWellCovered)}`}
                    >
                      {skill.coverageCount} team
                      {skill.coverageCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {skill.teamsWithSkill.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Teams with this skill:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {skill.teamsWithSkill.map(team => (
                          <Badge
                            key={team.teamId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {team.teamName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {skill.isAtRisk && (
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-2 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      <span>
                        High risk: Only {skill.coverageCount} team
                        {skill.coverageCount !== 1 ? 's' : ''} have this skill
                      </span>
                    </div>
                  )}

                  {skill.isWellCovered && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 p-2 rounded">
                      <Award className="h-3 w-3" />
                      <span>Well covered: Multiple teams have this skill</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {showRecommendations && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommendations
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Skills at Risk */}
                {coverageAnalysis.recommendations.skillsAtRisk.length > 0 && (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">
                        Skills at Risk
                      </span>
                    </div>
                    <div className="space-y-1">
                      {coverageAnalysis.recommendations.skillsAtRisk
                        .slice(0, 5)
                        .map(skill => (
                          <div key={skill} className="text-sm text-red-700">
                            • {skill}
                          </div>
                        ))}
                      {coverageAnalysis.recommendations.skillsAtRisk.length >
                        5 && (
                        <div className="text-xs text-red-600">
                          +
                          {coverageAnalysis.recommendations.skillsAtRisk
                            .length - 5}{' '}
                          more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Well Covered Skills */}
                {coverageAnalysis.recommendations.skillsWellCovered.length >
                  0 && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        Well Covered
                      </span>
                    </div>
                    <div className="space-y-1">
                      {coverageAnalysis.recommendations.skillsWellCovered
                        .slice(0, 5)
                        .map(skill => (
                          <div key={skill} className="text-sm text-green-700">
                            • {skill}
                          </div>
                        ))}
                      {coverageAnalysis.recommendations.skillsWellCovered
                        .length > 5 && (
                        <div className="text-xs text-green-600">
                          +
                          {coverageAnalysis.recommendations.skillsWellCovered
                            .length - 5}{' '}
                          more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Categories Needing Attention */}
                {coverageAnalysis.recommendations.categoriesNeedingAttention
                  .length > 0 && (
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">
                        Categories to Focus
                      </span>
                    </div>
                    <div className="space-y-1">
                      {coverageAnalysis.recommendations.categoriesNeedingAttention.map(
                        category => (
                          <div
                            key={category}
                            className="text-sm text-orange-700"
                          >
                            • {category}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Items */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Suggested Actions
                  </span>
                </div>
                <div className="space-y-2 text-sm text-blue-700">
                  {coverageAnalysis.recommendations.skillsAtRisk.length > 0 && (
                    <div>
                      • Consider cross-training or hiring for at-risk skills:{' '}
                      {coverageAnalysis.recommendations.skillsAtRisk
                        .slice(0, 3)
                        .join(', ')}
                    </div>
                  )}
                  {coverageAnalysis.recommendations.categoriesNeedingAttention
                    .length > 0 && (
                    <div>
                      • Expand team capabilities in:{' '}
                      {coverageAnalysis.recommendations.categoriesNeedingAttention.join(
                        ', '
                      )}
                    </div>
                  )}
                  <div>
                    • Leverage well-covered skills for mentoring and knowledge
                    transfer
                  </div>
                  <div>
                    • Review project skill requirements against current team
                    capabilities
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {coverageAnalysis.totalSkills === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No skills data available</p>
            <p className="text-sm mt-2">
              Add skills in Settings and assign them to teams to see coverage
              analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillCoverageAnalysis;
