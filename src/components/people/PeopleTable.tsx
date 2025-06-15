
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Person } from '@/types';
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
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculatePersonCost } from '@/utils/financialCalculations';

interface PeopleTableProps {
  people: Person[];
  onEditPerson: (personId: string) => void;
}

const PeopleTable: React.FC<PeopleTableProps> = ({
  people,
  onEditPerson
}) => {
  const { setPeople, teams, roles, divisions } = useApp();
  const { toast } = useToast();
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPeople(new Set(people.map(person => person.id)));
    } else {
      setSelectedPeople(new Set());
    }
  };

  const handleSelectPerson = (personId: string, checked: boolean) => {
    const newSelected = new Set(selectedPeople);
    if (checked) {
      newSelected.add(personId);
    } else {
      newSelected.delete(personId);
    }
    setSelectedPeople(newSelected);
  };

  const handleBulkDelete = () => {
    setPeople(prevPeople => 
      prevPeople.filter(person => !selectedPeople.has(person.id))
    );

    toast({
      title: "People Deleted",
      description: `Successfully deleted ${selectedPeople.size} person${selectedPeople.size !== 1 ? 's' : ''}`,
    });

    setSelectedPeople(new Set());
    setShowDeleteDialog(false);
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  const getDivisionName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team?.divisionId) return '-';
    const division = divisions.find(d => d.id === team.divisionId);
    return division?.name || 'Unknown Division';
  };

  const getPersonCostInfo = (person: Person) => {
    const role = roles.find(r => r.id === person.roleId);
    if (!role) return '-';

    const costCalc = calculatePersonCost(person, role);
    
    if (person.employmentType === 'permanent') {
      const annualSalary = person.annualSalary || role.defaultAnnualSalary || 0;
      return `$${annualSalary.toLocaleString()}/year`;
    } else {
      if (person.contractDetails?.hourlyRate) {
        return `$${person.contractDetails.hourlyRate}/hour`;
      } else if (person.contractDetails?.dailyRate) {
        return `$${person.contractDetails.dailyRate}/day`;
      } else if (role.defaultHourlyRate) {
        return `$${role.defaultHourlyRate}/hour`;
      } else if (role.defaultDailyRate) {
        return `$${role.defaultDailyRate}/day`;
      }
      return `$${role.defaultRate}/hour`;
    }
  };

  const isAllSelected = people.length > 0 && selectedPeople.size === people.length;

  return (
    <div className="space-y-4">
      {selectedPeople.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedPeople.size} person{selectedPeople.size !== 1 ? 's' : ''} selected
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
                  aria-label="Select all people"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Compensation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPeople.has(person.id)}
                    onCheckedChange={(checked) => handleSelectPerson(person.id, checked as boolean)}
                    aria-label={`Select ${person.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>{getRoleName(person.roleId)}</TableCell>
                <TableCell>{getTeamName(person.teamId)}</TableCell>
                <TableCell>{getDivisionName(person.teamId)}</TableCell>
                <TableCell>
                  <Badge variant={person.employmentType === 'permanent' ? 'default' : 'secondary'}>
                    {person.employmentType}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {getPersonCostInfo(person)}
                </TableCell>
                <TableCell>
                  <Badge variant={person.isActive ? 'default' : 'secondary'}>
                    {person.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditPerson(person.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {people.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  No people found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete People</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPeople.size} person{selectedPeople.size !== 1 ? 's' : ''}? 
              This action cannot be undone.
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

export default PeopleTable;
