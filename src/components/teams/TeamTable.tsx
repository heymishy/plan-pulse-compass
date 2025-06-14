
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamTableProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamTable: React.FC<TeamTableProps> = ({ teams, onEditTeam }) => {
  const { people, divisions, setTeams, setPeople } = useApp();
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(new Set(teams.map(team => team.id)));
    } else {
      setSelectedTeams(new Set());
    }
  };

  const handleSelectTeam = (teamId: string, checked: boolean) => {
    const newSelected = new Set(selectedTeams);
    if (checked) {
      newSelected.add(teamId);
    } else {
      newSelected.delete(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const handleBulkDelete = () => {
    // Remove selected teams
    setTeams(prevTeams => prevTeams.filter(team => !selectedTeams.has(team.id)));
    
    // Update people to remove team assignments for deleted teams
    setPeople(prevPeople => 
      prevPeople.map(person => 
        selectedTeams.has(person.teamId || '') 
          ? { ...person, teamId: undefined }
          : person
      )
    );

    toast({
      title: "Teams Deleted",
      description: `Successfully deleted ${selectedTeams.size} team${selectedTeams.size !== 1 ? 's' : ''}`,
    });

    setSelectedTeams(new Set());
    setShowDeleteDialog(false);
  };

  const isAllSelected = teams.length > 0 && selectedTeams.size === teams.length;
  const isIndeterminate = selectedTeams.size > 0 && selectedTeams.size < teams.length;

  return (
    <div className="space-y-4">
      {selectedTeams.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all teams"
                />
              </TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedTeams.has(team.id)}
                      onCheckedChange={(checked) => handleSelectTeam(team.id, checked as boolean)}
                      aria-label={`Select ${team.name}`}
                    />
                  </TableCell>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teams</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''}? 
              This action cannot be undone. Team members will be unassigned from their teams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamTable;
