
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Clock } from 'lucide-react';

interface TeamCardsProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamCards: React.FC<TeamCardsProps> = ({ teams, onEditTeam }) => {
  const { people, divisions } = useApp();

  const getTeamMembers = (teamId: string) => {
    return people.filter(person => person.teamId === teamId && person.isActive);
  };

  const getDivisionName = (divisionId?: string) => {
    if (!divisionId) return 'No Division';
    const division = divisions.find(d => d.id === divisionId);
    return division?.name || 'Unknown Division';
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'No Manager';
    const manager = people.find(p => p.id === managerId);
    return manager?.name || 'Unknown Manager';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => {
        const members = getTeamMembers(team.id);
        const utilizationPercentage = members.length > 0 ? 
          Math.round((members.length * 40 / team.capacity) * 100) : 0;
        
        return (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditTeam(team.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Division:</span>
                  <span>{getDivisionName(team.divisionId)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Manager:</span>
                  <span>{getManagerName(team.managerId)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <Badge variant="secondary">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{team.capacity}h/week</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Utilization:</span>
                  <span className={`font-medium ${
                    utilizationPercentage > 100 ? 'text-red-600' :
                    utilizationPercentage > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {utilizationPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      utilizationPercentage > 100 ? 'bg-red-500' :
                      utilizationPercentage > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {members.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm text-gray-600">Team Members:</span>
                  <div className="flex flex-wrap gap-1">
                    {members.slice(0, 3).map(member => (
                      <Badge key={member.id} variant="outline" className="text-xs">
                        {member.name}
                      </Badge>
                    ))}
                    {members.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{members.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TeamCards;
