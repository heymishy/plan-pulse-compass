
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { Edit, Copy, Split, Archive, Link, Target, TrendingUp, Pause } from 'lucide-react';

interface GoalContextMenuProps {
  x: number;
  y: number;
  goalId?: string;
  onClose: () => void;
  onEdit?: (goalId: string) => void;
  onSplit?: (goalId: string) => void;
  onClone?: (goalId: string) => void;
}

const GoalContextMenu: React.FC<GoalContextMenuProps> = ({ 
  x, 
  y, 
  goalId, 
  onClose,
  onEdit,
  onSplit,
  onClone
}) => {
  const { goals, updateGoal } = useApp();
  
  const goal = goalId ? goals.find(g => g.id === goalId) : null;

  const handleAction = (action: string) => {
    if (!goal) return;

    switch (action) {
      case 'edit':
        onEdit?.(goal.id);
        break;
      case 'clone':
        onClone?.(goal.id);
        break;
      case 'split':
        onSplit?.(goal.id);
        break;
      case 'park':
        updateGoal(goal.id, { timeFrame: 'unassigned', status: 'not-started' });
        break;
      case 'complete':
        updateGoal(goal.id, { 
          status: 'completed',
          metric: { ...goal.metric, current: goal.metric.target }
        });
        break;
      case 'at-risk':
        updateGoal(goal.id, { status: 'at-risk', confidence: Math.min(goal.confidence, 0.4) });
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
      className="absolute z-50 p-2 shadow-lg border bg-white min-w-[180px]"
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
          Link to Epic/Project
        </Button>

        <hr className="my-1" />

        {goal?.status !== 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm text-green-600"
            onClick={() => handleAction('complete')}
          >
            <Target className="h-3 w-3 mr-2" />
            Mark Complete
          </Button>
        )}

        {goal?.status !== 'at-risk' && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm text-yellow-600"
            onClick={() => handleAction('at-risk')}
          >
            <TrendingUp className="h-3 w-3 mr-2" />
            Mark At Risk
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm text-blue-600"
          onClick={() => handleAction('park')}
        >
          <Pause className="h-3 w-3 mr-2" />
          Park Goal
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
