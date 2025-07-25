import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Building2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Person, Team, Division, TeamMember } from '@/types';
import { getDivisionName } from '@/utils/teamUtils';

interface PeopleTeamMapperProps {
  isOpen: boolean;
  onClose: () => void;
}

const PeopleTeamMapper: React.FC<PeopleTeamMapperProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    people,
    teams,
    divisions,
    roles,
    teamMembers,
    setPeople,
    addTeamMember,
    addTeam,
  } = useApp();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showAssignedPeople, setShowAssignedPeople] = useState(false);
  const [teamDivisionFilter, setTeamDivisionFilter] = useState<string>('all');

  // Get people based on showAssignedPeople toggle
  const availablePeople = useMemo(() => {
    if (showAssignedPeople) {
      // Show all active people when toggle is on
      return people.filter(person => person.isActive);
    } else {
      // Show only truly unassigned people by default
      const activeTeamMemberIds = new Set(
        teamMembers.filter(tm => tm.isActive).map(tm => tm.personId)
      );

      return people.filter(
        person =>
          person.isActive &&
          (!person.teamId || !activeTeamMemberIds.has(person.id))
      );
    }
  }, [people, teamMembers, showAssignedPeople]);

  // Filter people based on search, division, role, and skills
  const filteredPeople = useMemo(() => {
    return availablePeople.filter(person => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // For division filtering, check if person's current team (if any) is in the division
      const matchesDivision =
        selectedDivision === 'all' ||
        (person.teamId &&
          teams.find(t => t.id === person.teamId)?.divisionId ===
            selectedDivision);

      // Role filter
      const matchesRole =
        selectedRole === 'all' || person.roleId === selectedRole;

      // Skills filter
      const matchesSkills =
        !skillsFilter ||
        (person.skills &&
          person.skills.some(skill =>
            skill.toLowerCase().includes(skillsFilter.toLowerCase())
          ));

      return (
        matchesSearch &&
        (selectedDivision === 'all' || !person.teamId || matchesDivision) &&
        matchesRole &&
        matchesSkills
      );
    });
  }, [
    availablePeople,
    searchTerm,
    selectedDivision,
    selectedRole,
    skillsFilter,
    teams,
  ]);

  // Group teams by division for better UX, filtered by teamDivisionFilter
  const teamsByDivision = useMemo(() => {
    const grouped = new Map<string, Team[]>();

    teams
      .filter(team => {
        if (teamDivisionFilter === 'all') return true;
        return team.divisionId === teamDivisionFilter;
      })
      .forEach(team => {
        const divisionKey = team.divisionId || 'no-division';
        if (!grouped.has(divisionKey)) {
          grouped.set(divisionKey, []);
        }
        grouped.get(divisionKey)!.push(team);
      });

    return grouped;
  }, [teams, teamDivisionFilter]);

  const handleSelectPerson = (personId: string, checked: boolean) => {
    const newSelected = new Set(selectedPeople);
    if (checked) {
      newSelected.add(personId);
    } else {
      newSelected.delete(personId);
    }
    setSelectedPeople(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPeople(new Set(filteredPeople.map(p => p.id)));
    } else {
      setSelectedPeople(new Set());
    }
  };

  const handleAssignToTeam = () => {
    if (!selectedTeam || selectedPeople.size === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select people and a team to assign them to.',
        variant: 'destructive',
      });
      return;
    }

    const team = teams.find(t => t.id === selectedTeam);
    if (!team) {
      toast({
        title: 'Error',
        description: 'Selected team not found.',
        variant: 'destructive',
      });
      return;
    }

    // Add team members
    const today = new Date().toISOString().split('T')[0];
    let successCount = 0;

    selectedPeople.forEach(personId => {
      try {
        const memberData: Omit<TeamMember, 'id'> = {
          teamId: selectedTeam,
          personId,
          role: 'member',
          allocation: 100,
          startDate: today,
          isActive: true,
        };

        addTeamMember(memberData);

        // Update person's teamId
        setPeople(prev =>
          prev.map(p =>
            p.id === personId ? { ...p, teamId: selectedTeam } : p
          )
        );

        successCount++;
      } catch (error) {
        console.error(`Failed to assign person ${personId} to team:`, error);
      }
    });

    if (successCount > 0) {
      toast({
        title: 'Success',
        description: `Assigned ${successCount} people to ${team.name}`,
      });

      // Clear selections
      setSelectedPeople(new Set());
      setSelectedTeam('');
    }
  };

  const handleCreateTeamWithPeople = () => {
    if (!newTeamName.trim() || selectedPeople.size === 0) {
      toast({
        title: 'Input Required',
        description: 'Please enter a team name and select people.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create new team
      const teamData = {
        name: newTeamName.trim(),
        description: `Team created for ${selectedPeople.size} people`,
        type: 'project' as const,
        status: 'planning' as const,
        capacity: selectedPeople.size * 40, // Estimate 40h per person
        divisionId: selectedDivision !== 'all' ? selectedDivision : undefined,
        targetSkills: [],
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const newTeam = addTeam(teamData);

      // Assign people to the new team
      const today = new Date().toISOString().split('T')[0];
      selectedPeople.forEach(personId => {
        const memberData: Omit<TeamMember, 'id'> = {
          teamId: newTeam.id,
          personId,
          role: 'member',
          allocation: 100,
          startDate: today,
          isActive: true,
        };

        addTeamMember(memberData);

        // Update person's teamId
        setPeople(prev =>
          prev.map(p => (p.id === personId ? { ...p, teamId: newTeam.id } : p))
        );
      });

      toast({
        title: 'Success',
        description: `Created team "${newTeamName}" with ${selectedPeople.size} members`,
      });

      // Reset form
      setNewTeamName('');
      setSelectedPeople(new Set());
      setShowCreateTeamDialog(false);
    } catch (error) {
      console.error('Failed to create team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPersonSkillsDisplay = (person: Person) => {
    if (!person.skills || person.skills.length === 0) {
      return <span className="text-gray-400 text-sm">No skills listed</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {person.skills.slice(0, 3).map((skill, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {skill}
          </Badge>
        ))}
        {person.skills.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{person.skills.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            People to Team Mapping
            <Badge variant="secondary" className="ml-2">
              {availablePeople.length}{' '}
              {showAssignedPeople ? 'total' : 'unassigned'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[70vh]">
          {/* Left Side - Unassigned People */}
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Show assigned people toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-assigned"
                  checked={showAssignedPeople}
                  onCheckedChange={setShowAssignedPeople}
                />
                <Label htmlFor="show-assigned" className="text-sm">
                  Show people already in teams (for reassignment)
                </Label>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={selectedDivision}
                  onValueChange={setSelectedDivision}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {divisions.map(division => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by skills..."
                  value={skillsFilter}
                  onChange={e => setSkillsFilter(e.target.value)}
                />
              </div>

              {/* Select All */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      selectedPeople.size === filteredPeople.length &&
                      filteredPeople.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <label className="text-sm">
                    Select all ({selectedPeople.size} of {filteredPeople.length}{' '}
                    selected)
                  </label>
                </div>
              </div>
            </div>

            {/* People List */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">
                  {showAssignedPeople ? 'All People' : 'Unassigned People'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPeople.map(person => (
                  <div
                    key={person.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPeople.has(person.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      handleSelectPerson(
                        person.id,
                        !selectedPeople.has(person.id)
                      )
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedPeople.has(person.id)}
                        onChange={() => {}}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{person.name}</h4>
                          {person.teamId && (
                            <Badge variant="outline" className="text-xs">
                              Previously assigned
                            </Badge>
                          )}
                        </div>
                        {person.email && (
                          <p className="text-xs text-gray-600">
                            {person.email}
                          </p>
                        )}
                        <div className="mt-1">
                          {getPersonSkillsDisplay(person)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPeople.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {showAssignedPeople
                        ? 'No people found'
                        : 'No unassigned people found'}
                    </p>
                    {(searchTerm ||
                      selectedDivision !== 'all' ||
                      selectedRole !== 'all' ||
                      skillsFilter) && (
                      <p className="text-sm">
                        Try adjusting your search or filter criteria
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Team Assignment */}
          <div className="space-y-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Assign to Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Filter Teams by Division
                    </label>
                    <Select
                      value={teamDivisionFilter}
                      onValueChange={setTeamDivisionFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All divisions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Divisions</SelectItem>
                        {divisions.map(division => (
                          <SelectItem key={division.id} value={division.id}>
                            {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Target Team
                    </label>
                    <Select
                      value={selectedTeam}
                      onValueChange={setSelectedTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {Array.from(teamsByDivision.entries()).map(
                          ([divisionKey, teamsInDivision]) => {
                            const divisionName =
                              divisionKey === 'no-division'
                                ? 'Unassigned Teams'
                                : getDivisionName(divisionKey, divisions);

                            return (
                              <div key={divisionKey}>
                                <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                  {divisionName}
                                </div>
                                {teamsInDivision.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{team.name}</span>
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs"
                                      >
                                        {team.capacity}h capacity
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            );
                          }
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignToTeam}
                      disabled={selectedPeople.size === 0 || !selectedTeam}
                      className="flex-1"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign {selectedPeople.size} People
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateTeamDialog(true)}
                      disabled={selectedPeople.size === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </div>
                </div>

                {/* Selected People Preview */}
                {selectedPeople.size > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Selected People
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Array.from(selectedPeople).map(personId => {
                        const person = people.find(p => p.id === personId);
                        return person ? (
                          <div
                            key={personId}
                            className="text-sm text-gray-600 flex items-center"
                          >
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            {person.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {people.filter(p => p.isActive && p.teamId).length}
                    </div>
                    <div className="text-sm text-gray-600">Assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {people.filter(p => p.isActive && !p.teamId).length}
                    </div>
                    <div className="text-sm text-gray-600">Unassigned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Team Dialog */}
        <Dialog
          open={showCreateTeamDialog}
          onOpenChange={setShowCreateTeamDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div className="text-sm text-gray-600">
                This team will be created with {selectedPeople.size} members
                {selectedDivision !== 'all' && (
                  <span>
                    {' '}
                    in the {getDivisionName(selectedDivision, divisions)}{' '}
                    division
                  </span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateTeamDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTeamWithPeople}>Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleTeamMapper;
