import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Target,
  Users,
  Zap,
  Clock,
  Activity,
  Info,
} from 'lucide-react';
import {
  Team,
  Project,
  Epic,
  Allocation,
  Cycle,
  Person,
  PersonSkill,
  Skill,
} from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

// Confidence scoring factors
interface ConfidenceFactor {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // relative importance
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  details: string[];
  recommendations: string[];
}

interface TeamConfidenceScore {
  teamId: string;
  teamName: string;
  overallScore: number;
  factors: ConfidenceFactor[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readinessStatus: 'ready' | 'mostly-ready' | 'needs-attention' | 'not-ready';
}

interface PlanningConfidenceScoreProps {
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  allocations: Allocation[];
  people: Person[];
  personSkills: PersonSkill[];
  skills: Skill[];
  cycles: Cycle[];
  selectedCycleId: string;
}

const PlanningConfidenceScore: React.FC<PlanningConfidenceScoreProps> = ({
  teams,
  projects,
  epics,
  allocations,
  people,
  personSkills,
  skills,
  cycles,
  selectedCycleId,
}) => {
  const confidenceAnalysis = useMemo(() => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const currentCycle = cycles.find(c => c.id === selectedCycleId);

    if (!currentCycle) return { teamScores: [], overallScore: 0 };

    const teamScores: TeamConfidenceScore[] = teams.map(team => {
      const teamMembers = people.filter(
        p => p.teamId === team.id && p.isActive
      );
      const teamAllocations = relevantAllocations.filter(
        a => a.teamId === team.id
      );
      const teamSkills = personSkills.filter(ps =>
        teamMembers.some(member => member.id === ps.personId)
      );

      // Factor 1: Capacity Planning Confidence
      const totalAllocation = teamAllocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );
      const averageAllocation =
        teamAllocations.length > 0
          ? totalAllocation / teamAllocations.length
          : 0;

      let capacityScore = 100;
      let capacityStatus: 'excellent' | 'good' | 'warning' | 'critical' =
        'excellent';
      const capacityDetails: string[] = [];

      if (averageAllocation > 100) {
        capacityScore = Math.max(0, 100 - (averageAllocation - 100) * 2);
        capacityStatus = averageAllocation > 120 ? 'critical' : 'warning';
        capacityDetails.push(
          `Team is over-allocated at ${Math.round(averageAllocation)}%`
        );
      } else if (averageAllocation < 60) {
        capacityScore = 60 + (averageAllocation / 60) * 40;
        capacityStatus = averageAllocation < 30 ? 'warning' : 'good';
        capacityDetails.push(
          `Team is under-utilized at ${Math.round(averageAllocation)}%`
        );
      } else {
        capacityDetails.push(
          `Healthy allocation at ${Math.round(averageAllocation)}%`
        );
      }

      const capacityFactor: ConfidenceFactor = {
        id: 'capacity',
        name: 'Capacity Planning',
        score: capacityScore,
        weight: 0.25,
        status: capacityStatus,
        description: `Team capacity utilization assessment`,
        details: capacityDetails,
        recommendations:
          capacityStatus !== 'excellent'
            ? [
                'Rebalance team workload',
                'Consider adding/removing team members',
                'Adjust iteration scope',
              ]
            : [],
      };

      // Factor 2: Skill Alignment Confidence
      const requiredSkillsForTeam = new Set<string>();
      teamAllocations.forEach(allocation => {
        if (allocation.epicId) {
          // Mock skill requirements based on epic/project
          requiredSkillsForTeam.add('javascript');
          requiredSkillsForTeam.add('react');
          if (Math.random() > 0.7) requiredSkillsForTeam.add('python');
          if (Math.random() > 0.8) requiredSkillsForTeam.add('aws');
        }
      });

      const availableSkills = new Set(teamSkills.map(ts => ts.skillId));
      const skillCoverage =
        requiredSkillsForTeam.size > 0
          ? (Array.from(requiredSkillsForTeam).filter(skill =>
              availableSkills.has(skill)
            ).length /
              requiredSkillsForTeam.size) *
            100
          : 100;

      let skillStatus: 'excellent' | 'good' | 'warning' | 'critical' =
        'excellent';
      if (skillCoverage < 40) skillStatus = 'critical';
      else if (skillCoverage < 70) skillStatus = 'warning';
      else if (skillCoverage < 90) skillStatus = 'good';

      const skillFactor: ConfidenceFactor = {
        id: 'skills',
        name: 'Skill Alignment',
        score: skillCoverage,
        weight: 0.2,
        status: skillStatus,
        description: `Alignment between required and available skills`,
        details: [
          `${Math.round(skillCoverage)}% of required skills are available`,
          `${requiredSkillsForTeam.size} skills required, ${availableSkills.size} available`,
        ],
        recommendations:
          skillStatus !== 'excellent'
            ? [
                'Provide skill training for team members',
                'Hire specialists for missing skills',
                'Partner with teams that have required skills',
              ]
            : [],
      };

      // Factor 3: Team Stability
      const teamStability = teamMembers.length >= 2 ? 90 : 50; // Simple stability metric
      let stabilityStatus: 'excellent' | 'good' | 'warning' | 'critical' =
        'excellent';
      if (teamMembers.length === 0) stabilityStatus = 'critical';
      else if (teamMembers.length === 1) stabilityStatus = 'warning';
      else if (teamMembers.length < 3) stabilityStatus = 'good';

      const stabilityFactor: ConfidenceFactor = {
        id: 'stability',
        name: 'Team Stability',
        score: teamStability,
        weight: 0.15,
        status: stabilityStatus,
        description: `Team composition and knowledge distribution`,
        details: [
          `${teamMembers.length} active team members`,
          teamMembers.length === 1
            ? 'Single point of failure risk'
            : 'Multiple team members for knowledge sharing',
        ],
        recommendations:
          stabilityStatus !== 'excellent'
            ? [
                'Add team members to reduce single points of failure',
                'Cross-train team members',
                'Document critical knowledge',
              ]
            : [],
      };

      // Factor 4: Scope Clarity
      const definedEpics = teamAllocations.filter(a => a.epicId).length;
      const totalAllocations = teamAllocations.length;
      const scopeClarity =
        totalAllocations > 0 ? (definedEpics / totalAllocations) * 100 : 0;

      let scopeStatus: 'excellent' | 'good' | 'warning' | 'critical' =
        'excellent';
      if (scopeClarity < 50) scopeStatus = 'critical';
      else if (scopeClarity < 75) scopeStatus = 'warning';
      else if (scopeClarity < 90) scopeStatus = 'good';

      const scopeFactor: ConfidenceFactor = {
        id: 'scope',
        name: 'Scope Clarity',
        score: scopeClarity,
        weight: 0.2,
        status: scopeStatus,
        description: `Clarity and definition of planned work`,
        details: [
          `${Math.round(scopeClarity)}% of allocations have defined epics`,
          `${definedEpics} of ${totalAllocations} allocations are defined`,
        ],
        recommendations:
          scopeStatus !== 'excellent'
            ? [
                'Define unclear work items as epics',
                'Break down large epics into smaller ones',
                'Clarify acceptance criteria',
              ]
            : [],
      };

      // Factor 5: Historical Performance (mock data)
      const historicalPerformance = 70 + Math.random() * 25; // Mock performance metric
      let performanceStatus: 'excellent' | 'good' | 'warning' | 'critical' =
        'excellent';
      if (historicalPerformance < 60) performanceStatus = 'critical';
      else if (historicalPerformance < 75) performanceStatus = 'warning';
      else if (historicalPerformance < 85) performanceStatus = 'good';

      const performanceFactor: ConfidenceFactor = {
        id: 'performance',
        name: 'Historical Performance',
        score: historicalPerformance,
        weight: 0.2,
        status: performanceStatus,
        description: `Team's past delivery performance`,
        details: [
          `${Math.round(historicalPerformance)}% average delivery success rate`,
          'Based on last 3 iterations',
        ],
        recommendations:
          performanceStatus !== 'excellent'
            ? [
                'Analyze past delivery issues',
                'Improve estimation accuracy',
                'Address recurring blockers',
              ]
            : [],
      };

      const factors = [
        capacityFactor,
        skillFactor,
        stabilityFactor,
        scopeFactor,
        performanceFactor,
      ];

      // Calculate weighted overall score
      const overallScore = factors.reduce(
        (sum, factor) => sum + factor.score * factor.weight,
        0
      );

      // Determine risk level and readiness
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let readinessStatus:
        | 'ready'
        | 'mostly-ready'
        | 'needs-attention'
        | 'not-ready' = 'ready';

      if (overallScore < 50) {
        riskLevel = 'critical';
        readinessStatus = 'not-ready';
      } else if (overallScore < 70) {
        riskLevel = 'high';
        readinessStatus = 'needs-attention';
      } else if (overallScore < 85) {
        riskLevel = 'medium';
        readinessStatus = 'mostly-ready';
      }

      return {
        teamId: team.id,
        teamName: team.name,
        overallScore,
        factors,
        riskLevel,
        readinessStatus,
      };
    });

    // Calculate overall planning confidence
    const overallScore =
      teamScores.length > 0
        ? teamScores.reduce((sum, team) => sum + team.overallScore, 0) /
          teamScores.length
        : 0;

    return { teamScores, overallScore };
  }, [teams, people, allocations, personSkills, selectedCycleId, cycles]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadinessIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'mostly-ready':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'needs-attention':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'not-ready':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFactorIcon = (factorId: string) => {
    switch (factorId) {
      case 'capacity':
        return <Users className="h-4 w-4" />;
      case 'skills':
        return <Target className="h-4 w-4" />;
      case 'stability':
        return <Shield className="h-4 w-4" />;
      case 'scope':
        return <Activity className="h-4 w-4" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (!selectedCycleId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Please select a cycle to analyze planning confidence.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Confidence Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Planning Confidence Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div
                className={`text-4xl font-bold ${getScoreColor(confidenceAnalysis.overallScore)}`}
              >
                {Math.round(confidenceAnalysis.overallScore)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Overall Planning Confidence
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                {confidenceAnalysis.overallScore >= 85 && (
                  <Badge className="bg-green-100 text-green-800">
                    High Confidence
                  </Badge>
                )}
                {confidenceAnalysis.overallScore >= 70 &&
                  confidenceAnalysis.overallScore < 85 && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Medium Confidence
                    </Badge>
                  )}
                {confidenceAnalysis.overallScore < 70 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Low Confidence
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Based on {confidenceAnalysis.teamScores.length} team(s)
              </div>
            </div>
          </div>

          <Progress
            value={confidenceAnalysis.overallScore}
            className="h-3 mb-4"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">
                {
                  confidenceAnalysis.teamScores.filter(
                    t => t.readinessStatus === 'ready'
                  ).length
                }
              </div>
              <div className="text-xs text-gray-600">Ready Teams</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {
                  confidenceAnalysis.teamScores.filter(
                    t => t.readinessStatus === 'mostly-ready'
                  ).length
                }
              </div>
              <div className="text-xs text-gray-600">Mostly Ready</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow-600">
                {
                  confidenceAnalysis.teamScores.filter(
                    t => t.readinessStatus === 'needs-attention'
                  ).length
                }
              </div>
              <div className="text-xs text-gray-600">Need Attention</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">
                {
                  confidenceAnalysis.teamScores.filter(
                    t => t.readinessStatus === 'not-ready'
                  ).length
                }
              </div>
              <div className="text-xs text-gray-600">Not Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team-by-Team Analysis */}
      <div className="space-y-4">
        {confidenceAnalysis.teamScores.map(teamScore => (
          <Card key={teamScore.teamId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getReadinessIcon(teamScore.readinessStatus)}
                  <div>
                    <CardTitle className="text-base">
                      {teamScore.teamName}
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      Confidence Score: {Math.round(teamScore.overallScore)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(teamScore.readinessStatus)}>
                    {teamScore.readinessStatus.replace('-', ' ')}
                  </Badge>
                  <Badge
                    className={
                      teamScore.riskLevel === 'low'
                        ? 'bg-green-100 text-green-800'
                        : teamScore.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : teamScore.riskLevel === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                    }
                  >
                    {teamScore.riskLevel} risk
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamScore.factors.map(factor => (
                  <div key={factor.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getFactorIcon(factor.id)}
                        <span className="font-medium text-sm">
                          {factor.name}
                        </span>
                      </div>
                      <Badge className={getStatusColor(factor.status)}>
                        {Math.round(factor.score)}%
                      </Badge>
                    </div>

                    <Progress value={factor.score} className="h-2 mb-2" />

                    <div className="text-xs text-gray-600 mb-2">
                      {factor.description}
                    </div>

                    <div className="space-y-1">
                      {factor.details.map((detail, index) => (
                        <div key={index} className="text-xs text-gray-700">
                          • {detail}
                        </div>
                      ))}
                    </div>

                    {factor.recommendations.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Recommendations:
                        </div>
                        {factor.recommendations
                          .slice(0, 2)
                          .map((rec, index) => (
                            <div key={index} className="text-xs text-blue-600">
                              • {rec}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {confidenceAnalysis.overallScore < 70 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-medium text-red-800">
                  Low Planning Confidence
                </div>
                <div className="text-sm text-red-700 mt-1">
                  Consider delaying iteration start until critical issues are
                  resolved. Focus on teams marked as "not ready" or "needs
                  attention".
                </div>
              </div>
            )}

            {confidenceAnalysis.overallScore >= 70 &&
              confidenceAnalysis.overallScore < 85 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800">
                    Medium Planning Confidence
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Planning is acceptable but improvements are recommended.
                    Address the most critical factors before iteration start.
                  </div>
                </div>
              )}

            {confidenceAnalysis.overallScore >= 85 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-800">
                  High Planning Confidence
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Teams are well-prepared for the upcoming iteration. Continue
                  monitoring for any changes in team capacity or scope.
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">
                General Recommendations
              </div>
              <div className="text-sm text-blue-700 mt-1">
                • Review team allocations weekly for capacity changes • Ensure
                all epics have clear acceptance criteria • Maintain skill
                development plans for critical gaps • Monitor team stability and
                cross-training needs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningConfidenceScore;
