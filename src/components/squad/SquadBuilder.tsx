import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Target,
  Users,
  Plus,
  Trash2,
  Edit,
  Crown,
  User,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle,
  Star,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  Squad,
  SquadMember,
  SquadType,
  SquadStatus,
  SquadMemberRole,
  UnmappedPerson,
} from '@/types';
import UnmappedPeople from './UnmappedPeople';

interface SquadBuilderProps {
  selectedSquad?: Squad;
  onSquadChange?: (squad: Squad) => void;
}

const SquadBuilder: React.FC<SquadBuilderProps> = ({
  selectedSquad,
  onSquadChange,
}) => {
  const {
    squads,
    squadMembers,
    people,
    addSquad,
    updateSquad,
    deleteSquad,
    addSquadMember,
    updateSquadMember,
    removeSquadMember,
    getSquadMembers,
    divisions,
    projects,
  } = useApp();

  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSquadData, setNewSquadData] = useState({
    name: '',
    description: '',
    type: 'project' as SquadType,
    status: 'planning' as SquadStatus,
    capacity: 5,
    divisionId: '',
    projectIds: [] as string[],
    targetSkills: [] as string[],
    duration: {
      start: '',
      end: '',
    },
  });

  const currentSquadMembers = selectedSquad
    ? getSquadMembers(selectedSquad.id)
    : [];

  const getSquadStatusColor = (status: SquadStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'planning':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'on-hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSquadTypeIcon = (type: SquadType) => {
    switch (type) {
      case 'project':
        return '🚀';
      case 'initiative':
        return '💡';
      case 'workstream':
        return '🔄';
      case 'feature-team':
        return '⚡';
      default:
        return '👥';
    }
  };

  const getRoleIcon = (role: SquadMemberRole) => {
    switch (role) {
      case 'lead':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'member':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'advisor':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'consultant':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleCreateSquad = () => {
    if (!newSquadData.name.trim()) return;

    const squadData = {
      ...newSquadData,
      targetSkills: [], // Will be populated later
    };

    addSquad(squadData);
    setIsCreateDialogOpen(false);
    setNewSquadData({
      name: '',
      description: '',
      type: 'project',
      status: 'planning',
      capacity: 5,
      divisionId: '',
      projectIds: [],
      targetSkills: [],
      duration: {
        start: '',
        end: '',
      },
    });
  };

  const handlePersonSelect = (person: UnmappedPerson) => {
    if (!selectedSquad) {
      // Create a new squad with this person
      setNewSquadData(prev => ({ ...prev, name: `${person.name}'s Squad` }));
      setIsCreateDialogOpen(true);
      return;
    }

    // Add person to the selected squad
    const memberData = {
      squadId: selectedSquad.id,
      personId: person.id,
      role: 'member' as SquadMemberRole,
      allocation: 100,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    addSquadMember(memberData);
  };

  const handleBulkAction = (action: string, people: UnmappedPerson[]) => {
    switch (action) {
      case 'assign-to-squad':
        if (!selectedSquad) return;

        people.forEach(person => {
          const memberData = {
            squadId: selectedSquad.id,
            personId: person.id,
            role: 'member' as SquadMemberRole,
            allocation: 100,
            startDate: new Date().toISOString().split('T')[0],
            isActive: true,
          };
          addSquadMember(memberData);
        });
        break;

      case 'create-squad':
        if (people.length > 0) {
          setNewSquadData(prev => ({
            ...prev,
            name: `${people[0].name}'s Team`,
            capacity: people.length + 2, // Add some buffer
          }));
          setIsCreateDialogOpen(true);
        }
        break;
    }
  };

  const handleRemoveMember = (memberId: string) => {
    removeSquadMember(memberId);
  };

  const getPersonName = (personId: string) => {
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown Person';
  };

  const calculateSquadHealth = (squad: Squad) => {
    const members = getSquadMembers(squad.id);
    const totalAllocation = members.reduce(
      (sum, member) => sum + member.allocation,
      0
    );
    const avgAllocation =
      members.length > 0 ? totalAllocation / members.length : 0;

    if (members.length === 0) return { score: 0, status: 'empty' };
    if (members.length < squad.capacity * 0.5)
      return { score: 30, status: 'understaffed' };
    if (avgAllocation < 50) return { score: 50, status: 'underutilized' };
    if (avgAllocation > 90) return { score: 90, status: 'excellent' };
    return { score: 75, status: 'good' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Squad List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Squads ({squads.length})
            </CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Squad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Squad</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Squad Name</Label>
                    <Input
                      id="name"
                      value={newSquadData.name}
                      onChange={e =>
                        setNewSquadData(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter squad name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newSquadData.type}
                      onValueChange={(value: SquadType) =>
                        setNewSquadData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="initiative">Initiative</SelectItem>
                        <SelectItem value="workstream">Workstream</SelectItem>
                        <SelectItem value="feature-team">
                          Feature Team
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newSquadData.status}
                      onValueChange={(value: SquadStatus) =>
                        setNewSquadData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Target Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newSquadData.capacity}
                      onChange={e =>
                        setNewSquadData(prev => ({
                          ...prev,
                          capacity: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="1"
                      max="20"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newSquadData.description}
                      onChange={e =>
                        setNewSquadData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the squad's purpose and goals"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newSquadData.duration.start}
                      onChange={e =>
                        setNewSquadData(prev => ({
                          ...prev,
                          duration: { ...prev.duration, start: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newSquadData.duration.end}
                      onChange={e =>
                        setNewSquadData(prev => ({
                          ...prev,
                          duration: { ...prev.duration, end: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSquad}>Create Squad</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {squads.map(squad => {
            const members = getSquadMembers(squad.id);
            const health = calculateSquadHealth(squad);
            const isSelected = selectedSquad?.id === squad.id;

            return (
              <Card
                key={squad.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onSquadChange?.(squad)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getSquadTypeIcon(squad.type)}
                    </span>
                    <div>
                      <h4 className="font-medium">{squad.name}</h4>
                      <p className="text-xs text-gray-600">{squad.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-white ${getSquadStatusColor(squad.status)}`}
                  >
                    {squad.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {members.length}/{squad.capacity}
                    </div>
                    <div className="flex items-center">
                      {health.status === 'excellent' && (
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      )}
                      {health.status === 'good' && (
                        <CheckCircle className="h-3 w-3 mr-1 text-blue-500" />
                      )}
                      {health.status === 'understaffed' && (
                        <AlertCircle className="h-3 w-3 mr-1 text-yellow-500" />
                      )}
                      {health.status === 'empty' && (
                        <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                      )}
                      <span className="text-xs">{health.status}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {squads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No squads created yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create your first squad
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Squad Details */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            {selectedSquad ? (
              <>
                <span className="text-lg mr-2">
                  {getSquadTypeIcon(selectedSquad.type)}
                </span>
                {selectedSquad.name}
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Select a Squad
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSquad ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">
                  {selectedSquad.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Squad Members ({currentSquadMembers.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentSquadMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <div>
                          <div className="font-medium text-sm">
                            {getPersonName(member.personId)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {member.role} • {member.allocation}% allocation
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {currentSquadMembers.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No members assigned</p>
                      <p className="text-xs">
                        Drag people from the right panel
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSquad.duration?.start && (
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        selectedSquad.duration.start
                      ).toLocaleDateString()}
                      {selectedSquad.duration.end && (
                        <>
                          {' '}
                          -{' '}
                          {new Date(
                            selectedSquad.duration.end
                          ).toLocaleDateString()}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a Squad</h3>
              <p className="text-sm">
                Choose a squad from the list to view details and manage members
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unmapped People */}
      <div className="lg:col-span-1">
        <UnmappedPeople
          onPersonSelect={handlePersonSelect}
          onBulkAction={handleBulkAction}
          maxHeight="max-h-[600px]"
        />
      </div>
    </div>
  );
};

export default SquadBuilder;
