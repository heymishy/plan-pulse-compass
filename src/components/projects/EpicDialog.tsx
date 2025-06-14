
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
  const { epics, setEpics } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedEffort: '',
    status: 'not-started' as Epic['status'],
  });

  useEffect(() => {
    if (epic) {
      setFormData({
        name: epic.name,
        description: epic.description || '',
        estimatedEffort: epic.estimatedEffort.toString(),
        status: epic.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        estimatedEffort: '',
        status: 'not-started',
      });
    }
  }, [epic, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
