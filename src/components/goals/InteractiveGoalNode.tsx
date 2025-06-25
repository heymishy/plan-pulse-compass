
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/types/goalTypes';
import { Star, Target, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface InteractiveGoalNodeProps {
  data: Goal & {
    isNorthStar?: boolean;
    cycle?: { name: string; endDate: string };
  };
}

const InteractiveGoalNode: React.FC<InteractiveGoalNodeProps> = ({ data }) => {
  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50';
      case 'in-progress': return 'border-blue-500 bg-blue-50';
      case 'at-risk': return 'border-yellow-500 bg-yellow-50';
      case 'cancelled': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getConfidenceRing = (confidence: number) => {
    const intensity = Math.max(0.3, confidence);
    let color = 'rgba(239, 68, 68, 0.4)'; // red default
    
    if (confidence > 0.7) {
      color = 'rgba(34, 197, 94, 0.4)'; // green
    } else if (confidence > 0.4) {
      color = 'rgba(251, 191, 36, 0.4)'; // yellow
    }
    
    return {
      boxShadow: `0 0 0 ${Math.round(confidence * 8 + 2)}px ${color}`,
    };
  };

  const getProgressPercentage = () => {
    if (data.metric.target === 0) return 0;
    return Math.min((data.metric.current / data.metric.target) * 100, 100);
  };

  const getRiskIcon = () => {
    if (data.status === 'at-risk') return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    if (data.confidence < 0.4) return <TrendingUp className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <div 
      className={`
        relative p-4 rounded-lg border-2 min-w-[200px] max-w-[250px] cursor-pointer 
        transition-shadow hover:shadow-lg ${getStatusColor(data.status)}
      `}
      style={getConfidenceRing(data.confidence)}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 hover:opacity-100" />
      <Handle type="target" position={Position.Left} className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right} className="opacity-0 hover:opacity-100" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {data.isNorthStar ? (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <Target className="h-4 w-4 text-blue-500" />
          )}
          {getRiskIcon()}
        </div>
        <Badge variant="outline" className="text-xs">
          {Math.round(data.confidence * 100)}%
        </Badge>
      </div>

      {/* Title */}
      <div className="font-medium text-sm mb-2 line-clamp-2">
        {data.title}
      </div>

      {/* Progress Arc - Visual representation */}
      {data.metric && data.metric.target > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{getProgressPercentage().toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.metric.current} / {data.metric.target} {data.metric.unit}
          </div>
        </div>
      )}

      {/* Time frame */}
      <div className="flex items-center text-xs text-gray-500">
        <Clock className="h-3 w-3 mr-1" />
        {data.cycle?.name || data.timeFrame}
      </div>

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div 
          className={`w-2 h-2 rounded-full ${
            data.status === 'completed' ? 'bg-green-500' :
            data.status === 'in-progress' ? 'bg-blue-500' :
            data.status === 'at-risk' ? 'bg-yellow-500' :
            'bg-gray-400'
          }`}
        />
      </div>
    </div>
  );
};

export default InteractiveGoalNode;
