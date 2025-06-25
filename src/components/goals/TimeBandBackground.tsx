import React from 'react';
import { Calendar, Clock, Archive } from 'lucide-react';

interface TimeBandBackgroundProps {
  data: {
    cycle: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    };
    width: number;
    height: number;
    isUnassigned?: boolean;
  };
}

const TimeBandBackground: React.FC<TimeBandBackgroundProps> = ({ data }) => {
  const { cycle, width, height, isUnassigned } = data;
  
  const isCurrentCycle = () => {
    if (isUnassigned) return false;
    const now = new Date();
    const start = new Date(cycle.startDate);
    const end = new Date(cycle.endDate);
    return now >= start && now <= end;
  };

  if (isUnassigned) {
    return (
      <div 
        className="border-2 border-dashed rounded-lg p-4 pointer-events-none border-gray-400 bg-gray-100/40"
        style={{ width, height }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Archive className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-600">{cycle.name}</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Drop goals here to park them for later consideration
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-4 pointer-events-none transition-all
        ${isCurrentCycle() 
          ? 'border-blue-400 bg-blue-50/40 shadow-sm' 
          : 'border-gray-300 bg-gray-50/20'
        }
      `}
      style={{ width, height }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700">{cycle.name}</span>
          {isCurrentCycle() && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Current Cycle
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Drag goals here to assign to {cycle.name}
      </div>
    </div>
  );
};

export default TimeBandBackground;
