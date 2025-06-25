
import React from 'react';
import { Archive, Pause } from 'lucide-react';

interface UnassignedZoneProps {
  onDrop: (goalId: string) => void;
  goalCount: number;
}

const UnassignedZone: React.FC<UnassignedZoneProps> = ({ onDrop, goalCount }) => {
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const goalId = event.dataTransfer.getData('text/plain');
    if (goalId) {
      onDrop(goalId);
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 w-48 h-24 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50/80 backdrop-blur-sm flex flex-col items-center justify-center hover:border-gray-600 hover:bg-gray-100/80 transition-all duration-200 z-10"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center space-x-2 text-gray-600">
        <Archive className="h-4 w-4" />
        <Pause className="h-4 w-4" />
      </div>
      <div className="text-sm font-medium text-gray-700 mt-1">
        Parking Zone
      </div>
      {goalCount > 0 && (
        <div className="text-xs text-gray-500">
          {goalCount} parked goals
        </div>
      )}
    </div>
  );
};

export default UnassignedZone;
