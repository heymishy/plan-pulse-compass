
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle, Filter } from 'lucide-react';

const BulkRemovalSettings = () => {
  const { 
    cycles, teams, allocations, setAllocations, 
    actualAllocations, setActualAllocations,
    iterationReviews, setIterationReviews 
  } = useApp();
  const { toast } = useToast();
  
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedIterationNumber, setSelectedIterationNumber] = useState('');
  const [removalType, setRemovalType] = useState<'allocations' | 'tracking' | 'both'>('allocations');

  const quarterCycles = cycles.filter(c => c.type === 'quarterly');
  const iterations = selectedCycleId 
    ? cycles.filter(c => c.type === 'iteration' && c.parentCycleId === selectedCycleId)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    : [];

  const getRemovalStats = () => {
    let allocationsCount = 0;
    let actualAllocationsCount = 0;
    let iterationReviewsCount = 0;

    const filters = {
      cycleId: selectedCycleId || undefined,
      teamId: selectedTeamId || undefined,
      iterationNumber: selectedIterationNumber ? parseInt(selectedIterationNumber) : undefined
    };

    // Count allocations
    allocationsCount = allocations.filter(a => 
      (!filters.cycleId || a.cycleId === filters.cycleId) &&
      (!filters.teamId || a.teamId === filters.teamId) &&
      (!filters.iterationNumber || a.iterationNumber === filters.iterationNumber)
    ).length;

    // Count actual allocations
    actualAllocationsCount = actualAllocations.filter(a =>
      (!filters.cycleId || a.cycleId === filters.cycleId) &&
      (!filters.teamId || a.teamId === filters.teamId) &&
      (!filters.iterationNumber || a.iterationNumber === filters.iterationNumber)
    ).length;

    // Count iteration reviews
    iterationReviewsCount = iterationReviews.filter(r =>
      (!filters.cycleId || r.cycleId === filters.cycleId) &&
      (!filters.iterationNumber || r.iterationNumber === filters.iterationNumber)
    ).length;

    return { allocationsCount, actualAllocationsCount, iterationReviewsCount };
  };

  const stats = getRemovalStats();

  const handleBulkRemove = () => {
    const filters = {
      cycleId: selectedCycleId || undefined,
      teamId: selectedTeamId || undefined,
      iterationNumber: selectedIterationNumber ? parseInt(selectedIterationNumber) : undefined
    };

    let removedCount = 0;

    if (removalType === 'allocations' || removalType === 'both') {
      const remainingAllocations = allocations.filter(a => 
        !(!filters.cycleId || a.cycleId === filters.cycleId) ||
        !(!filters.teamId || a.teamId === filters.teamId) ||
        !(!filters.iterationNumber || a.iterationNumber === filters.iterationNumber)
      );
      removedCount += allocations.length - remainingAllocations.length;
      setAllocations(remainingAllocations);
    }

    if (removalType === 'tracking' || removalType === 'both') {
      const remainingActualAllocations = actualAllocations.filter(a =>
        !(!filters.cycleId || a.cycleId === filters.cycleId) ||
        !(!filters.teamId || a.teamId === filters.teamId) ||
        !(!filters.iterationNumber || a.iterationNumber === filters.iterationNumber)
      );
      removedCount += actualAllocations.length - remainingActualAllocations.length;
      setActualAllocations(remainingActualAllocations);

      const remainingIterationReviews = iterationReviews.filter(r =>
        !(!filters.cycleId || r.cycleId === filters.cycleId) ||
        !(!filters.iterationNumber || r.iterationNumber === filters.iterationNumber)
      );
      removedCount += iterationReviews.length - remainingIterationReviews.length;
      setIterationReviews(remainingIterationReviews);
    }

    toast({
      title: "Bulk Removal Complete",
      description: `Removed ${removedCount} items successfully.`,
    });

    // Reset form
    setSelectedCycleId('');
    setSelectedTeamId('');
    setSelectedIterationNumber('');
  };

  const getFilterDescription = () => {
    const parts = [];
    if (selectedCycleId) {
      const cycle = quarterCycles.find(c => c.id === selectedCycleId);
      parts.push(`Quarter: ${cycle?.name}`);
    }
    if (selectedTeamId) {
      const team = teams.find(t => t.id === selectedTeamId);
      parts.push(`Team: ${team?.name}`);
    }
    if (selectedIterationNumber) {
      parts.push(`Iteration: ${selectedIterationNumber}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'No filters applied - will remove ALL data';
  };

  const getRemovalDescription = () => {
    const { allocationsCount, actualAllocationsCount, iterationReviewsCount } = stats;
    const parts = [];
    
    if (removalType === 'allocations' || removalType === 'both') {
      if (allocationsCount > 0) parts.push(`${allocationsCount} planned allocations`);
    }
    
    if (removalType === 'tracking' || removalType === 'both') {
      if (actualAllocationsCount > 0) parts.push(`${actualAllocationsCount} actual allocations`);
      if (iterationReviewsCount > 0) parts.push(`${iterationReviewsCount} iteration reviews`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No matching data found';
  };

  const hasDataToRemove = () => {
    const { allocationsCount, actualAllocationsCount, iterationReviewsCount } = stats;
    if (removalType === 'allocations') return allocationsCount > 0;
    if (removalType === 'tracking') return actualAllocationsCount > 0 || iterationReviewsCount > 0;
    if (removalType === 'both') return allocationsCount > 0 || actualAllocationsCount > 0 || iterationReviewsCount > 0;
    return false;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Bulk Data Removal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={removalType} onValueChange={(value: 'allocations' | 'tracking' | 'both') => setRemovalType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allocations">Planned Allocations Only</SelectItem>
                  <SelectItem value="tracking">Tracking Data Only</SelectItem>
                  <SelectItem value="both">Both Allocations & Tracking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quarter (Optional)</Label>
              <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger>
                  <SelectValue placeholder="All quarters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All quarters</SelectItem>
                  {quarterCycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team (Optional)</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Iteration (Optional)</Label>
              <Select value={selectedIterationNumber} onValueChange={setSelectedIterationNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="All iterations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All iterations</SelectItem>
                  {iterations.map((iteration, index) => (
                    <SelectItem key={iteration.id} value={(index + 1).toString()}>
                      Iteration {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <h3 className="font-medium text-orange-800 mb-2">Preview</h3>
            <p className="text-sm text-orange-700 mb-2">
              <strong>Filters:</strong> {getFilterDescription()}
            </p>
            <p className="text-sm text-orange-700">
              <strong>Will remove:</strong> {getRemovalDescription()}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={!hasDataToRemove()}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Confirm Bulk Removal
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This action cannot be undone. You are about to permanently delete:</p>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="font-medium text-red-800">{getRemovalDescription()}</p>
                    <p className="text-sm text-red-600 mt-1">Filters: {getFilterDescription()}</p>
                  </div>
                  <p>Are you sure you want to proceed?</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkRemove} className="bg-red-600 hover:bg-red-700">
                  Delete Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="text-sm text-gray-600 space-y-1">
            <p>• Use filters to target specific data for removal</p>
            <p>• Leave filters empty to remove ALL data of the selected type</p>
            <p>• "Planned Allocations" removes team allocation percentages</p>
            <p>• "Tracking Data" removes actual allocations and iteration reviews</p>
            <p>• Always review the preview before confirming removal</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkRemovalSettings;
