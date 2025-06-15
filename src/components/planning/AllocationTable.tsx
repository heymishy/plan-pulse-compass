
import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Team, Cycle } from '@/types';

interface AllocationTableProps {
  teams: Team[];
  iterations: Cycle[];
  workId: string;
  workData: { epicId?: string; runWorkCategoryId?: string };
  getCurrentValue: (teamId: string, iterationNumber: number, workId: string, epicId?: string, runWorkCategoryId?: string) => string;
  onPercentageChange: (teamId: string, iterationNumber: number, workId: string, value: string, workData: { epicId?: string; runWorkCategoryId?: string }) => void;
}

const AllocationTable: React.FC<AllocationTableProps> = ({
  teams,
  iterations,
  workId,
  workData,
  getCurrentValue,
  onPercentageChange,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Team</TableHead>
            {iterations.map((_, index) => (
              <TableHead key={index} className="text-center">
                Iteration {index + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map(team => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{team.name}</div>
                  <div className="text-xs text-gray-500">{team.capacity}h/week</div>
                </div>
              </TableCell>
              {iterations.map((_, index) => {
                const iterationNumber = index + 1;
                return (
                  <TableCell key={index} className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 text-center"
                      placeholder="%"
                      value={getCurrentValue(team.id, iterationNumber, workId, workData.epicId, workData.runWorkCategoryId)}
                      onChange={(e) => onPercentageChange(team.id, iterationNumber, workId, e.target.value, workData)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AllocationTable;
