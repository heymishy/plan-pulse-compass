import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Edit2, Trash2, Users, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Team } from '@/types';
import {
  getProductOwnerName,
  getTeamMembers,
  getDivisionName,
} from '@/utils/teamUtils';

interface TeamTableProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamTable: React.FC<TeamTableProps> = ({ teams, onEditTeam }) => {
  const { people, divisions, setTeams, setPeople, roles } = useApp();
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleDeleteTeams = () => {
    const teamsToDelete = Array.from(selectedTeams);

    // Remove people from deleted teams
    setPeople(prev =>
      prev.map(person =>
        teamsToDelete.includes(person.teamId || '')
          ? { ...person, teamId: undefined }
          : person
      )
    );

    // Remove teams
    setTeams(prev => prev.filter(team => !teamsToDelete.includes(team.id)));

    setSelectedTeams(new Set());
    setShowDeleteDialog(false);

    toast({
      title: 'Success',
      description: `Deleted ${teamsToDelete.length} team${teamsToDelete.length !== 1 ? 's' : ''}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={selectedTeams.size === teams.length && teams.length > 0}
            onCheckedChange={handleSelectAll}
            aria-label="Select all teams"
          />
          <span className="text-sm text-gray-600">
            {selectedTeams.size} of {teams.length} selected
          </span>
        </div>

        {selectedTeams.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        )}
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Product Owner</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map(team => {
                  const members = getTeamMembers(team.id, people);
                  const utilizationPercentage =
                    members.length > 0
                      ? Math.round(
                          ((members.length * 40) / team.capacity) * 100
                        )
                      : 0;

                  return (
                    <TableRow key={team.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTeams.has(team.id)}
                          onCheckedChange={checked =>
                            handleSelectTeam(team.id, checked as boolean)
                          }
                          aria-label={`Select ${team.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {getDivisionName(team.divisionId, divisions)}
                      </TableCell>
                      <TableCell>
                        {getProductOwnerName(team, people, roles)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {members.length} member
                          {members.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>{team.capacity}h/week</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                utilizationPercentage > 100
                                  ? 'bg-red-500'
                                  : utilizationPercentage > 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(utilizationPercentage, 100)}%`,
                              }}
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
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {teams.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No teams found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teams</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTeams.size} team
              {selectedTeams.size !== 1 ? 's' : ''}? This action cannot be
              undone. Team members will be unassigned from their teams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeams}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamTable;
