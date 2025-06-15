
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
  const getIterationNumber = (iteration: Cycle) => {
    const match = iteration.name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Team</TableHead>
            {iterations.map((iteration) => (
              <TableHead key={iteration.id} className="text-center">
                {iteration.name}
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
              {iterations.map((iteration) => {
                const iterationNumber = getIterationNumber(iteration);
                if (iterationNumber === 0) return <TableCell key={iteration.id}></TableCell>;
                return (
                  <TableCell key={iteration.id} className="text-center">
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
