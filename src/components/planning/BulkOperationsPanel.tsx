import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  Square,
  Copy,
  Trash2,
  BarChart3,
  Users,
  Calendar,
} from 'lucide-react';
import { Team, Cycle, Epic, Project, RunWorkCategory } from '@/types';

export interface BulkSelection {
  teams: Set<string>;
  iterations: Set<number>;
}

interface BulkOperationsPanelProps {
  selection: BulkSelection;
  onSelectionChange: (selection: BulkSelection) => void;
  teams: Team[];
  iterations: Cycle[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  onBulkAllocate: (
    teamIds: string[],
    iterationNumbers: number[],
    allocation: {
      epicId?: string;
      runWorkCategoryId?: string;
      percentage: number;
    }
  ) => void;
  onBulkDelete: (teamIds: string[], iterationNumbers: number[]) => void;
  onBulkCopy: (
    sourceTeamId: string,
    sourceIteration: number,
    targetTeamIds: string[],
    targetIterations: number[]
  ) => void;
}

const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selection,
  onSelectionChange,
  teams,
  iterations,
  projects,
  epics,
  runWorkCategories,
  onBulkAllocate,
  onBulkDelete,
  onBulkCopy,
}) => {
  const [bulkPercentage, setBulkPercentage] = useState<string>('');
  const [selectedEpicId, setSelectedEpicId] = useState<string>('');
  const [selectedRunWorkCategoryId, setSelectedRunWorkCategoryId] =
    useState<string>('');
  const [copySource, setCopySource] = useState<{
    teamId: string;
    iteration: number;
  } | null>(null);

  const hasSelection =
    selection.teams.size > 0 && selection.iterations.size > 0;
  const selectionCount = selection.teams.size * selection.iterations.size;

  const toggleTeamSelection = (teamId: string) => {
    const newTeams = new Set(selection.teams);
    if (newTeams.has(teamId)) {
      newTeams.delete(teamId);
    } else {
      newTeams.add(teamId);
    }
    onSelectionChange({ ...selection, teams: newTeams });
  };

  const toggleIterationSelection = (iterationNumber: number) => {
    const newIterations = new Set(selection.iterations);
    if (newIterations.has(iterationNumber)) {
      newIterations.delete(iterationNumber);
    } else {
      newIterations.add(iterationNumber);
    }
    onSelectionChange({ ...selection, iterations: newIterations });
  };

  const selectAllTeams = () => {
    onSelectionChange({
      ...selection,
      teams: new Set(teams.map(t => t.id)),
    });
  };

  const selectAllIterations = () => {
    onSelectionChange({
      ...selection,
      iterations: new Set(iterations.map((_, index) => index + 1)),
    });
  };

  const clearSelection = () => {
    onSelectionChange({ teams: new Set(), iterations: new Set() });
    setCopySource(null);
  };

  const handleBulkAllocate = () => {
    if (!hasSelection || !bulkPercentage) return;

    const percentage = parseInt(bulkPercentage);
    if (isNaN(percentage) || percentage <= 0) return;

    onBulkAllocate(
      Array.from(selection.teams),
      Array.from(selection.iterations),
      {
        epicId: selectedEpicId || undefined,
        runWorkCategoryId: selectedRunWorkCategoryId || undefined,
        percentage,
      }
    );

    // Reset form
    setBulkPercentage('');
    setSelectedEpicId('');
    setSelectedRunWorkCategoryId('');
  };

  const handleBulkDelete = () => {
    if (!hasSelection) return;
    onBulkDelete(Array.from(selection.teams), Array.from(selection.iterations));
  };

  const handleSetCopySource = () => {
    if (selection.teams.size === 1 && selection.iterations.size === 1) {
      setCopySource({
        teamId: Array.from(selection.teams)[0],
        iteration: Array.from(selection.iterations)[0],
      });
    }
  };

  const handleBulkCopy = () => {
    if (!copySource || !hasSelection) return;
    onBulkCopy(
      copySource.teamId,
      copySource.iteration,
      Array.from(selection.teams),
      Array.from(selection.iterations)
    );
    setCopySource(null);
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-orange-500" />
            <span>Bulk Operations</span>
          </div>
          {hasSelection && (
            <Badge variant="secondary">
              {selectionCount} cell{selectionCount !== 1 ? 's' : ''} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Teams</Label>
            <div className="space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllTeams}
                className="text-xs"
              >
                Select All
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => toggleTeamSelection(team.id)}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs border transition-colors ${
                  selection.teams.has(team.id)
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {selection.teams.has(team.id) ? (
                  <CheckSquare className="h-3 w-3" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
                <span>{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Iteration Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Iterations</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllIterations}
              className="text-xs"
            >
              Select All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {iterations.map((iteration, index) => (
              <button
                key={iteration.id}
                onClick={() => toggleIterationSelection(index + 1)}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs border transition-colors ${
                  selection.iterations.has(index + 1)
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {selection.iterations.has(index + 1) ? (
                  <CheckSquare className="h-3 w-3" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
                <span>Iter {index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Allocation */}
        {hasSelection && (
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium">Bulk Allocation</Label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Percentage</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={bulkPercentage}
                  onChange={e => setBulkPercentage(e.target.value)}
                  className="text-sm"
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkPercentage('50')}
                  className="text-xs px-2"
                >
                  50%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkPercentage('75')}
                  className="text-xs px-2"
                >
                  75%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkPercentage('100')}
                  className="text-xs px-2"
                >
                  100%
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Epic</Label>
              <Select value={selectedEpicId} onValueChange={setSelectedEpicId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select epic (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {epics.map(epic => {
                    const project = projects.find(p => p.id === epic.projectId);
                    return (
                      <SelectItem key={epic.id} value={epic.id}>
                        {project?.name} - {epic.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Run Work Category</Label>
              <Select
                value={selectedRunWorkCategoryId}
                onValueChange={setSelectedRunWorkCategoryId}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {runWorkCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleBulkAllocate}
                disabled={
                  !bulkPercentage ||
                  (!selectedEpicId && !selectedRunWorkCategoryId)
                }
                size="sm"
                className="flex-1"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Allocate
              </Button>

              <Button variant="outline" onClick={handleBulkDelete} size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Copy Operations */}
        {hasSelection && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm font-medium">Copy Operations</Label>
            <div className="flex space-x-2">
              {!copySource ? (
                <Button
                  variant="outline"
                  onClick={handleSetCopySource}
                  disabled={
                    selection.teams.size !== 1 ||
                    selection.iterations.size !== 1
                  }
                  size="sm"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Set Copy Source
                </Button>
              ) : (
                <>
                  <div className="text-xs text-gray-600 flex-1 self-center">
                    Source: {teams.find(t => t.id === copySource.teamId)?.name}{' '}
                    / Iter {copySource.iteration}
                  </div>
                  <Button onClick={handleBulkCopy} size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Paste
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCopySource(null)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Clear Selection */}
        {hasSelection && (
          <Button
            variant="ghost"
            onClick={clearSelection}
            size="sm"
            className="w-full"
          >
            Clear Selection
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkOperationsPanel;
