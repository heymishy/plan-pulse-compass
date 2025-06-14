
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarCheck, BarChart3, Grid, Calendar, Users, Target } from 'lucide-react';
import AllocationTimeline from '@/components/allocations/AllocationTimeline';
import AllocationMatrix from '@/components/allocations/AllocationMatrix';
import CapacityChart from '@/components/allocations/CapacityChart';
import AllocationStats from '@/components/allocations/AllocationStats';

const Allocations = () => {
  const { teams, cycles, allocations, config, projects, epics, runWorkCategories } = useApp();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  // Get current quarter cycles
  const quarterCycles = cycles.filter(c => c.type === 'quarterly' && c.status !== 'completed');
  const currentQuarter = quarterCycles.find(c => c.status === 'active') || quarterCycles[0];

  React.useEffect(() => {
    if (currentQuarter && !selectedCycleId) {
      setSelectedCycleId(currentQuarter.id);
    }
  }, [currentQuarter, selectedCycleId]);

  // Get iterations for selected quarter
  const iterations = cycles.filter(c => 
    c.type === 'iteration' && 
    c.parentCycleId === selectedCycleId
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Filter data based on selections
  const filteredTeams = selectedTeamId === 'all' ? teams : teams.filter(t => t.id === selectedTeamId);
  const filteredAllocations = allocations.filter(a => a.cycleId === selectedCycleId);

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <CalendarCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600">Please complete the setup to view allocations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Allocations</h1>
          <p className="text-gray-600">Visual views of team capacity and allocation planning</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Quarter:</label>
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select quarter" />
            </SelectTrigger>
            <SelectContent>
              {quarterCycles.map(cycle => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name} ({cycle.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Team:</label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <AllocationStats 
        allocations={filteredAllocations}
        teams={filteredTeams}
        iterations={iterations}
        projects={projects}
        epics={epics}
        runWorkCategories={runWorkCategories}
      />

      {/* Visual Views */}
      {selectedCycleId && iterations.length > 0 ? (
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Timeline View</span>
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center space-x-2">
              <Grid className="h-4 w-4" />
              <span>Matrix View</span>
            </TabsTrigger>
            <TabsTrigger value="capacity" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Capacity Chart</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <AllocationTimeline
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
            />
          </TabsContent>

          <TabsContent value="matrix">
            <AllocationMatrix
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
            />
          </TabsContent>

          <TabsContent value="capacity">
            <CapacityChart
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Allocation Data</h3>
            <p className="text-gray-600">
              {!selectedCycleId 
                ? "Select a quarter to view allocations" 
                : "No iterations found for this quarter."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Allocations;
