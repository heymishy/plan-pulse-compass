import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types/goalTypes';
import { Target, User, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import GoalDialog from './GoalDialog';

const GoalsTable: React.FC = () => {
  const { goals, people, cycles } = useApp();

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'at-risk':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPersonName = (personId?: string) => {
    if (!personId) return 'Unassigned';
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown';
  };

  const getCycleName = (cycleId: string) => {
    const cycle = cycles.find(c => c.id === cycleId);
    return cycle?.name || 'Unknown';
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.metric.target === 0) return 0;
    const progress = (goal.metric.current / goal.metric.target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Goals</h2>
        <GoalDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Goal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Time Frame</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map(goal => (
            <TableRow key={goal.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{goal.title}</div>
                  {goal.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {goal.description}
                    </div>
                  )}
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Target className="h-3 w-3 mr-1" />
                    {goal.metric.target}
                    {goal.metric.unit}
                    {goal.metric.direction === 'increase' ? (
                      <TrendingUp className="h-3 w-3 ml-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 ml-1 text-red-500" />
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(goal.status)}>
                  {goal.status ? goal.status.replace('-', ' ') : 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress value={calculateProgress(goal)} className="w-20" />
                  <div className="text-xs text-gray-500">
                    {goal.metric.current} / {goal.metric.target}
                    {goal.metric.unit}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Progress value={goal.confidence * 100} className="w-16" />
                  <span className="text-sm">
                    {Math.round(goal.confidence * 100)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {getPersonName(goal.ownerId)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {getCycleName(goal.timeFrame)}
                </div>
              </TableCell>
              <TableCell>
                <GoalDialog
                  goal={goal}
                  trigger={
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
          {goals.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No goals created yet. Create your first goal to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default GoalsTable;
