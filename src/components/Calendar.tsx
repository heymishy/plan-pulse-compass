import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarFilters,
  Project,
  Team,
  Milestone,
  Epic,
} from '@/types';

interface CalendarProps {
  events?: CalendarEvent[];
  projects?: Project[];
  teams?: Team[];
  milestones?: Milestone[];
  epics?: Epic[];
  onEventCreate?: (
    event: Omit<CalendarEvent, 'id' | 'createdDate' | 'lastModified'>
  ) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  projects = [],
  teams = [],
  milestones = [],
  epics = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    name: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'custom',
  });

  const [filters, setFilters] = useState<CalendarFilters>({
    projects: [],
    teams: [],
    divisions: [],
    eventTypes: [],
  });

  // Derive events from milestones and epics
  const derivedEvents = useMemo(() => {
    const derived: CalendarEvent[] = [];

    // Add milestone events
    milestones.forEach(milestone => {
      const project = projects.find(p => p.id === milestone.projectId);
      derived.push({
        id: `milestone-${milestone.id}`,
        name: milestone.name,
        description: milestone.description,
        date: milestone.dueDate,
        type: 'milestone',
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        createdDate: milestone.createdDate,
        lastModified: milestone.lastModified,
      });
    });

    // Add epic completion events
    epics
      .filter(epic => epic.endDate)
      .forEach(epic => {
        const project = projects.find(p => p.id === epic.projectId);
        derived.push({
          id: `epic-${epic.id}`,
          name: `${epic.name} - Completion`,
          description: `Epic completion: ${epic.description}`,
          date: epic.endDate!,
          type: 'epic-completion',
          projectId: epic.projectId,
          epicId: epic.id,
          createdDate: epic.createdDate,
          lastModified: epic.lastModified,
        });
      });

    return derived;
  }, [milestones, epics, projects]);

  // Combine manual and derived events
  const allEvents = useMemo(() => {
    return [...events, ...derivedEvents];
  }, [events, derivedEvents]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Project filter
      if (
        filters.projects.length > 0 &&
        event.projectId &&
        !filters.projects.includes(event.projectId)
      ) {
        return false;
      }

      // Team filter
      if (
        filters.teams.length > 0 &&
        event.teamId &&
        !filters.teams.includes(event.teamId)
      ) {
        return false;
      }

      // Event type filter
      if (
        filters.eventTypes.length > 0 &&
        !filters.eventTypes.includes(event.type)
      ) {
        return false;
      }

      // Month/Year filter
      const eventDate = parseISO(event.date);
      const currentMonthStart = startOfMonth(selectedDate);
      const currentMonthEnd = endOfMonth(selectedDate);

      if (eventDate < currentMonthStart || eventDate > currentMonthEnd) {
        return false;
      }

      return true;
    });
  }, [allEvents, filters, selectedDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event =>
      isSameDay(parseISO(event.date), date)
    );
  };

  // Custom day content with events
  const renderDayWithEvents = (date: Date) => {
    const dayEvents = getEventsForDate(date);

    return (
      <div className="relative">
        {dayEvents.length > 0 && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    );
  };

  const getEventTypeStyles = (type: CalendarEventType) => {
    switch (type) {
      case 'holiday':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'milestone':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic-completion':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'release':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'planning-event':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'iteration-start':
      case 'iteration-end':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'custom':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateEvent = () => {
    if (newEvent.name && newEvent.date && newEvent.type && onEventCreate) {
      onEventCreate({
        name: newEvent.name,
        description: newEvent.description,
        date: newEvent.date,
        type: newEvent.type,
        projectId: newEvent.projectId,
        teamId: newEvent.teamId,
      });
      setNewEvent({
        name: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'custom',
      });
      setIsCreateDialogOpen(false);
    }
  };

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6" data-testid="calendar-container">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input
                        id="event-name"
                        value={newEvent.name || ''}
                        onChange={e =>
                          setNewEvent({ ...newEvent, name: e.target.value })
                        }
                        placeholder="Enter event name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-date">Event Date</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEvent.date || ''}
                        onChange={e =>
                          setNewEvent({ ...newEvent, date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-type">Event Type</Label>
                      <Select
                        value={newEvent.type || 'custom'}
                        onValueChange={(value: CalendarEventType) =>
                          setNewEvent({ ...newEvent, type: value })
                        }
                      >
                        <SelectTrigger id="event-type">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="planning-event">
                            Planning Event
                          </SelectItem>
                          <SelectItem value="release">Release</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="event-description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="event-description"
                        value={newEvent.description || ''}
                        onChange={e =>
                          setNewEvent({
                            ...newEvent,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter event description"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateEvent}>Save Event</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" aria-label="Previous month" />
              </Button>
              <h2 className="text-lg font-semibold">
                {format(selectedDate, 'MMMM yyyy')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(1)}
              >
                <ChevronRight className="h-4 w-4" aria-label="Next month" />
              </Button>
            </div>

            {/* Quick date selectors */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedDate.getMonth().toString()}
                onValueChange={value => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(parseInt(value));
                  setSelectedDate(newDate);
                }}
              >
                <SelectTrigger className="w-32" data-testid="month-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(2024, i, 1), 'MMMM')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDate.getFullYear().toString()}
                onValueChange={value => {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(parseInt(value));
                  setSelectedDate(newDate);
                }}
              >
                <SelectTrigger className="w-24" data-testid="year-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter Events
            </Button>

            <Select defaultValue="all-projects">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-projects">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="all-types">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="milestones">Milestones</SelectItem>
                <SelectItem value="holidays">Holidays</SelectItem>
                <SelectItem value="epic-completions">
                  Epic Completions
                </SelectItem>
                <SelectItem value="releases">Releases</SelectItem>
                <SelectItem value="custom">Custom Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={date => date && setSelectedDate(date)}
              month={selectedDate}
              modifiers={{
                hasEvents: date => getEventsForDate(date).length > 0,
              }}
              modifiersClassNames={{
                hasEvents: 'bg-blue-50',
              }}
              showOutsideDays
            />
          </div>

          {/* Events List for Selected Date */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>Events for {format(selectedDate, 'PPP')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500">No events for this date</p>
                  ) : (
                    getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEventDialogOpen(true);
                        }}
                        data-event-type={event.type}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.name}</h4>
                          <Badge className={getEventTypeStyles(event.type)}>
                            {event.type.replace('-', ' ')}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Event Name</Label>
                <p className="text-sm text-gray-600">{selectedEvent.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm text-gray-600">
                  {format(parseISO(selectedEvent.date), 'PPP')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Badge className={getEventTypeStyles(selectedEvent.type)}>
                  {selectedEvent.type.replace('-', ' ')}
                </Badge>
              </div>
              {selectedEvent.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
              {selectedEvent.projectId && (
                <div>
                  <Label className="text-sm font-medium">Project</Label>
                  <p className="text-sm text-gray-600">
                    {projects.find(p => p.id === selectedEvent.projectId)
                      ?.name || 'Unknown Project'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
