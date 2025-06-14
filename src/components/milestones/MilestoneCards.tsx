
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Calendar, AlertTriangle, CheckCircle, Clock, FolderOpen } from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { Milestone } from '@/types';

interface MilestoneWithProject extends Milestone {
  projectName: string;
  projectStatus: string;
}

interface MilestoneCardsProps {
  milestones: MilestoneWithProject[];
  onEditMilestone: (milestone: Milestone) => void;
}

const MilestoneCards: React.FC<MilestoneCardsProps> = ({ milestones, onEditMilestone }) => {
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

  const getDueDateStatus = (dueDate: string, status: Milestone['status']) => {
    if (status === 'completed') return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const nextWeek = addDays(now, 7);

    if (isPast(due)) {
      return { variant: 'destructive' as const, label: 'Overdue' };
    }
    
    if (isWithinInterval(due, { start: now, end: nextWeek })) {
      return { variant: 'outline' as const, label: 'Due Soon' };
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedMilestones.map((milestone) => {
        const dueDateStatus = getDueDateStatus(milestone.dueDate, milestone.status);
        
        return (
          <Card key={milestone.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{milestone.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMilestone(milestone)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(milestone.status)}
                {dueDateStatus && (
                  <Badge variant={dueDateStatus.variant}>
                    {dueDateStatus.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FolderOpen className="h-4 w-4" />
                <span>{milestone.projectName}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}</span>
              </div>
              
              {milestone.description && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {milestone.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MilestoneCards;
