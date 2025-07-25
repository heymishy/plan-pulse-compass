import React, { useState } from 'react';
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
  UserPlus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Star,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Team, TeamMember } from '@/types';

interface TeamBuilderProps {
  selectedTeam?: Team;
  onTeamChange?: (team: Team) => void;
}

const TeamBuilder: React.FC<TeamBuilderProps> = ({
  selectedTeam,
  onTeamChange,
}) => {
  const {
    teams,
    teamMembers,
    people,
    addTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    getTeamMembers,
    divisions,
    projects,
  } = useApp();

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    description: '',
    type: 'project' as Team['type'],
    status: 'planning' as Team['status'],
    capacity: 40,
    divisionId: '',
    projectIds: [] as string[],
    targetSkills: [] as string[],
    duration: {
      start: '',
      end: '',
    },
  });

  const currentTeamMembers = selectedTeam
    ? getTeamMembers(selectedTeam.id)
    : [];

  const getTeamStatusColor = (status: Team['status']) => {
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

  const getTeamTypeIcon = (type: Team['type']) => {
    switch (type) {
      case 'project':
        return '🚀';
      case 'initiative':
        return '💡';
      case 'workstream':
        return '🔄';
      case 'feature-team':
        return '⚡';
      case 'permanent':
        return '🏢';
      default:
        return '👥';
    }
  };

  const getRoleIcon = (role: TeamMember['role']) => {
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

  const handleCreateTeam = () => {
    if (!newTeamData.name.trim()) return;

    const teamData = {
      ...newTeamData,
      targetSkills: [],
    };

    addTeam(teamData);
    setIsCreateDialogOpen(false);
    setNewTeamData({
      name: '',
      description: '',
      type: 'project',
      status: 'planning',
      capacity: 40,
      divisionId: '',
      projectIds: [],
      targetSkills: [],
      duration: {
        start: '',
        end: '',
      },
    });
  };

  // Person selection functionality has been moved to PeopleTeamMapper component

  const handleRemoveMember = (memberId: string) => {
    removeTeamMember(memberId);
  };

  const getPersonName = (personId: string) => {
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown Person';
  };

  const calculateTeamHealth = (team: Team) => {
    const members = getTeamMembers(team.id);
    const totalAllocation = members.reduce(
      (sum, member) => sum + member.allocation,
      0
    );
    const avgAllocation =
      members.length > 0 ? totalAllocation / members.length : 0;

    if (members.length === 0) return { score: 0, status: 'empty' };
    if (members.length * 40 < team.capacity * 0.5)
      return { score: 30, status: 'understaffed' };
    if (avgAllocation < 50) return { score: 50, status: 'underutilized' };
    if (avgAllocation > 90) return { score: 90, status: 'excellent' };
    return { score: 75, status: 'good' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Team List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Teams ({teams.length})
            </CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Team
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={newTeamData.name}
                      onChange={e =>
                        setNewTeamData(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newTeamData.type}
                      onValueChange={(value: Team['type']) =>
                        setNewTeamData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
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
                      value={newTeamData.status}
                      onValueChange={(value: Team['status']) =>
                        setNewTeamData(prev => ({ ...prev, status: value }))
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
                    <Label htmlFor="capacity">Weekly Capacity (hours)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newTeamData.capacity}
                      onChange={e =>
                        setNewTeamData(prev => ({
                          ...prev,
                          capacity: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="1"
                      max="400"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTeamData.description}
                      onChange={e =>
                        setNewTeamData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the team's purpose and goals"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newTeamData.duration.start}
                      onChange={e =>
                        setNewTeamData(prev => ({
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
                      value={newTeamData.duration.end}
                      onChange={e =>
                        setNewTeamData(prev => ({
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
                  <Button onClick={handleCreateTeam}>Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {teams.map(team => {
            const members = getTeamMembers(team.id);
            const health = calculateTeamHealth(team);
            const isSelected = selectedTeam?.id === team.id;

            return (
              <Card
                key={team.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onTeamChange?.(team)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getTeamTypeIcon(team.type)}
                    </span>
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-xs text-gray-600">{team.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-white ${getTeamStatusColor(team.status)}`}
                  >
                    {team.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {members.length} members
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

          {teams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No teams created yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create your first team
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Details */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            {selectedTeam ? (
              <>
                <span className="text-lg mr-2">
                  {getTeamTypeIcon(selectedTeam.type)}
                </span>
                {selectedTeam.name}
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Select a Team
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTeam ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">
                  {selectedTeam.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  Team Members ({currentTeamMembers.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentTeamMembers.map(member => (
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

                  {currentTeamMembers.length === 0 && (
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

              {selectedTeam.duration?.start && (
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        selectedTeam.duration.start
                      ).toLocaleDateString()}
                      {selectedTeam.duration.end && (
                        <>
                          {' '}
                          -{' '}
                          {new Date(
                            selectedTeam.duration.end
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
              <h3 className="text-lg font-medium mb-2">Select a Team</h3>
              <p className="text-sm">
                Choose a team from the list to view details and manage members
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* People Assignment */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              People Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>People mapping functionality</p>
              <p className="text-sm">Consolidated into Team management</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamBuilder;
