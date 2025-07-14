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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Goal, JourneyCanvasConfig } from '@/types/goalTypes';
import { Star, Target, Users, Calendar } from 'lucide-react';

// Custom node component for goals
const GoalNode = ({ data }: { data: Goal }) => {
  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50';
      case 'at-risk':
        return 'border-yellow-500 bg-yellow-50';
      case 'cancelled':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getConfidenceRing = (confidence: number) => {
    const opacity = confidence;
    const color =
      confidence > 0.7 ? 'green' : confidence > 0.4 ? 'yellow' : 'red';
    return {
      boxShadow: `0 0 0 ${Math.round(confidence * 10)}px rgba(${
        color === 'green'
          ? '34, 197, 94'
          : color === 'yellow'
            ? '251, 191, 36'
            : '239, 68, 68'
      }, ${opacity * 0.3})`,
    };
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 min-w-[200px] ${getStatusColor(
        data.status
      )}`}
      style={getConfidenceRing(data.confidence)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {data.isNorthStar ? (
            <Star className="h-4 w-4 text-yellow-500 mr-2" />
          ) : (
            <Target className="h-4 w-4 text-blue-500 mr-2" />
          )}
          <span className="font-medium text-sm">{data.title}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {Math.round(data.confidence * 100)}%
        </Badge>
      </div>

      {data.metric && (
        <div className="text-xs text-gray-600 mb-2">
          {data.metric.current} / {data.metric.target}
          {data.metric.unit}
        </div>
      )}

      <div className="flex items-center text-xs text-gray-500">
        <Calendar className="h-3 w-3 mr-1" />
        {data.timeFrame}
      </div>
    </div>
  );
};

const nodeTypes = {
  goal: GoalNode,
};

const JourneyCanvasView: React.FC = () => {
  const { goals, northStar, teams, cycles } = useApp();
  const [canvasConfig, setCanvasConfig] = useState<JourneyCanvasConfig>({
    timeFrameFilter: [],
    teamFilter: [],
    projectFilter: [],
    showDependencies: true,
    showMetrics: true,
    viewMode: 'journey',
  });

  const [showMiniMap, setShowMiniMap] = useState(true);

  // Generate nodes from goals and north star
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];

    // Add North Star as central node
    if (northStar) {
      nodes.push({
        id: `north-star-${northStar.id}`,
        type: 'goal',
        position: { x: 400, y: 50 },
        data: {
          ...northStar,
          isNorthStar: true,
          confidence: 1.0,
          status: 'in-progress',
          timeFrame: northStar.timeHorizon,
        },
      });
    }

    // Add goal nodes in a radial pattern around North Star
    goals.forEach((goal, index) => {
      const angle = (index / goals.length) * 2 * Math.PI;
      const radius = 250;
      const x = 400 + Math.cos(angle) * radius;
      const y = 300 + Math.sin(angle) * radius;

      nodes.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        position: { x, y },
        data: {
          ...goal,
          isNorthStar: false,
          timeFrame:
            cycles.find(c => c.id === goal.timeFrame)?.name || goal.timeFrame,
        },
      });
    });

    return nodes;
  }, [goals, northStar, cycles]);

  // Generate edges for dependencies
  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];

    // Connect goals to North Star
    if (northStar) {
      goals.forEach(goal => {
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
    goals.forEach(goal => {
      (goal.dependencies || []).forEach(depId => {
        if (goals.find(g => g.id === depId)) {
          edges.push({
            id: `edge-dep-${depId}-to-${goal.id}`,
            source: `goal-${depId}`,
            target: `goal-${goal.id}`,
            type: 'step',
            style: {
              stroke: '#f59e0b',
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
          });
        }
      });
    });

    return edges;
  }, [goals, northStar]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Goal clicked:', node.data);
    // TODO: Show goal detail panel
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Journey Canvas</h2>
        <div className="flex items-center space-x-2">
          <Select
            value={canvasConfig.viewMode}
            onValueChange={value =>
              setCanvasConfig({
                ...canvasConfig,
                viewMode: value as JourneyCanvasConfig['viewMode'],
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="journey">Journey View</SelectItem>
              <SelectItem value="timeline">Timeline View</SelectItem>
              <SelectItem value="hierarchy">Hierarchy View</SelectItem>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              North Star
            </CardTitle>
          </CardHeader>
          <CardContent>
            {northStar ? (
              <div className="text-sm">{northStar.title}</div>
            ) : (
              <div className="text-xs text-gray-500">Not set</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {goals.filter(g => g.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Teams Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Set(goals.flatMap(g => g.dependencies || [])).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Time Frames
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Set(goals.map(g => g.timeFrame)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              style={{ backgroundColor: '#fafafa' }}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JourneyCanvasView;
