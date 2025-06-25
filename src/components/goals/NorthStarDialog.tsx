
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { NorthStar, GoalMetric } from '@/types/goalTypes';
import { Star } from 'lucide-react';

interface NorthStarDialogProps {
  trigger?: React.ReactNode;
}

const NorthStarDialog: React.FC<NorthStarDialogProps> = ({ trigger }) => {
  const { northStar, setNorthStar } = useApp();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vision: '',
    timeHorizon: '',
    metricType: 'percentage' as GoalMetric['type'],
    metricTarget: 100,
    metricUnit: '',
    metricDirection: 'increase' as GoalMetric['direction']
  });

  useEffect(() => {
    if (northStar) {
      setFormData({
        title: northStar.title,
        description: northStar.description || '',
        vision: northStar.vision,
        timeHorizon: northStar.timeHorizon,
        metricType: northStar.metric.type,
        metricTarget: northStar.metric.target,
        metricUnit: northStar.metric.unit || '',
        metricDirection: northStar.metric.direction
      });
    }
  }, [northStar]);

  const handleSave = () => {
    const northStarData: NorthStar = {
      id: northStar?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      vision: formData.vision,
      timeHorizon: formData.timeHorizon,
      metric: {
        type: formData.metricType,
        target: formData.metricTarget,
        current: northStar?.metric.current || 0,
        unit: formData.metricUnit,
        direction: formData.metricDirection
      },
      isActive: true,
      createdDate: northStar?.createdDate || new Date().toISOString()
    };

    setNorthStar(northStarData);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button>
      <Star className="h-4 w-4 mr-2" />
      {northStar ? 'Edit North Star' : 'Set North Star'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            {northStar ? 'Edit North Star Goal' : 'Set North Star Goal'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Become the leading platform for..."
            />
          </div>

          <div>
            <Label htmlFor="vision">Vision Statement</Label>
            <Textarea
              id="vision"
              value={formData.vision}
              onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
              placeholder="The long-term vision this North Star represents"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional context about this North Star goal"
            />
          </div>

          <div>
            <Label htmlFor="timeHorizon">Time Horizon</Label>
            <Input
              id="timeHorizon"
              value={formData.timeHorizon}
              onChange={(e) => setFormData({ ...formData, timeHorizon: e.target.value })}
              placeholder="e.g., 2024, 12 months, 3 years"
            />
          </div>

          <div className="space-y-2">
            <Label>Success Metric</Label>
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metricUnit">Unit</Label>
                <Input
                  id="metricUnit"
                  value={formData.metricUnit}
                  onChange={(e) => setFormData({ ...formData, metricUnit: e.target.value })}
                  placeholder="e.g., %, $, users"
                />
              </div>

              <div>
                <Label htmlFor="metricDirection">Direction</Label>
                <Select value={formData.metricDirection} onValueChange={(value) => setFormData({ ...formData, metricDirection: value as GoalMetric['direction'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase</SelectItem>
                    <SelectItem value="decrease">Decrease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.vision}>
              {northStar ? 'Update North Star' : 'Set North Star'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NorthStarDialog;
