
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/context/AppContext';
import { Goal, GoalMetric } from '@/types/goalTypes';
import { Plus, Edit } from 'lucide-react';

interface GoalDialogProps {
  goal?: Goal;
  trigger?: React.ReactNode;
  onSave?: (goal: Goal) => void;
}

const GoalDialog: React.FC<GoalDialogProps> = ({ goal, trigger, onSave }) => {
  const { addGoal, updateGoal, cycles, people } = useApp();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeFrame: '',
    ownerId: '',
    metricType: 'percentage' as GoalMetric['type'],
    metricTarget: 100,
    metricUnit: '',
    metricDirection: 'increase' as GoalMetric['direction'],
    confidence: 0.5,
    notes: ''
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        timeFrame: goal.timeFrame,
        ownerId: goal.ownerId || '',
        metricType: goal.metric.type,
        metricTarget: goal.metric.target,
        metricUnit: goal.metric.unit || '',
        metricDirection: goal.metric.direction,
        confidence: goal.confidence,
        notes: goal.notes || ''
      });
    }
  }, [goal]);

  const handleSave = () => {
    const goalData = {
      title: formData.title,
      description: formData.description,
      timeFrame: formData.timeFrame,
      ownerId: formData.ownerId,
      metric: {
        type: formData.metricType,
        target: formData.metricTarget,
        current: goal?.metric.current || 0,
        unit: formData.metricUnit,
        direction: formData.metricDirection
      } as GoalMetric,
      confidence: formData.confidence,
      status: goal?.status || 'not-started' as const,
      dependencies: goal?.dependencies || [],
      notes: formData.notes
    };

    if (goal) {
      updateGoal(goal.id, goalData);
      onSave?.(goalData as Goal);
    } else {
      addGoal(goalData);
    }
    setOpen(false);
  };

  const defaultTrigger = (
    <Button>
      {goal ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
      {goal ? 'Edit Goal' : 'Add Goal'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Improve onboarding conversion"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the goal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeFrame">Time Frame</Label>
              <Select value={formData.timeFrame} onValueChange={(value) => setFormData({ ...formData, timeFrame: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="owner">Owner</Label>
              <Select value={formData.ownerId} onValueChange={(value) => setFormData({ ...formData, ownerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metric Configuration</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="metricType">Type</Label>
                <Select value={formData.metricType} onValueChange={(value) => setFormData({ ...formData, metricType: value as GoalMetric['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="metricTarget">Target</Label>
                <Input
                  id="metricTarget"
                  type="number"
                  value={formData.metricTarget}
                  onChange={(e) => setFormData({ ...formData, metricTarget: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="metricUnit">Unit</Label>
                <Input
                  id="metricUnit"
                  value={formData.metricUnit}
                  onChange={(e) => setFormData({ ...formData, metricUnit: e.target.value })}
                  placeholder="e.g., %, $, users"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="metricDirection">Direction</Label>
              <Select value={formData.metricDirection} onValueChange={(value) => setFormData({ ...formData, metricDirection: value as GoalMetric['direction'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase (higher is better)</SelectItem>
                  <SelectItem value="decrease">Decrease (lower is better)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Confidence Level: {Math.round(formData.confidence * 100)}%</Label>
            <Slider
              value={[formData.confidence]}
              onValueChange={([value]) => setFormData({ ...formData, confidence: value })}
              max={1}
              min={0}
              step={0.1}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this goal"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.timeFrame}>
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDialog;
