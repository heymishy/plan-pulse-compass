import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Goal } from "@/types/goalTypes";
import { Plus, Eye, EyeOff } from "lucide-react";
import InteractiveGoalNode from "./InteractiveGoalNode";
import TimeBandBackground from "./TimeBandBackground";
import GoalCreationModal from "./GoalCreationModal";
import GoalContextMenu from "./GoalContextMenu";
import GoalSplitDialog from "./GoalSplitDialog";
import UnassignedZone from "./UnassignedZone";
import { useCanvasInteractions } from "../../hooks/useCanvasInteractions";

const nodeTypes = {
  goalNode: InteractiveGoalNode,
  timeBand: TimeBandBackground,
};

const InteractiveJourneyCanvas: React.FC = () => {
  const {
    goals,
    northStar,
    cycles,
    teams,
    divisions,
    updateGoal,
    addGoal,
    setNorthStar,
  } = useApp();
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [creationPosition, setCreationPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [goalToSplit, setGoalToSplit] = useState<Goal | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    goalId?: string;
  }>({ visible: false, x: 0, y: 0 });

  // Debug logging
  console.log("InteractiveJourneyCanvas - cycles:", cycles);
  console.log("InteractiveJourneyCanvas - teams:", teams);
  console.log("InteractiveJourneyCanvas - goals:", goals);

  // Create default cycles if none exist
  const effectiveCycles = useMemo(() => {
    if (cycles.length === 0) {
      console.log("No cycles found, creating default cycles");
      return [
        {
          id: "q1-2024",
          name: "Q1 2024",
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          type: "quarter" as const,
          status: "planning" as const,
        },
        {
          id: "q2-2024",
          name: "Q2 2024",
          startDate: "2024-04-01",
          endDate: "2024-06-30",
          type: "quarter" as const,
          status: "planning" as const,
        },
        {
          id: "q3-2024",
          name: "Q3 2024",
          startDate: "2024-07-01",
          endDate: "2024-09-30",
          type: "quarter" as const,
          status: "planning" as const,
        },
        {
          id: "q4-2024",
          name: "Q4 2024",
          startDate: "2024-10-01",
          endDate: "2024-12-31",
          type: "quarter" as const,
          status: "planning" as const,
        },
      ];
    }
    return cycles;
  }, [cycles]);

  // Generate time band zones including unassigned
  const timeBands = useMemo(() => {
    const bands = effectiveCycles.map((cycle, index) => ({
      id: `timeband-${cycle.id}`,
      type: "timeBand",
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
      id: "timeband-unassigned",
      type: "timeBand",
      position: { x: 0, y: effectiveCycles.length * 220 + 100 },
      data: {
        cycle: {
          id: "unassigned",
          name: "Parking Zone",
          startDate: "",
          endDate: "",
          type: "iteration" as const,
          status: "planning" as const,
        },
        width: 1400,
        height: 150,
        isUnassigned: true,
      },
      draggable: false,
      selectable: false,
    });

    return bands;
  }, [effectiveCycles]);

  // Filter goals based on selected team and division
  const filteredGoals = useMemo(() => {
    console.log(
      "InteractiveJourneyCanvas - selectedDivision:",
      selectedDivision
    );
    console.log("InteractiveJourneyCanvas - selectedTeam:", selectedTeam);
    console.log("InteractiveJourneyCanvas - all goals:", goals);
    console.log("InteractiveJourneyCanvas - all teams:", teams);
    console.log("InteractiveJourneyCanvas - all divisions:", divisions);

    // First, filter teams by division
    const teamsInDivision =
      selectedDivision === "all"
        ? teams
        : teams.filter((team) => team.divisionId === selectedDivision);

    console.log("InteractiveJourneyCanvas - teamsInDivision:", teamsInDivision);

    // Then, filter goals by team within the division
    if (selectedTeam === "all") {
      // If "all teams" is selected, show goals from all teams in the selected division
      const filtered = goals.filter((goal) => {
        if (!goal.ownerId) return true; // Goals without owners are shown
        const team = teamsInDivision.find((t) => t.id === goal.ownerId);
        return team !== undefined;
      });
      console.log(
        "InteractiveJourneyCanvas - filtered goals (all teams):",
        filtered
      );
      return filtered;
    } else {
      // Show goals from the specific selected team
      const filtered = goals.filter((goal) => goal.ownerId === selectedTeam);
      console.log(
        "InteractiveJourneyCanvas - filtered goals (specific team):",
        filtered
      );
      return filtered;
    }
  }, [goals, teams, selectedTeam, selectedDivision]);

  // Generate goal nodes positioned within time bands
  const goalNodes = useMemo(() => {
    console.log(
      "InteractiveJourneyCanvas - Creating goal nodes from filteredGoals:",
      filteredGoals
    );
    const nodes: Node[] = [];

    // Add North Star at the top
    if (northStar) {
      nodes.push({
        id: `north-star-${northStar.id}`,
        type: "goalNode",
        position: { x: 700, y: 20 },
        draggable: true,
        data: {
          ...northStar,
          isNorthStar: true,
          confidence: northStar.confidence || 1.0,
          status: northStar.status || "in-progress",
          timeFrame: northStar.timeHorizon,
          dependencies: northStar.dependencies || [],
          updatedDate: northStar.updatedDate || northStar.createdDate,
        },
      });
    }

    // Position goals within their time bands
    const goalsByTimeFrame = new Map();
    filteredGoals.forEach((goal) => {
      const timeFrame = goal.timeFrame || "unassigned";
      if (!goalsByTimeFrame.has(timeFrame)) {
        goalsByTimeFrame.set(timeFrame, []);
      }
      goalsByTimeFrame.get(timeFrame).push(goal);
    });

    console.log(
      "InteractiveJourneyCanvas - goalsByTimeFrame:",
      goalsByTimeFrame
    );

    goalsByTimeFrame.forEach((goalsInFrame, timeFrame) => {
      const cycleIndex =
        timeFrame === "unassigned"
          ? effectiveCycles.length
          : effectiveCycles.findIndex((c) => c.id === timeFrame);

      const bandY =
        cycleIndex >= 0
          ? cycleIndex * 220 + 150
          : effectiveCycles.length * 220 + 150;

      goalsInFrame.forEach((goal: Goal, index: number) => {
        const offsetX = (index % 5) * 280 + 120;
        const offsetY = Math.floor(index / 5) * 100;

        const node = {
          id: `goal-${goal.id}`,
          type: "goalNode",
          position: { x: offsetX, y: bandY + offsetY },
          draggable: true,
          data: {
            ...goal,
            isNorthStar: goal.isNorthStar || false,
            cycle: effectiveCycles.find((c) => c.id === goal.timeFrame),
            canSplit: goal.status !== "completed",
          },
        };
        console.log(
          "InteractiveJourneyCanvas - Creating node for goal:",
          goal.title,
          node
        );
        nodes.push(node);
      });
    });

    console.log(
      "InteractiveJourneyCanvas - Total nodes created:",
      nodes.length
    );
    return nodes;
  }, [filteredGoals, northStar, effectiveCycles]);

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
          type: "smoothstep",
          animated: goal.status === "in-progress",
          style: {
            stroke: goal.status === "completed" ? "#22c55e" : "#64748b",
            strokeWidth: 2,
            opacity: 0.6,
          },
        });
      });
    }

    // Add dependency edges
    filteredGoals.forEach((goal) => {
      (goal.dependencies || []).forEach((depId) => {
        if (filteredGoals.find((g) => g.id === depId)) {
          edges.push({
            id: `edge-dep-${depId}-to-${goal.id}`,
            source: `goal-${depId}`,
            target: `goal-${goal.id}`,
            type: "step",
            style: {
              stroke: "#f59e0b",
              strokeWidth: 2,
              strokeDasharray: "5,5",
            },
          });
        }
      });
    });

    return edges;
  }, [filteredGoals, northStar, showDependencies]);

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // Update nodes when goals change
  useEffect(() => {
    console.log(
      "InteractiveJourneyCanvas - Updating nodes due to goal changes"
    );
    console.log("InteractiveJourneyCanvas - New initialNodes:", initialNodes);
    setNodes(initialNodes);
  }, [goals, filteredGoals]);

  // Update edges when goals change
  useEffect(() => {
    console.log(
      "InteractiveJourneyCanvas - Updating edges due to goal changes"
    );
    console.log("InteractiveJourneyCanvas - New initialEdges:", initialEdges);
    setEdges(initialEdges);
  }, [goals, filteredGoals, showDependencies]);

  // Close context menu when modals open
  useEffect(() => {
    if (creationModalOpen || editModalOpen || splitDialogOpen) {
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  }, [creationModalOpen, editModalOpen, splitDialogOpen]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    console.log(
      "InteractiveJourneyCanvas - onNodesChange called with:",
      changes
    );
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    console.log(
      "InteractiveJourneyCanvas - onEdgesChange called with:",
      changes
    );
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

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
    cycles: effectiveCycles,
  });

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
      // Close context menu when clicking on empty canvas
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
      console.log(
        "InteractiveJourneyCanvas - handleGoalCreation called with:",
        goalData
      );
      console.log(
        "InteractiveJourneyCanvas - creationPosition:",
        creationPosition
      );

      if (creationPosition) {
        // Use the timeFrame from the modal if provided, otherwise determine from position
        let timeFrame = goalData.timeFrame;

        if (!timeFrame) {
          // Determine time frame based on position if not provided by modal
          const bandIndex = Math.floor((creationPosition.y - 100) / 220);
          let cycle;

          if (bandIndex >= effectiveCycles.length) {
            cycle = { id: "unassigned" };
          } else {
            cycle = effectiveCycles[bandIndex];
          }

          timeFrame = cycle?.id || effectiveCycles[0]?.id || "";
        }

        const finalGoalData = {
          ...goalData,
          timeFrame: timeFrame,
        };

        console.log(
          "InteractiveJourneyCanvas - Final goal data:",
          finalGoalData
        );
        addGoal(finalGoalData as any);
      }
      setCreationModalOpen(false);
      setCreationPosition(null);
    },
    [creationPosition, effectiveCycles, addGoal]
  );

  const handleGoalSplit = useCallback(
    (subGoals: Partial<Goal>[]) => {
      console.log("handleGoalSplit called with:", subGoals);
      subGoals.forEach((subGoal) => {
        console.log("Adding sub-goal:", subGoal);
        addGoal(subGoal as any);
      });
      console.log("Sub-goals added, closing split dialog");
      setSplitDialogOpen(false);
    },
    [addGoal]
  );

  const handleGoalEdit = useCallback(
    (goalData: Partial<Goal>) => {
      console.log(
        "InteractiveJourneyCanvas - handleGoalEdit called with:",
        goalData
      );
      if (goalToEdit) {
        // Check if it's a North Star goal
        if (goalToEdit.isNorthStar && northStar) {
          console.log("InteractiveJourneyCanvas - Updating North Star goal");
          const updatedNorthStar = {
            ...northStar,
            ...goalData,
            updatedDate: new Date().toISOString(),
          };
          setNorthStar(updatedNorthStar);
        } else {
          console.log("InteractiveJourneyCanvas - Updating regular goal");
          updateGoal(goalToEdit.id, goalData);
        }
      }
      setEditModalOpen(false);
      setGoalToEdit(null);
    },
    [goalToEdit, updateGoal, northStar, setNorthStar]
  );

  const handleParkGoal = useCallback(
    (goalId: string) => {
      updateGoal(goalId, { timeFrame: "unassigned", status: "not-started" });
    },
    [updateGoal]
  );

  const handleEditGoal = useCallback(
    (goalId: string) => {
      console.log(
        "InteractiveJourneyCanvas - handleEditGoal called with:",
        goalId
      );

      // Check if it's a North Star goal
      if (northStar && northStar.id === goalId) {
        console.log("InteractiveJourneyCanvas - Editing North Star goal");
        // Convert NorthStar to Goal-compatible format for editing
        const goalCompatibleNorthStar: Goal = {
          id: northStar.id,
          title: northStar.title,
          description: northStar.description,
          status: northStar.status || 'in-progress',
          confidence: northStar.confidence || 1.0,
          metric: northStar.metric,
          timeFrame: northStar.timeHorizon,
          dependencies: northStar.dependencies || [],
          createdDate: northStar.createdDate,
          updatedDate: northStar.updatedDate || northStar.createdDate,
          isNorthStar: true,
        };
        setGoalToEdit(goalCompatibleNorthStar);
        setEditModalOpen(true);
      } else {
        // Check regular goals
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
          console.log("InteractiveJourneyCanvas - Editing regular goal");
          setGoalToEdit(goal);
          setEditModalOpen(true);
        }
      }
      setContextMenu({ visible: false, x: 0, y: 0 });
    },
    [goals, northStar]
  );

  const handleCloneGoal = useCallback(
    (goalId: string) => {
      console.log(
        "InteractiveJourneyCanvas - handleCloneGoal called with:",
        goalId
      );
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        // Create a clone of the goal with a new ID
        const clonedGoal: Omit<Goal, "id" | "createdDate" | "updatedDate"> = {
          ...goal,
          title: `${goal.title} (Copy)`,
          status: "not-started",
          metric: { ...goal.metric, current: 0 },
        };
        console.log(
          "InteractiveJourneyCanvas - Creating cloned goal:",
          clonedGoal
        );
        addGoal(clonedGoal);
      }
      setContextMenu({ visible: false, x: 0, y: 0 });
    },
    [goals, addGoal]
  );

  const parkedGoalsCount = goals.filter(
    (g) => g.timeFrame === "unassigned"
  ).length;

  // Reset team selection when division changes
  useEffect(() => {
    setSelectedTeam("all");
  }, [selectedDivision]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interactive Journey Canvas</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((division) => (
                <SelectItem key={division.id} value={division.id}>
                  {division.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams
                .filter(
                  (team) =>
                    selectedDivision === "all" ||
                    team.divisionId === selectedDivision
                )
                .map((team) => (
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
            {showDependencies ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            Dependencies
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMiniMap(!showMiniMap)}
          >
            {showMiniMap ? "Hide" : "Show"} MiniMap
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
          <div style={{ width: "100%", height: "800px", position: "relative" }}>
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
              style={{ backgroundColor: "#fafafa" }}
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
                    backgroundColor: "#f1f5f9",
                  }}
                />
              )}
            </ReactFlow>

            <UnassignedZone
              onDrop={handleParkGoal}
              goalCount={parkedGoalsCount}
            />

            {contextMenu.visible && (
              <div
                className="fixed z-[9999]"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <GoalContextMenu
                  x={0}
                  y={0}
                  goalId={contextMenu.goalId}
                  onClose={() => {
                    console.log(
                      "InteractiveJourneyCanvas - Closing context menu"
                    );
                    setContextMenu({ visible: false, x: 0, y: 0 });
                  }}
                  onSplit={(goalId) => {
                    console.log(
                      "InteractiveJourneyCanvas - onSplit called with:",
                      goalId
                    );
                    const goal = goals.find((g) => g.id === goalId);
                    if (goal) {
                      setGoalToSplit(goal);
                      setSplitDialogOpen(true);
                    }
                  }}
                  onEdit={handleEditGoal}
                  onClone={handleCloneGoal}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <GoalCreationModal
        open={creationModalOpen || editModalOpen}
        onClose={() => {
          setCreationModalOpen(false);
          setEditModalOpen(false);
          setGoalToEdit(null);
        }}
        onSave={editModalOpen ? handleGoalEdit : handleGoalCreation}
        position={creationPosition}
        effectiveCycles={effectiveCycles}
        initialData={goalToEdit}
        isEditing={editModalOpen}
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
