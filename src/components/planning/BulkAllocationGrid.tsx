
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Team, Cycle, Project, Epic, RunWorkCategory, Allocation } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import WorkTypeSelector from './WorkTypeSelector';
import EpicSelector from './EpicSelector';
import TeamSelector from './TeamSelector';
import EpicAddForm from './EpicAddForm';
import AllocationTable from './AllocationTable';
import TeamAllocationTable from './TeamAllocationTable';

interface BulkAllocationGridProps {
  teams: Team[];
  iterations: Cycle[];
  cycleId: string;
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

interface GridAllocation {
  teamId: string;
  iterationNumber: number;
  percentage: number;
  epicId?: string;
  runWorkCategoryId?: string;
  projectId?: string;
}

const BulkAllocationGrid: React.FC<BulkAllocationGridProps> = ({
  teams,
  iterations,
  cycleId,
  projects,
  epics,
  runWorkCategories,
}) => {
  const { allocations, setAllocations } = useApp();
  const { toast } = useToast();
  const [workType, setWorkType] = useState<'epic' | 'run-work' | 'team'>('epic');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEpicId, setSelectedEpicId] = useState('');
  const [selectedRunWorkCategoryId, setSelectedRunWorkCategoryId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [gridAllocations, setGridAllocations] = useState<Record<string, GridAllocation>>({});
  
  // For team mode: track which epics the team has added to their allocation grid
  const [teamSelectedEpics, setTeamSelectedEpics] = useState<string[]>([]);
  const [epicToAdd, setEpicToAdd] = useState('');
  const [projectForEpic, setProjectForEpic] = useState('');

  console.log('BulkAllocationGrid: workType:', workType);
  console.log('BulkAllocationGrid: selectedTeamId:', selectedTeamId);
  console.log('BulkAllocationGrid: teamSelectedEpics:', teamSelectedEpics);

  // For team-based view, get epics that the team has explicitly selected
  const teamEpics = teamSelectedEpics.map(epicId => epics.find(e => e.id === epicId)).filter(Boolean) as Epic[];

  const getGridKey = (teamId: string, iterationNumber: number, workId: string) => 
    `${teamId}-${iterationNumber}-${workId}`;

  const handlePercentageChange = (teamId: string, iterationNumber: number, workId: string, value: string, workData: {epicId?: string, runWorkCategoryId?: string, projectId?: string}) => {
    const key = getGridKey(teamId, iterationNumber, workId);
    const percentage = parseFloat(value) || 0;
    
    if (percentage === 0) {
      const newGridAllocations = { ...gridAllocations };
      delete newGridAllocations[key];
      setGridAllocations(newGridAllocations);
    } else if (percentage > 0 && percentage <= 100) {
      setGridAllocations(prev => ({
        ...prev,
        [key]: { 
          teamId, 
          iterationNumber, 
          percentage,
          epicId: workData.epicId,
          runWorkCategoryId: workData.runWorkCategoryId,
          projectId: workData.projectId
        }
      }));
    }
  };

  const getExistingAllocation = (teamId: string, iterationNumber: number, epicId?: string, runWorkCategoryId?: string) => {
    return allocations.find(a => 
      a.teamId === teamId && 
      a.cycleId === cycleId && 
      a.iterationNumber === iterationNumber &&
      ((epicId && a.epicId === epicId) ||
       (runWorkCategoryId && a.runWorkCategoryId === runWorkCategoryId))
    );
  };

  const getCurrentValue = (teamId: string, iterationNumber: number, workId: string, epicId?: string, runWorkCategoryId?: string) => {
    const key = getGridKey(teamId, iterationNumber, workId);
    const gridValue = gridAllocations[key];
    if (gridValue) return gridValue.percentage.toString();
    
    const existing = getExistingAllocation(teamId, iterationNumber, epicId, runWorkCategoryId);
    return existing ? existing.percentage.toString() : '';
  };

  const handleAddEpicToTeam = () => {
    if (epicToAdd && !teamSelectedEpics.includes(epicToAdd)) {
      setTeamSelectedEpics(prev => [...prev, epicToAdd]);
      setEpicToAdd('');
      setProjectForEpic('');
    }
  };

  const handleRemoveEpicFromTeam = (epicId: string) => {
    setTeamSelectedEpics(prev => prev.filter(id => id !== epicId));
    // Also remove any allocations for this epic
    const newGridAllocations = { ...gridAllocations };
    Object.keys(newGridAllocations).forEach(key => {
      if (newGridAllocations[key].epicId === epicId) {
        delete newGridAllocations[key];
      }
    });
    setGridAllocations(newGridAllocations);
  };

  const handleSave = () => {
    if (workType === 'epic' && !selectedEpicId) {
      toast({
        title: "Error",
        description: "Please select a project and epic first",
        variant: "destructive",
      });
      return;
    }

    if (workType === 'run-work' && !selectedRunWorkCategoryId) {
      toast({
        title: "Error",
        description: "Please select a run work category first",
        variant: "destructive",
      });
      return;
    }

    if (workType === 'team' && !selectedTeamId) {
      toast({
        title: "Error",
        description: "Please select a team first",
        variant: "destructive",
      });
      return;
    }

    const newAllocations: Allocation[] = [];
    const updatedAllocations: Allocation[] = [];

    Object.values(gridAllocations).forEach(({ teamId, iterationNumber, percentage, epicId, runWorkCategoryId }) => {
      const existing = getExistingAllocation(teamId, iterationNumber, epicId, runWorkCategoryId);
      
      const allocationData: Allocation = {
        id: existing?.id || crypto.randomUUID(),
        teamId,
        cycleId,
        iterationNumber,
        epicId,
        runWorkCategoryId,
        percentage,
        notes: undefined,
      };

      if (existing) {
        updatedAllocations.push(allocationData);
      } else {
        newAllocations.push(allocationData);
      }
    });

    setAllocations(prev => {
      let updated = [...prev];
      
      // Update existing allocations
      updatedAllocations.forEach(updated_allocation => {
        updated = updated.map(a => a.id === updated_allocation.id ? updated_allocation : a);
      });
      
      // Add new allocations
      updated = [...updated, ...newAllocations];
      
      return updated;
    });

    toast({
      title: "Success",
      description: `Saved ${newAllocations.length + updatedAllocations.length} allocations`,
    });

    setGridAllocations({});
  };

  const canSave = Object.keys(gridAllocations).length > 0 && 
    ((workType === 'epic' && selectedEpicId) || 
     (workType === 'run-work' && selectedRunWorkCategoryId) ||
     (workType === 'team' && selectedTeamId));

  const resetSelections = () => {
    setSelectedProjectId('');
    setSelectedEpicId('');
    setSelectedRunWorkCategoryId('');
    setSelectedTeamId('');
    setTeamSelectedEpics([]);
    setEpicToAdd('');
    setProjectForEpic('');
    setGridAllocations({});
  };

  const handleWorkTypeChange = (value: 'epic' | 'run-work' | 'team') => {
    setWorkType(value);
    resetSelections();
  };

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setSelectedEpicId('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Allocation Grid</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <WorkTypeSelector
            workType={workType}
            onWorkTypeChange={handleWorkTypeChange}
          />

          {workType === 'epic' && (
            <EpicSelector
              selectedProjectId={selectedProjectId}
              selectedEpicId={selectedEpicId}
              projects={projects}
              epics={epics}
              onProjectChange={handleProjectChange}
              onEpicChange={setSelectedEpicId}
            />
          )}

          {workType === 'run-work' && (
            <div className="space-y-2">
              <Label>Run Work Category</Label>
              <Select value={selectedRunWorkCategoryId} onValueChange={setSelectedRunWorkCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {runWorkCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {workType === 'team' && (
            <TeamSelector
              selectedTeamId={selectedTeamId}
              teams={teams}
              onTeamChange={setSelectedTeamId}
            />
          )}

          <div className="flex items-end">
            <Button onClick={handleSave} disabled={!canSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Allocations
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Single Epic/Run Work Grid */}
      {((workType === 'epic' && selectedEpicId) || (workType === 'run-work' && selectedRunWorkCategoryId)) && (
        <CardContent>
          <AllocationTable
            teams={teams}
            iterations={iterations}
            workId={workType === 'epic' ? selectedEpicId : selectedRunWorkCategoryId}
            workData={workType === 'epic' 
              ? { epicId: selectedEpicId }
              : { runWorkCategoryId: selectedRunWorkCategoryId }
            }
            getCurrentValue={getCurrentValue}
            onPercentageChange={handlePercentageChange}
          />
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• Enter percentage values (1-100) for team allocations across iterations</p>
            <p>• Empty cells will remove existing allocations</p>
            <p>• Changes are saved only when you click "Save Allocations"</p>
          </div>
        </CardContent>
      )}

      {/* Team-based Grid */}
      {workType === 'team' && selectedTeamId && (
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">
              Allocate work for {teams.find(t => t.id === selectedTeamId)?.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add epics and run work categories to allocate across iterations
            </p>
            
            <EpicAddForm
              projectForEpic={projectForEpic}
              epicToAdd={epicToAdd}
              projects={projects}
              epics={epics}
              teamSelectedEpics={teamSelectedEpics}
              onProjectForEpicChange={setProjectForEpic}
              onEpicToAddChange={setEpicToAdd}
              onAddEpic={handleAddEpicToTeam}
            />
          </div>
          
          <TeamAllocationTable
            iterations={iterations}
            teamEpics={teamEpics}
            runWorkCategories={runWorkCategories}
            projects={projects}
            selectedTeamId={selectedTeamId}
            getCurrentValue={getCurrentValue}
            onPercentageChange={handlePercentageChange}
            onRemoveEpic={handleRemoveEpicFromTeam}
          />
          
          {/* Show empty state if no work items */}
          {teamEpics.length === 0 && runWorkCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No epics added and no run work categories available.</p>
              <p className="text-sm mt-1">Use the "Add Epic" section above to add epics to this team's allocation grid.</p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• Use "Add Epic" above to add any epic from any project to this team's allocation grid</p>
            <p>• Enter percentage values (1-100) for each work item across iterations</p>
            <p>• Blue items are epics, colored items are run work categories</p>
            <p>• Click the X button to remove epics from the allocation grid</p>
            <p>• Changes are saved only when you click "Save Allocations"</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default BulkAllocationGrid;
