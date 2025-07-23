import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarCheck,
  BarChart3,
  Grid,
  Calendar,
  Users,
  Target,
  BookOpenCheck,
  Activity,
  Clock,
} from 'lucide-react';
import AllocationTimeline from '@/components/allocations/AllocationTimeline';
import AllocationMatrix from '@/components/allocations/AllocationMatrix';
import CapacityChart from '@/components/allocations/CapacityChart';
import AllocationStats from '@/components/allocations/AllocationStats';
import TeamQuarterPlans from '@/components/allocations/TeamQuarterPlans';
import AllocationImportDialog from '@/components/allocations/AllocationImportDialog';
import { useToast } from '@/hooks/use-toast';
import AnnualFinancialReport from '@/components/allocations/AnnualFinancialReport';
import TeamCapacityUtilizationMatrix from '@/components/teams/TeamCapacityUtilizationMatrix';
import EpicTimelineView from '@/components/planning/EpicTimelineView';

const NoDataForQuarter = ({ selectedCycleId }: { selectedCycleId: string }) => (
  <Card>
    <CardContent className="text-center py-12">
      <CalendarCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Allocation Data
      </h3>
      <p className="text-gray-600">
        {!selectedCycleId
          ? 'Select a quarter to view allocations'
          : 'No iterations found for this quarter.'}
      </p>
    </CardContent>
  </Card>
);

const Allocations = () => {
  const {
    teams,
    cycles,
    allocations,
    config,
    projects,
    epics,
    runWorkCategories,
    people,
    roles,
    divisions,
  } = useApp();
  const { toast } = useToast();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  // Get current quarter cycles
  const quarterCycles = cycles.filter(
    c => c.type === 'quarterly' && c.status !== 'completed'
  );
  const currentQuarter =
    quarterCycles.find(c => c.status === 'active') || quarterCycles[0];

  React.useEffect(() => {
    if (currentQuarter && !selectedCycleId) {
      setSelectedCycleId(currentQuarter.id);
    }
  }, [currentQuarter, selectedCycleId]);

  // Get iterations for selected quarter
  const iterations = cycles
    .filter(c => c.type === 'iteration' && c.parentCycleId === selectedCycleId)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  // Filter data based on selections
  const filteredTeams =
    selectedTeamId === 'all'
      ? teams
      : teams.filter(t => t.id === selectedTeamId);
  const filteredAllocations = useMemo(() => {
    let filtered = allocations.filter(a => a.cycleId === selectedCycleId);

    if (selectedTeamId !== 'all') {
      filtered = filtered.filter(a => a.teamId === selectedTeamId);
    }

    return filtered;
  }, [allocations, selectedCycleId, selectedTeamId]);

  const handleImportComplete = () => {
    toast({
      title: 'Import Successful',
      description: 'Team allocations have been imported successfully.',
    });
  };

  const annualReportProjects = useMemo(() => {
    const teamAllocationProjectIds = new Set<string>();
    filteredAllocations.forEach(alloc => {
      if (alloc.epicId) {
        const epic = epics.find(e => e.id === alloc.epicId);
        if (epic) {
          teamAllocationProjectIds.add(epic.projectId);
        }
      }
    });
    return projects.filter(p => teamAllocationProjectIds.has(p.id));
  }, [epics, projects, filteredAllocations]);

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <CalendarCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setup Required
          </h2>
          <p className="text-gray-600">
            Please complete the setup to view allocations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Allocations</h1>
          <p className="text-gray-600">
            Visual views of team capacity and allocation planning
          </p>
        </div>
        <AllocationImportDialog onImportComplete={handleImportComplete} />
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
      <Tabs defaultValue="quarter-plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger
            value="quarter-plans"
            className="flex items-center space-x-2"
          >
            <Target className="h-4 w-4" />
            <span>Quarter Plans</span>
          </TabsTrigger>
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
          <TabsTrigger
            value="utilization"
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Utilization</span>
          </TabsTrigger>
          <TabsTrigger
            value="epic-timeline"
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Epic Timeline</span>
          </TabsTrigger>
          <TabsTrigger
            value="annual-view"
            className="flex items-center space-x-2"
          >
            <BookOpenCheck className="h-4 w-4" />
            <span>Annual View</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quarter-plans">
          {selectedCycleId && iterations.length > 0 ? (
            <TeamQuarterPlans
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
            />
          ) : (
            <NoDataForQuarter selectedCycleId={selectedCycleId} />
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {selectedCycleId && iterations.length > 0 ? (
            <AllocationTimeline
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
            />
          ) : (
            <NoDataForQuarter selectedCycleId={selectedCycleId} />
          )}
        </TabsContent>

        <TabsContent value="matrix">
          {selectedCycleId && iterations.length > 0 ? (
            <AllocationMatrix
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
            />
          ) : (
            <NoDataForQuarter selectedCycleId={selectedCycleId} />
          )}
        </TabsContent>

        <TabsContent value="capacity">
          {selectedCycleId && iterations.length > 0 ? (
            <CapacityChart
              teams={filteredTeams}
              iterations={iterations}
              allocations={filteredAllocations}
            />
          ) : (
            <NoDataForQuarter selectedCycleId={selectedCycleId} />
          )}
        </TabsContent>

        <TabsContent value="utilization">
          <TeamCapacityUtilizationMatrix />
        </TabsContent>

        <TabsContent value="epic-timeline">
          {selectedCycleId && iterations.length > 0 ? (
            <EpicTimelineView
              cycleId={selectedCycleId}
              teams={teams}
              iterations={iterations}
              allocations={allocations}
              projects={projects}
              epics={epics}
              milestones={projects.flatMap(p => p.milestones)}
              runWorkCategories={runWorkCategories}
              divisions={divisions}
              people={people}
            />
          ) : (
            <NoDataForQuarter selectedCycleId={selectedCycleId} />
          )}
        </TabsContent>

        <TabsContent value="annual-view">
          <AnnualFinancialReport
            allocations={allocations}
            cycles={cycles}
            teams={teams}
            projects={annualReportProjects}
            epics={epics}
            people={people}
            roles={roles}
            config={config}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Allocations;
