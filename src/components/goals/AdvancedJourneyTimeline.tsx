
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types/goalTypes';
import { Calendar, Target, TrendingUp, Clock, Filter } from 'lucide-react';

interface TimelineItem {
  id: string;
  type: 'goal' | 'epic' | 'milestone';
  title: string;
  date: string;
  status: string;
  goalId?: string;
  progress?: number;
}

const AdvancedJourneyTimeline: React.FC = () => {
  const { goals, epics, projects, goalEpics, cycles, northStar } = useApp();
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<string>('all');

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add goals to timeline
    goals.forEach(goal => {
      if (selectedGoal !== 'all' && goal.id !== selectedGoal) return;
      
      const cycle = cycles.find(c => c.id === goal.timeFrame);
      if (selectedCycle !== 'all' && goal.timeFrame !== selectedCycle) return;

      items.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        title: goal.title,
        date: cycle?.endDate || goal.updatedDate,
        status: goal.status,
        goalId: goal.id,
        progress: goal.metric.target > 0 ? (goal.metric.current / goal.metric.target) * 100 : 0
      });
    });

    // Add linked epics to timeline
    goalEpics.forEach(goalEpic => {
      const epic = epics.find(e => e.id === goalEpic.epicId);
      const goal = goals.find(g => g.id === goalEpic.goalId);
      
      if (!epic || !goal) return;
      if (selectedGoal !== 'all' && goal.id !== selectedGoal) return;
      
      const cycle = cycles.find(c => c.id === goal.timeFrame);
      if (selectedCycle !== 'all' && goal.timeFrame !== selectedCycle) return;

      items.push({
        id: `epic-${epic.id}`,
        type: 'epic',
        title: epic.name,
        date: epic.targetEndDate || cycle?.endDate || new Date().toISOString(),
        status: epic.status,
        goalId: goal.id
      });
    });

    // Sort by date
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [goals, epics, goalEpics, cycles, selectedCycle, selectedGoal]);

  const getCycleName = (cycleId: string) => {
    const cycle = cycles.find(c => c.id === cycleId);
    return cycle?.name || 'Unknown';
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'goal') {
      switch (status) {
        case 'completed': return 'bg-green-500';
        case 'in-progress': return 'bg-blue-500';
        case 'at-risk': return 'bg-yellow-500';
        case 'cancelled': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    } else {
      switch (status) {
        case 'completed': return 'bg-green-500';
        case 'in-progress': return 'bg-blue-500';
        default: return 'bg-gray-500';
      }
    }
  };

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return '';
    const goal = goals.find(g => g.id === goalId);
    return goal?.title || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Advanced Journey Timeline
        </h3>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cycles</SelectItem>
              {cycles.map(cycle => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedGoal} onValueChange={setSelectedGoal}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {goals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* North Star Section */}
      {northStar && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Target className="h-4 w-4 mr-2 text-yellow-600" />
              North Star: {northStar.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Target: {northStar.timeHorizon}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          {timelineItems.length > 0 ? (
            <div className="space-y-4">
              {timelineItems.map((item, index) => (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status, item.type)}`} />
                    {index < timelineItems.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {item.goalId && item.type !== 'goal' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Linked to: {getGoalTitle(item.goalId)}
                      </div>
                    )}
                    
                    {item.progress !== undefined && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(item.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {item.progress.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No timeline items available for the selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedJourneyTimeline;
