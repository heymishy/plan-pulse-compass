
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Goal } from '@/types/goalTypes';
import { Plus, Eye, EyeOff } from 'lucide-react';
import InteractiveGoalNode from './InteractiveGoalNode';
import TimeBandBackground from './TimeBandBackground';
import GoalCreationModal from './GoalCreationModal';
import GoalContextMenu from './GoalContextMenu';
import GoalSplitDialog from './GoalSplitDialog';
import UnassignedZone from './UnassignedZone';
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions';

const nodeTypes = {
  goalNode: InteractiveGoalNode,
  timeBand: TimeBandBackground,
};

const InteractiveJourneyCanvas: React.FC = () => {
  const { goals, northStar, cycles, teams, updateGoal, addGoal } = useApp();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [creationPosition, setCreationPosition] = useState<{ x: number; y: number } | null>(null);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [goalToSplit, setGoalToSplit] = useState<Goal | null>(null);
  const [contextMenu, setContextMenu] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    goalId?: string 
  }>({ visible: false, x: 0, y: 0 });

  // Generate time band zones including unassigned
  const timeBands = useMemo(() => {
    const bands = cycles.map((cycle, index) => ({
      id: `timeband-${cycle.id}`,
      type: 'timeBand',
      position: { x: 0, y: index * 220 + 100 },
      data: {
        cycle,
        width: 1400,
        height: 200,
      },
      draggable: false,
      selectable: false,
    }));

    // Add unassigned zone
    bands.push({
      id: 'timeband-unassigned',
      type: 'timeBand',
      position: { x: 0, y: cycles.length * 220 + 100 },
      data: {
        cycle: {
          id: 'unassigned',
          name: 'Parking Zone',
          startDate: '',
          endDate: '',
        },
        width: 1400,
        height: 150,
        isUnassigned: true,
      },
      draggable: false,
      selectable: false,
    });

    return bands;
  }, [cycles]);

  // Filter goals by team
  const filteredGoals = useMemo(() => {
    if (selectedTeam === 'all') return goals;
    return goals.filter(goal => goal.ownerId === selectedTeam);
  }, [goals, selectedTeam]);

  // Generate goal nodes positioned within time bands
  const goalNodes = useMemo(() => {
    const nodes: Node[] = [];
    
    // Add North Star at the top
    if (northStar) {
      nodes.push({
        id: `north-star-${northStar.id}`,
        type: 'goalNode',
        position: { x: 700, y: 20 },
        data: {
          ...northStar,
          isNorthStar: true,
          confidence: 1.0,
          status: 'in-progress',
          timeFrame: northStar.timeHorizon,
        },
      });
    }

    // Position goals within their time bands
    const goalsByTimeFrame = new Map();
    filteredGoals.forEach(goal => {
      const timeFrame = goal.timeFrame || 'unassigned';
      if (!goalsByTimeFrame.has(timeFrame)) {
        goalsByTimeFrame.set(timeFrame, []);
      }
      goalsByTimeFrame.get(timeFrame).push(goal);
    });

    goalsByTimeFrame.forEach((goalsInFrame, timeFrame) => {
      const cycleIndex = timeFrame === 'unassigned' 
        ? cycles.length 
        : cycles.findIndex(c => c.id === timeFrame);
      
      const bandY = cycleIndex >= 0 ? cycleIndex * 220 + 150 : cycles.length * 220 + 150;
      
      goalsInFrame.forEach((goal: Goal, index: number) => {
        const offsetX = (index % 5) * 280 + 120;
        const offsetY = Math.floor(index / 5) * 100;
        
        nodes.push({
          id: `goal-${goal.id}`,
          type: 'goalNode',
          position: { x: offsetX, y: bandY + offsetY },
          data: {
            ...goal,
            isNorthStar: false,
            cycle: cycles.find(c => c.id === goal.timeFrame),
            canSplit: goal.status !== 'completed',
          },
        });
      });
    });

    return nodes;
  }, [filteredGoals, northStar, cycles]);

  const initialNodes = [...timeBands, ...goalNodes];

  // Generate dependency edges
  const initialEdges = useMemo(() => {
    if (!showDependencies) return [];
    
    const edges: Edge[] = [];

    // Connect goals to North Star
    if (northStar) {
      filteredGoals.forEach((goal) => {
        edges.push({
          id: `edge-goal-${goal.id}-to-north-star`,
          source: `goal-${goal.id}`,
          target: `north-star-${northStar.id}`,
          type: 'smoothstep',
          animated: goal.status === 'in-progress',
          style: { 
            stroke: goal.status === 'completed' ? '#22c55e' : '#64748b',
            strokeWidth: 2,
            opacity: 0.6,
          },
        });
      });
    }

    // Add dependency edges
    filteredGoals.forEach((goal) => {
      goal.dependencies.forEach((depId) => {
        if (filteredGoals.find(g => g.id === depId)) {
          edges.push({
            id: `edge-dep-${depId}-to-${goal.id}`,
            source: `goal-${depId}`,
            target: `goal-${goal.id}`,
            type: 'step',
            style: { 
              stroke: '#f59e0b',
              strokeWidth: 2,
              strokeDasharray: '5,5'
            },
          });
        }
      });
    });

    return edges;
  }, [filteredGoals, northStar, showDependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const {
    handleCanvasClick,
    handleNodeDrag,
    handleNodeContextMenu,
    handleConnection,
  } = useCanvasInteractions({
    setCreationModalOpen,
    setCreationPosition,
    setContextMenu,
    updateGoal,
    cycles,
  });

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      handleConnection(params);
      setEdges((eds) => addEdge(params, eds));
    },
    [handleConnection, setEdges]
  );

  const onNodeChange = useCallback(
    (changes: NodeChange[]) => {
      handleNodeDrag(changes);
      onNodesChange(changes);
    },
    [handleNodeDrag, onNodesChange]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const rect = (event.target as Element).getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      handleCanvasClick(position);
      setContextMenu({ visible: false, x: 0, y: 0 });
    },
    [handleCanvasClick]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      handleNodeContextMenu(event, node);
    },
    [handleNodeContextMenu]
  );

  const handleGoalCreation = useCallback(
    (goalData: Partial<Goal>) => {
      if (creationPosition) {
        // Determine time frame based on position
        const bandIndex = Math.floor((creationPosition.y - 100) / 220);
        let cycle;
        
        if (bandIndex >= cycles.length) {
          cycle = { id: 'unassigned' };
        } else {
          cycle = cycles[bandIndex];
        }
        
        addGoal({
          ...goalData,
          timeFrame: cycle?.id || cycles[0]?.id || '',
        } as any);
      }
      setCreationModalOpen(false);
      setCreationPosition(null);
    },
    [creationPosition, cycles, addGoal]
  );

  const handleGoalSplit = useCallback(
    (subGoals: Partial<Goal>[]) => {
      subGoals.forEach(subGoal => {
        addGoal(subGoal as any);
      });
    },
    [addGoal]
  );

  const handleParkGoal = useCallback(
    (goalId: string) => {
      updateGoal(goalId, { timeFrame: 'unassigned', status: 'not-started' });
    },
    [updateGoal]
  );

  const parkedGoalsCount = goals.filter(g => g.timeFrame === 'unassigned').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interactive Journey Canvas</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDependencies(!showDependencies)}
          >
            {showDependencies ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Dependencies
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMiniMap(!showMiniMap)}
          >
            {showMiniMap ? 'Hide' : 'Show'} MiniMap
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Click anywhere to create goals</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>•</span>
            <span>Drag goals between time bands</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>•</span>
            <span>Right-click for actions</span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '800px', position: 'relative' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodeChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={onPaneClick}
              onNodeContextMenu={onNodeContextMenu}
              nodeTypes={nodeTypes}
              fitView
              style={{ backgroundColor: '#fafafa' }}
              minZoom={0.2}
              maxZoom={1.5}
            >
              <Controls />
              <Background color="#e2e8f0" gap={16} />
              {showMiniMap && (
                <MiniMap 
                  zoomable 
                  pannable 
                  style={{
                    height: 120,
                    width: 200,
                    backgroundColor: '#f1f5f9',
                  }}
                />
              )}
            </ReactFlow>

            <UnassignedZone 
              onDrop={handleParkGoal}
              goalCount={parkedGoalsCount}
            />

            {contextMenu.visible && (
              <GoalContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                goalId={contextMenu.goalId}
                onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
                onSplit={(goalId) => {
                  const goal = goals.find(g => g.id === goalId);
                  if (goal) {
                    setGoalToSplit(goal);
                    setSplitDialogOpen(true);
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <GoalCreationModal
        open={creationModalOpen}
        onClose={() => setCreationModalOpen(false)}
        onSave={handleGoalCreation}
        position={creationPosition}
      />

      <GoalSplitDialog
        open={splitDialogOpen}
        onClose={() => setSplitDialogOpen(false)}
        parentGoal={goalToSplit}
        onSplit={handleGoalSplit}
      />
    </div>
  );
};

export default InteractiveJourneyCanvas;
