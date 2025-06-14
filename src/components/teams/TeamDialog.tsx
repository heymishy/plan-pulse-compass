
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: string | null;
}

const TeamDialog: React.FC<TeamDialogProps> = ({ isOpen, onClose, teamId }) => {
  const { teams, setTeams, divisions, people } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    divisionId: '',
    managerId: '',
    capacity: '40',
  });

  const isEditing = Boolean(teamId);

  useEffect(() => {
    if (isEditing && teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setFormData({
          name: team.name,
          divisionId: team.divisionId || '',
          managerId: team.managerId || '',
          capacity: team.capacity.toString(),
        });
      }
    } else {
      setFormData({
        name: '',
        divisionId: '',
        managerId: '',
        capacity: '40',
      });
    }
  }, [isEditing, teamId, teams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      toast({
        title: "Error",
        description: "Capacity must be a positive number",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && teamId) {
      // Update existing team
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? {
              ...team,
              name: formData.name.trim(),
              divisionId: formData.divisionId === 'none' ? undefined : formData.divisionId,
              managerId: formData.managerId === 'none' ? undefined : formData.managerId,
              capacity,
            }
          : team
      ));
      
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    } else {
      // Create new team
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        divisionId: formData.divisionId === 'none' ? undefined : formData.divisionId,
        managerId: formData.managerId === 'none' ? undefined : formData.managerId,
        capacity,
      };
      
      setTeams(prev => [...prev, newTeam]);
      
      toast({
        title: "Success",
        description: "Team created successfully",
      });
    }
    
    onClose();
  };

  const potentialManagers = people.filter(person => person.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Team' : 'Create New Team'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Select
              value={formData.divisionId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, divisionId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Division</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division.id} value={division.id}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {potentialManagers.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Weekly Capacity (hours) *</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              placeholder="40"
              min="1"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update' : 'Create'} Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDialog;
