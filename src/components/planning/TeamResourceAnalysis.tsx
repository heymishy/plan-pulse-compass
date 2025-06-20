
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, DollarSign, Zap } from 'lucide-react';
import { ProjectFeasibilityAnalysis } from '@/types/planningTypes';
import { Team, Person, Role } from '@/types';
import { calculatePersonCost } from '@/utils/financialCalculations';

interface TeamResourceAnalysisProps {
  projectAnalyses: ProjectFeasibilityAnalysis[];
  teams: Team[];
  people: Person[];
  roles: Role[];
}

const TeamResourceAnalysis: React.FC<TeamResourceAnalysisProps> = ({
  projectAnalyses,
  teams,
  people,
  roles
}) => {
  // Get all unique teams from recommendations
  const allRecommendedTeams = React.useMemo(() => {
    const teamMap = new Map();
    
    projectAnalyses.forEach(analysis => {
      analysis.recommendedTeams.forEach(team => {
        if (!teamMap.has(team.teamId)) {
          teamMap.set(team.teamId, {
            ...team,
            projectMatches: [analysis.projectName]
          });
        } else {
          teamMap.get(team.teamId).projectMatches.push(analysis.projectName);
        }
      });
    });
    
    return Array.from(teamMap.values()).sort((a, b) => b.matchScore - a.matchScore);
  }, [projectAnalyses]);

  const getTeamCost = (teamId: string) => {
    const teamMembers = people.filter(p => p.teamId === teamId && p.isActive);
    let totalCost = 0;
    
    teamMembers.forEach(person => {
      const role = roles.find(r => r.id === person.roleId);
      if (role) {
        const personCost = calculatePersonCost(person, role);
        totalCost += personCost.costPerMonth;
      }
    });
    
    return totalCost;
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 70) return 'text-green-600';
    if (availability >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Resource Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Analysis of team availability, skills, and cost for selected projects
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            {allRecommendedTeams.map(team => {
              const teamData = teams.find(t => t.id === team.teamId);
              const teamMembers = people.filter(p => p.teamId === team.teamId && p.isActive);
              const monthlyCost = getTeamCost(team.teamId);
              
              return (
                <Card key={team.teamId} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{team.teamName}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {Math.round(team.matchScore)}% Match
                        </Badge>
                        <Badge 
                          className={`${getAvailabilityColor(team.availabilityMatch)}`}
                          variant="outline"
                        >
                          {Math.round(team.availabilityMatch)}% Available
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Team Size</p>
                          <p className="font-semibold">{teamMembers.length} people</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Capacity</p>
                          <p className="font-semibold">{teamData?.capacity || 0}h/week</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Monthly Cost</p>
                          <p className="font-semibold">${(monthlyCost / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Efficiency</p>
                          <p className="font-semibold">
                            {team.costEfficiency?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Skill Match Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Skill Match</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(team.skillMatch)}%
                        </span>
                      </div>
                      <Progress value={team.skillMatch} className="h-2" />
                    </div>

                    {/* Availability Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Availability</span>
                        <span className={`text-sm ${getAvailabilityColor(team.availabilityMatch)}`}>
                          {Math.round(team.availabilityMatch)}%
                        </span>
                      </div>
                      <Progress value={team.availabilityMatch} className="h-2" />
                    </div>

                    {/* Project Matches */}
                    <div>
                      <p className="text-sm font-medium mb-2">Suitable for Projects:</p>
                      <div className="flex flex-wrap gap-2">
                        {team.projectMatches.map((projectName: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {projectName}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Current Allocations */}
                    {team.currentAllocations && team.currentAllocations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Current Allocations:</p>
                        <div className="space-y-1">
                          {team.currentAllocations.map((allocation: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{allocation.projectName}</span>
                              <Badge variant="outline">{allocation.percentage}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Gaps */}
                    {team.skillGaps && team.skillGaps.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Skill Gaps:</p>
                        <div className="flex flex-wrap gap-2">
                          {team.skillGaps.map((gap: any) => (
                            <Badge key={gap.skillId} variant="destructive">
                              {gap.skillName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamResourceAnalysis;
