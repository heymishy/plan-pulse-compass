
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Team, Cycle, Project, Epic, RunWorkCategory, Allocation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Users } from 'lucide-react';

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

  console.log('BulkAllocationGrid: workType:', workType);
  console.log('BulkAllocationGrid: selectedTeamId:', selectedTeamId);
  console.log('BulkAllocationGrid: teams:', teams);
  console.log('BulkAllocationGrid: epics:', epics);

  const selectableProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  const availableEpics = selectedProjectId 
    ? epics.filter(epic => epic.projectId === selectedProjectId)
    : [];
  
  // For team-based view, get epics assigned to the selected team
  const teamEpics = selectedTeamId 
    ? epics.filter(epic => epic.assignedTeamId === selectedTeamId)
    : [];

  console.log('BulkAllocationGrid: teamEpics for selectedTeamId:', selectedTeamId, teamEpics);

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
    setGridAllocations({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Allocation Grid</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Work Type</Label>
            <Select value={workType} onValueChange={(value: 'epic' | 'run-work' | 'team') => {
              setWorkType(value);
              resetSelections();
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Project Epic</SelectItem>
                <SelectItem value="run-work">Run Work Category</SelectItem>
                <SelectItem value="team">Team Work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {workType === 'epic' && (
            <>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setSelectedEpicId('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Epic</Label>
                <Select 
                  value={selectedEpicId} 
                  onValueChange={setSelectedEpicId}
                  disabled={!selectedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProjectId ? "Select epic" : "Select project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEpics.map(epic => (
                      <SelectItem key={epic.id} value={epic.id}>
                        {epic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
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
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Team</TableHead>
                  {iterations.map((_, index) => (
                    <TableHead key={index} className="text-center">
                      Iteration {index + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map(team => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{team.name}</div>
                        <div className="text-xs text-gray-500">{team.capacity}h/week</div>
                      </div>
                    </TableCell>
                    {iterations.map((_, index) => {
                      const iterationNumber = index + 1;
                      const workId = workType === 'epic' ? selectedEpicId : selectedRunWorkCategoryId;
                      const workData = workType === 'epic' 
                        ? { epicId: selectedEpicId }
                        : { runWorkCategoryId: selectedRunWorkCategoryId };
                      
                      return (
                        <TableCell key={index} className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className="w-20 text-center"
                            placeholder="%"
                            value={getCurrentValue(team.id, iterationNumber, workId, workData.epicId, workData.runWorkCategoryId)}
                            onChange={(e) => handlePercentageChange(team.id, iterationNumber, workId, e.target.value, workData)}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
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
            <p className="text-sm text-gray-600 mb-2">
              Set allocation percentages for epics and run work categories across iterations
            </p>
            <p className="text-sm text-blue-600">
              Found {teamEpics.length} epics assigned to this team and {runWorkCategories.length} run work categories
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64">Work Item</TableHead>
                  {iterations.map((_, index) => (
                    <TableHead key={index} className="text-center">
                      Iteration {index + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Team Epics */}
                {teamEpics.map(epic => {
                  const project = projects.find(p => p.id === epic.projectId);
                  return (
                    <TableRow key={`epic-${epic.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-blue-600 font-medium">{epic.name}</div>
                          <div className="text-xs text-gray-500">{project?.name} • Epic • {epic.estimatedEffort} points</div>
                        </div>
                      </TableCell>
                      {iterations.map((_, index) => {
                        const iterationNumber = index + 1;
                        const workId = `epic-${epic.id}`;
                        return (
                          <TableCell key={index} className="text-center">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="w-20 text-center"
                              placeholder="%"
                              value={getCurrentValue(selectedTeamId, iterationNumber, workId, epic.id, undefined)}
                              onChange={(e) => handlePercentageChange(selectedTeamId, iterationNumber, workId, e.target.value, { epicId: epic.id })}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
                
                {/* Run Work Categories */}
                {runWorkCategories.map(category => (
                  <TableRow key={`category-${category.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium" style={{ color: category.color }}>{category.name}</div>
                        <div className="text-xs text-gray-500">Run Work Category</div>
                      </div>
                    </TableCell>
                    {iterations.map((_, index) => {
                      const iterationNumber = index + 1;
                      const workId = `category-${category.id}`;
                      return (
                        <TableCell key={index} className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className="w-20 text-center"
                            placeholder="%"
                            value={getCurrentValue(selectedTeamId, iterationNumber, workId, undefined, category.id)}
                            onChange={(e) => handlePercentageChange(selectedTeamId, iterationNumber, workId, e.target.value, { runWorkCategoryId: category.id })}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Show empty state if no work items */}
          {teamEpics.length === 0 && runWorkCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No epics assigned to this team and no run work categories available.</p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• Enter percentage values (1-100) for each work item across iterations</p>
            <p>• Blue items are epics, colored items are run work categories</p>
            <p>• Empty cells will remove existing allocations</p>
            <p>• Changes are saved only when you click "Save Allocations"</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default BulkAllocationGrid;
