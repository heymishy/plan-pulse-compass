
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Search, Settings, Star } from 'lucide-react';
import TeamTable from '@/components/teams/TeamTable';
import TeamCards from '@/components/teams/TeamCards';
import TeamDialog from '@/components/teams/TeamDialog';
import CapacityOverview from '@/components/teams/CapacityOverview';
import TeamSkillsSummary from '@/components/scenarios/TeamSkillsSummary';

const Teams = () => {
  const { teams, people, divisions, isSetupComplete } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [selectedTeamForSkills, setSelectedTeamForSkills] = useState<string>('');

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to manage teams.
          </p>
        </div>
      </div>
    );
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = selectedDivision === 'all' || team.divisionId === selectedDivision;
    return matchesSearch && matchesDivision;
  });

  const totalCapacity = teams.reduce((sum, team) => sum + team.capacity, 0);
  const activeTeams = teams.filter(team => 
    people.some(person => person.teamId === team.id && person.isActive)
  );

  const handleEditTeam = (teamId: string) => {
    setEditingTeam(teamId);
    setIsDialogOpen(true);
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
          <p className="text-gray-600">
            Manage teams and their capacity across your organization
          </p>
        </div>
        <Button onClick={handleAddTeam}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeams.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}h</div>
            <p className="text-xs text-gray-500">per week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Divisions</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{divisions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Divisions</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-md shadow-sm">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-r-none"
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-l-none"
              >
                Cards
              </Button>
            </div>
          </div>

          {/* Teams Display */}
          {viewMode === 'table' ? (
            <TeamTable teams={filteredTeams} onEditTeam={handleEditTeam} />
          ) : (
            <TeamCards teams={filteredTeams} onEditTeam={handleEditTeam} />
          )}
        </TabsContent>

        <TabsContent value="capacity">
          <CapacityOverview />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {/* Team Selection for Skills Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Team Skills Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Team to Analyze:</label>
                  <select
                    value={selectedTeamForSkills}
                    onChange={(e) => setSelectedTeamForSkills(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Summary */}
          {selectedTeamForSkills && (
            <TeamSkillsSummary teamId={selectedTeamForSkills} />
          )}
        </TabsContent>
      </Tabs>

      <TeamDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        teamId={editingTeam}
      />
    </div>
  );
};

export default Teams;
