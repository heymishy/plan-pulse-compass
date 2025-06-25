import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { Goal, GoalMetric } from "@/types/goalTypes";

interface GoalCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => void;
  position: { x: number; y: number } | null;
  effectiveCycles?: Array<{ id: string; name: string }>;
  initialData?: Goal | null;
  isEditing?: boolean;
}

const GoalCreationModal: React.FC<GoalCreationModalProps> = ({
  open,
  onClose,
  onSave,
  position,
  effectiveCycles,
  initialData,
  isEditing,
}) => {
  const { teams, divisions } = useApp();
  const [selectedDivision, setSelectedDivision] = useState<string>("all");

  // Debug logging
  console.log("GoalCreationModal - teams:", teams);
  console.log("GoalCreationModal - divisions:", divisions);
  console.log("GoalCreationModal - effectiveCycles:", effectiveCycles);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeFrame: "",
    ownerId: "",
    metricType: "percentage" as GoalMetric["type"],
    metricTarget: 100,
    metricUnit: "%",
    confidence: 0.8,
  });

  // Initialize form data when editing
  React.useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        timeFrame: initialData.timeFrame,
        ownerId: initialData.ownerId || "",
        metricType: initialData.metric.type,
        metricTarget: initialData.metric.target,
        metricUnit: initialData.metric.unit,
        confidence: initialData.confidence,
      });
    } else if (!isEditing) {
      // Reset form when creating new goal
      setFormData({
        title: "",
        description: "",
        timeFrame: "",
        ownerId: "",
        metricType: "percentage",
        metricTarget: 100,
        metricUnit: "%",
        confidence: 0.8,
      });
    }
  }, [isEditing, initialData]);

  // Reset division selection when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedDivision("all");
    }
  }, [open]);

  // Reset team selection when division changes
  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, ownerId: "" }));
  }, [selectedDivision]);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    const goalData: Partial<Goal> = {
      title: formData.title,
      description: formData.description,
      timeFrame: formData.timeFrame,
      ownerId: formData.ownerId || undefined,
      confidence: formData.confidence,
      status: "not-started",
      metric: {
        type: formData.metricType,
        target: formData.metricTarget,
        current: 0,
        unit: formData.metricUnit,
        direction: "increase",
      },
      dependencies: [],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    onSave(goalData);

    // Reset form
    setFormData({
      title: "",
      description: "",
      timeFrame: "",
      ownerId: "",
      metricType: "percentage",
      metricTarget: 100,
      metricUnit: "%",
      confidence: 0.8,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the goal details below. Changes will be saved to your journey canvas."
              : "Create a new goal with title, description, time frame, and metrics. This goal will be added to your journey canvas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter goal title..."
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the goal..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeFrame">Time Frame</Label>
              <Select
                value={formData.timeFrame}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, timeFrame: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {effectiveCycles && effectiveCycles.length > 0 ? (
                    effectiveCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="q1-2024">Q1 2024</SelectItem>
                      <SelectItem value="q2-2024">Q2 2024</SelectItem>
                      <SelectItem value="q3-2024">Q3 2024</SelectItem>
                      <SelectItem value="q4-2024">Q4 2024</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="owner">Owner (optional)</Label>
              <div className="space-y-2">
                <Select
                  value={selectedDivision}
                  onValueChange={setSelectedDivision}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
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
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, ownerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="metricType">Metric Type</Label>
              <Select
                value={formData.metricType}
                onValueChange={(value: GoalMetric["type"]) =>
                  setFormData((prev) => ({ ...prev, metricType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                value={formData.metricTarget}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metricTarget: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.metricUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metricUnit: e.target.value,
                  }))
                }
                placeholder="%"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confidence">
              Initial Confidence ({Math.round(formData.confidence * 100)}%)
            </Label>
            <input
              id="confidence"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.confidence}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confidence: Number(e.target.value),
                }))
              }
              className="w-full mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            {isEditing ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalCreationModal;
