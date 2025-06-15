
import React from 'react';
import { Epic } from '@/types';
import { format, differenceInDays, min, max, isValid } from 'date-fns';

interface EpicTimelineProps {
  epics: Epic[];
}

const getStatusColor = (status: Epic['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in-progress':
      return 'bg-blue-500';
    case 'not-started':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

const EpicTimeline: React.FC<EpicTimelineProps> = ({ epics }) => {
  const epicsWithDates = epics.filter(
    e => e.startDate && e.targetEndDate && isValid(new Date(e.startDate)) && isValid(new Date(e.targetEndDate))
  );

  if (epicsWithDates.length === 0) {
    return <p className="text-gray-500">No epics with defined start and end dates to display.</p>;
  }

  const allStartDates = epicsWithDates.map(e => new Date(e.startDate!));
  const allEndDates = epicsWithDates.map(e => new Date(e.targetEndDate!));

  const timelineStart = min(allStartDates);
  const timelineEnd = max(allEndDates);
  
  if (!isValid(timelineStart) || !isValid(timelineEnd)) {
     return <p className="text-gray-500">Could not determine timeline range from epic dates.</p>;
  }

  const totalDays = differenceInDays(timelineEnd, timelineStart);
  if (totalDays <= 0) {
      return (
          <ul className="list-disc list-inside text-sm">
              {epicsWithDates.map(epic => <li key={epic.id}>{epic.name} ({epic.status})</li>)}
          </ul>
      )
  }

  return (
    <div className="space-y-4 pt-2">
      {epicsWithDates
        .sort((a,b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
        .map(epic => {
          const epicStart = new Date(epic.startDate!);
          const epicEnd = new Date(epic.targetEndDate!);
          
          const startOffsetDays = differenceInDays(epicStart, timelineStart);
          let durationDays = differenceInDays(epicEnd, epicStart);
          if (durationDays < 1) durationDays = 1;

          const startPercentage = (startOffsetDays / totalDays) * 100;
          const widthPercentage = (durationDays / totalDays) * 100;

          return (
            <div key={epic.id}>
              <p className="text-sm font-medium truncate" title={epic.name}>{epic.name}</p>
              <div className="h-6 bg-gray-200 rounded mt-1 relative">
                <div
                  className={`h-full rounded ${getStatusColor(epic.status)} absolute`}
                  style={{
                    left: `${startPercentage}%`,
                    width: `${widthPercentage}%`,
                    minWidth: '4px',
                  }}
                  title={`${epic.name}: ${format(epicStart, 'PPP')} - ${format(epicEnd, 'PPP')}`}
                />
              </div>
            </div>
          );
      })}
    </div>
  );
};

export default EpicTimeline;
