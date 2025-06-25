
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
  OnConnectStartParams,
  OnConnectEnd,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Goal } from '@/types/goalTypes';
import { Plus } from 'lucide-react';
import InteractiveGoalNode from './InteractiveGoalNode';
import TimeBandBackground from './TimeBandBackground';
import GoalCreationModal from './GoalCreationModal';
import GoalContextMenu from './GoalContextMenu';
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions';

const nodeTypes = {
  goalNode: InteractiveGoalNode,
  timeBand: TimeBandBackground,
};

const InteractiveJourneyCanvas: React.FC = () => {
  const { goals, northStar, cycles, teams, updateGoal, createGoal } = useApp();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [creationPosition, setCreationPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    goalId?: string 
  }>({ visible: false, x: 0, y: 0 });

  // Generate time band zones
  const timeBands = useMemo(() => {
    return cycles.map((cycle, index) => ({
      id: `timeband-${cycle.id}`,
      type: 'timeBand',
      position: { x: 0, y: index * 200 + 100 },
      data: {
        cycle,
        width: 1200,
        height: 180,
      },
      draggable: false,
      selectable: false,
    }));
  }, [cycles]);

  // Generate goal nodes positioned within time bands
  const goalNodes = useMemo(() => {
    const nodes: Node[] = [];
    
    // Add North Star at the top
    if (northStar) {
      nodes.push({
        id: `north-star-${northStar.id}`,
        type: 'goalNode',
        position: { x: 600, y: 20 },
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
    goals.forEach((goal, index) => {
      const cycleIndex = cycles.findIndex(c => c.id === goal.timeFrame);
      const bandY = cycleIndex >= 0 ? cycleIndex * 200 + 140 : 50;
      const offsetX = (index % 4) * 250 + 100;
      
      nodes.push({
        id: `goal-${goal.id}`,
        type: 'goalNode',
        position: { x: offsetX, y: bandY },
        data: {
          ...goal,
          isNorthStar: false,
          cycle: cycles.find(c => c.id === goal.timeFrame),
        },
      });
    });

    return nodes;
  }, [goals, northStar, cycles]);

  const initialNodes = [...timeBands, ...goalNodes];

  // Generate dependency edges
  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];

    // Connect goals to North Star
    if (northStar) {
      goals.forEach((goal) => {
        edges.push({
          id: `edge-goal-${goal.id}-to-north-star`,
          source: `goal-${goal.id}`,
          target: `north-star-${northStar.id}`,
          type: 'smoothstep',
          animated: goal.status === 'in-progress',
          style: { 
            stroke: goal.status === 'completed' ? '#22c55e' : '#64748b',
            strokeWidth: 2,
          },
        });
      });
    }

    // Add dependency edges
    goals.forEach((goal) => {
      goal.dependencies.forEach((depId) => {
        if (goals.find(g => g.id === depId)) {
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
  }, [goals, northStar]);

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
        const bandIndex = Math.floor((creationPosition.y - 100) / 200);
        const cycle = cycles[bandIndex];
        
        createGoal({
          ...goalData,
          timeFrame: cycle?.id || cycles[0]?.id || '',
        } as any);
      }
      setCreationModalOpen(false);
      setCreationPosition(null);
    },
    [creationPosition, cycles, createGoal]
  );

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
            onClick={() => setShowMiniMap(!showMiniMap)}
          >
            {showMiniMap ? 'Hide' : 'Show'} MiniMap
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Click anywhere on the canvas to create a new goal • Drag goals between time bands to reassign</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '700px', position: 'relative' }}>
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
              minZoom={0.3}
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

            {contextMenu.visible && (
              <GoalContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                goalId={contextMenu.goalId}
                onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
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
    </div>
  );
};

export default InteractiveJourneyCanvas;
