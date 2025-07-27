// Calendar-specific types for Plan Pulse Compass
// Follows existing type patterns from types/index.ts

export type CalendarEventType =
  | 'holiday'
  | 'milestone'
  | 'epic-completion'
  | 'release'
  | 'planning-event'
  | 'iteration-start'
  | 'iteration-end'
  | 'custom';

export interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  date: string; // ISO date string
  type: CalendarEventType;
  projectId?: string; // Optional link to project
  teamId?: string; // Optional link to team
  epicId?: string; // Optional link to epic
  milestoneId?: string; // Optional link to milestone
  releaseId?: string; // Optional link to release
  createdDate: string;
  lastModified: string;
}

export interface CalendarFilters {
  projects: string[]; // project IDs
  teams: string[]; // team IDs
  divisions: string[]; // division IDs
  eventTypes: CalendarEventType[];
  month?: number; // 1-12
  year?: number;
  financialYear?: string;
  quarter?: string;
}

export interface CalendarViewConfig {
  defaultView: 'month' | 'week' | 'year';
  showWeekends: boolean;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showEventDetails: boolean;
  maxEventsPerDay: number;
}

// Derived events from existing data
export interface DerivedCalendarEvent {
  id: string;
  name: string;
  description?: string;
  date: string;
  type: CalendarEventType;
  sourceType: 'milestone' | 'epic' | 'release' | 'iteration';
  sourceId: string;
  projectId?: string;
  teamId?: string;
}
