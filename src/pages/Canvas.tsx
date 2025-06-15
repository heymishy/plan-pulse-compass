
import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';

import { useCanvasData } from '../hooks/useCanvasData';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { CanvasControls } from '@/components/canvas/CanvasControls';
import { CanvasStats } from '@/components/canvas/CanvasStats';
import { CanvasLegend } from '@/components/canvas/CanvasLegend';

type ViewType = 'all' | 'teams-projects' | 'projects-epics' | 'team-allocations' | 'people-teams';

const Canvas = () => {
  const { teams, projects, divisions } = useApp();
  const [viewType, setViewType] = useState<ViewType>('all');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const { nodes: initialNodes, edges: initialEdges, stats } = useCanvasData({
    viewType,
    selectedDivision,
    selectedTeam,
    selectedProject,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="p-6 space-y-6">
      <CanvasHeader showMiniMap={showMiniMap} setShowMiniMap={setShowMiniMap} />
      
      <CanvasControls
        viewType={viewType}
        setViewType={setViewType}
        selectedDivision={selectedDivision}
        setSelectedDivision={setSelectedDivision}
        divisions={divisions}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        teams={teams}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        projects={projects}
      />

      <CanvasStats stats={stats} />

      <Card>
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              style={{ backgroundColor: '#f8fafc' }}
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

      <CanvasLegend />
    </div>
  );
};

export default Canvas;
