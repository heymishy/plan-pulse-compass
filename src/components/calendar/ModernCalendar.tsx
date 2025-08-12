/**
 * ModernCalendar - High-quality calendar component
 *
 * Features:
 * - Full-width responsive design
 * - Multiple view modes (Week/Month/Quarter)
 * - Financial year filtering
 * - Iteration overlays with visual blocks
 * - Event management and display
 * - Performance optimized with proper memoization
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Target,
  Clock,
  FolderOpen,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isSameQuarter,
  isToday,
  addMonths,
  subMonths,
  addQuarters,
  subQuarters,
  getQuarter,
  getYear,
  isWithinInterval,
} from 'date-fns';
import { useApp } from '@/context/AppContext';

// Types
interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  date: string;
  type:
    | 'milestone'
    | 'epic-completion'
    | 'project-start'
    | 'project-end'
    | 'custom'
    | 'holiday';
  projectId?: string;
  epicId?: string;
  milestoneId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

type ViewMode = 'month' | 'quarter' | 'week';

// Constants
const ITERATION_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
];

// Custom Hooks
const useFinancialYear = () => {
  const getFinancialYear = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 3 ? year : year - 1; // April = month 3 (0-indexed)
  }, []);

  const getCurrentFinancialYear = useCallback(
    () => getFinancialYear(new Date()),
    [getFinancialYear]
  );

  const getFinancialYearRange = useCallback((fyYear: number) => {
    const start = new Date(fyYear, 3, 1); // April 1st
    const end = new Date(fyYear + 1, 2, 31); // March 31st
    return { start, end };
  }, []);

  const availableFinancialYears = useMemo(() => {
    const currentFY = getCurrentFinancialYear();
    const years = [];
    for (let i = -2; i <= 2; i++) {
      const fy = currentFY + i;
      years.push({
        value: fy.toString(),
        label: `FY ${fy}-${(fy + 1).toString().slice(2)}`,
      });
    }
    return years;
  }, [getCurrentFinancialYear]);

  return {
    getFinancialYear,
    getCurrentFinancialYear,
    getFinancialYearRange,
    availableFinancialYears,
  };
};

const useCalendarEvents = (
  projects: any[],
  milestones: any[],
  epics: any[]
) => {
  return useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // Add milestone events
    milestones.forEach(milestone => {
      events.push({
        id: `milestone-${milestone.id}`,
        name: milestone.name,
        description: milestone.description,
        date: milestone.dueDate,
        type: 'milestone',
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        priority:
          (milestone.priority as 'low' | 'medium' | 'high' | 'critical') ||
          'medium',
      });
    });

    // Add epic completion events
    epics
      .filter(epic => epic.endDate)
      .forEach(epic => {
        events.push({
          id: `epic-${epic.id}`,
          name: `${epic.name} Completion`,
          description: `Epic: ${epic.description}`,
          date: epic.endDate!,
          type: 'epic-completion',
          projectId: epic.projectId,
          epicId: epic.id,
          priority: 'medium',
        });
      });

    // Add project start/end dates
    projects.forEach(project => {
      if (project.startDate) {
        events.push({
          id: `project-start-${project.id}`,
          name: `${project.name} Start`,
          description: `Project kickoff: ${project.description}`,
          date: project.startDate,
          type: 'project-start',
          projectId: project.id,
          priority: 'high',
        });
      }
      if (project.endDate) {
        events.push({
          id: `project-end-${project.id}`,
          name: `${project.name} End`,
          description: `Project completion: ${project.description}`,
          date: project.endDate,
          type: 'project-end',
          projectId: project.id,
          priority: 'high',
        });
      }
    });

    return events;
  }, [milestones, epics, projects]);
};

const ModernCalendar: React.FC = () => {
  const { projects = [], milestones = [], epics = [], cycles = [] } = useApp();
  const iterations = cycles || [];

  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFinancialYear, setFilterFinancialYear] =
    useState<string>('current');
  const [showIterations, setShowIterations] = useState(true);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // Custom hooks
  const {
    getCurrentFinancialYear,
    getFinancialYearRange,
    availableFinancialYears,
  } = useFinancialYear();
  const calendarEvents = useCalendarEvents(projects, milestones, epics);

  // Calculate calendar days based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === 'quarter') {
      const start = startOfWeek(startOfQuarter(currentDate));
      const end = endOfWeek(endOfQuarter(currentDate));
      return eachDayOfInterval({ start, end });
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      // month view
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      // Search filter
      if (
        searchTerm &&
        !event.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Project filter
      if (filterProject !== 'all' && event.projectId !== filterProject) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && event.type !== filterType) {
        return false;
      }

      // Financial year filter
      if (filterFinancialYear !== 'all') {
        const eventDate = parseISO(event.date);
        if (filterFinancialYear === 'current') {
          const currentFY = getCurrentFinancialYear();
          const { start, end } = getFinancialYearRange(currentFY);
          if (!isWithinInterval(eventDate, { start, end })) {
            return false;
          }
        } else {
          const fyYear = parseInt(filterFinancialYear);
          const { start, end } = getFinancialYearRange(fyYear);
          if (!isWithinInterval(eventDate, { start, end })) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    calendarEvents,
    searchTerm,
    filterProject,
    filterType,
    filterFinancialYear,
    getCurrentFinancialYear,
    getFinancialYearRange,
  ]);

  // Get visible iterations
  const visibleIterations = useMemo(() => {
    if (
      !showIterations ||
      !iterations ||
      iterations.length === 0 ||
      calendarDays.length === 0
    ) {
      return [];
    }

    const calendarStart = calendarDays[0];
    const calendarEnd = calendarDays[calendarDays.length - 1];

    return iterations
      .filter(iteration => {
        if (!iteration.startDate || !iteration.endDate) return false;
        const iterStart = parseISO(iteration.startDate);
        const iterEnd = parseISO(iteration.endDate);

        // Check if iteration overlaps with calendar view
        return iterStart <= calendarEnd && iterEnd >= calendarStart;
      })
      .map((iteration, index) => ({
        ...iteration,
        colorIndex: index % ITERATION_COLORS.length,
        colorClass: ITERATION_COLORS[index % ITERATION_COLORS.length],
      }));
  }, [iterations, showIterations, calendarDays]);

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date) => {
      return filteredEvents.filter(event =>
        isSameDay(parseISO(event.date), date)
      );
    },
    [filteredEvents]
  );

  // Event type styling
  const getEventTypeStyles = useCallback((type: CalendarEvent['type']) => {
    const base = 'text-xs px-2 py-1 rounded-full font-medium';

    switch (type) {
      case 'milestone':
        return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
      case 'epic-completion':
        return `${base} bg-green-100 text-green-700 border border-green-200`;
      case 'project-start':
        return `${base} bg-purple-100 text-purple-700 border border-purple-200`;
      case 'project-end':
        return `${base} bg-orange-100 text-orange-700 border border-orange-200`;
      case 'custom':
        return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
      case 'holiday':
        return `${base} bg-red-100 text-red-700 border border-red-200`;
      default:
        return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
    }
  }, []);

  const getEventIcon = useCallback((type: CalendarEvent['type']) => {
    switch (type) {
      case 'milestone':
        return <Target className="h-3 w-3" />;
      case 'epic-completion':
        return <Clock className="h-3 w-3" />;
      case 'project-start':
      case 'project-end':
        return <FolderOpen className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  }, []);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    if (viewMode === 'quarter') {
      setCurrentDate(subQuarters(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
      });
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  }, [viewMode, currentDate]);

  const goToNext = useCallback(() => {
    if (viewMode === 'quarter') {
      setCurrentDate(addQuarters(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
      });
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  }, [viewMode, currentDate]);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  // Get current period label
  const getCurrentPeriodLabel = useCallback(() => {
    if (viewMode === 'quarter') {
      const quarter = getQuarter(currentDate);
      const year = getYear(currentDate);
      return `Q${quarter} ${year}`;
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  }, [currentDate, viewMode]);

  // Render iteration blocks
  const renderIterationBlocks = useCallback(() => {
    if (!showIterations || visibleIterations.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-0">
        {visibleIterations.map(iteration => {
          if (!iteration.startDate || !iteration.endDate) return null;

          const iterStart = parseISO(iteration.startDate);
          const iterEnd = parseISO(iteration.endDate);

          // Find the start and end day positions, handling cases where dates are outside calendar view
          let startIndex = calendarDays.findIndex(day =>
            isSameDay(day, iterStart)
          );
          let endIndex = calendarDays.findIndex(day => isSameDay(day, iterEnd));

          // If iteration starts before calendar view, start from first day
          if (startIndex < 0 && iterStart < calendarDays[0]) {
            startIndex = 0;
          }

          // If iteration ends after calendar view, end at last day
          if (endIndex < 0 && iterEnd > calendarDays[calendarDays.length - 1]) {
            endIndex = calendarDays.length - 1;
          }

          // If iteration still not found in calendar view, skip
          if (startIndex < 0 || endIndex < 0) return null;

          // Calculate position for each row that the iteration spans
          const startRow = Math.floor(startIndex / 7);
          const endRow = Math.floor(endIndex / 7);
          const blocks = [];

          for (let row = startRow; row <= endRow; row++) {
            const rowStartIndex = row * 7;
            const rowEndIndex = Math.min(
              (row + 1) * 7 - 1,
              calendarDays.length - 1
            );

            const blockStart = Math.max(startIndex, rowStartIndex);
            const blockEnd = Math.min(endIndex, rowEndIndex);

            const startCol = blockStart % 7;
            const endCol = blockEnd % 7;
            const blockWidth = ((endCol - startCol + 1) / 7) * 100;
            const blockLeft = (startCol / 7) * 100;

            // Create visual indicator for partial blocks
            const isPartialStart =
              startIndex === 0 && iterStart < calendarDays[0];
            const isPartialEnd =
              endIndex === calendarDays.length - 1 &&
              iterEnd > calendarDays[calendarDays.length - 1];

            blocks.push(
              <div
                key={`${iteration.id}-row-${row}`}
                className={`absolute rounded border-2 opacity-30 flex items-center justify-center ${iteration.colorClass} ${isPartialStart || isPartialEnd ? 'border-dashed' : ''}`}
                style={{
                  top: `${row * 120}px`,
                  left: `${blockLeft}%`,
                  width: `${blockWidth}%`,
                  height: '120px',
                }}
                title={`${iteration.name}: ${format(iterStart, 'MMM d')} - ${format(iterEnd, 'MMM d')}${isPartialStart || isPartialEnd ? ' (extends beyond calendar view)' : ''}`}
              >
                {row === startRow && (
                  <span className="text-xs font-semibold text-center px-2 py-1 rounded bg-white bg-opacity-70">
                    {isPartialStart ? '← ' : ''}
                    {iteration.name}
                    {isPartialEnd ? ' →' : ''}
                  </span>
                )}
              </div>
            );
          }

          return blocks;
        })}
      </div>
    );
  }, [showIterations, visibleIterations, calendarDays]);

  return (
    <div className="space-y-6" data-testid="calendar-container">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-3">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Calendar</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Project milestones, epics, and important dates
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Dialog
                open={isEventDialogOpen}
                onOpenChange={setIsEventDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Event</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-gray-600">
                      Custom event creation functionality will be implemented
                      here. Milestones and epic dates are automatically imported
                      from your projects.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters and Controls */}
          <div className="space-y-4 mb-6">
            {/* First row - Search and main filters */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Financial Year Filter */}
                <Select
                  value={filterFinancialYear}
                  onValueChange={setFilterFinancialYear}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Financial Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="current">Current FY</SelectItem>
                    {availableFinancialYears.map(fy => (
                      <SelectItem key={fy.value} value={fy.value}>
                        {fy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Project Filter */}
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="milestone">Milestones</SelectItem>
                    <SelectItem value="epic-completion">
                      Epic Completions
                    </SelectItem>
                    <SelectItem value="project-start">
                      Project Starts
                    </SelectItem>
                    <SelectItem value="project-end">Project Ends</SelectItem>
                    <SelectItem value="custom">Custom Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <Tabs
                value={viewMode}
                onValueChange={value => setViewMode(value as ViewMode)}
              >
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="quarter">Quarter</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Second row - Iteration toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={showIterations ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowIterations(!showIterations)}
                  className="flex items-center space-x-2"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${showIterations ? 'bg-white' : 'bg-blue-500'}`}
                  />
                  <span>Show Iterations</span>
                </Button>

                {showIterations && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Iterations:</span>
                    <div className="flex items-center space-x-1">
                      {ITERATION_COLORS.slice(0, 4).map((color, index) => (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded border-2 ${color.split(' ')[0]} ${color.split(' ')[1]}`}
                        />
                      ))}
                      <span className="text-xs">+more</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500">
                {filteredEvents.length} events in {getCurrentPeriodLabel()}
              </div>
            </div>
          </div>

          {/* Period Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-semibold min-w-[200px] text-center">
                {getCurrentPeriodLabel()}
              </h2>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden bg-white relative">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="p-4 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Container */}
            <div className="relative">
              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map(day => {
                  const dayEvents = getEventsForDate(day);

                  const isCurrentPeriod =
                    viewMode === 'quarter'
                      ? isSameQuarter(day, currentDate)
                      : viewMode === 'month'
                        ? isSameMonth(day, currentDate)
                        : true;
                  const isDayToday = isToday(day);
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[120px] p-2 border-r border-b last:border-r-0 relative
                        ${isCurrentPeriod ? 'bg-white' : 'bg-gray-50'}
                        ${isDayToday ? 'bg-blue-50' : ''}
                        ${isSelected ? 'bg-blue-100' : ''}
                        cursor-pointer hover:bg-gray-50 transition-colors
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <span
                          className={`
                          text-sm font-medium
                          ${isDayToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                          ${isCurrentPeriod ? 'text-gray-900' : 'text-gray-400'}
                        `}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>

                      {/* Events for this day */}
                      <div className="space-y-1 relative z-10">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`${getEventTypeStyles(event.type)} flex items-center space-x-1 truncate`}
                            title={`${event.name}${event.description ? `: ${event.description}` : ''}`}
                          >
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.name}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Iteration Block Overlays */}
              {renderIterationBlocks()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Events for {format(selectedDate, 'PPPP')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No events scheduled for this date</p>
                  <p className="text-sm">
                    Add custom events or milestones will appear here
                    automatically
                  </p>
                </div>
              ) : (
                getEventsForDate(selectedDate).map(event => {
                  const project = projects.find(p => p.id === event.projectId);
                  return (
                    <Card
                      key={event.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              {getEventIcon(event.type)}
                              <h3 className="font-medium text-lg">
                                {event.name}
                              </h3>
                              <Badge className={getEventTypeStyles(event.type)}>
                                {event.type.replace('-', ' ')}
                              </Badge>
                            </div>

                            {event.description && (
                              <p className="text-gray-600 ml-6">
                                {event.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 ml-6 text-sm text-gray-500">
                              {project && (
                                <div className="flex items-center space-x-1">
                                  <FolderOpen className="h-4 w-4" />
                                  <span>{project.name}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(parseISO(event.date), 'PPP')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernCalendar;
