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
  Filter,
  Search,
  Plus,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Squad, SquadMember, UnmappedPerson } from '@/types';
import SquadBuilder from '@/components/squad/SquadBuilder';
import UnmappedPeople from '@/components/squad/UnmappedPeople';
import SquadSkillsAnalyzer from '@/components/squad/SquadSkillsAnalyzer';
import SquadImportSystem from '@/components/squad/SquadImportSystem';
import SquadCanvas from '@/components/squad/SquadCanvas';

const SquadManagement: React.FC = () => {
  const { squads, squadMembers, unmappedPeople, people, teams, divisions } =
    useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [canvasViewMode, setCanvasViewMode] = useState<
    'squads' | 'skills' | 'network'
  >('squads');

  // Calculate overview statistics
  const stats = {
    totalSquads: squads.length,
    activeSquads: squads.filter(s => s.status === 'active').length,
    totalMembers: squadMembers.filter(m => m.isActive).length,
    unmappedCount: unmappedPeople.length,
    avgSquadSize:
      squads.length > 0
        ? Math.round(
            (squadMembers.filter(m => m.isActive).length / squads.length) * 10
          ) / 10
        : 0,
  };

  const getSquadStatusColor = (status: Squad['status']) => {
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

  const getSquadTypeIcon = (type: Squad['type']) => {
    switch (type) {
      case 'project':
        return '🚀';
      case 'initiative':
        return '💡';
      case 'workstream':
        return '🔄';
      case 'feature-team':
        return '⚡';
      default:
        return '👥';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Squad Management
          </h1>
          <p className="text-muted-foreground">
            Manage teams, map people to squads, and analyze skill coverage
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
            New Squad
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              Total Squads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSquads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSquads} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-500" />
              Squad Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgSquadSize} per squad
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
              Need squad assignment
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
            <p className="text-xs text-muted-foreground">People in squads</p>
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
              {squadMembers.length > 0
                ? Math.round(
                    (squadMembers.filter(m => m.allocation >= 80).length /
                      squadMembers.length) *
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="squads">Squads</TabsTrigger>
          <TabsTrigger value="mapping">People Mapping</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Squads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Squads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {squads.slice(0, 5).map(squad => {
                    const memberCount = squadMembers.filter(
                      m => m.squadId === squad.id && m.isActive
                    ).length;

                    return (
                      <div
                        key={squad.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {getSquadTypeIcon(squad.type)}
                          </div>
                          <div>
                            <div className="font-medium">{squad.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {memberCount} members • {squad.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={`text-white ${getSquadStatusColor(squad.status)}`}
                          >
                            {squad.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {squads.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No squads created yet</p>
                      <p className="text-sm">
                        Create your first squad to get started
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
                        Map to Squad
                      </Button>
                    </div>
                  ))}

                  {unmappedPeople.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>All people are mapped</p>
                      <p className="text-sm">Great job on squad assignments!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="squads" className="space-y-6">
          <SquadBuilder
            selectedSquad={selectedSquad}
            onSquadChange={setSelectedSquad}
          />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                People to Squad Mapping
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Select people from the unmapped list and assign them to squads,
                or create new squads.
              </p>
              <UnmappedPeople
                showBulkActions={true}
                maxHeight="max-h-[500px]"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Squad Overview</h2>
              <p className="text-sm text-muted-foreground mb-6">
                View existing squads and their current members.
              </p>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {squads.map(squad => {
                  const members = squadMembers.filter(
                    m => m.squadId === squad.id && m.isActive
                  );
                  return (
                    <Card key={squad.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {getSquadTypeIcon(squad.type)}
                          </span>
                          <div>
                            <h4 className="font-medium">{squad.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {squad.type}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-white ${getSquadStatusColor(squad.status)}`}
                        >
                          {squad.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>
                            {members.length} / {squad.capacity} members
                          </span>
                          <span>
                            {Math.round(
                              (members.length / squad.capacity) * 100
                            )}
                            % capacity
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {squads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No squads created yet</p>
                    <p className="text-sm">
                      Go to the Squads tab to create your first squad
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <SquadImportSystem />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <SquadSkillsAnalyzer selectedSquad={selectedSquad} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Squad Analytics & Visualization
              </h2>
              <p className="text-sm text-muted-foreground">
                Interactive canvas view of squad relationships and structures
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                variant={canvasViewMode === 'squads' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCanvasViewMode('squads')}
              >
                <Target className="h-4 w-4 mr-1" />
                Squads
              </Button>
              <Button
                variant={canvasViewMode === 'skills' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCanvasViewMode('skills')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Skills
              </Button>
              <Button
                variant={canvasViewMode === 'network' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCanvasViewMode('network')}
              >
                <Users className="h-4 w-4 mr-1" />
                Network
              </Button>
            </div>
          </div>

          <SquadCanvas
            selectedSquad={selectedSquad}
            viewMode={canvasViewMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SquadManagement;
