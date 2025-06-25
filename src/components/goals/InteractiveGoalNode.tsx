
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/types/goalTypes';
import { Star, Target, Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';

interface InteractiveGoalNodeProps {
  data: Goal & {
    isNorthStar?: boolean;
    cycle?: { name: string; endDate: string };
    isSelected?: boolean;
    canSplit?: boolean;
  };
  selected?: boolean;
}

const InteractiveGoalNode: React.FC<InteractiveGoalNodeProps> = ({ data, selected }) => {
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
    let color = 'rgba(239, 68, 68, 0.6)'; // red default
    
    if (confidence > 0.7) {
      color = 'rgba(34, 197, 94, 0.6)'; // green
    } else if (confidence > 0.4) {
      color = 'rgba(251, 191, 36, 0.6)'; // yellow
    }
    
    return {
      boxShadow: `0 0 0 ${Math.round(confidence * 6 + 2)}px ${color}, 0 0 15px ${color}`,
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

  const progressPercentage = getProgressPercentage();

  return (
    <div 
      className={`
        relative p-4 rounded-lg border-2 min-w-[220px] max-w-[280px] cursor-pointer 
        transition-all duration-200 hover:shadow-lg ${getStatusColor(data.status)}
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        ${data.isNorthStar ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : ''}
      `}
      style={getConfidenceRing(data.confidence)}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="opacity-0 hover:opacity-100 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 hover:opacity-100 bg-blue-500" />
      <Handle type="target" position={Position.Left} className="opacity-0 hover:opacity-100 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="opacity-0 hover:opacity-100 bg-blue-500" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {data.isNorthStar ? (
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          ) : (
            <Target className="h-4 w-4 text-blue-500" />
          )}
          {getRiskIcon()}
        </div>
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-xs">
            {Math.round(data.confidence * 100)}%
          </Badge>
          {data.ownerId && (
            <Users className="h-3 w-3 text-gray-500" />
          )}
        </div>
      </div>

      {/* Title */}
      <div className={`font-medium mb-3 line-clamp-2 ${data.isNorthStar ? 'text-lg' : 'text-sm'}`}>
        {data.title}
      </div>

      {/* Radial Progress Arc */}
      {data.metric && data.metric.target > 0 && (
        <div className="mb-3 relative">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
          </div>
          
          {/* Progress bar with rounded edges */}
          <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                progressPercentage >= 100 ? 'bg-green-500' :
                progressPercentage >= 70 ? 'bg-blue-500' :
                progressPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Glow effect for completed goals */}
            {progressPercentage >= 100 && (
              <div className="absolute inset-0 bg-green-500 opacity-30 animate-pulse rounded-full" />
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1 font-mono">
            {data.metric.current.toLocaleString()} / {data.metric.target.toLocaleString()} {data.metric.unit}
          </div>
        </div>
      )}

      {/* Time frame and dependencies */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center text-gray-600">
          <Clock className="h-3 w-3 mr-1" />
          <span className="truncate">{data.cycle?.name || data.timeFrame}</span>
        </div>
        {data.dependencies.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {data.dependencies.length} deps
          </Badge>
        )}
      </div>

      {/* Status indicator dot */}
      <div className="absolute top-3 right-3">
        <div 
          className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
            data.status === 'completed' ? 'bg-green-500' :
            data.status === 'in-progress' ? 'bg-blue-500' :
            data.status === 'at-risk' ? 'bg-yellow-500' :
            data.status === 'cancelled' ? 'bg-red-500' :
            'bg-gray-400'
          }`}
        />
      </div>

      {/* Splitting affordance indicator */}
      {data.canSplit && (
        <div className="absolute bottom-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
          <div className="text-xs text-gray-500">⤴️</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveGoalNode;
