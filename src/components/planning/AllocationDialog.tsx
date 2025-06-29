import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Allocation, Team, Cycle, Project, Epic, RunWorkCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allocation: Allocation | null;
  cycleId: string;
  teams: Team[];
  iterations: Cycle[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  prefilledData?: {
    teamId?: string;
    iterationNumber?: number;
    suggestedEpicId?: string;
  } | null;
}

const AllocationDialog: React.FC<AllocationDialogProps> = ({
  isOpen,
  onClose,
  allocation,
  cycleId,
  teams,
  iterations,
  projects,
  epics,
  runWorkCategories,
  prefilledData,
}) => {
  const { allocations, setAllocations } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teamId: '',
    iterationNumber: '',
    workType: 'epic' as 'epic' | 'run-work',
    projectId: '',
    epicId: '',
    runWorkCategoryId: '',
    percentage: '',
    notes: '',
  });

  // Debug logging
  console.log('AllocationDialog: epics array:', epics);
  console.log('AllocationDialog: formData.projectId:', formData.projectId);
  console.log('AllocationDialog: prefilledData:', prefilledData);

  useEffect(() => {
    if (allocation) {
      const epic = allocation.epicId ? epics.find(e => e.id === allocation.epicId) : null;
      setFormData({
        teamId: allocation.teamId,
        iterationNumber: allocation.iterationNumber.toString(),
        workType: allocation.epicId ? 'epic' : 'run-work',
        projectId: epic?.projectId || '',
        epicId: allocation.epicId || '',
        runWorkCategoryId: allocation.runWorkCategoryId || '',
        percentage: allocation.percentage.toString(),
        notes: allocation.notes || '',
      });
    } else if (prefilledData) {
      // Handle prefilled data from matrix click
      const suggestedEpic = prefilledData.suggestedEpicId ? epics.find(e => e.id === prefilledData.suggestedEpicId) : null;
      setFormData({
        teamId: prefilledData.teamId || '',
        iterationNumber: prefilledData.iterationNumber?.toString() || '',
        workType: suggestedEpic ? 'epic' : 'epic',
        projectId: suggestedEpic?.projectId || '',
        epicId: prefilledData.suggestedEpicId || '',
        runWorkCategoryId: '',
        percentage: '',
        notes: '',
      });
    } else {
      setFormData({
        teamId: '',
        iterationNumber: '',
        workType: 'epic',
        projectId: '',
        epicId: '',
        runWorkCategoryId: '',
        percentage: '',
        notes: '',
      });
    }
  }, [allocation, isOpen, epics, prefilledData]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`AllocationDialog: ${field} changed to:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset epic when project changes
      if (field === 'projectId') {
        newData.epicId = '';
        console.log('AllocationDialog: Project changed, resetting epicId');
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teamId || !formData.iterationNumber || !formData.percentage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: "Error",
        description: "Percentage must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    if (formData.workType === 'epic' && !formData.epicId) {
      toast({
        title: "Error",
        description: "Please select an epic",
        variant: "destructive",
      });
      return;
    }

    if (formData.workType === 'run-work' && !formData.runWorkCategoryId) {
      toast({
        title: "Error",
        description: "Please select a run work category",
        variant: "destructive",
      });
      return;
    }

    // Validate epic assignment to team
    if (formData.workType === 'epic') {
      const selectedEpic = epics.find(e => e.id === formData.epicId);
      const selectedTeam = teams.find(t => t.id === formData.teamId);
      
      if (selectedEpic && selectedTeam && selectedEpic.assignedTeamId && selectedEpic.assignedTeamId !== formData.teamId) {
        const assignedTeam = teams.find(t => t.id === selectedEpic.assignedTeamId);
        toast({
          title: "Warning",
          description: `Epic "${selectedEpic.name}" is assigned to ${assignedTeam?.name}, but you're allocating it to ${selectedTeam.name}. Consider reassigning the epic first.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Check for over-allocation
    const existingAllocations = allocations.filter(a => 
      a.teamId === formData.teamId && 
      a.cycleId === cycleId && 
      a.iterationNumber === parseInt(formData.iterationNumber) &&
      a.id !== allocation?.id
    );
    
    const totalExistingPercentage = existingAllocations.reduce((sum, a) => sum + a.percentage, 0);
    if (totalExistingPercentage + percentage > 100) {
      toast({
        title: "Warning",
        description: `This allocation would result in ${totalExistingPercentage + percentage}% allocation for this team in this iteration. Consider adjusting the percentage.`,
        variant: "destructive",
      });
    }

    const allocationData: Allocation = {
      id: allocation?.id || crypto.randomUUID(),
      teamId: formData.teamId,
      cycleId,
      iterationNumber: parseInt(formData.iterationNumber),
      epicId: formData.workType === 'epic' ? formData.epicId : undefined,
      runWorkCategoryId: formData.workType === 'run-work' ? formData.runWorkCategoryId : undefined,
      percentage,
      notes: formData.notes.trim() || undefined,
    };

    if (allocation) {
      setAllocations(prev => prev.map(a => a.id === allocation.id ? allocationData : a));
      toast({
        title: "Success",
        description: "Allocation updated successfully",
      });
    } else {
      setAllocations(prev => [...prev, allocationData]);
      toast({
        title: "Success",
        description: "Allocation created successfully",
      });
    }

    onClose();
  };

  const selectableProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  const availableEpics = formData.projectId 
    ? epics.filter(epic => epic.projectId === formData.projectId)
    : [];

  console.log('AllocationDialog: availableEpics:', availableEpics);
  console.log('AllocationDialog: selectableProjects:', selectableProjects);

  const getEpicTeamInfo = (epic: Epic) => {
    if (!epic.assignedTeamId) return null;
    const team = teams.find(t => t.id === epic.assignedTeamId);
    return team ? `Assigned to: ${team.name}` : 'Assigned team not found';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {allocation ? 'Edit Allocation' : 'Create New Allocation'}
            {prefilledData && (
              <div className="text-sm text-blue-600 font-normal mt-1">
                Pre-filled from matrix selection
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select value={formData.teamId} onValueChange={(value) => handleInputChange('teamId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.capacity}h/week)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iteration">Iteration *</Label>
              <Select value={formData.iterationNumber} onValueChange={(value) => handleInputChange('iterationNumber', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select iteration" />
                </SelectTrigger>
                <SelectContent>
                  {iterations.map((iteration, index) => (
                    <SelectItem key={iteration.id} value={(index + 1).toString()}>
                      Iteration {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workType">Work Type *</Label>
            <Select value={formData.workType} onValueChange={(value) => handleInputChange('workType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Project Epic</SelectItem>
                <SelectItem value="run-work">Run Work Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.workType === 'epic' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project first" />
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
                <Label htmlFor="epic">Epic *</Label>
                <Select 
                  value={formData.epicId} 
                  onValueChange={(value) => handleInputChange('epicId', value)}
                  disabled={!formData.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.projectId ? "Select epic" : "Select project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEpics.length === 0 && formData.projectId ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No epics found for this project</div>
                    ) : (
                      availableEpics.map(epic => {
                        const teamInfo = getEpicTeamInfo(epic);
                        const isAssignedToSelectedTeam = epic.assignedTeamId === formData.teamId;
                        
                        return (
                          <SelectItem key={epic.id} value={epic.id}>
                            <div className="flex flex-col">
                              <span>{epic.name}</span>
                              {teamInfo && (
                                <span className={`text-xs ${isAssignedToSelectedTeam ? 'text-green-600' : 'text-orange-600'}`}>
                                  {teamInfo}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {formData.epicId && formData.teamId && (
                  (() => {
                    const selectedEpic = availableEpics.find(e => e.id === formData.epicId);
                    if (selectedEpic?.assignedTeamId && selectedEpic.assignedTeamId !== formData.teamId) {
                      const assignedTeam = teams.find(t => t.id === selectedEpic.assignedTeamId);
                      return (
                        <p className="text-sm text-orange-600">
                          ⚠️ This epic is assigned to {assignedTeam?.name}
                        </p>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            </>
          )}

          {formData.workType === 'run-work' && (
            <div className="space-y-2">
              <Label htmlFor="runWorkCategory">Run Work Category *</Label>
              <Select value={formData.runWorkCategoryId} onValueChange={(value) => handleInputChange('runWorkCategoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No category assigned</SelectItem>
                  {runWorkCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="percentage">Allocation Percentage *</Label>
            <Input
              id="percentage"
              type="number"
              value={formData.percentage}
              onChange={(e) => handleInputChange('percentage', e.target.value)}
              placeholder="e.g., 20"
              min="1"
              max="100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {allocation ? 'Update Allocation' : 'Create Allocation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationDialog;
