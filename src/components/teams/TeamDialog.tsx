
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
  const { teams, setTeams, divisions, people, roles } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    divisionId: '',
    productOwnerId: '',
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
          productOwnerId: team.productOwnerId || '',
          capacity: team.capacity.toString(),
        });
      }
    } else {
      setFormData({
        name: '',
        divisionId: '',
        productOwnerId: '',
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
              productOwnerId: formData.productOwnerId === 'none' ? undefined : formData.productOwnerId,
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
        productOwnerId: formData.productOwnerId === 'none' ? undefined : formData.productOwnerId,
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

  // Get current team members
  const currentTeamMembers = isEditing && teamId ? 
    people.filter(person => person.teamId === teamId && person.isActive) : 
    [];

  // Find Product Owner role
  const productOwnerRole = roles.find(role => 
    role.name.toLowerCase().includes('product owner') || role.name.toLowerCase().includes('po')
  );

  // Find team member with Product Owner role
  const teamProductOwner = productOwnerRole ? 
    currentTeamMembers.find(person => person.roleId === productOwnerRole.id) : null;

  // Get all active people for selection (in case no PO exists in team)
  const allActivePeople = people.filter(person => person.isActive);

  // Determine if the selected person is acting (not the natural PO from the team)
  const selectedPerson = formData.productOwnerId ? 
    people.find(p => p.id === formData.productOwnerId) : null;
  const isActingProductOwner = selectedPerson && selectedPerson.id !== teamProductOwner?.id;

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
            <Label htmlFor="productOwner">
              Product Owner {isActingProductOwner && <span className="text-orange-600">(Acting)</span>}
            </Label>
            <Select
              value={formData.productOwnerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, productOwnerId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Product Owner</SelectItem>
                {teamProductOwner && (
                  <SelectItem key={teamProductOwner.id} value={teamProductOwner.id}>
                    {teamProductOwner.name} (Team PO)
                  </SelectItem>
                )}
                {allActivePeople
                  .filter(person => person.id !== teamProductOwner?.id)
                  .map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                      {currentTeamMembers.some(tm => tm.id === person.id) ? ' (Team Member)' : ' (External)'}
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
