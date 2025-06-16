import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Division } from '@/types';
import { Button } from '@/components/ui/button';
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

interface DivisionTableProps {
  divisions: Division[];
  onEditDivision: (divisionId: string) => void;
}

const DivisionTable: React.FC<DivisionTableProps> = ({
  divisions,
  onEditDivision
}) => {
  const { setDivisions, people, teams } = useApp();
  const { toast } = useToast();
  const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleBulkDelete = () => {
    setDivisions(prevDivisions => 
      prevDivisions.filter(division => !selectedDivisions.has(division.id))
    );

    toast({
      title: "Divisions Deleted",
      description: `Successfully deleted ${selectedDivisions.size} division${selectedDivisions.size !== 1 ? 's' : ''}`,
    });

    setSelectedDivisions(new Set());
    setShowDeleteDialog(false);
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'No manager';
    const manager = people.find(p => p.id === managerId);
    return manager?.name || 'Unknown';
  };

  const getProductOwnerName = (productOwnerId?: string) => {
    if (!productOwnerId) return 'No Product Owner';
    const productOwner = people.find(p => p.id === productOwnerId);
    return productOwner?.name || 'Unknown';
  };

  const getTeamCount = (divisionId: string) => {
    return teams.filter(team => team.divisionId === divisionId).length;
  };

  const isAllSelected = divisions.length > 0 && selectedDivisions.size === divisions.length;

  return (
    <div className="space-y-4">
      {selectedDivisions.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedDivisions.size} division{selectedDivisions.size !== 1 ? 's' : ''} selected
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
                  aria-label="Select all divisions"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Product Owner</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.map((division) => (
              <TableRow key={division.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedDivisions.has(division.id)}
                    onCheckedChange={(checked) => handleSelectDivision(division.id, checked as boolean)}
                    aria-label={`Select ${division.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{division.name}</TableCell>
                <TableCell>{division.description || '-'}</TableCell>
                <TableCell>{getProductOwnerName(division.productOwnerId)}</TableCell>
                <TableCell>{getTeamCount(division.id)} teams</TableCell>
                <TableCell>
                  {division.budget ? `$${division.budget.toLocaleString()}` : '-'}
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
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No divisions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Divisions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDivisions.size} division{selectedDivisions.size !== 1 ? 's' : ''}? 
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

export default DivisionTable;
