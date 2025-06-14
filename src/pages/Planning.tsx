
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Users, Target, Grid3X3, List } from 'lucide-react';
import PlanningMatrix from '@/components/planning/PlanningMatrix';
import BulkAllocationGrid from '@/components/planning/BulkAllocationGrid';
import AllocationDialog from '@/components/planning/AllocationDialog';
import CycleDialog from '@/components/planning/CycleDialog';
import { Allocation, Cycle } from '@/types';

const Planning = () => {
  const { teams, cycles, setCycles, allocations, config, projects, epics, runWorkCategories } = useApp();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'bulk'>('matrix');
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);

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

  // Filter teams
  const filteredTeams = selectedTeamId === 'all' ? teams : teams.filter(t => t.id === selectedTeamId);

  const handleCreateAllocation = () => {
    setSelectedAllocation(null);
    setIsAllocationDialogOpen(true);
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setIsAllocationDialogOpen(true);
  };

  const getQuarterStats = () => {
    if (!currentQuarter) return { totalTeams: 0, allocatedTeams: 0, totalIterations: 0 };
    
    const quarterAllocations = allocations.filter(a => a.cycleId === currentQuarter.id);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600">Please complete the setup to start planning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarterly Planning</h1>
          <p className="text-gray-600">Plan team allocations across quarters and iterations</p>
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

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between">
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
            <div className="text-2xl font-bold">{stats.totalIterations}</div>
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
              allocations={allocations.filter(a => a.cycleId === selectedCycleId)}
              onEditAllocation={handleEditAllocation}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Planning Data</h3>
            <p className="text-gray-600 mb-4">
              {!selectedCycleId 
                ? "Select a quarter to start planning" 
                : "No iterations found for this quarter. Create iterations first."}
            </p>
            <Button variant="outline" onClick={() => setIsCycleDialogOpen(true)}>
              Manage Cycles
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AllocationDialog
        isOpen={isAllocationDialogOpen}
        onClose={() => setIsAllocationDialogOpen(false)}
        allocation={selectedAllocation}
        cycleId={selectedCycleId}
        teams={teams}
        iterations={iterations}
        projects={projects}
        epics={epics}
        runWorkCategories={runWorkCategories}
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
