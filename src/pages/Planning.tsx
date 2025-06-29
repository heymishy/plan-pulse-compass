import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Calendar,
  Users,
  Target,
  Grid3X3,
  List,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react';
import PlanningMatrix from '@/components/planning/PlanningMatrix';
import BulkAllocationGrid from '@/components/planning/BulkAllocationGrid';
import AllocationDialog from '@/components/planning/AllocationDialog';
import CycleDialog from '@/components/planning/CycleDialog';
import AdvancedPlanningDashboard from '@/components/planning/AdvancedPlanningDashboard';
import QuarterAnalysisDashboard from '@/components/planning/QuarterAnalysisDashboard';
import IterationSequenceView from '@/components/planning/IterationSequenceView';
import { Allocation, Cycle } from '@/types';

const Planning = () => {
  const {
    teams,
    cycles,
    setCycles,
    allocations,
    config,
    projects,
    epics,
    runWorkCategories,
    divisions,
    people,
  } = useApp();
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'bulk'>('matrix');
  const [activeTab, setActiveTab] = useState<
    'planning' | 'analysis' | 'advanced'
  >('planning');
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] =
    useState<Allocation | null>(null);
  const [prefilledData, setPrefilledData] = useState<{
    teamId?: string;
    iterationNumber?: number;
    suggestedEpicId?: string;
  } | null>(null);

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

  // Filter teams based on division
  const teamsInDivision = React.useMemo(() => {
    if (selectedDivisionId === 'all') {
      return teams;
    }
    return teams.filter(t => t.divisionId === selectedDivisionId);
  }, [selectedDivisionId, teams]);

  // When division changes, if selected team is not in the new division, reset it
  React.useEffect(() => {
    if (
      selectedTeamId !== 'all' &&
      !teamsInDivision.find(t => t.id === selectedTeamId)
    ) {
      setSelectedTeamId('all');
    }
  }, [selectedDivisionId, teamsInDivision, selectedTeamId]);

  // Filter teams for display
  const filteredTeams = React.useMemo(() => {
    if (selectedTeamId === 'all') {
      return teamsInDivision;
    }
    return teamsInDivision.filter(t => t.id === selectedTeamId);
  }, [selectedTeamId, teamsInDivision]);

  const handleCreateAllocation = () => {
    setSelectedAllocation(null);
    setPrefilledData(null);
    setIsAllocationDialogOpen(true);
  };

  const handleCreateAllocationFromMatrix = (
    teamId: string,
    iterationNumber: number
  ) => {
    setSelectedAllocation(null);

    // Find suggested epic from previous iteration
    let suggestedEpicId = '';
    if (iterationNumber > 1) {
      const previousIterationAllocations = allocations.filter(
        a =>
          a.teamId === teamId &&
          a.cycleId === selectedCycleId &&
          a.iterationNumber === iterationNumber - 1 &&
          a.epicId
      );

      if (previousIterationAllocations.length > 0) {
        // Use the first epic from the previous iteration
        suggestedEpicId = previousIterationAllocations[0].epicId || '';
      }
    }

    setPrefilledData({
      teamId,
      iterationNumber,
      suggestedEpicId,
    });
    setIsAllocationDialogOpen(true);
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setPrefilledData(null);
    setIsAllocationDialogOpen(true);
  };

  const handleCloseAllocationDialog = () => {
    setIsAllocationDialogOpen(false);
    setPrefilledData(null);
  };

  const getQuarterStats = () => {
    if (!currentQuarter)
      return { totalTeams: 0, allocatedTeams: 0, totalIterations: 0 };

    const quarterAllocations = allocations.filter(
      a => a.cycleId === currentQuarter.id
    );
    const allocatedTeams = new Set(quarterAllocations.map(a => a.teamId)).size;

    return {
      totalTeams: teams.length,
      allocatedTeams,
      totalIterations: iterations.length,
    };
  };

  const stats = getQuarterStats();

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setup Required
          </h2>
          <p className="text-gray-600">
            Please complete the setup to start planning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
          <p className="text-gray-600">
            Plan team allocations and analyze project feasibility
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsCycleDialogOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Manage Cycles
          </Button>
          <Button onClick={handleCreateAllocation}>
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        </div>
      </div>

      {/* Main Planning Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as any)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="planning">Quarterly Planning</TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="h-4 w-4 mr-2" />
            Plan Analysis
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="h-4 w-4 mr-2" />
            Advanced Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-6">
          {/* Filters and View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Quarter:</label>
                <Select
                  value={selectedCycleId}
                  onValueChange={setSelectedCycleId}
                >
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
                <label className="text-sm font-medium">Division:</label>
                <Select
                  value={selectedDivisionId}
                  onValueChange={setSelectedDivisionId}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select division" />
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
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Team:</label>
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teamsInDivision.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">View:</label>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('matrix')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4 mr-1" />
                  Matrix
                </Button>
                <Button
                  variant={viewMode === 'bulk' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('bulk')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Bulk Entry
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Team Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.allocatedTeams}/{stats.totalTeams}
                </div>
                <p className="text-sm text-gray-600">Teams with allocations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Iterations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalIterations}
                </div>
                <p className="text-sm text-gray-600">Total iterations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-sm text-gray-600">Active projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Planning Views */}
          {selectedCycleId && iterations.length > 0 && (
            <>
              {viewMode === 'matrix' && (
                <PlanningMatrix
                  teams={filteredTeams}
                  iterations={iterations}
                  allocations={allocations.filter(
                    a => a.cycleId === selectedCycleId
                  )}
                  onEditAllocation={handleEditAllocation}
                  onCreateAllocation={handleCreateAllocationFromMatrix}
                  projects={projects}
                  epics={epics}
                  runWorkCategories={runWorkCategories}
                />
              )}

              {viewMode === 'bulk' && (
                <BulkAllocationGrid
                  teams={teams}
                  iterations={iterations}
                  cycleId={selectedCycleId}
                  projects={projects}
                  epics={epics}
                  runWorkCategories={runWorkCategories}
                />
              )}
            </>
          )}

          {(!selectedCycleId || iterations.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Planning Data
                </h3>
                <p className="text-gray-600 mb-4">
                  {!selectedCycleId
                    ? 'Select a quarter to start planning'
                    : 'No iterations found for this quarter. Create iterations first.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsCycleDialogOpen(true)}
                >
                  Manage Cycles
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {selectedCycleId && iterations.length > 0 ? (
            <Tabs defaultValue="quarter-analysis" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quarter-analysis">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Quarter Analysis
                </TabsTrigger>
                <TabsTrigger value="iteration-sequence">
                  <Clock className="h-4 w-4 mr-2" />
                  Iteration Sequence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quarter-analysis">
                <QuarterAnalysisDashboard
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
              </TabsContent>

              <TabsContent value="iteration-sequence">
                <IterationSequenceView
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
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Analysis Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Select a quarter with iterations to view analysis
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsCycleDialogOpen(true)}
                >
                  Manage Cycles
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedPlanningDashboard />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AllocationDialog
        isOpen={isAllocationDialogOpen}
        onClose={handleCloseAllocationDialog}
        allocation={selectedAllocation}
        cycleId={selectedCycleId}
        teams={teams}
        iterations={iterations}
        projects={projects}
        epics={epics}
        runWorkCategories={runWorkCategories}
        prefilledData={prefilledData}
      />

      <CycleDialog
        isOpen={isCycleDialogOpen}
        onClose={() => setIsCycleDialogOpen(false)}
        parentCycle={currentQuarter}
      />
    </div>
  );
};

export default Planning;
