
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, Users, DollarSign, AlertTriangle, 
  Calendar, CheckCircle, TrendingUp 
} from 'lucide-react';
import { ProjectFeasibilityAnalysis } from '@/types/planningTypes';

interface ProjectFeasibilityCardProps {
  analysis: ProjectFeasibilityAnalysis;
}

const ProjectFeasibilityCard: React.FC<ProjectFeasibilityCardProps> = ({ analysis }) => {
  const getFeasibilityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeasibilityBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500">High Feasibility</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-500">Medium Feasibility</Badge>;
    return <Badge className="bg-red-500">Low Feasibility</Badge>;
  };

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            {analysis.projectName}
          </CardTitle>
          {getFeasibilityBadge(analysis.feasibilityScore)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feasibility Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Feasibility</span>
            <span className={`text-lg font-bold ${getFeasibilityColor(analysis.feasibilityScore)}`}>
              {Math.round(analysis.feasibilityScore)}%
            </span>
          </div>
          <Progress value={analysis.feasibilityScore} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Budget Required</p>
              <p className="font-semibold">
                ${(analysis.budgetRequirement / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">
                {analysis.timelineRequirement.durationInIterations} iterations
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Team Options</p>
              <p className="font-semibold">{analysis.recommendedTeams.length} teams</p>
            </div>
          </div>
        </div>

        {/* Skills Required */}
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Required Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.requiredSkills.map(skill => (
              <Badge
                key={skill.skillId}
                variant={skill.importance === 'critical' ? 'destructive' : 'secondary'}
              >
                {skill.skillName}
                {skill.importance === 'critical' && ' *'}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">* Critical skills</p>
        </div>

        {/* Top Team Recommendations */}
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Top Team Matches
          </h4>
          <div className="space-y-2">
            {analysis.recommendedTeams.slice(0, 3).map(team => (
              <div key={team.teamId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{team.teamName}</p>
                  <p className="text-sm text-gray-600">
                    Skills: {Math.round(team.skillMatch)}% | 
                    Availability: {Math.round(team.availabilityMatch)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    {Math.round(team.matchScore)}%
                  </p>
                  <p className="text-xs text-gray-500">Match</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        {analysis.riskFactors.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {analysis.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${getRiskSeverityColor(risk.severity)}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{risk.description}</p>
                    {risk.mitigation && (
                      <p className="text-xs text-gray-600 mt-1">
                        Mitigation: {risk.mitigation}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={getRiskSeverityColor(risk.severity)}>
                    {risk.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectFeasibilityCard;
