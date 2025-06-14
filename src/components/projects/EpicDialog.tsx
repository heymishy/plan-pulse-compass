import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Epic } from '@/types';
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

interface EpicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  epic: Epic | null;
  projectId: string;
}

const EpicDialog: React.FC<EpicDialogProps> = ({ isOpen, onClose, epic, projectId }) => {
  const { epics, setEpics, teams, projects, setProjects } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedEffort: '',
    status: 'not-started' as Epic['status'],
    assignedTeamId: '',
    startDate: '',
    targetEndDate: '',
  });

  useEffect(() => {
    if (epic) {
      setFormData({
        name: epic.name,
        description: epic.description || '',
        estimatedEffort: epic.estimatedEffort.toString(),
        status: epic.status,
        assignedTeamId: epic.assignedTeamId || '',
        startDate: epic.startDate || '',
        targetEndDate: epic.targetEndDate || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        estimatedEffort: '',
        status: 'not-started',
        assignedTeamId: '',
        startDate: '',
        targetEndDate: '',
      });
    }
  }, [epic, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateProjectEndDate = (epicTargetEndDate: string) => {
    if (!epicTargetEndDate) return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Get all epics for this project
    const projectEpics = epics.filter(e => e.projectId === projectId);
    
    // Find the latest target end date among all epics
    const allEndDates = projectEpics
      .map(e => e.targetEndDate)
      .filter(Boolean)
      .concat([epicTargetEndDate]);

    if (allEndDates.length === 0) return;

    const latestEndDate = allEndDates.reduce((latest, current) => {
      return new Date(current!) > new Date(latest!) ? current : latest;
    });

    // Update project end date if this epic's end date is later
    if (!project.endDate || new Date(latestEndDate!) > new Date(project.endDate)) {
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, endDate: latestEndDate }
          : p
      ));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Epic name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.estimatedEffort || parseFloat(formData.estimatedEffort) <= 0) {
      toast({
        title: "Error",
        description: "Estimated effort must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const epicData: Epic = {
      id: epic?.id || crypto.randomUUID(),
      projectId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      estimatedEffort: parseFloat(formData.estimatedEffort),
      status: formData.status,
      assignedTeamId: formData.assignedTeamId === 'none' ? undefined : formData.assignedTeamId || undefined,
      startDate: formData.startDate || undefined,
      targetEndDate: formData.targetEndDate || undefined,
      actualEndDate: formData.status === 'completed' ? (epic?.actualEndDate || new Date().toISOString().split('T')[0]) : undefined,
    };

    if (epic) {
      setEpics(prev => prev.map(e => e.id === epic.id ? epicData : e));
      toast({
        title: "Success",
        description: "Epic updated successfully",
      });
    } else {
      setEpics(prev => [...prev, epicData]);
      toast({
        title: "Success",
        description: "Epic created successfully",
      });
    }

    // Update project end date based on epic timeline
    if (formData.targetEndDate) {
      updateProjectEndDate(formData.targetEndDate);
    }

    onClose();
  };

  const assignedTeam = teams.find(t => t.id === formData.assignedTeamId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {epic ? 'Edit Epic' : 'Create New Epic'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Epic Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter epic name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter epic description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedEffort">Estimated Effort *</Label>
              <Input
                id="estimatedEffort"
                type="number"
                value={formData.estimatedEffort}
                onChange={(e) => handleInputChange('estimatedEffort', e.target.value)}
                placeholder="Story points"
                min="0"
                step="0.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTeam">Assigned Team</Label>
            <Select value={formData.assignedTeamId} onValueChange={(value) => handleInputChange('assignedTeamId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team assigned</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.capacity}h/week)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedTeam && (
              <p className="text-sm text-gray-600">
                Team capacity: {assignedTeam.capacity} hours per week
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetEndDate">Target End Date</Label>
              <Input
                id="targetEndDate"
                type="date"
                value={formData.targetEndDate}
                onChange={(e) => handleInputChange('targetEndDate', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {epic ? 'Update Epic' : 'Create Epic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EpicDialog;
