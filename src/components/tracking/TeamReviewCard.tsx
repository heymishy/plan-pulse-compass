import React from 'react';
import { Team, Allocation, Project, Epic, RunWorkCategory, VarianceReasonType, IterationActualEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Trash2 } from 'lucide-react';

interface TeamReviewCardProps {
  team: Team;
  plannedAllocations: Allocation[];
  actualEntries: IterationActualEntry[];
  onActualEntriesChange: (entries: IterationActualEntry[]) => void;
  epics: Epic[];
  projects: Project[];
  runWorkCategories: RunWorkCategory[];
  getEpicName: (epicId: string) => string;
  getRunWorkCategoryName: (categoryId: string) => string;
}

const varianceReasons: { value: VarianceReasonType; label: string }[] = [
    { value: 'none', label: 'No reason' },
    { value: 'production-support', label: 'Production Support' },
    { value: 'scope-change', label: 'Scope Change' },
    { value: 'resource-unavailable', label: 'Resource Unavailable' },
    { value: 'technical-blocker', label: 'Technical Blocker' },
    { value: 'priority-shift', label: 'Priority Shift' },
    { value: 'other', label: 'Other' },
];

const TeamReviewCard: React.FC<TeamReviewCardProps> = ({
  team,
  plannedAllocations,
  actualEntries,
  onActualEntriesChange,
  epics,
  runWorkCategories,
  getEpicName,
}) => {
  const handleActualChange = (entryIndex: number, field: keyof IterationActualEntry, value: any) => {
    const updatedEntries = actualEntries.map((entry, index) => 
      index === entryIndex ? { ...entry, [field]: value } : entry
    );
    onActualEntriesChange(updatedEntries);
  };

  const addActualEntry = () => {
    onActualEntriesChange([
      ...actualEntries,
      { id: crypto.randomUUID(), actualPercentage: 0 }
    ]);
  };

  const removeActualEntry = (entryIndex: number) => {
    onActualEntriesChange(actualEntries.filter((_, index) => index !== entryIndex));
  };
  
  const autoPopulateFromPlanned = () => {
    const newEntries = plannedAllocations.map(p => ({
        id: crypto.randomUUID(),
        plannedAllocationId: p.id,
        actualPercentage: p.percentage,
        actualEpicId: p.epicId,
        actualRunWorkCategoryId: p.runWorkCategoryId,
    }));
    onActualEntriesChange(newEntries);
  };

  const totalActual = actualEntries.reduce((sum, entry) => sum + (entry.actualPercentage || 0), 0);
  const totalPlanned = plannedAllocations.reduce((sum, a) => sum + a.percentage, 0);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-gray-500" />
              <div>
                <CardTitle className="text-xl">{team.name}</CardTitle>
                <p className="text-sm text-gray-500">{team.capacity}h/week capacity</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Planned: {totalPlanned}%</Badge>
              <Badge variant={totalActual === 100 ? "default" : totalActual > 100 ? "destructive" : "secondary"}>
                Actual: {totalActual}%
              </Badge>
            </div>
          </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {plannedAllocations.length > 0 && (
          <div className="p-3 bg-gray-50/80 rounded border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Planned Allocations:</h4>
            <div className="space-y-1">
              {plannedAllocations.map(planned => (
                <div key={planned.id} className="text-sm text-gray-600 flex justify-between">
                  <span>{planned.epicId ? getEpicName(planned.epicId) : (planned.runWorkCategoryId && runWorkCategories.find(c => c.id === planned.runWorkCategoryId)?.name) || 'Unknown'}</span>
                  <span>{planned.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Actual Allocations:</h4>
          {actualEntries.map((entry, entryIndex) => (
            <div key={entry.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded bg-white">
                <div className="col-span-12 sm:col-span-2">
                    <Input type="number" min="0" max="100" placeholder="%" value={entry.actualPercentage || ''}
                    onChange={(e) => handleActualChange(entryIndex, 'actualPercentage', parseFloat(e.target.value) || 0)}/>
                </div>
                <div className="col-span-12 sm:col-span-3">
                    <Select value={entry.actualEpicId || 'none'} 
                    onValueChange={(value) => {
                        handleActualChange(entryIndex, 'actualEpicId', value === 'none' ? undefined : value);
                        if (value !== 'none') handleActualChange(entryIndex, 'actualRunWorkCategoryId', undefined);
                    }}>
                    <SelectTrigger><SelectValue placeholder="Select epic" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Epic</SelectItem>
                        {epics.map(epic => (
                        <SelectItem key={epic.id} value={epic.id}>{getEpicName(epic.id)}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="col-span-12 sm:col-span-3">
                    <Select value={entry.actualRunWorkCategoryId || 'none'}
                    onValueChange={(value) => {
                        handleActualChange(entryIndex, 'actualRunWorkCategoryId', value === 'none' ? undefined : value);
                        if (value !== 'none') handleActualChange(entryIndex, 'actualEpicId', undefined);
                    }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {runWorkCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="col-span-10 sm:col-span-3">
                    <Select value={entry.varianceReason || 'none'}
                    onValueChange={(value) => handleActualChange(entryIndex, 'varianceReason', value === 'none' ? undefined : value as VarianceReasonType)}>
                    <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
                    <SelectContent>
                        {varianceReasons.map(reason => (<SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={() => removeActualEntry(entryIndex)} disabled={actualEntries.length === 1 && entry.actualPercentage === 0}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addActualEntry}>+ Add Allocation</Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={autoPopulateFromPlanned}>Auto-fill from Planned</Button>
      </CardFooter>
    </Card>
  );
}

export default TeamReviewCard;
