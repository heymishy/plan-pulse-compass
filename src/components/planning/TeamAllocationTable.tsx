
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Project, Epic, RunWorkCategory, Cycle } from '@/types';
import { X } from 'lucide-react';

interface TeamAllocationTableProps {
  iterations: Cycle[];
  teamEpics: Epic[];
  runWorkCategories: RunWorkCategory[];
  projects: Project[];
  selectedTeamId: string;
  getCurrentValue: (teamId: string, iterationNumber: number, workId: string, epicId?: string, runWorkCategoryId?: string) => string;
  onPercentageChange: (teamId: string, iterationNumber: number, workId: string, value: string, workData: { epicId?: string; runWorkCategoryId?: string }) => void;
  onRemoveEpic: (epicId: string) => void;
}

const TeamAllocationTable: React.FC<TeamAllocationTableProps> = ({
  iterations,
  teamEpics,
  runWorkCategories,
  projects,
  selectedTeamId,
  getCurrentValue,
  onPercentageChange,
  onRemoveEpic,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-64">Work Item</TableHead>
            {iterations.map((_, index) => (
              <TableHead key={index} className="text-center">
                Iteration {index + 1}
              </TableHead>
            ))}
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Team Selected Epics */}
          {teamEpics.map(epic => {
            const project = projects.find(p => p.id === epic.projectId);
            return (
              <TableRow key={`epic-${epic.id}`}>
                <TableCell className="font-medium">
                  <div>
                    <div className="text-blue-600 font-medium">{epic.name}</div>
                    <div className="text-xs text-gray-500">{project?.name} • Epic • {epic.estimatedEffort} points</div>
                  </div>
                </TableCell>
                {iterations.map((_, index) => {
                  const iterationNumber = index + 1;
                  const workId = `epic-${epic.id}`;
                  return (
                    <TableCell key={index} className="text-center">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className="w-20 text-center"
                        placeholder="%"
                        value={getCurrentValue(selectedTeamId, iterationNumber, workId, epic.id, undefined)}
                        onChange={(e) => onPercentageChange(selectedTeamId, iterationNumber, workId, e.target.value, { epicId: epic.id })}
                      />
                    </TableCell>
                  );
                })}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveEpic(epic.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Run Work Categories */}
          {runWorkCategories.map(category => (
            <TableRow key={`category-${category.id}`}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium" style={{ color: category.color }}>{category.name}</div>
                  <div className="text-xs text-gray-500">Run Work Category</div>
                </div>
              </TableCell>
              {iterations.map((_, index) => {
                const iterationNumber = index + 1;
                const workId = `category-${category.id}`;
                return (
                  <TableCell key={index} className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 text-center"
                      placeholder="%"
                      value={getCurrentValue(selectedTeamId, iterationNumber, workId, undefined, category.id)}
                      onChange={(e) => onPercentageChange(selectedTeamId, iterationNumber, workId, e.target.value, { runWorkCategoryId: category.id })}
                    />
                  </TableCell>
                );
              })}
              <TableCell>
                {/* Run work categories can't be removed */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamAllocationTable;
