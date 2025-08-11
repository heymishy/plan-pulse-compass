import React from 'react';
import ModernCalendar from '../components/calendar/ModernCalendar';

const CalendarPage: React.FC = () => {
  return (
    <div className="p-6" data-testid="calendar-page-container">
      <ModernCalendar />
    </div>
  );
};

export default CalendarPage;
