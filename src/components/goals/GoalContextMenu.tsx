import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import {
  Edit,
  Copy,
  Split,
  Archive,
  Link,
  Target,
  TrendingUp,
  Pause,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

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
  onClone,
}) => {
  const { goals, northStar, updateGoal } = useApp();

  console.log("GoalContextMenu - received goalId:", goalId);
  console.log("GoalContextMenu - available goals:", goals);
  console.log("GoalContextMenu - northStar:", northStar);

  // Find the goal - check both regular goals and north star
  const goal = goalId ? goals.find((g) => g.id === goalId) : null;
  const northStarGoal = northStar && northStar.id === goalId ? northStar : null;
  const foundGoal = goal || northStarGoal;

  console.log("GoalContextMenu - found goal:", foundGoal);
  console.log("GoalContextMenu - goal status:", foundGoal?.status);
  console.log("GoalContextMenu - rendering context menu");

  // Handle north star goals (they have a different structure)
  const isNorthStar = foundGoal?.isNorthStar || false;

  // For North Star goals, we need to handle the different structure
  const goalStatus = isNorthStar ? "not-started" : foundGoal?.status;

  const handleAction = (action: string) => {
    console.log("GoalContextMenu - handleAction called with:", action);
    console.log("GoalContextMenu - goal:", foundGoal);

    if (!foundGoal) {
      console.log("GoalContextMenu - No goal found, returning");
      return;
    }

    switch (action) {
      case "edit":
        console.log("GoalContextMenu - Edit action, calling onEdit");
        onEdit?.(foundGoal.id);
        break;
      case "clone":
        console.log("GoalContextMenu - Clone action, calling onClone");
        onClone?.(foundGoal.id);
        break;
      case "split":
        console.log("GoalContextMenu - Split action, calling onSplit");
        onSplit?.(foundGoal.id);
        break;
      case "park":
        console.log("GoalContextMenu - Park action, updating goal");
        updateGoal(foundGoal.id, {
          timeFrame: "unassigned",
          status: "not-started",
        });
        break;
      case "complete":
        console.log("GoalContextMenu - Complete action, updating goal");
        updateGoal(foundGoal.id, {
          status: "completed",
          metric: { ...foundGoal.metric, current: foundGoal.metric.target },
        });
        break;
      case "at-risk":
        console.log("GoalContextMenu - At-risk action, updating goal");
        updateGoal(foundGoal.id, {
          status: "at-risk",
          confidence: Math.min(foundGoal.confidence, 0.4),
        });
        break;
      case "archive":
        console.log("GoalContextMenu - Archive action, updating goal");
        updateGoal(foundGoal.id, { status: "cancelled" });
        break;
      case "link":
        console.log("GoalContextMenu - Link action, logging to console");
        console.log("Link to epic/project:", foundGoal.id);
        break;
    }
    console.log("GoalContextMenu - Calling onClose");
    onClose();
  };

  const handleSplit = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("GoalContextMenu - handleSplit called for goalId:", goalId);
    console.log("GoalContextMenu - event:", event);
    if (goalId && onSplit) {
      onSplit(goalId);
    }
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("GoalContextMenu - handleEdit called for goalId:", goalId);
    console.log("GoalContextMenu - event:", event);
    if (goalId && onEdit) {
      onEdit(goalId);
    }
  };

  const handleClone = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("GoalContextMenu - handleClone called for goalId:", goalId);
    console.log("GoalContextMenu - event:", event);
    if (goalId && onClone) {
      onClone(goalId);
    }
  };

  const handlePark = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("GoalContextMenu - handlePark called for goalId:", goalId);
    if (foundGoal && updateGoal) {
      updateGoal(foundGoal.id, {
        timeFrame: "unassigned",
        status: "not-started",
      });
    }
  };

  const handleComplete = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("GoalContextMenu - handleComplete called for goalId:", goalId);
    if (foundGoal && updateGoal) {
      updateGoal(foundGoal.id, {
        status: "completed",
        metric: { ...foundGoal.metric, current: foundGoal.metric.target },
      });
    }
  };

  const handleAtRisk = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("GoalContextMenu - handleAtRisk called for goalId:", goalId);
    if (foundGoal && updateGoal) {
      updateGoal(foundGoal.id, {
        status: "at-risk",
        confidence: Math.min(foundGoal.confidence, 0.4),
      });
    }
  };

  const handleArchive = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("GoalContextMenu - handleArchive called for goalId:", goalId);
    if (foundGoal && updateGoal) {
      updateGoal(foundGoal.id, { status: "cancelled" });
    }
  };

  const handleLink = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("GoalContextMenu - handleLink called for goalId:", goalId);
    console.log("Link to epic/project:", goalId);
  };

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <Card
      className="w-64 shadow-lg border border-gray-200"
      onClick={handleCardClick}
    >
      <CardContent className="p-2">
        <div className="space-y-1">
          {!isNorthStar && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleSplit}
              >
                <Split className="h-4 w-4 mr-2" />
                Split Goal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Goal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleClone}
              >
                <Copy className="h-4 w-4 mr-2" />
                Clone Goal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleLink}
              >
                <Link className="h-4 w-4 mr-2" />
                Link to Epic/Project
              </Button>

              <hr className="my-1" />

              {goalStatus !== "completed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-green-600"
                  onClick={handleComplete}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}

              {goalStatus !== "at-risk" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-yellow-600"
                  onClick={handleAtRisk}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Mark At Risk
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-blue-600"
                onClick={handlePark}
              >
                <Pause className="h-4 w-4 mr-2" />
                Park Goal
              </Button>

              <hr className="my-1" />

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-red-600 hover:text-red-700"
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Goal
              </Button>
            </>
          )}

          {isNorthStar && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit North Star
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleLink}
              >
                <Link className="h-4 w-4 mr-2" />
                Link to Epic/Project
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalContextMenu;
