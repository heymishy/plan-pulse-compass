
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Milestone } from '@/types';
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

interface MilestoneDialogProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  projectId: string | null;
}

const MilestoneDialog: React.FC<MilestoneDialogProps> = ({ 
  isOpen, 
  onClose, 
  milestone, 
  projectId 
}) => {
  const { projects, setProjects } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    status: 'not-started' as Milestone['status'],
    selectedProjectId: '',
  });

  useEffect(() => {
    if (milestone && projectId) {
      setFormData({
        name: milestone.name,
        description: milestone.description || '',
        dueDate: milestone.dueDate,
        status: milestone.status,
        selectedProjectId: projectId,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        dueDate: '',
        status: 'not-started',
        selectedProjectId: projectId || '',
      });
    }
  }, [milestone, projectId, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Milestone name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: "Error",
        description: "Due date is required",
        variant: "destructive",
      });
      return;
    }

    const milestoneData: Milestone = {
      id: milestone?.id || crypto.randomUUID(),
      projectId: formData.selectedProjectId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      dueDate: formData.dueDate,
      status: formData.status,
    };

    setProjects(prev => prev.map(project => {
      if (project.id === formData.selectedProjectId) {
        if (milestone) {
          // Update existing milestone
          return {
            ...project,
            milestones: project.milestones.map(m => 
              m.id === milestone.id ? milestoneData : m
            )
          };
        } else {
          // Add new milestone
          return {
            ...project,
            milestones: [...project.milestones, milestoneData]
          };
        }
      }
      
      // If editing and project changed, remove from old project
      if (milestone && project.milestones.some(m => m.id === milestone.id)) {
        return {
          ...project,
          milestones: project.milestones.filter(m => m.id !== milestone.id)
        };
      }
      
      return project;
    }));

    toast({
      title: "Success",
      description: milestone ? "Milestone updated successfully" : "Milestone created successfully",
    });

    onClose();
  };

  const activeProjects = projects.filter(p => p.status !== 'cancelled');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {milestone ? 'Edit Milestone' : 'Create New Milestone'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Milestone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter milestone name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={formData.selectedProjectId} 
                onValueChange={(value) => handleInputChange('selectedProjectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
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
                  <SelectItem value="at-risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter milestone description"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {milestone ? 'Update Milestone' : 'Create Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneDialog;
