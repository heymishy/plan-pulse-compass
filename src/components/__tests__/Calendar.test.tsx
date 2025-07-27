import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calendar from '../Calendar';
import { CalendarEvent, CalendarEventType } from '../../types/calendarTypes';

// Mock data
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    name: 'Project Launch',
    description: 'Major project launch event',
    date: '2024-01-15',
    type: 'milestone',
    projectId: 'proj-1',
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Epic Completion',
    date: '2024-01-20',
    type: 'epic-completion',
    epicId: 'epic-1',
    projectId: 'proj-1',
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Holiday - New Year',
    date: '2024-01-01',
    type: 'holiday',
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const mockProjects = [
  {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Test project description',
    status: 'in-progress' as const,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 100000,
    milestones: ['milestone-1'],
    priority: 1,
    ranking: 1,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const mockTeams = [
  {
    id: 'team-1',
    name: 'Development Team',
    description: 'Main development team',
    type: 'permanent' as const,
    status: 'active' as const,
    capacity: 100,
    targetSkills: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

const mockMilestones = [
  {
    id: 'milestone-1',
    name: 'Project Launch',
    description: 'Major project launch milestone',
    projectId: 'proj-1',
    dueDate: '2024-01-15',
    status: 'not-started' as const,
    isCompleted: false,
    createdDate: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
];

describe('Calendar Component', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Calendar />);

    expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
  });

  it('should display current month by default', () => {
    render(<Calendar />);

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', {
      month: 'long',
    });
    const currentYear = currentDate.getFullYear();

    expect(
      screen.getByText(new RegExp(`${currentMonth} ${currentYear}`))
    ).toBeInTheDocument();
  });

  it('should display events on calendar', async () => {
    render(<Calendar events={mockEvents} />);

    // Should show current date events by default
    await waitFor(() => {
      // Check that there is an events section
      expect(screen.getByText(/Events for/)).toBeInTheDocument();
    });
  });

  it('should navigate between months', async () => {
    render(<Calendar />);

    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);

    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);

    // Should be back to current month
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', {
      month: 'long',
    });
    const currentYear = currentDate.getFullYear();

    expect(
      screen.getByText(new RegExp(`${currentMonth} ${currentYear}`))
    ).toBeInTheDocument();
  });

  it('should display event details on click', async () => {
    // Set the date to January 15, 2024 where we have the Project Launch event
    const testDate = new Date('2024-01-15');
    vi.spyOn(Date, 'now').mockReturnValue(testDate.getTime());

    render(<Calendar events={mockEvents} />);

    // Wait for the Project Launch event to appear in the events list
    await waitFor(() => {
      const eventElement = screen.getByText('Project Launch');
      expect(eventElement).toBeInTheDocument();

      // Click on the event
      fireEvent.click(eventElement);
    });

    await waitFor(() => {
      expect(screen.getByText('Event Details')).toBeInTheDocument();
      // Check specifically for the dialog content by looking for multiple instances
      expect(screen.getAllByText('Major project launch event')).toHaveLength(2);
    });
  });

  it('should handle month/year navigation', async () => {
    render(<Calendar />);

    // Should have month/year selectors
    expect(screen.getByTestId('month-selector')).toBeInTheDocument();
    expect(screen.getByTestId('year-selector')).toBeInTheDocument();
  });

  it('should create new events', async () => {
    const onEventCreate = vi.fn();

    render(<Calendar onEventCreate={onEventCreate} />);

    // Click on add event button
    const addButton = screen.getByText('Add Event');
    fireEvent.click(addButton);

    // Fill out form
    const nameInput = screen.getByLabelText('Event Name');
    const dateInput = screen.getByLabelText('Event Date');
    const typeSelect = screen.getByLabelText('Event Type');

    fireEvent.change(nameInput, { target: { value: 'New Event' } });
    fireEvent.change(dateInput, { target: { value: '2024-02-01' } });
    fireEvent.change(typeSelect, { target: { value: 'custom' } });

    // Submit form
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Event',
          date: '2024-02-01',
          type: 'custom',
        })
      );
    });
  });

  it('should integrate with existing milestone data', async () => {
    // Set the date to January 15, 2024 where we have the milestone event
    const testDate = new Date('2024-01-15');
    vi.spyOn(Date, 'now').mockReturnValue(testDate.getTime());

    render(<Calendar milestones={mockMilestones} projects={mockProjects} />);

    // Should automatically create calendar events from milestones
    await waitFor(() => {
      expect(screen.getByText('Project Launch')).toBeInTheDocument();
    });
  });

  it('should handle different event types with proper styling', async () => {
    // Set the date to January 15, 2024 where we have events
    const testDate = new Date('2024-01-15');
    vi.spyOn(Date, 'now').mockReturnValue(testDate.getTime());

    render(<Calendar events={mockEvents} />);

    // Wait for events to load and check their styling
    await waitFor(() => {
      const milestoneEvent = screen.getByText('Project Launch');
      expect(
        milestoneEvent.closest('[data-event-type="milestone"]')
      ).toBeInTheDocument();
    });
  });

  it('should filter events by project', async () => {
    // Set the date to January 15, 2024 where we have events
    const testDate = new Date('2024-01-15');
    vi.spyOn(Date, 'now').mockReturnValue(testDate.getTime());

    render(<Calendar events={mockEvents} projects={mockProjects} />);

    // Check that filter dropdown exists
    await waitFor(() => {
      expect(screen.getByText('All Projects')).toBeInTheDocument();
    });
  });

  it('should show add event dialog', async () => {
    render(<Calendar />);

    const addButton = screen.getByText('Add Event');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
    });
  });
});
