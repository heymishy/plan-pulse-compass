import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { Goal } from "@/types/goalTypes";
import { ArrowRight, Plus, X, AlertCircle } from "lucide-react";

interface GoalDependenciesManagerProps {
  goalId?: string;
}

const GoalDependenciesManager: React.FC<GoalDependenciesManagerProps> = ({
  goalId,
}) => {
  const { goals, updateGoal } = useApp();
  const [selectedGoal, setSelectedGoal] = useState<string>(goalId || "");
  const [newDependency, setNewDependency] = useState<string>("");

  const currentGoal = goals.find((g) => g.id === selectedGoal);
  const availableDependencies = goals.filter(
    (g) =>
      g.id !== selectedGoal &&
      !currentGoal?.dependencies.includes(g.id) &&
      !wouldCreateCircularDependency(selectedGoal, g.id)
  );

  function wouldCreateCircularDependency(
    goalId: string,
    dependencyId: string
  ): boolean {
    if (goalId === dependencyId) return true;

    const dependencyGoal = goals.find((g) => g.id === dependencyId);
    if (!dependencyGoal) return false;

    // Check if the dependency has the current goal as a dependency (direct or indirect)
    return checkDependencyChain(dependencyGoal, goalId, new Set());
  }

  function checkDependencyChain(
    goal: Goal,
    targetId: string,
    visited: Set<string>
  ): boolean {
    if (visited.has(goal.id)) return false; // Avoid infinite loops
    visited.add(goal.id);

    if ((goal.dependencies || []).includes(targetId)) return true;

    for (const depId of goal.dependencies || []) {
      const depGoal = goals.find((g) => g.id === depId);
      if (depGoal && checkDependencyChain(depGoal, targetId, visited)) {
        return true;
      }
    }

    return false;
  }

  const addDependency = () => {
    if (!currentGoal || !newDependency) return;

    const updatedDependencies = [
      ...(currentGoal.dependencies || []),
      newDependency,
    ];
    updateGoal(currentGoal.id, { dependencies: updatedDependencies });
    setNewDependency("");
  };

  const removeDependency = (dependencyId: string) => {
    if (!currentGoal) return;

    const updatedDependencies = (currentGoal.dependencies || []).filter(
      (id) => id !== dependencyId
    );
    updateGoal(currentGoal.id, { dependencies: updatedDependencies });
  };

  const getDependencyGoal = (dependencyId: string) => {
    return goals.find((g) => g.id === dependencyId);
  };

  const getStatusColor = (status: Goal["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "at-risk":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDependentGoals = (goalId: string) => {
    return goals.filter((g) => (g.dependencies || []).includes(goalId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Goal Dependencies Manager</h3>
        {!goalId && (
          <Select value={selectedGoal} onValueChange={setSelectedGoal}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a goal to manage" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {currentGoal ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{currentGoal.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Dependencies */}
              <div>
                <h4 className="font-medium mb-2">
                  Dependencies ({(currentGoal.dependencies || []).length})
                </h4>
                {(currentGoal.dependencies || []).length > 0 ? (
                  <div className="space-y-2">
                    {(currentGoal.dependencies || []).map((depId) => {
                      const depGoal = getDependencyGoal(depId);
                      if (!depGoal) return null;

                      return (
                        <div
                          key={depId}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(depGoal.status)}>
                              {depGoal.status.replace("-", " ")}
                            </Badge>
                            <span className="text-sm font-medium">
                              {depGoal.title}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDependency(depId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm border rounded border-dashed">
                    No dependencies defined
                  </div>
                )}
              </div>

              {/* Add New Dependency */}
              {availableDependencies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Add Dependency</h4>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={newDependency}
                      onValueChange={setNewDependency}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a goal to depend on" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDependencies.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={getStatusColor(goal.status)}
                                variant="outline"
                              >
                                {goal.status.replace("-", " ")}
                              </Badge>
                              <span>{goal.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addDependency} disabled={!newDependency}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Goals that depend on this one */}
              <div>
                <h4 className="font-medium mb-2">Goals Depending on This</h4>
                {(() => {
                  const dependentGoals = getDependentGoals(currentGoal.id);
                  return dependentGoals.length > 0 ? (
                    <div className="space-y-2">
                      {dependentGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center space-x-2 p-2 border rounded bg-blue-50"
                        >
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status.replace("-", " ")}
                          </Badge>
                          <span className="text-sm font-medium">
                            {goal.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm border rounded border-dashed">
                      No goals depend on this one
                    </div>
                  );
                })()}
              </div>

              {/* Circular Dependency Warning */}
              {(currentGoal.dependencies || []).some((depId) =>
                wouldCreateCircularDependency(currentGoal.id, depId)
              ) && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Potential circular dependency detected. Review your
                    dependency chain.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            {goals.length === 0
              ? "No goals available"
              : "Select a goal to manage its dependencies"}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalDependenciesManager;
