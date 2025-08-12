import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  Target,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRight,
  Brain,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  analyzeSkillCoverage,
  analyzeProjectSkillGaps,
} from '@/utils/skillBasedPlanning';

interface SkillsMetrics {
  totalSkills: number;
  coveredSkills: number;
  skillCoverage: number;
  criticalGaps: number;
  topSkillGaps: Array<{
    skillName: string;
    gap: number;
    riskLevel: 'high' | 'medium' | 'low';
  }>;
  teamRecommendations: number;
}

const SkillsInsightsCard = () => {
  const {
    skills,
    people,
    personSkills,
    teams,
    projects,
    projectSkills,
    teamMembers,
  } = useApp();

  const skillsMetrics = useMemo((): SkillsMetrics => {
    // Analyze skill coverage across organization
    const coverageAnalysis = analyzeSkillCoverage(
      skills,
      people,
      personSkills,
      teams,
      teamMembers
    );

    // Analyze project skill gaps for active projects
    const activeProjects = projects.filter(p => p.status === 'active');
    let totalGaps = 0;
    let criticalGaps = 0;
    const skillGapMap = new Map<string, { gap: number; projects: number }>();

    activeProjects.forEach(project => {
      const projectSkillReqs = projectSkills.filter(
        ps => ps.projectId === project.id
      );
      if (projectSkillReqs.length === 0) return;

      const gapAnalysis = analyzeProjectSkillGaps(
        project,
        teams,
        people,
        personSkills,
        skills,
        projectSkills,
        teamMembers
      );

      gapAnalysis.skillGaps.forEach(gap => {
        totalGaps++;
        if (gap.severity === 'high') criticalGaps++;

        const existing = skillGapMap.get(gap.skillId) || {
          gap: 0,
          projects: 0,
        };
        skillGapMap.set(gap.skillId, {
          gap: existing.gap + gap.gap,
          projects: existing.projects + 1,
        });
      });
    });

    // Get top skill gaps
    const topSkillGaps = Array.from(skillGapMap.entries())
      .map(([skillId, data]) => {
        const skill = skills.find(s => s.id === skillId);
        const avgGap = data.gap / data.projects;
        return {
          skillName: skill?.name || 'Unknown',
          gap: avgGap,
          riskLevel:
            avgGap > 0.7 ? 'high' : avgGap > 0.4 ? 'medium' : ('low' as const),
        };
      })
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);

    // Count teams that could benefit from skill recommendations
    const teamsNeedingSkills = teams.filter(team => {
      const teamSkillAnalysis = analyzeSkillCoverage(
        skills,
        people.filter(p =>
          teamMembers.some(tm => tm.teamId === team.id && tm.personId === p.id)
        ),
        personSkills,
        [team],
        teamMembers.filter(tm => tm.teamId === team.id)
      );
      return (
        teamSkillAnalysis.riskLevel === 'high' || teamSkillAnalysis.gapCount > 3
      );
    }).length;

    return {
      totalSkills: skills.length,
      coveredSkills: coverageAnalysis.coveredSkills,
      skillCoverage: coverageAnalysis.coveragePercentage,
      criticalGaps,
      topSkillGaps,
      teamRecommendations: teamsNeedingSkills,
    };
  }, [
    skills,
    people,
    personSkills,
    teams,
    projects,
    projectSkills,
    teamMembers,
  ]);

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'text-green-600';
    if (coverage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Skills Intelligence
        </CardTitle>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Coverage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Skills Coverage
              </span>
              <span
                className={`font-medium ${getCoverageColor(skillsMetrics.skillCoverage)}`}
              >
                {skillsMetrics.skillCoverage.toFixed(1)}%
              </span>
            </div>
            <Progress value={skillsMetrics.skillCoverage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {skillsMetrics.coveredSkills} of {skillsMetrics.totalSkills}{' '}
              skills covered
            </div>
          </div>

          {/* Critical Gaps */}
          {skillsMetrics.criticalGaps > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                Critical Gaps
              </span>
              <Badge variant="destructive">{skillsMetrics.criticalGaps}</Badge>
            </div>
          )}

          {/* Top Skill Gaps */}
          {skillsMetrics.topSkillGaps.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Top Skill Gaps</span>
              {skillsMetrics.topSkillGaps.map((gap, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm truncate">{gap.skillName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {(gap.gap * 100).toFixed(0)}%
                    </span>
                    <Badge
                      variant={getRiskBadgeVariant(gap.riskLevel)}
                      className="text-xs"
                    >
                      {gap.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team Recommendations */}
          {skillsMetrics.teamRecommendations > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
                Teams Need Skills
              </span>
              <Badge variant="secondary">
                {skillsMetrics.teamRecommendations}
              </Badge>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <Link to="/skills">
                <span className="flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Skills Analysis
                </span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
            {skillsMetrics.teamRecommendations > 0 && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-between"
              >
                <Link to="/teams?view=skills">
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    Team Recommendations
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsInsightsCard;
