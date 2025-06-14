
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit } from 'lucide-react';

interface TeamTableProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamTable: React.FC<TeamTableProps> = ({ teams, onEditTeam }) => {
  const { people, divisions, roles } = useApp();

  const getTeamMembers = (teamId: string) => {
    return people.filter(person => person.teamId === teamId && person.isActive);
  };

  const getDivisionName = (divisionId?: string) => {
    if (!divisionId) return 'No Division';
    const division = divisions.find(d => d.id === divisionId);
    return division?.name || 'Unknown Division';
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'No Manager';
    const manager = people.find(p => p.id === managerId);
    return manager?.name || 'Unknown Manager';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Division</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Utilization</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const members = getTeamMembers(team.id);
            const utilizationPercentage = members.length > 0 ? 
              Math.round((members.length * 40 / team.capacity) * 100) : 0;
            
            return (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{getDivisionName(team.divisionId)}</TableCell>
                <TableCell>{getManagerName(team.managerId)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>{team.capacity}h/week</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          utilizationPercentage > 100 ? 'bg-red-500' :
                          utilizationPercentage > 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {utilizationPercentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTeam(team.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamTable;
