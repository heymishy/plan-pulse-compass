import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Users,
  Search,
  Settings,
  Star,
  BarChart3,
  Target,
  Activity,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react';
import TeamTable from '@/components/teams/TeamTable';
import TeamCards from '@/components/teams/TeamCards';
import EnhancedTeamDialog from '@/components/teams/TeamDialog';
import PeopleTeamMapper from '@/components/teams/PeopleTeamMapper';
import TeamBuilder from '@/components/teams/TeamBuilder';
import CapacityOverview from '@/components/teams/CapacityOverview';
import TeamSkillsSummary from '@/components/scenarios/TeamSkillsSummary';
import TeamPortfolioOverview from '@/components/teams/TeamPortfolioOverview';
import RunWorkAllocationView from '@/components/teams/RunWorkAllocationView';
import TeamCapacityUtilizationMatrix from '@/components/teams/TeamCapacityUtilizationMatrix';
import EnterpriseTeamAnalytics from '@/components/teams/EnterpriseTeamAnalytics';
import FinancialImpactAnalysis from '@/components/canvas/FinancialImpactAnalysis';
import { ScenarioDebugInfo } from '@/components/scenarios/ScenarioDebugInfo';
import SkillsMigrationDialog from '@/components/skills/SkillsMigrationDialog';

const Teams = () => {
  const { teams, people, divisions, setTeams } = useApp();
  const { isSetupComplete } = useSettings();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [selectedTeamForSkills, setSelectedTeamForSkills] =
    useState<string>('');
  const [isPeopleMapperOpen, setIsPeopleMapperOpen] = useState(false);
  const [selectedTeamForBuilder, setSelectedTeamForBuilder] = useState<
    Team | undefined
  >();
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false);

  if (!isSetupComplete) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setup Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete the initial setup to manage teams.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDivision =
      selectedDivision === 'all' || team.divisionId === selectedDivision;
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

  // Check if default teams exist
  const defaultTeamIds = ['engineering', 'product', 'design', 'marketing'];
  const hasDefaultTeams = teams.some(team => defaultTeamIds.includes(team.id));

  const handleRemoveDefaultTeams = () => {
    const defaultTeamsToRemove = teams.filter(team =>
      defaultTeamIds.includes(team.id)
    );

    if (defaultTeamsToRemove.length === 0) {
      toast({
        title: 'No Default Teams',
        description: 'No default teams found to remove.',
      });
      return;
    }

    setTeams(prev => prev.filter(team => !defaultTeamIds.includes(team.id)));

    toast({
      title: 'Success',
      description: `Removed ${defaultTeamsToRemove.length} default team${defaultTeamsToRemove.length !== 1 ? 's' : ''}: ${defaultTeamsToRemove.map(t => t.name).join(', ')}`,
    });
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className="flex-1 p-6 space-y-6 w-full overflow-auto"
        data-testid="teams-content"
      >
        <ScenarioDebugInfo />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
            <p className="text-gray-600">
              Manage teams and their capacity across your organization
            </p>
          </div>
          <div className="flex gap-2">
            {hasDefaultTeams && (
              <Button
                variant="outline"
                onClick={handleRemoveDefaultTeams}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Default Teams
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsMigrationDialogOpen(true)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Migrate Skills
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPeopleMapperOpen(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              Map People to Teams
            </Button>
            <Button onClick={handleAddTeam}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </div>
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
              <CardTitle className="text-sm font-medium">
                Active Teams
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTeams.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Capacity
              </CardTitle>
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
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger
              value="portfolio"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger
              value="builder"
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Builder</span>
            </TabsTrigger>
            <TabsTrigger
              value="run-work"
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Run Work</span>
            </TabsTrigger>
            <TabsTrigger
              value="capacity"
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Capacity</span>
            </TabsTrigger>
            <TabsTrigger
              value="utilization"
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Utilization</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Skills</span>
            </TabsTrigger>
            <TabsTrigger
              value="financial-impact"
              className="flex items-center space-x-2"
            >
              <Star className="h-4 w-4" />
              <span>Financial Impact</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <TeamPortfolioOverview />
          </TabsContent>

          <TabsContent value="analytics">
            <EnterpriseTeamAnalytics />
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map(division => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <TabsContent value="builder">
            <TeamBuilder
              selectedTeam={selectedTeamForBuilder}
              onTeamChange={setSelectedTeamForBuilder}
            />
          </TabsContent>

          <TabsContent value="run-work">
            <RunWorkAllocationView />
          </TabsContent>

          <TabsContent value="capacity">
            <CapacityOverview />
          </TabsContent>

          <TabsContent value="utilization">
            <TeamCapacityUtilizationMatrix />
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
                    <label className="text-sm font-medium">
                      Select Team to Analyze:
                    </label>
                    <select
                      value={selectedTeamForSkills}
                      onChange={e => setSelectedTeamForSkills(e.target.value)}
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
          <TabsContent value="financial-impact">
            <FinancialImpactAnalysis />
          </TabsContent>
        </Tabs>

        <EnhancedTeamDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          teamId={editingTeam}
        />

        <PeopleTeamMapper
          isOpen={isPeopleMapperOpen}
          onClose={() => setIsPeopleMapperOpen(false)}
        />

        <SkillsMigrationDialog
          open={isMigrationDialogOpen}
          onOpenChange={setIsMigrationDialogOpen}
        />
      </div>
    </div>
  );
};

export default Teams;
