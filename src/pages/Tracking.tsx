import React, { useState, useMemo } from 'react';
import { useTeams } from '@/context/TeamContext';
import { useProjects } from '@/context/ProjectContext';
import { usePlanning } from '@/context/PlanningContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Upload, Download } from 'lucide-react';
import IterationReviewFlow from '@/components/tracking/IterationReviewFlow';
import VarianceAnalysis from '@/components/tracking/VarianceAnalysis';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';
import TrackingSidebar from '@/components/tracking/TrackingSidebar';
import ActualAllocationImportDialog from '@/components/tracking/ActualAllocationImportDialog';
import IterationReviewImportDialog from '@/components/tracking/IterationReviewImportDialog';

const Tracking = () => {
  const { teams } = useTeams();
  const { projects, epics } = useProjects();
  const {
    cycles,
    allocations,
    actualAllocations,
    iterationReviews,
    runWorkCategories,
  } = usePlanning();
  const { config } = useSettings();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedIterationNumber, setSelectedIterationNumber] =
    useState<number>(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
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

  // Data filtering logic
  const divisions = useMemo(() => {
    if (!teams) return [];
    const allDivisions = teams
      .map(team => ({ id: team.divisionId, name: team.divisionName }))
      .filter(d => d.id && d.name);
    if (!allDivisions.length) return [];
    const uniqueDivisions = [
      ...new Map(allDivisions.map(d => [d.id, d])).values(),
    ];
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
      teamsToFilter = teamsToFilter.filter(
        t => t.divisionId === selectedDivisionId
      );
    }
    if (selectedTeamId !== 'all') {
      teamsToFilter = teamsToFilter.filter(t => t.id === selectedTeamId);
    }
    return teamsToFilter;
  }, [teams, selectedDivisionId, selectedTeamId]);

  const filteredTeamIds = useMemo(
    () => new Set(filteredTeams.map(t => t.id)),
    [filteredTeams]
  );

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => filteredTeamIds.has(a.teamId));
  }, [allocations, filteredTeamIds]);

  const filteredActualAllocations = useMemo(() => {
    return actualAllocations.filter(a => filteredTeamIds.has(a.teamId));
  }, [actualAllocations, filteredTeamIds]);

  // Get review status for current iteration
  const currentIterationReview = iterationReviews.find(
    r =>
      r.cycleId === selectedCycleId &&
      r.iterationNumber === selectedIterationNumber
  );

  const completedEpicsDetails = useMemo(() => {
    if (!currentIterationReview?.completedEpics?.length) return [];

    return currentIterationReview.completedEpics
      .map(epicId => {
        const epic = epics.find(e => e.id === epicId);
        if (!epic) return null;
        const project = projects.find(p => p.id === epic.projectId);
        return {
          id: epic.id,
          name: epic.name,
          projectName: project?.name || 'Unknown Project',
        };
      })
      .filter(Boolean as any);
  }, [currentIterationReview, epics, projects]);

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setup Required
          </h2>
          <p className="text-gray-600">
            Please complete the setup to start tracking progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      <TrackingSidebar
        quarterCycles={quarterCycles}
        selectedCycleId={selectedCycleId}
        setSelectedCycleId={setSelectedCycleId}
        iterations={iterations}
        selectedIterationNumber={selectedIterationNumber}
        setSelectedIterationNumber={setSelectedIterationNumber}
        iterationReviews={iterationReviews}
        divisions={divisions}
        selectedDivisionId={selectedDivisionId}
        handleDivisionChange={handleDivisionChange}
        availableTeams={availableTeams}
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
      />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Progress Tracking
            </h1>
            <p className="text-gray-600">
              Track actual progress against planned allocations
            </p>
          </div>
          <div className="flex space-x-2">
            <ActualAllocationImportDialog>
              <Button variant="outline" size="sm" className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Import Actual Allocations
              </Button>
            </ActualAllocationImportDialog>
            <IterationReviewImportDialog>
              <Button variant="outline" size="sm" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Import Reviews
              </Button>
            </IterationReviewImportDialog>
          </div>
        </div>

        {selectedCycleId && iterations.length > 0 ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="review">Iteration Review</TabsTrigger>
              <TabsTrigger value="analysis">Variance Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <TrackingDashboard
                cycleId={selectedCycleId}
                teams={filteredTeams}
                allocations={filteredAllocations}
                actualAllocations={filteredActualAllocations}
                iterationReviews={iterationReviews}
                projects={projects}
                epics={epics}
                iterations={iterations}
              />
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              {completedEpicsDetails.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      Completed Epics in Selected Iteration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {completedEpicsDetails.map(epic => (
                        <li
                          key={epic.id}
                          className="text-sm p-2 border rounded-md bg-gray-50/50"
                        >
                          <span className="font-semibold">{epic.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({epic.projectName})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              <IterationReviewFlow
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
          </Tabs>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600 mb-4">
                {!selectedCycleId
                  ? 'Select a quarter to start tracking'
                  : 'No iterations found for this quarter.'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Tracking;
