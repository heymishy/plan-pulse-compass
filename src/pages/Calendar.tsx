import React from 'react';
import Calendar from '../components/Calendar';

const CalendarPage: React.FC = () => {
  return (
    <div className="p-4" data-testid="calendar-page-container">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <Calendar />
    </div>
  );
};

export default CalendarPage;
