import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { useScenarios } from '@/context/ScenarioContext';
import { useToast } from '@/hooks/use-toast';
import { Person, Team, Division, Role } from '@/types';
import { getTeamMembers } from '@/utils/teamUtils';
import { Users, ArrowRightLeft, Plus, Search } from 'lucide-react';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
}

const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
}) => {
  const { people, teams, divisions, roles, updatePerson, addTeamMember } =
    useApp();
  const { isInScenarioMode, refreshScenarioFinancialAnalysis } = useScenarios();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'add' | 'transfer'>('add');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [allocation, setAllocation] = useState('100');
  const [memberRole, setMemberRole] = useState<'member' | 'lead'>('member');

  // Get current team members
  const currentTeamMembers = getTeamMembers(teamId, people);
  const currentTeamMemberIds = new Set(currentTeamMembers.map(p => p.id));

  // Filter available people based on tab and filters
  const availablePeople = useMemo(() => {
    if (!people || !Array.isArray(people)) return [];

    let filtered = people.filter(person => {
      // For 'add' tab: only people NOT currently in any team (unassigned)
      // For 'transfer' tab: people assigned to other teams (not this team)
      if (activeTab === 'add') {
        // Only show people who have no team assignment OR are inactive
        return !person.teamId || !person.isActive;
      } else {
        // Only show people who are in OTHER teams (not this team) and are active
        return person.teamId && person.teamId !== teamId && person.isActive;
      }
    });

    // Apply division filter
    if (selectedDivisionFilter !== 'all' && teams && Array.isArray(teams)) {
      const divisionTeams = teams
        .filter(team => team.divisionId === selectedDivisionFilter)
        .map(team => team.id);

      filtered = filtered.filter(
        person => !person.teamId || divisionTeams.includes(person.teamId)
      );
    }

    // Apply team filter
    if (selectedTeamFilter !== 'all') {
      filtered = filtered.filter(
        person => person.teamId === selectedTeamFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        person =>
          person.name?.toLowerCase().includes(searchLower) ||
          person.email?.toLowerCase().includes(searchLower)
      );
    }

    return filtered || [];
  }, [
    people,
    teams,
    activeTab,
    selectedDivisionFilter,
    selectedTeamFilter,
    searchTerm,
    teamId,
    currentTeamMemberIds,
  ]);

  const selectedPerson =
    selectedPersonId && people
      ? people.find(p => p.id === selectedPersonId)
      : null;
  const selectedPersonCurrentTeam =
    selectedPerson?.teamId && teams
      ? teams.find(t => t.id === selectedPerson.teamId)
      : null;

  const handleAddMember = async () => {
    if (!selectedPersonId) {
      toast({
        title: 'Error',
        description: 'Please select a person to add to the team.',
        variant: 'destructive',
      });
      return;
    }

    const allocationNum = parseInt(allocation);
    if (isNaN(allocationNum) || allocationNum < 1 || allocationNum > 100) {
      toast({
        title: 'Error',
        description: 'Allocation must be between 1 and 100.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const person = people
        ? people.find(p => p.id === selectedPersonId)
        : null;
      if (!person) throw new Error('Person not found');

      // Update person's team assignment
      await updatePerson(selectedPersonId, {
        teamId: teamId,
        isActive: true,
      });

      // Add team member details if addTeamMember is available
      if (addTeamMember) {
        await addTeamMember({
          personId: selectedPersonId,
          teamId: teamId,
          role: memberRole,
          allocation: allocationNum,
          startDate: new Date().toISOString().split('T')[0],
          isActive: true,
        });
      }

      const actionText =
        activeTab === 'transfer' && selectedPersonCurrentTeam
          ? `transferred from ${selectedPersonCurrentTeam.name} to ${teamName}`
          : `added to ${teamName}`;

      toast({
        title: 'Success',
        description: `${person.name} has been ${actionText}.`,
      });

      // Refresh financial analysis if in scenario mode
      if (isInScenarioMode) {
        await refreshScenarioFinancialAnalysis();
      }

      // Reset form
      setSelectedPersonId('');
      setAllocation('100');
      setMemberRole('member');
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add team member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPersonTeamInfo = (person: Person) => {
    if (!person.teamId || !teams) return 'No Team';
    const team = teams.find(t => t.id === person.teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getPersonDivisionInfo = (person: Person) => {
    if (!person.teamId || !teams || !divisions) return 'No Division';
    const team = teams.find(t => t.id === person.teamId);
    if (!team?.divisionId) return 'No Division';
    const division = divisions.find(d => d.id === team.divisionId);
    return division ? division.name : 'Unknown Division';
  };

  const getPersonRoleInfo = (person: Person) => {
    if (!roles) return 'No Role';
    const role = roles.find(r => r.id === person.roleId);
    return role ? role.name : 'No Role';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Member to {teamName}
          </DialogTitle>
          <DialogDescription>
            Add new team members or transfer existing members from other teams.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'add' | 'transfer')}
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Member
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transfer from Team
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-1">
            <TabsContent value="add" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Add unassigned people or reactivate inactive team members.
              </p>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Transfer people from other teams to {teamName}.
              </p>
            </TabsContent>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Filter by Division</Label>
                <Select
                  value={selectedDivisionFilter}
                  onValueChange={setSelectedDivisionFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {(divisions || []).map(division => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeTab === 'transfer' && (
                <div className="space-y-2">
                  <Label>Filter by Team</Label>
                  <Select
                    value={selectedTeamFilter}
                    onValueChange={setSelectedTeamFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {(teams || [])
                        .filter(team => team.id !== teamId)
                        .map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <Label>Search People</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Person Selection */}
            <div className="space-y-2">
              <Label>Select Person</Label>
              <Select
                value={selectedPersonId}
                onValueChange={setSelectedPersonId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a person..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {availablePeople.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No people found
                    </div>
                  ) : (
                    availablePeople.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{person.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {getPersonRoleInfo(person)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getPersonTeamInfo(person)} •{' '}
                              {getPersonDivisionInfo(person)}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Person Info */}
            {selectedPerson &&
              activeTab === 'transfer' &&
              selectedPersonCurrentTeam && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>{selectedPerson.name}</strong> will be transferred
                    from <strong>{selectedPersonCurrentTeam.name}</strong> to{' '}
                    <strong>{teamName}</strong>.
                  </p>
                </div>
              )}

            {/* Member Role and Allocation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Member Role</Label>
                <Select
                  value={memberRole}
                  onValueChange={(value: 'member' | 'lead') =>
                    setMemberRole(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Allocation (%)</Label>
                <Input
                  type="number"
                  value={allocation}
                  onChange={e => setAllocation(e.target.value)}
                  min="1"
                  max="100"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddMember} disabled={!selectedPersonId}>
            {activeTab === 'transfer' ? 'Transfer to Team' : 'Add to Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;
