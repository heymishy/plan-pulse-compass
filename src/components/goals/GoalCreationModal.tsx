
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { Goal, GoalMetric } from '@/types/goalTypes';

interface GoalCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => void;
  position: { x: number; y: number } | null;
}

const GoalCreationModal: React.FC<GoalCreationModalProps> = ({
  open,
  onClose,
  onSave,
  position
}) => {
  const { teams, cycles } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeFrame: '',
    ownerId: '',
    metricType: 'percentage' as GoalMetric['type'],
    metricTarget: 100,
    metricUnit: '%',
    confidence: 0.8,
  });

  const handleSave = () => {
    if (!formData.title.trim()) return;

    const goalData: Partial<Goal> = {
      title: formData.title,
      description: formData.description,
      timeFrame: formData.timeFrame,
      ownerId: formData.ownerId || undefined,
      confidence: formData.confidence,
      status: 'not-started',
      metric: {
        type: formData.metricType,
        target: formData.metricTarget,
        current: 0,
        unit: formData.metricUnit,
        direction: 'increase',
      },
      dependencies: [],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    onSave(goalData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      timeFrame: '',
      ownerId: '',
      metricType: 'percentage',
      metricTarget: 100,
      metricUnit: '%',
      confidence: 0.8,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter goal title..."
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the goal..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeFrame">Time Frame</Label>
              <Select value={formData.timeFrame} onValueChange={(value) => setFormData(prev => ({ ...prev, timeFrame: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="owner">Owner (optional)</Label>
              <Select value={formData.ownerId} onValueChange={(value) => setFormData(prev => ({ ...prev, ownerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="metricType">Metric Type</Label>
              <Select value={formData.metricType} onValueChange={(value: GoalMetric['type']) => setFormData(prev => ({ ...prev, metricType: value }))}>
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
                onChange={(e) => setFormData(prev => ({ ...prev, metricTarget: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.metricUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, metricUnit: e.target.value }))}
                placeholder="%"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confidence">Initial Confidence ({Math.round(formData.confidence * 100)}%)</Label>
            <input
              id="confidence"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.confidence}
              onChange={(e) => setFormData(prev => ({ ...prev, confidence: Number(e.target.value) }))}
              className="w-full mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalCreationModal;
