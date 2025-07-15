import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  ArrowRight,
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'training' | 'hiring' | 'rebalancing' | 'timeline' | 'budget';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  cost?: number;
  affectedTeams: string[];
  expectedOutcome: string;
  actionSteps: string[];
}

interface TeamMatch {
  id: string;
  name: string;
  score: number;
  skills?: string[];
}

interface SkillGap {
  skill: string;
  required: number;
  available: number;
  gap: number;
}

interface RecommendationsEngineProps {
  teamMatches: TeamMatch[];
  skillGaps: SkillGap[];
  projectBudget?: number;
  projectTimeline?: string;
}

const RecommendationsEngine: React.FC<RecommendationsEngineProps> = ({
  teamMatches,
  skillGaps,
  projectBudget = 0,
  projectTimeline = 'Q2 2024',
}) => {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Training recommendations
    const criticalGaps = skillGaps.filter(gap => gap.importance === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push({
        id: 'training-critical',
        type: 'training',
        priority: 'high',
        title: 'Urgent Skills Training Program',
        description: `Address ${criticalGaps.length} critical skill gaps through intensive training`,
        impact: 'High - Enables project execution without external hiring',
        effort: 'medium',
        timeline: '4-6 weeks',
        cost: 15000,
        affectedTeams: teamMatches.slice(0, 3).map(t => t.teamName),
        expectedOutcome: '80% skill gap closure, improved team confidence',
        actionSteps: [
          'Identify training providers for critical skills',
          'Schedule intensive workshops',
          'Assign mentors for hands-on practice',
          'Track progress weekly',
        ],
      });
    }

    // Hiring recommendations
    const uncoveredSkills = skillGaps.filter(gap => !gap.availableInTeam);
    if (uncoveredSkills.length > 2) {
      recommendations.push({
        id: 'hiring-specialists',
        type: 'hiring',
        priority: 'medium',
        title: 'Strategic Specialist Hiring',
        description: `Hire 2-3 specialists to cover ${uncoveredSkills.length} unavailable skills`,
        impact: 'High - Immediate skill availability, faster delivery',
        effort: 'high',
        timeline: '8-12 weeks',
        cost: 180000,
        affectedTeams: ['All teams'],
        expectedOutcome:
          '100% skill coverage, knowledge transfer to existing team',
        actionSteps: [
          'Create detailed job descriptions',
          'Partner with specialized recruitment agencies',
          'Implement skills assessment process',
          'Plan onboarding and knowledge sharing',
        ],
      });
    }

    // Resource rebalancing
    const overutilizedTeams = teamMatches.filter(
      team => team.availabilityPercentage < 20
    );
    if (overutilizedTeams.length > 0) {
      recommendations.push({
        id: 'rebalancing-resources',
        type: 'rebalancing',
        priority: 'high',
        title: 'Resource Rebalancing Initiative',
        description: `Redistribute workload across ${overutilizedTeams.length} overutilized teams`,
        impact: 'Medium - Improved team health, sustainable delivery pace',
        effort: 'low',
        timeline: '2-3 weeks',
        affectedTeams: overutilizedTeams.map(t => t.teamName),
        expectedOutcome: 'Balanced utilization, reduced burnout risk',
        actionSteps: [
          'Analyze current allocation patterns',
          'Identify transferable tasks',
          'Negotiate with project stakeholders',
          'Implement gradual transition plan',
        ],
      });
    }

    // Timeline adjustment
    const bestMatch = teamMatches[0];
    if (
      bestMatch &&
      bestMatch.skillMatchPercentage > 80 &&
      bestMatch.availabilityPercentage < 30
    ) {
      recommendations.push({
        id: 'timeline-adjustment',
        type: 'timeline',
        priority: 'medium',
        title: 'Strategic Timeline Extension',
        description:
          'Extend project timeline to accommodate team availability constraints',
        impact: 'Medium - Higher quality delivery, reduced risk',
        effort: 'low',
        timeline: '1 week',
        affectedTeams: [bestMatch.teamName],
        expectedOutcome: 'Optimal team utilization, improved quality',
        actionSteps: [
          'Present business case to stakeholders',
          'Negotiate new delivery dates',
          'Update project plan and milestones',
          'Communicate changes to all parties',
        ],
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training':
        return BookOpen;
      case 'hiring':
        return Users;
      case 'rebalancing':
        return TrendingUp;
      case 'timeline':
        return Clock;
      case 'budget':
        return DollarSign;
      default:
        return Target;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'text-blue-600 bg-blue-100';
      case 'hiring':
        return 'text-green-600 bg-green-100';
      case 'rebalancing':
        return 'text-orange-600 bg-orange-100';
      case 'timeline':
        return 'text-purple-600 bg-purple-100';
      case 'budget':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEffortIndicator = (effort: string) => {
    const values = { low: 25, medium: 50, high: 75 };
    return values[effort as keyof typeof values] || 50;
  };

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            AI-Powered Recommendations Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {recommendations.length}
              </div>
              <p className="text-sm text-gray-600">Total Recommendations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {recommendations.filter(r => r.priority === 'high').length}
              </div>
              <p className="text-sm text-gray-600">High Priority</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                $
                {recommendations
                  .reduce((sum, r) => sum + (r.cost || 0), 0)
                  .toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Total Investment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {recommendations.map(rec => {
          const TypeIcon = getTypeIcon(rec.type);
          const typeColor = getTypeColor(rec.type);

          return (
            <Card key={rec.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${typeColor}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{rec.title}</h3>
                      <p className="text-gray-600 text-sm">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        getPriorityColor(rec.priority) as
                          | 'destructive'
                          | 'secondary'
                          | 'outline'
                      }
                    >
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">{rec.timeline}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Expected Impact
                    </h4>
                    <p className="text-sm text-gray-600">{rec.impact}</p>

                    <h4 className="font-medium mb-2 mt-4 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Expected Outcome
                    </h4>
                    <p className="text-sm text-gray-600">
                      {rec.expectedOutcome}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Implementation Effort</h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <Progress
                        value={getEffortIndicator(rec.effort)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium capitalize">
                        {rec.effort}
                      </span>
                    </div>

                    {rec.cost && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Estimated Cost:</span>
                        <span className="font-medium">
                          ${rec.cost.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="mt-2">
                      <span className="text-sm font-medium">
                        Affected Teams:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.affectedTeams.map((team, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {team}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Action Steps
                  </h4>
                  <ul className="space-y-1">
                    {rec.actionSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 flex items-start"
                      >
                        <span className="text-blue-600 mr-2 font-medium">
                          {idx + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    Save for Later
                  </Button>
                  <Button size="sm">Start Implementation</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsEngine;
