
import { useCallback } from 'react';
import { Node, NodeChange, Connection } from '@xyflow/react';
import { Goal } from '@/types/goalTypes';

interface UseCanvasInteractionsProps {
  setCreationModalOpen: (open: boolean) => void;
  setCreationPosition: (position: { x: number; y: number } | null) => void;
  setContextMenu: (menu: { visible: boolean; x: number; y: number; goalId?: string }) => void;
  updateGoal: (goalId: string, goalData: Partial<Goal>) => void;
  cycles: Array<{ id: string; name: string }>;
}

export const useCanvasInteractions = ({
  setCreationModalOpen,
  setCreationPosition,
  setContextMenu,
  updateGoal,
  cycles,
}: UseCanvasInteractionsProps) => {

  const handleCanvasClick = useCallback((position: { x: number; y: number }) => {
    // Only open creation modal if clicked on empty canvas area
    setCreationPosition(position);
    setCreationModalOpen(true);
  }, [setCreationModalOpen, setCreationPosition]);

  const handleNodeDrag = useCallback((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.id.startsWith('goal-')) {
        // Determine which time band this goal was dropped into
        const yPosition = change.position.y;
        const bandIndex = Math.floor((yPosition - 100) / 200);
        const targetCycle = cycles[bandIndex];
        
        if (targetCycle) {
          console.log(`Goal ${change.id} moved to ${targetCycle.name}`);
          // Extract goal ID and update timeFrame
          const goalId = change.id.replace('goal-', '');
          updateGoal(goalId, { timeFrame: targetCycle.id });
        }
      }
    });
  }, [cycles, updateGoal]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('goal-') || node.id.startsWith('north-star-')) {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        goalId: node.id.replace('goal-', '').replace('north-star-', ''),
      });
    }
  }, [setContextMenu]);

  const handleConnection = useCallback((params: Connection) => {
    console.log('Creating dependency:', params);
    // Here you would create a dependency relationship between goals
  }, []);

  return {
    handleCanvasClick,
    handleNodeDrag,
    handleNodeContextMenu,
    handleConnection,
  };
};
