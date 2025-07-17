import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Users, Calendar, Settings, Plus, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Team, TeamMember } from '@/types';
import {
  getTeamMembers,
  getNaturalProductOwner,
  getProductOwnerCandidates,
} from '@/utils/teamUtils';

interface EnhancedTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string | null;
}

const EnhancedTeamDialog: React.FC<EnhancedTeamDialogProps> = ({
  isOpen,
  onClose,
  teamId,
}) => {
  const {
    teams,
    addTeam,
    updateTeam,
    divisions,
    people,
    roles,
    projects,
    teamMembers,
    getTeamMembers: getTeamMembersFromContext,
  } = useApp();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'permanent' as Team['type'],
    status: 'active' as Team['status'],
    divisionId: '',
    productOwnerId: '',
    capacity: '40',
    targetSkills: [] as string[],
    projectIds: [] as string[],
    duration: { start: '', end: '' },
  });

  const [newSkill, setNewSkill] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = Boolean(teamId);

  // Get current team members from enhanced context
  const currentTeamMembers =
    isEditing && teamId ? getTeamMembersFromContext(teamId) : [];

  // Legacy support: Get team members from old utils for PO calculation
  const legacyTeamMembers =
    isEditing && teamId ? getTeamMembers(teamId, people) : [];

  // Get natural PO for the team
  const naturalPO =
    isEditing && teamId ? getNaturalProductOwner(teamId, people, roles) : null;

  // Get PO candidates (prioritizing natural PO)
  const poCandidates =
    isEditing && teamId ? getProductOwnerCandidates(teamId, people, roles) : [];

  useEffect(() => {
    if (isEditing && teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        // Auto-populate with team's natural Product Owner if one exists
        const autoProductOwnerId = naturalPO
          ? naturalPO.id
          : team.productOwnerId || '';

        setFormData({
          name: team.name,
          description: team.description || '',
          type: team.type || 'permanent',
          status: team.status || 'active',
          divisionId: team.divisionId || '',
          productOwnerId: autoProductOwnerId,
          capacity: team.capacity.toString(),
          targetSkills: team.targetSkills || [],
          projectIds: team.projectIds || [],
          duration: team.duration || { start: '', end: '' },
        });
      }
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'permanent',
        status: 'active',
        divisionId: '',
        productOwnerId: '',
        capacity: '40',
        targetSkills: [],
        projectIds: [],
        duration: { start: '', end: '' },
      });
    }
  }, [isEditing, teamId, teams, naturalPO]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      toast({
        title: 'Error',
        description: 'Capacity must be a positive number',
        variant: 'destructive',
      });
      return;
    }

    const teamData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      status: formData.status,
      divisionId:
        formData.divisionId === 'none' ? undefined : formData.divisionId,
      productOwnerId:
        formData.productOwnerId === 'none'
          ? undefined
          : formData.productOwnerId,
      capacity,
      targetSkills: formData.targetSkills,
      projectIds: formData.projectIds,
      duration: formData.duration.start ? formData.duration : undefined,
    };

    if (isEditing && teamId) {
      updateTeam(teamId, teamData);
      toast({
        title: 'Success',
        description: 'Team updated successfully',
      });
    } else {
      addTeam(teamData);
      toast({
        title: 'Success',
        description: 'Team created successfully',
      });
    }

    onClose();
  };

  const addTargetSkill = () => {
    if (newSkill.trim() && !formData.targetSkills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        targetSkills: [...prev.targetSkills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeTargetSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      targetSkills: prev.targetSkills.filter(s => s !== skill),
    }));
  };

  // Determine if the selected person is acting (not the natural PO from the team)
  const selectedPerson = formData.productOwnerId
    ? people.find(p => p.id === formData.productOwnerId)
    : null;
  const isActingProductOwner =
    selectedPerson && naturalPO && selectedPerson.id !== naturalPO.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEditing ? 'Edit Team' : 'Create New Team'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Skills & Goals
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({currentTeamMembers.length})
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto p-1">
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter team name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Team Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Team['type']) =>
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">🏢 Permanent</SelectItem>
                        <SelectItem value="project">🚀 Project</SelectItem>
                        <SelectItem value="initiative">
                          💡 Initiative
                        </SelectItem>
                        <SelectItem value="workstream">
                          🔄 Workstream
                        </SelectItem>
                        <SelectItem value="feature-team">
                          ⚡ Feature Team
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the team's purpose and goals"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Team['status']) =>
                        setFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">📋 Planning</SelectItem>
                        <SelectItem value="active">✅ Active</SelectItem>
                        <SelectItem value="completed">🎯 Completed</SelectItem>
                        <SelectItem value="on-hold">⏸️ On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Weekly Capacity (hours) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          capacity: e.target.value,
                        }))
                      }
                      placeholder="40"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    <Select
                      value={formData.divisionId}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, divisionId: value }))
                      }
                    >
                      <SelectTrigger id="division">
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
                      Product Owner{' '}
                      {isActingProductOwner && (
                        <span className="text-orange-600">(Acting)</span>
                      )}
                    </Label>
                    <Select
                      value={formData.productOwnerId}
                      onValueChange={value =>
                        setFormData(prev => ({
                          ...prev,
                          productOwnerId: value,
                        }))
                      }
                    >
                      <SelectTrigger id="productOwner">
                        <SelectValue placeholder="Select product owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Product Owner</SelectItem>
                        {poCandidates.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                            {person.id === naturalPO?.id ? ' (Team PO)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Target Skills</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Define the key skills this team needs to be effective
                    </p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        placeholder="Add a skill (e.g., React, Product Management)"
                        onKeyPress={e =>
                          e.key === 'Enter' &&
                          (e.preventDefault(), addTargetSkill())
                        }
                      />
                      <Button type="button" onClick={addTargetSkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.targetSkills.map(skill => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeTargetSkill(skill)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Associated Projects</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Link this team to specific projects they're working on
                    </p>
                    <Select
                      value=""
                      onValueChange={value => {
                        if (value && !formData.projectIds.includes(value)) {
                          setFormData(prev => ({
                            ...prev,
                            projectIds: [...prev.projectIds, value],
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects
                          .filter(p => !formData.projectIds.includes(p.id))
                          .map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.projectIds.map(projectId => {
                        const project = projects.find(p => p.id === projectId);
                        return project ? (
                          <Badge
                            key={projectId}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {project.name}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  projectIds: prev.projectIds.filter(
                                    id => id !== projectId
                                  ),
                                }))
                              }
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Team Duration</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set start and end dates for time-bound teams (optional for
                      permanent teams)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.duration.start}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            duration: {
                              ...prev.duration,
                              start: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.duration.end}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            duration: { ...prev.duration, end: e.target.value },
                          }))
                        }
                        min={formData.duration.start}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">Team Members</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentTeamMembers.length} active members
                      </p>
                    </div>
                    {isEditing && (
                      <Button type="button" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  {currentTeamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {currentTeamMembers.map(member => {
                        const person = people.find(
                          p => p.id === member.personId
                        );
                        if (!person) return null;

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{person.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {member.role} • {member.allocation}%
                                  allocation
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                member.role === 'lead' ? 'default' : 'secondary'
                              }
                            >
                              {member.role}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No team members assigned yet</p>
                      {isEditing && (
                        <p className="text-sm">
                          Add members after creating the team
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update' : 'Create'} Team
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedTeamDialog;
