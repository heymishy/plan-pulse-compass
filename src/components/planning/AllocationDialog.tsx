
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
}) => {
  const { allocations, setAllocations } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teamId: '',
    iterationNumber: '',
    workType: 'epic' as 'epic' | 'run-work',
    epicId: '',
    runWorkCategoryId: '',
    percentage: '',
    notes: '',
  });

  useEffect(() => {
    if (allocation) {
      setFormData({
        teamId: allocation.teamId,
        iterationNumber: allocation.iterationNumber.toString(),
        workType: allocation.epicId ? 'epic' : 'run-work',
        epicId: allocation.epicId || '',
        runWorkCategoryId: allocation.runWorkCategoryId || '',
        percentage: allocation.percentage.toString(),
        notes: allocation.notes || '',
      });
    } else {
      setFormData({
        teamId: '',
        iterationNumber: '',
        workType: 'epic',
        epicId: '',
        runWorkCategoryId: '',
        percentage: '',
        notes: '',
      });
    }
  }, [allocation, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const availableEpics = epics.filter(epic => 
    projects.find(p => p.id === epic.projectId && p.status === 'active')
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {allocation ? 'Edit Allocation' : 'Create New Allocation'}
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
                      {team.name}
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
            <div className="space-y-2">
              <Label htmlFor="epic">Epic *</Label>
              <Select value={formData.epicId} onValueChange={(value) => handleInputChange('epicId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select epic" />
                </SelectTrigger>
                <SelectContent>
                  {availableEpics.map(epic => {
                    const project = projects.find(p => p.id === epic.projectId);
                    return (
                      <SelectItem key={epic.id} value={epic.id}>
                        {project?.name} - {epic.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.workType === 'run-work' && (
            <div className="space-y-2">
              <Label htmlFor="runWorkCategory">Run Work Category *</Label>
              <Select value={formData.runWorkCategoryId} onValueChange={(value) => handleInputChange('runWorkCategoryId', value)}>
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
