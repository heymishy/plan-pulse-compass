import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Users,
  Target,
  Clock,
  Layers,
  Filter,
  Download,
} from 'lucide-react';
import { Team, Allocation, Cycle, Epic, Project } from '@/types';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
} from 'date-fns';

export type TimelineViewMode = 'teams' | 'epics' | 'projects';
export type TimelineZoomLevel = 'days' | 'weeks' | 'months';

interface TimelineItem {
  id: string;
  name: string;
  type: 'team' | 'epic' | 'project';
  allocations: Allocation[];
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  color?: string;
}

interface TimelineGanttViewProps {
  teams: Team[];
  allocations: Allocation[];
  iterations: Cycle[];
  epics: Epic[];
  projects: Project[];
  selectedCycleId: string;
  viewMode?: TimelineViewMode;
  onAllocationClick?: (allocation: Allocation) => void;
}

const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  teams,
  allocations,
  iterations,
  epics,
  projects,
  selectedCycleId,
  viewMode = 'teams',
  onAllocationClick,
}) => {
  const [currentViewMode, setCurrentViewMode] =
    useState<TimelineViewMode>(viewMode);
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>('weeks');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [showOnlyAllocated, setShowOnlyAllocated] = useState(false);

  // Calculate the timeline range based on iterations
  const timelineRange = useMemo(() => {
    const relevantIterations = iterations.filter(
      iter =>
        iter.parentCycleId === selectedCycleId || iter.id === selectedCycleId
    );

    if (relevantIterations.length === 0) return null;

    const startDate = new Date(
      Math.min(
        ...relevantIterations.map(iter => new Date(iter.startDate).getTime())
      )
    );
    const endDate = new Date(
      Math.max(
        ...relevantIterations.map(iter => new Date(iter.endDate).getTime())
      )
    );

    return { startDate, endDate };
  }, [iterations, selectedCycleId]);

  // Generate timeline columns based on zoom level
  const timelineColumns = useMemo(() => {
    if (!timelineRange) return [];

    const { startDate, endDate } = timelineRange;
    const columns = [];

    switch (zoomLevel) {
      case 'days': {
        return eachDayOfInterval({ start: startDate, end: endDate }).map(
          date => ({
            date,
            label: format(date, 'MMM dd'),
            key: format(date, 'yyyy-MM-dd'),
          })
        );
      }

      case 'weeks': {
        let currentWeekStart = startOfWeek(startDate);
        while (currentWeekStart <= endDate) {
          const weekEnd = endOfWeek(currentWeekStart);
          columns.push({
            date: currentWeekStart,
            label: format(currentWeekStart, 'MMM dd'),
            key: format(currentWeekStart, 'yyyy-ww'),
            endDate: weekEnd,
          });
          currentWeekStart = addDays(currentWeekStart, 7);
        }
        return columns;
      }

      case 'months': {
        const months = [];
        let currentDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          1
        );
        while (currentDate <= endDate) {
          months.push({
            date: currentDate,
            label: format(currentDate, 'MMM yyyy'),
            key: format(currentDate, 'yyyy-MM'),
          });
          currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1
          );
        }
        return months;
      }

      default:
        return [];
    }
  }, [timelineRange, zoomLevel]);

  // Generate timeline items based on view mode
  const timelineItems = useMemo(() => {
    const relevantAllocations = allocations.filter(
      a => a.cycleId === selectedCycleId
    );
    const items: TimelineItem[] = [];

    switch (currentViewMode) {
      case 'teams':
        teams.forEach(team => {
          const teamAllocations = relevantAllocations.filter(
            a => a.teamId === team.id
          );

          if (showOnlyAllocated && teamAllocations.length === 0) return;
          if (selectedTeamIds.length > 0 && !selectedTeamIds.includes(team.id))
            return;

          items.push({
            id: team.id,
            name: team.name,
            type: 'team',
            allocations: teamAllocations,
            color: '#3b82f6',
          });
        });
        break;

      case 'epics':
        epics.forEach(epic => {
          const epicAllocations = relevantAllocations.filter(
            a => a.epicId === epic.id
          );

          if (showOnlyAllocated && epicAllocations.length === 0) return;

          items.push({
            id: epic.id,
            name: epic.name,
            type: 'epic',
            allocations: epicAllocations,
            startDate: epic.startDate ? parseISO(epic.startDate) : undefined,
            endDate: epic.targetEndDate
              ? parseISO(epic.targetEndDate)
              : undefined,
            progress:
              epic.status === 'completed'
                ? 100
                : epic.status === 'in-progress'
                  ? 50
                  : 0,
            color: '#10b981',
          });
        });
        break;

      case 'projects':
        projects.forEach(project => {
          const projectEpics = epics.filter(e => e.projectId === project.id);
          const projectAllocations = relevantAllocations.filter(a =>
            projectEpics.some(e => e.id === a.epicId)
          );

          if (showOnlyAllocated && projectAllocations.length === 0) return;

          items.push({
            id: project.id,
            name: project.name,
            type: 'project',
            allocations: projectAllocations,
            startDate: parseISO(project.startDate),
            endDate: project.endDate ? parseISO(project.endDate) : undefined,
            progress:
              project.status === 'completed'
                ? 100
                : project.status === 'active'
                  ? 75
                  : 0,
            color: '#8b5cf6',
          });
        });
        break;
    }

    return items;
  }, [
    currentViewMode,
    teams,
    epics,
    projects,
    allocations,
    selectedCycleId,
    selectedTeamIds,
    showOnlyAllocated,
  ]);

  // Calculate allocation positioning within timeline
  const getAllocationPosition = (allocation: Allocation, iteration: number) => {
    const iterationData = iterations.find(
      iter =>
        (iter.parentCycleId === selectedCycleId ||
          iter.id === selectedCycleId) &&
        iterations.indexOf(iter) === iteration - 1
    );

    if (!iterationData || !timelineRange) return null;

    const startDate = parseISO(iterationData.startDate);
    const endDate = parseISO(iterationData.endDate);

    const totalDays = timelineColumns.length;
    const iterationStartCol = timelineColumns.findIndex(col =>
      isWithinInterval(col.date, { start: startDate, end: endDate })
    );

    if (iterationStartCol === -1) return null;

    const iterationLength = timelineColumns.filter(col =>
      isWithinInterval(col.date, { start: startDate, end: endDate })
    ).length;

    return {
      startCol: iterationStartCol,
      width: iterationLength,
      percentage: allocation.percentage,
    };
  };

  const renderGanttRow = (item: TimelineItem) => {
    return (
      <div
        key={item.id}
        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className="grid grid-cols-[300px_1fr] min-h-[60px]">
          {/* Item Info */}
          <div className="p-3 border-r border-gray-200 flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full`}
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{item.name}</div>
              <div className="text-xs text-gray-500 flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
                {item.allocations.length > 0 && (
                  <span>
                    {item.allocations.length} allocation
                    {item.allocations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {item.progress !== undefined && (
                <div className="mt-1">
                  <Progress value={item.progress} className="h-1" />
                </div>
              )}
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="relative flex">
            {timelineColumns.map((col, index) => (
              <div
                key={col.key}
                className="flex-1 border-r border-gray-100 min-h-[60px] relative"
                style={{ minWidth: '60px' }}
              >
                {/* Render allocations for this time period */}
                {item.allocations.map(allocation => {
                  const position = getAllocationPosition(
                    allocation,
                    allocation.iterationNumber
                  );
                  if (!position || position.startCol !== index) return null;

                  const epic = epics.find(e => e.id === allocation.epicId);
                  const width = `${position.width * 100}%`;

                  return (
                    <Tooltip
                      key={allocation.id}
                      content={
                        <div className="text-xs">
                          <div className="font-medium">
                            {epic?.name || 'Run work'}
                          </div>
                          <div>{allocation.percentage}% allocation</div>
                          <div>Iteration {allocation.iterationNumber}</div>
                        </div>
                      }
                    >
                      <div
                        className="absolute top-2 bottom-2 bg-blue-500 bg-opacity-20 border border-blue-500 rounded cursor-pointer hover:bg-opacity-30 transition-colors"
                        style={{
                          width,
                          left: 0,
                        }}
                        onClick={() => onAllocationClick?.(allocation)}
                      >
                        <div className="p-1 text-xs text-blue-800 font-medium truncate">
                          {allocation.percentage}%
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!timelineRange) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No timeline data available for the selected cycle.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Timeline & Gantt View
          </CardTitle>

          <div className="flex items-center space-x-2">
            {/* View Mode Selector */}
            <Select
              value={currentViewMode}
              onValueChange={(value: TimelineViewMode) =>
                setCurrentViewMode(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teams">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Teams
                  </div>
                </SelectItem>
                <SelectItem value="epics">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Epics
                  </div>
                </SelectItem>
                <SelectItem value="projects">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Projects
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (zoomLevel === 'months') setZoomLevel('weeks');
                  else if (zoomLevel === 'weeks') setZoomLevel('days');
                }}
                disabled={zoomLevel === 'days'}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm border-x">{zoomLevel}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (zoomLevel === 'days') setZoomLevel('weeks');
                  else if (zoomLevel === 'weeks') setZoomLevel('months');
                }}
                disabled={zoomLevel === 'months'}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Timeline Header */}
        <div className="grid grid-cols-[300px_1fr] border-t border-gray-200 mt-4">
          <div className="p-3 border-r border-gray-200 bg-gray-50 font-medium text-sm">
            {currentViewMode === 'teams'
              ? 'Teams'
              : currentViewMode === 'epics'
                ? 'Epics'
                : 'Projects'}
          </div>
          <div className="flex bg-gray-50">
            {timelineColumns.map(col => (
              <div
                key={col.key}
                className="flex-1 p-2 border-r border-gray-200 text-center text-xs font-medium"
                style={{ minWidth: '60px' }}
              >
                {col.label}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <Button
              variant={showOnlyAllocated ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyAllocated(!showOnlyAllocated)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Show Only Allocated
            </Button>

            {currentViewMode === 'teams' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Teams:</span>
                <Select
                  value={
                    selectedTeamIds.length === 1 ? selectedTeamIds[0] : 'all'
                  }
                  onValueChange={value =>
                    setSelectedTeamIds(value === 'all' ? [] : [value])
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="overflow-auto">
          {timelineItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="font-medium">No items to display</div>
              <div className="text-sm">
                {showOnlyAllocated
                  ? 'No allocated items found.'
                  : 'Try adjusting your filters.'}
              </div>
            </div>
          ) : (
            <div className="min-w-[800px]">
              {timelineItems.map(renderGanttRow)}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-6 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded" />
              <span>Allocation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={75} className="w-16 h-1" />
              <span>Progress</span>
            </div>
            <div className="text-gray-500">
              Click on allocations to edit • Hover for details
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineGanttView;
