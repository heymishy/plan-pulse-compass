
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { Edit, Copy, Split, Archive, Link, Target } from 'lucide-react';

interface GoalContextMenuProps {
  x: number;
  y: number;
  goalId?: string;
  onClose: () => void;
}

const GoalContextMenu: React.FC<GoalContextMenuProps> = ({ x, y, goalId, onClose }) => {
  const { goals, updateGoal } = useApp();
  
  const goal = goalId ? goals.find(g => g.id === goalId) : null;

  const handleAction = (action: string) => {
    if (!goal) return;

    switch (action) {
      case 'edit':
        console.log('Edit goal:', goal.id);
        break;
      case 'clone':
        console.log('Clone goal:', goal.id);
        break;
      case 'split':
        console.log('Split goal:', goal.id);
        break;
      case 'archive':
        updateGoal(goal.id, { status: 'cancelled' });
        break;
      case 'link':
        console.log('Link to epic/project:', goal.id);
        break;
    }
    onClose();
  };

  return (
    <Card 
      className="absolute z-50 p-2 shadow-lg border bg-white min-w-[160px]"
      style={{ left: x, top: y }}
    >
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm"
          onClick={() => handleAction('edit')}
        >
          <Edit className="h-3 w-3 mr-2" />
          Edit Goal
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm"
          onClick={() => handleAction('clone')}
        >
          <Copy className="h-3 w-3 mr-2" />
          Clone Goal
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm"
          onClick={() => handleAction('split')}
        >
          <Split className="h-3 w-3 mr-2" />
          Split into Sub-goals
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm"
          onClick={() => handleAction('link')}
        >
          <Link className="h-3 w-3 mr-2" />
          Link to Epic
        </Button>

        <hr className="my-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm text-red-600 hover:text-red-700"
          onClick={() => handleAction('archive')}
        >
          <Archive className="h-3 w-3 mr-2" />
          Archive Goal
        </Button>
      </div>
    </Card>
  );
};

export default GoalContextMenu;
