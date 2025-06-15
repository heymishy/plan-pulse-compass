
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkTypeSelectorProps {
  workType: 'epic' | 'run-work' | 'team';
  onWorkTypeChange: (value: 'epic' | 'run-work' | 'team') => void;
}

const WorkTypeSelector: React.FC<WorkTypeSelectorProps> = ({
  workType,
  onWorkTypeChange,
}) => {
  return (
    <div className="space-y-2">
      <Label>Work Type</Label>
      <Select value={workType} onValueChange={onWorkTypeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="epic">Project Epic</SelectItem>
          <SelectItem value="run-work">Run Work Category</SelectItem>
          <SelectItem value="team">Team Work</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default WorkTypeSelector;
