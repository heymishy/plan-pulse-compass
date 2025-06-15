
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import React from 'react';

interface CanvasHeaderProps {
  showMiniMap: boolean;
  setShowMiniMap: (show: boolean) => void;
}

export const CanvasHeader = ({ showMiniMap, setShowMiniMap }: CanvasHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Canvas View</h1>
        <p className="text-gray-600">Interactive visualization of team and project relationships</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant={showMiniMap ? "default" : "outline"}
          size="sm"
          onClick={() => setShowMiniMap(!showMiniMap)}
        >
          {showMiniMap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          MiniMap
        </Button>
      </div>
    </div>
  );
};
