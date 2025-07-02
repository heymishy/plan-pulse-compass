import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface TeamCardsProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamCards: React.FC<TeamCardsProps> = ({ teams, onEditTeam }) => {
  const { people, divisions, setTeams, setPeople, roles } = useApp();
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
            onCheckedChange={checked => {
              if (checked) {
                setSelectedTeams(new Set(teams.map(team => team.id)));
              } else {
                setSelectedTeams(new Set());
              }
            }}
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

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
          const members = getTeamMembers(team.id, people);
          const utilizationPercentage =
            members.length > 0
              ? Math.round(((members.length * 40) / team.capacity) * 100)
              : 0;

          return (
            <Card key={team.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTeams.has(team.id)}
                      onCheckedChange={checked =>
                        handleSelectTeam(team.id, checked as boolean)
                      }
                      aria-label={`Select ${team.name}`}
                    />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTeam(team.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Division:</span>
                    <span>{getDivisionName(team.divisionId, divisions)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Product Owner:</span>
                    <span>{getProductOwnerName(team, people, roles)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <Badge variant="secondary">
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{team.capacity}h/week</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="font-medium">
                      {utilizationPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
                </div>
              </CardContent>
            </Card>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No teams found</p>
          </div>
        )}
      </div>

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

export default TeamCards;
