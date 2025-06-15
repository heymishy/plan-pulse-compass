
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Team } from '@/types';
import { Users } from 'lucide-react';

interface TeamSelectorProps {
  selectedTeamId: string;
  teams: Team[];
  onTeamChange: (teamId: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeamId,
  teams,
  onTeamChange,
}) => {
  return (
    <div className="space-y-2">
      <Label>Team</Label>
      <Select value={selectedTeamId} onValueChange={onTeamChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map(team => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {team.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamSelector;
