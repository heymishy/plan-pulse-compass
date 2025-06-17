
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Target, Trophy, Package } from 'lucide-react';

interface EpicsHeaderProps {
  onCreateEpic: () => void;
  onCreateRelease: () => void;
  showMvpLine: boolean;
  showReleaseLine: boolean;
  onToggleMvpLine: () => void;
  onToggleReleaseLine: () => void;
}

const EpicsHeader: React.FC<EpicsHeaderProps> = ({ 
  onCreateEpic, 
  onCreateRelease,
  showMvpLine,
  showReleaseLine,
  onToggleMvpLine,
  onToggleReleaseLine
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Epics</h1>
        <p className="text-gray-600">Manage epics across all projects</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button 
          variant={showMvpLine ? "default" : "outline"}
          size="sm"
          onClick={onToggleMvpLine}
        >
          <Target className="h-4 w-4 mr-2" />
          MVP Line
        </Button>
        <Button 
          variant={showReleaseLine ? "default" : "outline"}
          size="sm"
          onClick={onToggleReleaseLine}
        >
          <Trophy className="h-4 w-4 mr-2" />
          Release Line
        </Button>
        <Button variant="outline" onClick={onCreateRelease}>
          <Package className="h-4 w-4 mr-2" />
          New Release
        </Button>
        <Button onClick={onCreateEpic}>
          <Plus className="h-4 w-4 mr-2" />
          New Epic
        </Button>
      </div>
    </div>
  );
};

export default EpicsHeader;
