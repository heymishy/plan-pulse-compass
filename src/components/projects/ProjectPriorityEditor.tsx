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
import { useSettings } from '@/context/SettingsContext';
import { getPriorityLevels, getPriorityLevel } from '@/utils/priorityUtils';

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
  const { config } = useSettings();

  // Get priority levels from configuration with fallback to defaults
  const priorityLevels = getPriorityLevels(config.priorityLevels);

  // Get current priority level info
  const currentPriorityLevel = getPriorityLevel(
    priority,
    config.priorityLevels
  );

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
                <SelectItem key={level.id} value={level.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${level.color} border-0 text-xs`}>
                      {level.id}
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
