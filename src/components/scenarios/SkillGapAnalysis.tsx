
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, TrendingDown, TrendingUp, Users, 
  BookOpen, Target, Lightbulb 
} from 'lucide-react';

interface SkillGapAnalysisProps {
  skillGaps: any[];
  teamMatches: any[];
}

const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({ skillGaps, teamMatches }) => {
  const getGapSeverity = (importance: string) => {
    switch (importance) {
      case 'critical': return { color: 'bg-red-500', label: 'Critical', priority: 3 };
      case 'important': return { color: 'bg-yellow-500', label: 'Important', priority: 2 };
      default: return { color: 'bg-blue-500', label: 'Nice-to-have', priority: 1 };
    }
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    // Training recommendations
    const criticalGaps = skillGaps.filter(gap => gap.importance === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push({
        type: 'training',
        title: 'Urgent Training Required',
        description: `${criticalGaps.length} critical skills missing across teams`,
        action: 'Schedule immediate training programs',
        priority: 'high'
      });
    }

    // Hiring recommendations
    const uncoveredSkills = skillGaps.filter(gap => !gap.availableInTeam);
    if (uncoveredSkills.length > 2) {
      recommendations.push({
        type: 'hiring',
        title: 'Consider New Hires',
        description: `${uncoveredSkills.length} skills completely unavailable`,
        action: 'Recruit specialists or consultants',
        priority: 'medium'
      });
    }

    // Team rebalancing
    const overutilizedTeams = teamMatches.filter(team => team.availabilityPercentage < 20);
    if (overutilizedTeams.length > 0) {
      recommendations.push({
        type: 'rebalancing',
        title: 'Resource Rebalancing',
        description: `${overutilizedTeams.length} teams at high utilization`,
        action: 'Redistribute workload or add resources',
        priority: 'medium'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Gap Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {skillGaps.filter(gap => gap.importance === 'critical').length}
            </div>
            <p className="text-xs text-gray-500">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Important Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {skillGaps.filter(gap => gap.importance === 'important').length}
            </div>
            <p className="text-xs text-gray-500">Plan for development</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Nice-to-have</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {skillGaps.filter(gap => gap.importance === 'nice-to-have').length}
            </div>
            <p className="text-xs text-gray-500">Future consideration</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Detailed Skill Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillGaps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No skill gaps identified!</p>
              <p className="text-sm">All required skills are available in your teams.</p>
            </div>
          ) : (
            skillGaps
              .sort((a, b) => getGapSeverity(b.importance).priority - getGapSeverity(a.importance).priority)
              .map((gap, index) => {
                const severity = getGapSeverity(gap.importance);
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{gap.skillName}</h4>
                      <Badge className={`text-white ${severity.color}`}>
                        {severity.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        This skill is not available in any team and is marked as {gap.importance}.
                      </p>
                      {gap.alternativeSkills.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Alternatives: </span>
                          {gap.alternativeSkills.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Your teams are well-positioned!</p>
              <p className="text-sm">No immediate actions required.</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {rec.type === 'training' && <BookOpen className="h-4 w-4 mr-2 text-blue-500" />}
                      {rec.type === 'hiring' && <Users className="h-4 w-4 mr-2 text-green-500" />}
                      {rec.type === 'rebalancing' && <TrendingDown className="h-4 w-4 mr-2 text-orange-500" />}
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                        className="ml-2"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm font-medium">{rec.action}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Action
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillGapAnalysis;
