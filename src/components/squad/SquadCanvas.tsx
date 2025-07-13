import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize,
  Users,
  Target,
  Zap,
  Network,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Squad, SquadMember, Person } from '@/types';

interface CanvasNode {
  id: string;
  type: 'squad' | 'person' | 'skill';
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
  data: Squad | Person | { name: string; count: number };
}

interface CanvasEdge {
  from: string;
  to: string;
  type: 'member' | 'skill' | 'collaboration';
  weight: number;
  color: string;
}

interface SquadCanvasProps {
  selectedSquad?: Squad;
  viewMode?: 'squads' | 'skills' | 'network';
}

const SquadCanvas: React.FC<SquadCanvasProps> = ({
  selectedSquad,
  viewMode = 'squads',
}) => {
  const { squads, squadMembers, people, getSquadMembers, getPersonSquads } =
    useApp();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<CanvasNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);

  // Helper functions
  const getSquadColor = (type: Squad['type']) => {
    switch (type) {
      case 'project':
        return '#3B82F6';
      case 'initiative':
        return '#8B5CF6';
      case 'workstream':
        return '#10B981';
      case 'feature-team':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lead':
        return '#F59E0B';
      case 'member':
        return '#3B82F6';
      case 'advisor':
        return '#10B981';
      case 'consultant':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  // Generate canvas data based on view mode
  const canvasData = useMemo(() => {
    const nodes: CanvasNode[] = [];
    const edges: CanvasEdge[] = [];

    if (viewMode === 'squads') {
      // Squad-centric view
      const targetSquads = selectedSquad ? [selectedSquad] : squads;

      targetSquads.forEach((squad, squadIndex) => {
        const members = getSquadMembers(squad.id);
        const squadNode: CanvasNode = {
          id: squad.id,
          type: 'squad',
          label: squad.name,
          x: 300 + (squadIndex % 3) * 200,
          y: 200 + Math.floor(squadIndex / 3) * 150,
          color: getSquadColor(squad.type),
          size: Math.max(30, Math.min(80, 30 + members.length * 5)),
          data: squad,
        };
        nodes.push(squadNode);

        // Add member nodes
        members.forEach((member, memberIndex) => {
          const person = people.find(p => p.id === member.personId);
          if (!person) return;

          const angle = (memberIndex / members.length) * 2 * Math.PI;
          const radius = squadNode.size + 60;

          const personNode: CanvasNode = {
            id: person.id,
            type: 'person',
            label: person.name,
            x: squadNode.x + Math.cos(angle) * radius,
            y: squadNode.y + Math.sin(angle) * radius,
            color: getRoleColor(member.role),
            size: 15 + (member.allocation / 100) * 10,
            data: person,
          };
          nodes.push(personNode);

          // Add edge from squad to person
          edges.push({
            from: squad.id,
            to: person.id,
            type: 'member',
            weight: member.allocation / 100,
            color: getRoleColor(member.role),
          });
        });
      });
    } else if (viewMode === 'skills') {
      // Skills network view
      const skillGroups = new Map<
        string,
        { people: Person[]; squads: Set<string> }
      >();

      // Collect skills data
      people.forEach(person => {
        person.skills?.forEach(skill => {
          if (!skillGroups.has(skill.skillName)) {
            skillGroups.set(skill.skillName, { people: [], squads: new Set() });
          }
          skillGroups.get(skill.skillName)!.people.push(person);

          // Find squads this person is in
          const personSquads = squadMembers.filter(
            m => m.personId === person.id
          );
          personSquads.forEach(sm => {
            skillGroups.get(skill.skillName)!.squads.add(sm.squadId);
          });
        });
      });

      // Create skill nodes
      let skillIndex = 0;
      skillGroups.forEach((group, skillName) => {
        const col = skillIndex % 4;
        const row = Math.floor(skillIndex / 4);

        const skillNode: CanvasNode = {
          id: `skill-${skillName}`,
          type: 'skill',
          label: skillName,
          x: 100 + col * 200,
          y: 100 + row * 150,
          color: '#8B5CF6',
          size: Math.max(20, Math.min(60, 20 + group.people.length * 3)),
          data: { name: skillName, count: group.people.length },
        };
        nodes.push(skillNode);

        // Add squad nodes and connections
        group.squads.forEach(squadId => {
          const squad = squads.find(s => s.id === squadId);
          if (!squad) return;

          let squadNode = nodes.find(n => n.id === squadId);
          if (!squadNode) {
            squadNode = {
              id: squadId,
              type: 'squad',
              label: squad.name,
              x: skillNode.x + (Math.random() - 0.5) * 150,
              y: skillNode.y + (Math.random() - 0.5) * 150,
              color: getSquadColor(squad.type),
              size: 25,
              data: squad,
            };
            nodes.push(squadNode);
          }

          edges.push({
            from: skillNode.id,
            to: squadId,
            type: 'skill',
            weight: 0.5,
            color: '#8B5CF6',
          });
        });

        skillIndex++;
      });
    } else if (viewMode === 'network') {
      // Network collaboration view
      const collaborationMap = new Map<string, Map<string, number>>();

      // Build collaboration matrix
      squads.forEach(squad => {
        const members = getSquadMembers(squad.id);
        members.forEach(member1 => {
          members.forEach(member2 => {
            if (member1.personId !== member2.personId) {
              if (!collaborationMap.has(member1.personId)) {
                collaborationMap.set(member1.personId, new Map());
              }
              const current =
                collaborationMap.get(member1.personId)!.get(member2.personId) ||
                0;
              collaborationMap
                .get(member1.personId)!
                .set(member2.personId, current + 1);
            }
          });
        });
      });

      // Create person nodes
      people.forEach((person, index) => {
        const personSquads = getPersonSquads(person.id);
        const col = index % 6;
        const row = Math.floor(index / 6);

        const personNode: CanvasNode = {
          id: person.id,
          type: 'person',
          label: person.name,
          x: 100 + col * 120,
          y: 100 + row * 120,
          color: personSquads.length > 0 ? '#10B981' : '#6B7280',
          size: Math.max(15, 15 + personSquads.length * 5),
          data: person,
        };
        nodes.push(personNode);
      });

      // Create collaboration edges
      collaborationMap.forEach((connections, fromPersonId) => {
        connections.forEach((strength, toPersonId) => {
          if (strength > 0) {
            edges.push({
              from: fromPersonId,
              to: toPersonId,
              type: 'collaboration',
              weight: Math.min(strength / 3, 1),
              color: `rgba(59, 130, 246, ${Math.min(strength / 3, 1)})`,
            });
          }
        });
      });
    }

    return { nodes, edges };
  }, [
    viewMode,
    selectedSquad,
    squads,
    squadMembers,
    people,
    getSquadMembers,
    getPersonSquads,
  ]);

  // Canvas drawing function
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panX, panY);

    // Draw edges first
    canvasData.edges.forEach(edge => {
      const fromNode = canvasData.nodes.find(n => n.id === edge.from);
      const toNode = canvasData.nodes.find(n => n.id === edge.to);

      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = edge.color;
      ctx.lineWidth = Math.max(1, edge.weight * 3);
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    canvasData.nodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isHovered) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Node icon
      ctx.fillStyle = '#fff';
      ctx.font = `${node.size / 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icon =
        node.type === 'squad' ? '🎯' : node.type === 'person' ? '👤' : '🔧';
      ctx.fillText(icon, node.x, node.y);

      // Node label
      if (isHovered || isSelected || zoom > 0.8) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.size + 15);
      }
    });

    ctx.restore();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom - panX;
    const y = (e.clientY - rect.top) / zoom - panY;

    // Check if clicking on a node
    const clickedNode = canvasData.nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
    } else {
      setSelectedNode(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    } else {
      const x = (e.clientX - rect.left) / zoom - panX;
      const y = (e.clientY - rect.top) / zoom - panY;

      const hoveredNode = canvasData.nodes.find(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        return distance <= node.size;
      });

      setHoveredNode(hoveredNode || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  };

  // Update canvas when data changes
  useEffect(() => {
    drawCanvas();
  }, [canvasData, zoom, panX, panY, hoveredNode, selectedNode]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawCanvas();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Squad Canvas -{' '}
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(-0.1)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Badge variant="outline">{Math.round(zoom * 100)}%</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div ref={containerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Node info panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-3 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{selectedNode.label}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>

            {selectedNode.type === 'squad' && (
              <div className="text-sm space-y-1">
                <div>Type: {(selectedNode.data as Squad).type}</div>
                <div>Status: {(selectedNode.data as Squad).status}</div>
                <div>Capacity: {(selectedNode.data as Squad).capacity}</div>
              </div>
            )}

            {selectedNode.type === 'person' && (
              <div className="text-sm space-y-1">
                <div>Email: {(selectedNode.data as Person).email}</div>
                <div>Role: {(selectedNode.data as Person).roleId}</div>
                <div>Team: {(selectedNode.data as Person).teamId}</div>
              </div>
            )}

            {selectedNode.type === 'skill' && (
              <div className="text-sm space-y-1">
                <div>People: {(selectedNode.data as any).count}</div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border rounded-lg shadow-lg p-3">
          <h5 className="font-medium mb-2">Legend</h5>
          <div className="space-y-1 text-xs">
            {viewMode === 'squads' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Project</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Initiative</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Workstream</span>
                </div>
              </>
            )}
            {viewMode === 'skills' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Skills</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Squads</span>
                </div>
              </>
            )}
            {viewMode === 'network' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Active member</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Unmapped</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SquadCanvas;
