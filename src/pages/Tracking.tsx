import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  Target,
  Users,
  DollarSign 
} from 'lucide-react';
import IterationReviewGrid from '@/components/tracking/IterationReviewGrid';
import VarianceAnalysis from '@/components/tracking/VarianceAnalysis';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';

const Tracking = () => {
  const { 
    teams, 
    cycles, 
    allocations, 
    actualAllocations,
    iterationReviews,
    config, 
    projects, 
    epics, 
    runWorkCategories 
  } = useApp();
  
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedIterationNumber, setSelectedIterationNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState('review');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
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

  // Data filtering logic
  const divisions = useMemo(() => {
    if (!teams) return [];
    const allDivisions = teams
        .map(team => ({ id: team.divisionId, name: team.divisionName }))
        .filter(d => d.id && d.name);
    if (!allDivisions.length) return [];
    const uniqueDivisions = [...new Map(allDivisions.map(d => [d.id, d])).values()];
    return uniqueDivisions.sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  const handleDivisionChange = (divisionId: string) => {
      setSelectedDivisionId(divisionId);
      setSelectedTeamId('all');
  };

  const availableTeams = useMemo(() => {
      if (selectedDivisionId === 'all') return teams;
      return teams.filter(team => team.divisionId === selectedDivisionId);
  }, [teams, selectedDivisionId]);

  const filteredTeams = useMemo(() => {
      let teamsToFilter = teams;
      if (selectedDivisionId !== 'all') {
          teamsToFilter = teamsToFilter.filter(t => t.divisionId === selectedDivisionId);
      }
      if (selectedTeamId !== 'all') {
          teamsToFilter = teamsToFilter.filter(t => t.id === selectedTeamId);
      }
      return teamsToFilter;
  }, [teams, selectedDivisionId, selectedTeamId]);

  const filteredTeamIds = useMemo(() => new Set(filteredTeams.map(t => t.id)), [filteredTeams]);

  const filteredAllocations = useMemo(() => {
      return allocations.filter(a => filteredTeamIds.has(a.teamId));
  }, [allocations, filteredTeamIds]);

  const filteredActualAllocations = useMemo(() => {
      return actualAllocations.filter(a => filteredTeamIds.has(a.teamId));
  }, [actualAllocations, filteredTeamIds]);

  // Get review status for current iteration
  const currentIterationReview = iterationReviews.find(r => 
    r.cycleId === selectedCycleId && r.iterationNumber === selectedIterationNumber
  );

  // Calculate tracking stats
  const trackingStats = useMemo(() => {
    const quarterAllocations = filteredAllocations.filter(a => a.cycleId === selectedCycleId);
    const quarterActuals = filteredActualAllocations.filter(a => a.cycleId === selectedCycleId);
    const quarterReviews = iterationReviews.filter(r => r.cycleId === selectedCycleId);
    
    const completedReviews = quarterReviews.filter(r => r.status === 'completed').length;
    const totalIterations = iterations.length;
    const reviewProgress = totalIterations > 0 ? (completedReviews / totalIterations) * 100 : 0;
    
    const teamsWithActuals = new Set(quarterActuals.map(a => a.teamId)).size;
    const totalTeams = filteredTeams.length;
    
    return {
      reviewProgress: Math.round(reviewProgress),
      completedReviews,
      totalIterations,
      teamsWithActuals,
      totalTeams,
      totalVariances: quarterActuals.length,
    };
  }, [filteredAllocations, filteredActualAllocations, iterationReviews, selectedCycleId, iterations, filteredTeams]);

  const completedEpicsDetails = useMemo(() => {
    if (!currentIterationReview?.completedEpics?.length) return [];
    
    return currentIterationReview.completedEpics.map(epicId => {
        const epic = epics.find(e => e.id === epicId);
        if (!epic) return null;
        const project = projects.find(p => p.id === epic.projectId);
        return {
            id: epic.id,
            name: epic.name,
            projectName: project?.name || 'Unknown Project'
        };
    }).filter(Boolean as any);
  }, [currentIterationReview, epics, projects]);

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600">Please complete the setup to start tracking progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="text-gray-600">Track actual progress against planned allocations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
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
          <label className="text-sm font-medium">Iteration:</label>
          <Select 
            value={selectedIterationNumber.toString()} 
            onValueChange={(value) => setSelectedIterationNumber(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iterations.map((_, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  Iteration {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {divisions.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Division:</label>
            <Select value={selectedDivisionId} onValueChange={handleDivisionChange}>
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
        )}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Team:</label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {availableTeams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {currentIterationReview && (
          <Badge 
            variant={
              currentIterationReview.status === 'completed' ? 'default' : 
              currentIterationReview.status === 'in-progress' ? 'secondary' : 
              'outline'
            }
          >
            {currentIterationReview.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {currentIterationReview.status === 'in-progress' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {currentIterationReview.status.replace('-', ' ')}
          </Badge>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Review Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingStats.reviewProgress}%</div>
            <p className="text-sm text-gray-600">
              {trackingStats.completedReviews}/{trackingStats.totalIterations} iterations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Team Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackingStats.teamsWithActuals}/{trackingStats.totalTeams}
            </div>
            <p className="text-sm text-gray-600">Teams with actuals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Variances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingStats.totalVariances}</div>
            <p className="text-sm text-gray-600">Allocation entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={
                currentIterationReview?.status === 'completed' ? 'default' : 
                currentIterationReview?.status === 'in-progress' ? 'secondary' : 
                'outline'
              }
              className="text-sm"
            >
              {currentIterationReview?.status?.replace('-', ' ') || 'Not Started'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Completed Epics */}
      {completedEpicsDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              Completed Epics in Selected Iteration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {completedEpicsDetails.map(epic => (
                <li key={epic.id} className="text-sm p-2 border rounded-md bg-gray-50/50">
                  <span className="font-semibold">{epic.name}</span>
                  <span className="text-gray-500 ml-2">({epic.projectName})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Tracking Interface */}
      {selectedCycleId && iterations.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review">Iteration Review</TabsTrigger>
            <TabsTrigger value="analysis">Variance Analysis</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="mt-6">
            <IterationReviewGrid
              cycleId={selectedCycleId}
              iterationNumber={selectedIterationNumber}
              teams={filteredTeams}
              allocations={filteredAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
              iterations={iterations}
            />
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <VarianceAnalysis
              cycleId={selectedCycleId}
              teams={filteredTeams}
              allocations={filteredAllocations}
              actualAllocations={filteredActualAllocations}
              projects={projects}
              epics={epics}
              runWorkCategories={runWorkCategories}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <TrackingDashboard
              cycleId={selectedCycleId}
              teams={filteredTeams}
              allocations={filteredAllocations}
              actualAllocations={filteredActualAllocations}
              iterationReviews={iterationReviews}
              projects={projects}
              epics={epics}
            />
          </TabsContent>
        </Tabs>
      )}

      {(!selectedCycleId || iterations.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              {!selectedCycleId 
                ? "Select a quarter to start tracking" 
                : "No iterations found for this quarter."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tracking;
