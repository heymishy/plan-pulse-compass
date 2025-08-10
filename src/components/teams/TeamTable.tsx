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
import { Edit2, Trash2, Users, Clock, Target } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Team } from '@/types';
import {
  getTeamMembers,
  getDivisionName,
  calculateEmploymentTypePercentages,
  calculateRoleCompositionPercentages,
  getCleanProductOwnerName,
} from '@/utils/teamUtils';
import RoleComposition from './RoleComposition';

interface TeamTableProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamTable: React.FC<TeamTableProps> = ({ teams, onEditTeam }) => {
  const { people, divisions, setTeams, setPeople, roles, skills } = useApp();
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

      {/* Role Composition Legend */}
      <div className="flex items-center gap-6 text-xs border-b border-gray-200 pb-2">
        <span className="font-medium text-gray-700">Team Role Colors:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-blue-500 rounded-full"></div>
          <span>Primary</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-green-500 rounded-full"></div>
          <span>Secondary</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-purple-500 rounded-full"></div>
          <span>Support</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-orange-500 rounded-full"></div>
          <span>Other</span>
        </div>
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
                  <TableHead>Skills</TableHead>
                  <TableHead>Contract/Perm %</TableHead>
                  <TableHead>SE/QE Roles %</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map(team => {
                  const members = getTeamMembers(team.id, people);

                  // Calculate new metrics for issue #74
                  const employmentTypes = calculateEmploymentTypePercentages(
                    team.id,
                    people
                  );
                  const roleComposition = calculateRoleCompositionPercentages(
                    team.id,
                    people,
                    roles
                  );

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
                        {getCleanProductOwnerName(team, people, roles)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {members.length} member
                          {members.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {team.targetSkills && team.targetSkills.length > 0 ? (
                            team.targetSkills.slice(0, 3).map(skillId => {
                              const skill = (skills || []).find(
                                s => s.id === skillId
                              );
                              return skill ? (
                                <Badge
                                  key={skillId}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {skill.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-gray-400">
                              No skills
                            </span>
                          )}
                          {team.targetSkills &&
                            team.targetSkills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{team.targetSkills.length - 3}
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">
                            {employmentTypes.permanentPercentage}% perm
                          </div>
                          <div className="text-xs text-gray-600">
                            {employmentTypes.contractorPercentage}% cont
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleComposition team={team} size="sm" />
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
