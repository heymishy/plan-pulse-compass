
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
import { Save } from 'lucide-react';

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
  const [workType, setWorkType] = useState<'epic' | 'run-work'>('epic');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEpicId, setSelectedEpicId] = useState('');
  const [selectedRunWorkCategoryId, setSelectedRunWorkCategoryId] = useState('');
  const [gridAllocations, setGridAllocations] = useState<Record<string, GridAllocation>>({});

  const activeProjects = projects.filter(p => p.status === 'active');
  const availableEpics = selectedProjectId 
    ? epics.filter(epic => epic.projectId === selectedProjectId)
    : [];

  const getGridKey = (teamId: string, iterationNumber: number) => `${teamId}-${iterationNumber}`;

  const handlePercentageChange = (teamId: string, iterationNumber: number, value: string) => {
    const key = getGridKey(teamId, iterationNumber);
    const percentage = parseFloat(value) || 0;
    
    if (percentage === 0) {
      const newGridAllocations = { ...gridAllocations };
      delete newGridAllocations[key];
      setGridAllocations(newGridAllocations);
    } else if (percentage > 0 && percentage <= 100) {
      setGridAllocations(prev => ({
        ...prev,
        [key]: { teamId, iterationNumber, percentage }
      }));
    }
  };

  const getExistingAllocation = (teamId: string, iterationNumber: number) => {
    return allocations.find(a => 
      a.teamId === teamId && 
      a.cycleId === cycleId && 
      a.iterationNumber === iterationNumber &&
      ((workType === 'epic' && a.epicId === selectedEpicId) ||
       (workType === 'run-work' && a.runWorkCategoryId === selectedRunWorkCategoryId))
    );
  };

  const getCurrentValue = (teamId: string, iterationNumber: number) => {
    const key = getGridKey(teamId, iterationNumber);
    const gridValue = gridAllocations[key];
    if (gridValue) return gridValue.percentage.toString();
    
    const existing = getExistingAllocation(teamId, iterationNumber);
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

    const newAllocations: Allocation[] = [];
    const updatedAllocations: Allocation[] = [];

    Object.values(gridAllocations).forEach(({ teamId, iterationNumber, percentage }) => {
      const existing = getExistingAllocation(teamId, iterationNumber);
      
      const allocationData: Allocation = {
        id: existing?.id || crypto.randomUUID(),
        teamId,
        cycleId,
        iterationNumber,
        epicId: workType === 'epic' ? selectedEpicId : undefined,
        runWorkCategoryId: workType === 'run-work' ? selectedRunWorkCategoryId : undefined,
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
    ((workType === 'epic' && selectedEpicId) || (workType === 'run-work' && selectedRunWorkCategoryId));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Allocation Grid</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Work Type</Label>
            <Select value={workType} onValueChange={(value: 'epic' | 'run-work') => setWorkType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Project Epic</SelectItem>
                <SelectItem value="run-work">Run Work Category</SelectItem>
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
                    {activeProjects.map(project => (
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

          <div className="flex items-end">
            <Button onClick={handleSave} disabled={!canSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Allocations
            </Button>
          </div>
        </div>
      </CardHeader>

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
                      return (
                        <TableCell key={index} className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className="w-20 text-center"
                            placeholder="%"
                            value={getCurrentValue(team.id, iterationNumber)}
                            onChange={(e) => handlePercentageChange(team.id, iterationNumber, e.target.value)}
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
    </Card>
  );
};

export default BulkAllocationGrid;
