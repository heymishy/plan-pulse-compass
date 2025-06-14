
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { Milestone } from '@/types';

interface MilestoneWithProject extends Milestone {
  projectName: string;
  projectStatus: string;
}

interface MilestoneTableProps {
  milestones: MilestoneWithProject[];
  onEditMilestone: (milestone: Milestone) => void;
}

const MilestoneTable: React.FC<MilestoneTableProps> = ({ milestones, onEditMilestone }) => {
  const getStatusBadge = (status: Milestone['status']) => {
    const statusConfig = {
      'not-started': { variant: 'secondary' as const, label: 'Not Started', icon: Clock },
      'in-progress': { variant: 'default' as const, label: 'In Progress', icon: Calendar },
      'completed': { variant: 'outline' as const, label: 'Completed', icon: CheckCircle },
      'at-risk': { variant: 'destructive' as const, label: 'At Risk', icon: AlertTriangle },
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProjectStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { variant: 'secondary' as const, label: 'Planning' },
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'outline' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDueDateStatus = (dueDate: string, status: Milestone['status']) => {
    if (status === 'completed') return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const nextWeek = addDays(now, 7);

    if (isPast(due)) {
      return <Badge variant="destructive" className="ml-2">Overdue</Badge>;
    }
    
    if (isWithinInterval(due, { start: now, end: nextWeek })) {
      return <Badge variant="outline" className="ml-2">Due Soon</Badge>;
    }
    
    return null;
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    // Sort by due date, with overdue first
    const aDate = new Date(a.dueDate);
    const bDate = new Date(b.dueDate);
    const now = new Date();
    
    const aOverdue = isPast(aDate) && a.status !== 'completed';
    const bOverdue = isPast(bDate) && b.status !== 'completed';
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Milestone Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMilestones.map((milestone) => (
            <TableRow key={milestone.id}>
              <TableCell className="font-medium">{milestone.name}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{milestone.projectName}</div>
                  {getProjectStatusBadge(milestone.projectStatus)}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(milestone.status)}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">
                      {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {getDueDateStatus(milestone.dueDate, milestone.status)}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm text-gray-600">
                  {milestone.description || 'No description'}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMilestone(milestone)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MilestoneTable;
