
import React from 'react';
import { Milestone } from '@/types';
import { format } from 'date-fns';
import { CheckCircle, Zap, Clock, AlertCircle } from 'lucide-react';

const getStatusIcon = (status: Milestone['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'in-progress': return <Zap className="h-5 w-5 text-blue-500" />;
    case 'at-risk': return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'not-started': return <Clock className="h-5 w-5 text-gray-500" />;
    default: return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
        case 'completed': return 'text-green-700';
        case 'in-progress': return 'text-blue-700';
        case 'at-risk': return 'text-red-700';
        case 'not-started': return 'text-gray-700';
        default: return 'text-gray-700';
    }
}

const MilestoneTimeline: React.FC<{ milestones: Milestone[] }> = ({ milestones }) => {
  if (!milestones || milestones.length === 0) {
    return <p className="text-center text-gray-500 py-4">No milestones for this project.</p>;
  }

  const sortedMilestones = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-4">
      {sortedMilestones.map((milestone, index) => (
        <div key={milestone.id} className="flex items-start">
          <div className="flex flex-col items-center mr-4 pt-1">
            {getStatusIcon(milestone.status)}
            {index < sortedMilestones.length - 1 && <div className="w-px h-16 bg-gray-300 mt-1" />}
          </div>
          <div>
            <p className="font-semibold">{milestone.name}</p>
            <p className="text-sm text-gray-500">Due: {format(new Date(milestone.dueDate), 'PPP')}</p>
            <p className={`text-sm font-medium capitalize ${getStatusColor(milestone.status)}`}>
                Status: {milestone.status.replace('-', ' ')}
            </p>
            {milestone.status === 'completed' && milestone.actualCompletionDate && (
              <p className="text-sm text-green-600">Completed: {format(new Date(milestone.actualCompletionDate), 'PPP')}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MilestoneTimeline;
