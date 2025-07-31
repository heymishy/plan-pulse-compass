import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, ArrowUpDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectPriorityEditorProps {
  priority: number;
  priorityOrder?: number;
  onPriorityChange: (priority: number) => void;
  onPriorityOrderChange: (priorityOrder: number | undefined) => void;
}

const ProjectPriorityEditor: React.FC<ProjectPriorityEditorProps> = ({
  priority,
  priorityOrder,
  onPriorityChange,
  onPriorityOrderChange,
}) => {
  // Priority level configurations
  const priorityLevels = [
    {
      value: 1,
      label: 'Priority 1',
      description: 'Critical - Highest priority',
      color: 'bg-red-100 text-red-800',
    },
    {
      value: 2,
      label: 'Priority 2',
      description: 'High - Important but not critical',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 3,
      label: 'Priority 3',
      description: 'Medium - Standard priority',
      color: 'bg-green-100 text-green-800',
    },
    {
      value: 4,
      label: 'Priority 4',
      description: 'Low - Can be deferred',
      color: 'bg-blue-100 text-blue-800',
    },
  ];

  // Get priority level info
  const currentPriorityLevel =
    priorityLevels.find(p => p.value === priority) || priorityLevels[1];

  // Handle priority order change with validation
  const handlePriorityOrderChange = (value: string) => {
    if (value === '') {
      onPriorityOrderChange(undefined);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      onPriorityOrderChange(1); // Minimum valid value
      return;
    }

    onPriorityOrderChange(numValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Project Priority
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Priority Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="priority">Priority Level</Label>
            <Badge className={`${currentPriorityLevel.color} border-0`}>
              {priority}
            </Badge>
          </div>
          <Select
            value={priority.toString()}
            onValueChange={value => onPriorityChange(parseInt(value, 10))}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityLevels.map(level => (
                <SelectItem key={level.value} value={level.value.toString()}>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${level.color} border-0 text-xs`}>
                      {level.value}
                    </Badge>
                    <span>{level.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600">
            {currentPriorityLevel.description}
          </p>
        </div>

        {/* Priority Order */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <Label htmlFor="priorityOrder">Priority Order</Label>
            {priorityOrder && <Badge variant="outline">{priorityOrder}</Badge>}
          </div>
          <Input
            id="priorityOrder"
            type="number"
            value={priorityOrder || ''}
            onChange={e => handlePriorityOrderChange(e.target.value)}
            placeholder="Enter specific order (optional)"
            min="1"
            step="1"
          />
          <p className="text-sm text-gray-600">
            {priorityOrder
              ? `This project will be ordered as #${priorityOrder} in priority lists.`
              : `Falls back to priority level (${priority}) when sorting projects.`}
          </p>
        </div>

        {/* Help Section */}
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p>
                <strong>Priority Level</strong> is a general classification
                (1-4) for broad project categorization.
              </p>
              <p>
                <strong>Priority Order</strong> provides fine-grained sorting
                within and across priority levels.
              </p>
              <p>
                Use Priority Order when you need specific ranking beyond the
                basic 4-level system.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ProjectPriorityEditor;
