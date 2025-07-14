import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Target,
  UserPlus,
  BarChart3,
  Download,
  Upload,
  Plus,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Team, TeamMember, UnmappedPerson } from '@/types';
import TeamBuilder from '@/components/teams/TeamBuilder';
// UnmappedPeople component was consolidated into Team functionality

const TeamBuilderPage: React.FC = () => {
  const { teams, teamMembers, unmappedPeople, people, getTeamMembers } =
    useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Calculate overview statistics
  const stats = {
    totalTeams: teams.length,
    activeTeams: teams.filter(t => t.status === 'active').length,
    totalMembers: teamMembers.filter(m => m.isActive).length,
    unmappedCount: unmappedPeople.length,
    avgTeamSize:
      teams.length > 0
        ? Math.round(
            (teamMembers.filter(m => m.isActive).length / teams.length) * 10
          ) / 10
        : 0,
  };

  const getTeamStatusColor = (status: Team['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'planning':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'on-hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTeamTypeIcon = (type: Team['type']) => {
    switch (type) {
      case 'project':
        return '🚀';
      case 'initiative':
        return '💡';
      case 'workstream':
        return '🔄';
      case 'feature-team':
        return '⚡';
      case 'permanent':
        return '🏢';
      default:
        return '👥';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Builder</h1>
          <p className="text-muted-foreground">
            Build teams, map people to teams, and analyze team composition
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTeams} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-500" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgTeamSize} per team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserPlus className="h-4 w-4 mr-2 text-orange-500" />
              Unmapped People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unmappedCount}</div>
            <p className="text-xs text-muted-foreground">
              Need team assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
              Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {people.length > 0
                ? Math.round((stats.totalMembers / people.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">People in teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-indigo-500" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.length > 0
                ? Math.round(
                    (teamMembers.filter(m => m.allocation >= 80).length /
                      teamMembers.length) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">High allocation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="builder">Team Builder</TabsTrigger>
          <TabsTrigger value="mapping">People Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.slice(0, 5).map(team => {
                    const memberCount = getTeamMembers(team.id).length;

                    return (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {getTeamTypeIcon(team.type)}
                          </div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {memberCount} members • {team.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={`text-white ${getTeamStatusColor(team.status)}`}
                          >
                            {team.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {teams.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No teams created yet</p>
                      <p className="text-sm">
                        Create your first team to get started
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unmapped People */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unmapped People</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unmappedPeople.slice(0, 5).map(person => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{person.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {person.skills.length} skills •{' '}
                            {person.availability}% available
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Map to Team
                      </Button>
                    </div>
                  ))}

                  {unmappedPeople.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>All people are mapped</p>
                      <p className="text-sm">Great job on team assignments!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <TeamBuilder
            selectedTeam={selectedTeam}
            onTeamChange={setSelectedTeam}
          />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                People to Team Mapping
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select people from the unmapped list and assign them to teams,
                or create new teams.
              </p>
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>People mapping functionality</p>
                <p className="text-sm">
                  Use the Team Builder tab to assign people to teams
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Team Overview</h2>
              <p className="text-sm text-muted-foreground mb-6">
                View existing teams and their current members.
              </p>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {teams.map(team => {
                  const members = getTeamMembers(team.id);
                  const memberCount = members.length;
                  const capacityUsed = members.reduce(
                    (sum, m) => sum + (m.allocation / 100) * 40,
                    0
                  );

                  return (
                    <Card key={team.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {getTeamTypeIcon(team.type)}
                          </span>
                          <div>
                            <h4 className="font-medium">{team.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {team.type}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-white ${getTeamStatusColor(team.status)}`}
                        >
                          {team.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>{memberCount} members</span>
                          <span>
                            {Math.round((capacityUsed / team.capacity) * 100)}%
                            capacity
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {teams.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No teams created yet</p>
                    <p className="text-sm">
                      Go to the Team Builder tab to create your first team
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamBuilderPage;
