
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Release } from '@/types';
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

interface ReleaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
}

const ReleaseDialog: React.FC<ReleaseDialogProps> = ({ isOpen, onClose, release }) => {
  const { releases, setReleases } = useApp();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    status: 'planned' as Release['status'],
    targetDate: '',
    actualDate: '',
  });

  useEffect(() => {
    if (release) {
      setFormData({
        name: release.name,
        version: release.version,
        description: release.description || '',
        status: release.status,
        targetDate: release.targetDate || '',
        actualDate: release.actualDate || '',
      });
    } else {
      setFormData({
        name: '',
        version: '',
        description: '',
        status: 'planned',
        targetDate: '',
        actualDate: '',
      });
    }
  }, [release, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.version.trim()) {
      toast({
        title: "Error",
        description: "Release name and version are required",
        variant: "destructive",
      });
      return;
    }

    const newRelease: Release = {
      id: release?.id || `release-${Date.now()}`,
      name: formData.name.trim(),
      version: formData.version.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      targetDate: formData.targetDate || undefined,
      actualDate: formData.actualDate || undefined,
    };

    if (release) {
      setReleases(prev => prev.map(r => r.id === release.id ? newRelease : r));
      toast({
        title: "Success",
        description: "Release updated successfully",
      });
    } else {
      setReleases(prev => [...prev, newRelease]);
      toast({
        title: "Success",
        description: "Release created successfully",
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{release ? 'Edit Release' : 'Create New Release'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Release Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter release name"
              required
            />
          </div>

          <div>
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              placeholder="e.g., 1.0.0"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter release description"
              rows={3}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value: Release['status']) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="actualDate">Actual Release Date</Label>
            <Input
              id="actualDate"
              type="date"
              value={formData.actualDate}
              onChange={(e) => setFormData(prev => ({ ...prev, actualDate: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {release ? 'Update Release' : 'Create Release'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseDialog;
