import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DivisionLeadershipRole } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface DivisionLeadershipFormProps {
  personId: string;
}

const LEADERSHIP_ROLE_TYPES = [
  { value: 'technical-delivery-lead', label: 'Technical Delivery Lead' },
  { value: 'people-leader', label: 'People Leader' },
  { value: 'solution-architect', label: 'Solution Architect' },
  { value: 'engineering-manager', label: 'Engineering Manager' },
  { value: 'principal-engineer', label: 'Principal Engineer' },
  { value: 'product-lead', label: 'Product Lead' },
  { value: 'operations-lead', label: 'Operations Lead' },
] as const;

const DivisionLeadershipForm: React.FC<DivisionLeadershipFormProps> = ({
  personId,
}) => {
  const {
    divisions,
    teams,
    divisionLeadershipRoles,
    addDivisionLeadershipRole,
    updateDivisionLeadershipRole,
    removeDivisionLeadershipRole,
    getDivisionLeadershipRoles,
  } = useApp();

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    divisionId: '',
    roleType: '' as DivisionLeadershipRole['roleType'],
    title: '',
    scope: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    supportsTeams: [] as string[],
    notes: '',
  });

  const personLeadershipRoles = getDivisionLeadershipRoles(personId);

  const handleAddRole = () => {
    if (!newRole.divisionId || !newRole.roleType || !newRole.title) {
      return;
    }

    addDivisionLeadershipRole({
      personId,
      divisionId: newRole.divisionId,
      roleType: newRole.roleType,
      title: newRole.title,
      scope: newRole.scope || undefined,
      startDate: newRole.startDate,
      endDate: newRole.endDate || undefined,
      isActive: true,
      supportsTeams:
        newRole.supportsTeams.length > 0 ? newRole.supportsTeams : undefined,
      notes: newRole.notes || undefined,
    });

    // Reset form
    setNewRole({
      divisionId: '',
      roleType: '' as DivisionLeadershipRole['roleType'],
      title: '',
      scope: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      supportsTeams: [],
      notes: '',
    });
    setIsAddingRole(false);
  };

  const handleUpdateRole = (
    roleId: string,
    updates: Partial<DivisionLeadershipRole>
  ) => {
    updateDivisionLeadershipRole(roleId, updates);
  };

  const handleRemoveRole = (roleId: string) => {
    removeDivisionLeadershipRole(roleId);
  };

  const getAvailableTeams = (divisionId: string) => {
    return teams.filter(team => team.divisionId === divisionId);
  };

  const handleTeamSelection = (
    teamId: string,
    checked: boolean,
    roleId?: string
  ) => {
    if (roleId) {
      // Update existing role
      const role = personLeadershipRoles.find(r => r.id === roleId);
      if (role) {
        const currentTeams = role.supportsTeams || [];
        const updatedTeams = checked
          ? [...currentTeams, teamId]
          : currentTeams.filter(id => id !== teamId);

        handleUpdateRole(roleId, {
          supportsTeams: updatedTeams.length > 0 ? updatedTeams : undefined,
        });
      }
    } else {
      // Update new role form
      setNewRole(prev => ({
        ...prev,
        supportsTeams: checked
          ? [...prev.supportsTeams, teamId]
          : prev.supportsTeams.filter(id => id !== teamId),
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Division Leadership Roles</h3>
        <Button
          onClick={() => setIsAddingRole(!isAddingRole)}
          size="sm"
          variant={isAddingRole ? 'secondary' : 'default'}
        >
          {isAddingRole ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </>
          )}
        </Button>
      </div>

      {/* Add new role form */}
      {isAddingRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Leadership Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="division">Division</Label>
                <Select
                  value={newRole.divisionId}
                  onValueChange={value =>
                    setNewRole(prev => ({
                      ...prev,
                      divisionId: value,
                      supportsTeams: [],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(division => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="roleType">Role Type</Label>
                <Select
                  value={newRole.roleType}
                  onValueChange={value =>
                    setNewRole(prev => ({
                      ...prev,
                      roleType: value as DivisionLeadershipRole['roleType'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEADERSHIP_ROLE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newRole.title}
                  onChange={e =>
                    setNewRole(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Senior Technical Lead"
                />
              </div>

              <div>
                <Label htmlFor="scope">Scope (Optional)</Label>
                <Input
                  id="scope"
                  value={newRole.scope}
                  onChange={e =>
                    setNewRole(prev => ({ ...prev, scope: e.target.value }))
                  }
                  placeholder="e.g., Platform Engineering"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newRole.startDate}
                  onChange={e =>
                    setNewRole(prev => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newRole.endDate}
                  onChange={e =>
                    setNewRole(prev => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {newRole.divisionId && (
              <div>
                <Label>Supported Teams</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {getAvailableTeams(newRole.divisionId).map(team => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-team-${team.id}`}
                        checked={newRole.supportsTeams.includes(team.id)}
                        onCheckedChange={checked =>
                          handleTeamSelection(team.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`new-team-${team.id}`}
                        className="text-sm font-normal"
                      >
                        {team.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newRole.notes}
                onChange={e =>
                  setNewRole(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes about this leadership role"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddRole} className="flex-1">
                Add Leadership Role
              </Button>
              <Button
                onClick={() => setIsAddingRole(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing leadership roles */}
      {personLeadershipRoles.length > 0 ? (
        <div className="space-y-3">
          {personLeadershipRoles.map(role => {
            const division = divisions.find(d => d.id === role.divisionId);
            const supportedTeams = teams.filter(t =>
              role.supportsTeams?.includes(t.id)
            );
            const roleTypeLabel =
              LEADERSHIP_ROLE_TYPES.find(t => t.value === role.roleType)
                ?.label || role.roleType;

            return (
              <Card key={role.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{role.title}</h4>
                        <Badge variant="outline">{roleTypeLabel}</Badge>
                        {!role.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <strong>Division:</strong>{' '}
                          {division?.name || 'Unknown'}
                        </div>
                        {role.scope && (
                          <div>
                            <strong>Scope:</strong> {role.scope}
                          </div>
                        )}
                        <div>
                          <strong>Duration:</strong> {role.startDate}
                          {role.endDate && ` - ${role.endDate}`}
                        </div>
                        {supportedTeams.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <strong>Supports:</strong>
                            <div className="flex flex-wrap gap-1">
                              {supportedTeams.map(team => (
                                <Badge
                                  key={team.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {team.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {role.notes && (
                          <div>
                            <strong>Notes:</strong> {role.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={role.isActive}
                        onCheckedChange={checked =>
                          handleUpdateRole(role.id, { isActive: checked })
                        }
                      />
                      <Button
                        onClick={() => handleRemoveRole(role.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !isAddingRole && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No leadership roles assigned</p>
            <p className="text-sm">
              Click "Add Role" to assign leadership responsibilities
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default DivisionLeadershipForm;
