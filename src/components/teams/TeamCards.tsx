import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
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
import { Edit, Users, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamCardsProps {
  teams: Team[];
  onEditTeam: (teamId: string) => void;
}

const TeamCards: React.FC<TeamCardsProps> = ({ teams, onEditTeam }) => {
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

  const getProductOwnerName = (productOwnerId?: string) => {
    if (!productOwnerId) return 'No Product Owner';
    const productOwner = people.find(p => p.id === productOwnerId);
    return productOwner?.name || 'Unknown Product Owner';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const members = getTeamMembers(team.id);
          const utilizationPercentage = members.length > 0 ? 
            Math.round((members.length * 40 / team.capacity) * 100) : 0;
          
          return (
            <Card key={team.id} className="hover:shadow-md transition-shadow relative">
              <div className="absolute top-3 left-3">
                <Checkbox
                  checked={selectedTeams.has(team.id)}
                  onCheckedChange={(checked) => handleSelectTeam(team.id, checked as boolean)}
                  aria-label={`Select ${team.name}`}
                />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-12">
                <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTeam(team.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Division:</span>
                    <span>{getDivisionName(team.divisionId)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Product Owner:</span>
                    <span>{getProductOwnerName(team.productOwnerId)}</span>
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
                    <span className={`font-medium ${
                      utilizationPercentage > 100 ? 'text-red-600' :
                      utilizationPercentage > 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {utilizationPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        utilizationPercentage > 100 ? 'bg-red-500' :
                        utilizationPercentage > 80 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {members.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Team Members:</span>
                    <div className="flex flex-wrap gap-1">
                      {members.slice(0, 3).map(member => (
                        <Badge key={member.id} variant="outline" className="text-xs">
                          {member.name}
                        </Badge>
                      ))}
                      {members.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{members.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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

export default TeamCards;
