
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';

const CapacityOverview = () => {
  const { teams, people, divisions } = useApp();

  const getTeamStats = () => {
    return teams.map(team => {
      const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);
      const actualCapacity = teamMembers.length * 40; // Assuming 40 hours per person
      const utilizationPercentage = team.capacity > 0 ? (actualCapacity / team.capacity) * 100 : 0;
      
      return {
        ...team,
        memberCount: teamMembers.length,
        actualCapacity,
        utilizationPercentage: Math.round(utilizationPercentage),
        isOverCapacity: utilizationPercentage > 100,
        isUnderCapacity: utilizationPercentage < 80,
      };
    });
  };

  const getDivisionStats = () => {
    return divisions.map(division => {
      const divisionTeams = teams.filter(t => t.divisionId === division.id);
      const totalCapacity = divisionTeams.reduce((sum, team) => sum + team.capacity, 0);
      const totalMembers = divisionTeams.reduce((sum, team) => {
        return sum + people.filter(p => p.teamId === team.id && p.isActive).length;
      }, 0);
      const actualCapacity = totalMembers * 40;
      
      return {
        ...division,
        teamCount: divisionTeams.length,
        totalCapacity,
        totalMembers,
        actualCapacity,
        utilizationPercentage: totalCapacity > 0 ? Math.round((actualCapacity / totalCapacity) * 100) : 0,
      };
    });
  };

  const teamStats = getTeamStats();
  const divisionStats = getDivisionStats();
  const overCapacityTeams = teamStats.filter(t => t.isOverCapacity);
  const underCapacityTeams = teamStats.filter(t => t.isUnderCapacity);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Capacity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overCapacityTeams.length}</div>
            <p className="text-xs text-gray-500">teams exceeding capacity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Capacity</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{underCapacityTeams.length}</div>
            <p className="text-xs text-gray-500">teams under 80% capacity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimal Teams</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teamStats.filter(t => !t.isOverCapacity && !t.isUnderCapacity).length}
            </div>
            <p className="text-xs text-gray-500">teams at optimal capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Division Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Division Capacity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {divisionStats.map(division => (
              <div key={division.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{division.name}</h3>
                    <Badge variant={
                      division.utilizationPercentage > 100 ? 'destructive' :
                      division.utilizationPercentage < 80 ? 'secondary' :
                      'default'
                    }>
                      {division.utilizationPercentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{division.teamCount} teams</span>
                    <span>{division.totalMembers} members</span>
                    <span>{division.totalCapacity}h planned capacity</span>
                  </div>
                  <Progress 
                    value={Math.min(division.utilizationPercentage, 100)} 
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Details */}
      <Card>
        <CardHeader>
          <CardTitle>Team Capacity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamStats.map(team => (
              <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{team.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        team.isOverCapacity ? 'destructive' :
                        team.isUnderCapacity ? 'secondary' :
                        'default'
                      }>
                        {team.utilizationPercentage}%
                      </Badge>
                      {team.isOverCapacity && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{team.memberCount} members</span>
                    <span>{team.actualCapacity}h actual / {team.capacity}h planned</span>
                  </div>
                  <Progress 
                    value={Math.min(team.utilizationPercentage, 100)} 
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapacityOverview;
