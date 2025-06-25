import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Goal } from "@/types/goalTypes";
import { Plus, X } from "lucide-react";

interface GoalSplitDialogProps {
  open: boolean;
  onClose: () => void;
  parentGoal: Goal | null;
  onSplit: (subGoals: Partial<Goal>[]) => void;
}

const GoalSplitDialog: React.FC<GoalSplitDialogProps> = ({
  open,
  onClose,
  parentGoal,
  onSplit,
}) => {
  const [subGoals, setSubGoals] = useState<string[]>(["", ""]);

  const addSubGoal = () => {
    setSubGoals([...subGoals, ""]);
  };

  const removeSubGoal = (index: number) => {
    if (subGoals.length > 2) {
      setSubGoals(subGoals.filter((_, i) => i !== index));
    }
  };

  const updateSubGoal = (index: number, value: string) => {
    const updated = [...subGoals];
    updated[index] = value;
    setSubGoals(updated);
  };

  const handleSplit = () => {
    if (!parentGoal) return;

    const validSubGoals = subGoals.filter((sg) => sg.trim());
    if (validSubGoals.length < 2) return;

    console.log("GoalSplitDialog - parentGoal:", parentGoal);
    console.log("GoalSplitDialog - parentGoal.ownerId:", parentGoal.ownerId);

    const subGoalData = validSubGoals.map((title) => ({
      title,
      description: `Split from: ${parentGoal.title}`,
      timeFrame: parentGoal.timeFrame,
      ownerId: parentGoal.ownerId,
      confidence: 0.8,
      status: "not-started" as const,
      metric: {
        type: parentGoal.metric.type,
        target: Math.floor(parentGoal.metric.target / validSubGoals.length),
        current: 0,
        unit: parentGoal.metric.unit,
        direction: parentGoal.metric.direction,
      },
      dependencies: [parentGoal.id],
    }));

    console.log("GoalSplitDialog - subGoalData:", subGoalData);
    onSplit(subGoalData);
    setSubGoals(["", ""]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Split Goal into Sub-Goals</DialogTitle>
        </DialogHeader>

        {parentGoal && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">
              Parent Goal:
            </Label>
            <div className="text-sm mt-1">{parentGoal.title}</div>
            <Badge variant="outline" className="mt-1 text-xs">
              {parentGoal.timeFrame}
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium">Sub-Goals:</Label>
          {subGoals.map((subGoal, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={subGoal}
                onChange={(e) => updateSubGoal(index, e.target.value)}
                placeholder={`Sub-goal ${index + 1}...`}
                className="flex-1"
              />
              {subGoals.length > 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSubGoal(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addSubGoal}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Sub-Goal
          </Button>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSplit}
            disabled={subGoals.filter((sg) => sg.trim()).length < 2}
          >
            Split Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalSplitDialog;
