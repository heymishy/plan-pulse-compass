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
import { Edit2, Trash2, Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Division } from '@/types';

interface DivisionTableProps {
  divisions: Division[];
  onEditDivision: (divisionId: string) => void;
}

const DivisionTable: React.FC<DivisionTableProps> = ({
  divisions,
  onEditDivision,
}) => {
  const { teams, people, setDivisions } = useApp();
  const { toast } = useToast();
  const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getProductOwnerName = (productOwnerId?: string) => {
    if (!productOwnerId) return 'No Product Owner';
    const person = people.find(p => p.id === productOwnerId);
    return person?.name || 'Unknown Product Owner';
  };

  const getTeamCount = (divisionId: string) => {
    return teams.filter(team => team.divisionId === divisionId).length;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDivisions(new Set(divisions.map(division => division.id)));
    } else {
      setSelectedDivisions(new Set());
    }
  };

  const handleSelectDivision = (divisionId: string, checked: boolean) => {
    const newSelected = new Set(selectedDivisions);
    if (checked) {
      newSelected.add(divisionId);
    } else {
      newSelected.delete(divisionId);
    }
    setSelectedDivisions(newSelected);
  };

  const handleDeleteDivisions = () => {
    const divisionsToDelete = Array.from(selectedDivisions);

    // Remove teams from deleted divisions
    setDivisions(prev =>
      prev.filter(division => !divisionsToDelete.includes(division.id))
    );

    setSelectedDivisions(new Set());
    setShowDeleteDialog(false);

    toast({
      title: 'Success',
      description: `Deleted ${divisionsToDelete.length} division${divisionsToDelete.length !== 1 ? 's' : ''}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={
              selectedDivisions.size === divisions.length &&
              divisions.length > 0
            }
            onCheckedChange={handleSelectAll}
            aria-label="Select all divisions"
          />
          <span className="text-sm text-gray-600">
            {selectedDivisions.size} of {divisions.length} selected
          </span>
        </div>

        {selectedDivisions.size > 0 && (
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

      {/* Divisions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Division Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Product Owner</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {divisions.map(division => (
                  <TableRow key={division.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDivisions.has(division.id)}
                        onCheckedChange={checked =>
                          handleSelectDivision(division.id, checked as boolean)
                        }
                        aria-label={`Select ${division.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {division.name}
                    </TableCell>
                    <TableCell>{division.description || '-'}</TableCell>
                    <TableCell>
                      {getProductOwnerName(division.productOwnerId)}
                    </TableCell>
                    <TableCell>{getTeamCount(division.id)} teams</TableCell>
                    <TableCell>
                      {division.budget
                        ? `$${division.budget.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditDivision(division.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {divisions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No divisions found
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
            <AlertDialogTitle>Delete Divisions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDivisions.size} division
              {selectedDivisions.size !== 1 ? 's' : ''}? This action cannot be
              undone. Teams in these divisions will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDivisions}
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

export default DivisionTable;
