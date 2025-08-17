import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Team,
  Cycle,
  Allocation,
  Project,
  Epic,
  RunWorkCategory,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AllocationMatrixProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
}

const AllocationMatrix: React.FC<AllocationMatrixProps> = ({
  teams,
  iterations,
  allocations,
  projects,
  epics,
  runWorkCategories,
}) => {
  // Debug: Log allocation data received by AllocationMatrix
  console.log('🔍 [AllocationMatrix] Component rendered');
  console.log('🔍 [AllocationMatrix] Teams count:', teams?.length || 0);
  console.log(
    '🔍 [AllocationMatrix] Iterations count:',
    iterations?.length || 0
  );
  console.log(
    '🔍 [AllocationMatrix] Allocations count:',
    allocations?.length || 0
  );

  if (allocations && allocations.length > 0) {
    console.log('🔍 [AllocationMatrix] Sample allocations:');
    allocations.slice(0, 5).forEach((alloc, index) => {
      console.log(`  [${index}]:`, {
        id: alloc.id,
        teamId: alloc.teamId,
        cycleId: alloc.cycleId,
        percentage: alloc.percentage,
        notes: alloc.notes?.substring(0, 50),
      });
    });

    // Check specifically for Q2 2025 allocations
    const q2Allocations = allocations.filter(
      alloc =>
        alloc.notes?.includes('Quick allocation') ||
        alloc.notes?.includes('cards switch upgrade')
    );
    console.log(
      '🔍 [AllocationMatrix] Q2 2025 allocations found:',
      q2Allocations.length
    );
    q2Allocations.forEach((alloc, index) => {
      console.log(`  Q2[${index}]:`, {
        id: alloc.id,
        teamId: alloc.teamId,
        cycleId: alloc.cycleId,
        percentage: alloc.percentage,
        notes: alloc.notes,
      });
    });
  }

  const { setAllocations } = useApp();
  const { toast } = useToast();
  const [selectedAllocations, setSelectedAllocations] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getIterationNumber = (iteration: Cycle) => {
    const match = iteration.name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getAllocationName = (allocation: Allocation) => {
    if (allocation.epicId) {
      const epic = epics.find(e => e.id === allocation.epicId);
      const project = epic ? projects.find(p => p.id === epic.projectId) : null;
      return `${project?.name || 'Unknown'} - ${epic?.name || 'Unknown'}`;
    } else if (allocation.runWorkCategoryId) {
      const category = runWorkCategories.find(
        c => c.id === allocation.runWorkCategoryId
      );
      return category?.name || 'Unknown Category';
    }
    return 'Unknown Allocation';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAllocations(
        new Set(allocations.map(allocation => allocation.id))
      );
    } else {
      setSelectedAllocations(new Set());
    }
  };

  const handleSelectAllocation = (allocationId: string, checked: boolean) => {
    const newSelected = new Set(selectedAllocations);
    if (checked) {
      newSelected.add(allocationId);
    } else {
      newSelected.delete(allocationId);
    }
    setSelectedAllocations(newSelected);
  };

  const handleBulkDelete = () => {
    setAllocations(prevAllocations =>
      prevAllocations.filter(
        allocation => !selectedAllocations.has(allocation.id)
      )
    );

    toast({
      title: 'Allocations Deleted',
      description: `Successfully deleted ${selectedAllocations.size} allocation${selectedAllocations.size !== 1 ? 's' : ''}`,
    });

    setSelectedAllocations(new Set());
    setShowDeleteDialog(false);
  };

  const isAllSelected =
    allocations.length > 0 && selectedAllocations.size === allocations.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Allocation Matrix</CardTitle>
          {selectedAllocations.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-700">
                {selectedAllocations.size} allocation
                {selectedAllocations.size !== 1 ? 's' : ''} selected
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all allocations"
                  />
                </TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Work Item</TableHead>
                {iterations.map(iteration => (
                  <TableHead
                    key={iteration.id}
                    className="text-center min-w-24"
                  >
                    {iteration.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map(allocation => {
                const team = teams.find(t => t.id === allocation.teamId);
                return (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAllocations.has(allocation.id)}
                        onCheckedChange={checked =>
                          handleSelectAllocation(
                            allocation.id,
                            checked as boolean
                          )
                        }
                        aria-label={`Select allocation`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {team?.name || 'Unknown Team'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {getAllocationName(allocation)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(allocation.percentage)}% capacity
                        </Badge>
                      </div>
                    </TableCell>
                    {iterations.map(iteration => {
                      const iterationNumber = getIterationNumber(iteration);
                      const isCurrentIteration =
                        iterationNumber === allocation.iterationNumber;
                      return (
                        <TableCell key={iteration.id} className="text-center">
                          {isCurrentIteration ? (
                            <Badge variant="secondary">
                              {Math.round(allocation.percentage)}%
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              {allocations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3 + iterations.length}
                    className="text-center py-8 text-gray-500"
                  >
                    No allocations found for this quarter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Allocations</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedAllocations.size}{' '}
                allocation{selectedAllocations.size !== 1 ? 's' : ''}? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default AllocationMatrix;
