
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role, Team } from '@/types';

interface PersonRoleTeamFormProps {
  roleId: string;
  teamId: string;
  roles: Role[];
  teams: Team[];
  onRoleChange: (roleId: string) => void;
  onTeamChange: (teamId: string) => void;
}

const PersonRoleTeamForm: React.FC<PersonRoleTeamFormProps> = ({
  roleId,
  teamId,
  roles,
  teams,
  onRoleChange,
  onTeamChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Role</Label>
        <Select value={roleId} onValueChange={onRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Team</Label>
        <Select value={teamId} onValueChange={onTeamChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PersonRoleTeamForm;
