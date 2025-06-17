
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Epic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';

interface EpicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  epic: Epic | null;
  projectId: string;
}

const EpicDialog: React.FC<EpicDialogProps> = ({ isOpen, onClose, epic, projectId }) => {
  const { epics, setEpics, teams, releases } = useApp();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'not-started' as Epic['status'],
    assignedTeamId: 'none',
    estimatedEffort: '',
    storyPoints: '',
    startDate: '',
    targetEndDate: '',
    releaseId: 'none',
    mvpPriority: '',
    releasePriority: '',
    isDeployed: false,
    deploymentDate: '',
    isToggleEnabled: false,
    toggleEnabledDate: '',
  });

  useEffect(() => {
    if (epic) {
      setFormData({
        name: epic.name,
        description: epic.description || '',
        status: epic.status,
        assignedTeamId: epic.assignedTeamId || 'none',
        estimatedEffort: epic.estimatedEffort?.toString() || '',
        storyPoints: epic.storyPoints?.toString() || '',
        startDate: epic.startDate || '',
        targetEndDate: epic.targetEndDate || '',
        releaseId: epic.releaseId || 'none',
        mvpPriority: epic.mvpPriority?.toString() || '',
        releasePriority: epic.releasePriority?.toString() || '',
        isDeployed: epic.isDeployed || false,
        deploymentDate: epic.deploymentDate || '',
        isToggleEnabled: epic.isToggleEnabled || false,
        toggleEnabledDate: epic.toggleEnabledDate || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'not-started',
        assignedTeamId: 'none',
        estimatedEffort: '',
        storyPoints: '',
        startDate: '',
        targetEndDate: '',
        releaseId: 'none',
        mvpPriority: '',
        releasePriority: '',
        isDeployed: false,
        deploymentDate: '',
        isToggleEnabled: false,
        toggleEnabledDate: '',
      });
    }
  }, [epic, isOpen]);

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

    const newEpic: Epic = {
      id: epic?.id || `epic-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      projectId,
      assignedTeamId: formData.assignedTeamId === 'none' ? undefined : formData.assignedTeamId,
      estimatedEffort: formData.estimatedEffort ? parseInt(formData.estimatedEffort) : undefined,
      storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : undefined,
      startDate: formData.startDate || undefined,
      targetEndDate: formData.targetEndDate || undefined,
      releaseId: formData.releaseId === 'none' ? undefined : formData.releaseId,
      mvpPriority: formData.mvpPriority ? parseInt(formData.mvpPriority) : undefined,
      releasePriority: formData.releasePriority ? parseInt(formData.releasePriority) : undefined,
      isDeployed: formData.isDeployed,
      deploymentDate: formData.deploymentDate || undefined,
      isToggleEnabled: formData.isToggleEnabled,
      toggleEnabledDate: formData.toggleEnabledDate || undefined,
    };

    if (epic) {
      setEpics(prev => prev.map(e => e.id === epic.id ? newEpic : e));
      toast({
        title: "Success",
        description: "Epic updated successfully",
      });
    } else {
      setEpics(prev => [...prev, newEpic]);
      toast({
        title: "Success",
        description: "Epic created successfully",
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{epic ? 'Edit Epic' : 'Create New Epic'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Epic Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter epic name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter epic description"
                rows={3}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: Epic['status']) => setFormData(prev => ({ ...prev, status: value }))}>
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

            <div>
              <Label>Assigned Team</Label>
              <Select value={formData.assignedTeamId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTeamId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team assigned</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedEffort">Estimated Effort (hours)</Label>
              <Input
                id="estimatedEffort"
                type="number"
                min="0"
                value={formData.estimatedEffort}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedEffort: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="storyPoints">Story Points (optional)</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                value={formData.storyPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, storyPoints: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="targetEndDate">Target End Date</Label>
              <Input
                id="targetEndDate"
                type="date"
                value={formData.targetEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetEndDate: e.target.value }))}
              />
            </div>

            <div>
              <Label>Release</Label>
              <Select value={formData.releaseId} onValueChange={(value) => setFormData(prev => ({ ...prev, releaseId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select release" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No release</SelectItem>
                  {releases.map(release => (
                    <SelectItem key={release.id} value={release.id}>
                      {release.name} ({release.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mvpPriority">MVP Priority (1-1000)</Label>
              <Input
                id="mvpPriority"
                type="number"
                min="1"
                max="1000"
                value={formData.mvpPriority}
                onChange={(e) => setFormData(prev => ({ ...prev, mvpPriority: e.target.value }))}
                placeholder="Enter priority"
              />
            </div>

            <div>
              <Label htmlFor="releasePriority">Release Priority (1-1000)</Label>
              <Input
                id="releasePriority"
                type="number"
                min="1"
                max="1000"
                value={formData.releasePriority}
                onChange={(e) => setFormData(prev => ({ ...prev, releasePriority: e.target.value }))}
                placeholder="Enter priority"
              />
            </div>

            <div>
              <Label htmlFor="deploymentDate">Deployment Date</Label>
              <Input
                id="deploymentDate"
                type="date"
                value={formData.deploymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deploymentDate: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDeployed"
                  checked={formData.isDeployed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDeployed: checked as boolean }))}
                />
                <Label htmlFor="isDeployed">Is Deployed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isToggleEnabled"
                  checked={formData.isToggleEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isToggleEnabled: checked as boolean }))}
                />
                <Label htmlFor="isToggleEnabled">Feature Toggle Enabled</Label>
              </div>

              {formData.isToggleEnabled && (
                <div>
                  <Label htmlFor="toggleEnabledDate">Toggle Enabled Date</Label>
                  <Input
                    id="toggleEnabledDate"
                    type="date"
                    value={formData.toggleEnabledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, toggleEnabledDate: e.target.value }))}
                  />
                </div>
              )}
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
