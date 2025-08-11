import { parse, isValid, format, isWithinInterval } from 'date-fns';
import { Cycle } from '@/types';

const SUPPORTED_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'M/d/yyyy',
  'yyyy.MM.dd',
  'dd-MM-yyyy',
  'yyyy/MM/dd',
];

export const parseDateString = (
  dateString: string | undefined | null
): string | undefined => {
  if (!dateString) {
    return undefined;
  }

  for (const fmt of SUPPORTED_FORMATS) {
    const parsedDate = parse(dateString, fmt, new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, 'yyyy-MM-dd');
    }
  }

  const fallbackDate = new Date(dateString);
  if (isValid(fallbackDate)) {
    return format(fallbackDate, 'yyyy-MM-dd');
  }

  return undefined;
};

/**
 * Determines the current financial year based on a financial year start date
 * @param fyStartDate - Financial year start date (e.g., "2025-04-01")
 * @param currentDate - Optional date to check against (defaults to current date)
 * @returns The financial year start date for the current financial year
 */
export const getCurrentFinancialYear = (
  fyStartDate: string,
  currentDate: Date = new Date()
): string => {
  const fyStart = new Date(fyStartDate);
  const fyMonth = fyStart.getMonth();
  const fyDay = fyStart.getDate();

  const currentYear = currentDate.getFullYear();

  // Create financial year start for current calendar year
  const currentFyStart = new Date(currentYear, fyMonth, fyDay);

  // If current date is before the FY start date, we're in the previous financial year
  if (currentDate < currentFyStart) {
    return `${currentYear - 1}-${String(fyMonth + 1).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;
  }

  // Otherwise, we're in the current financial year
  return `${currentYear}-${String(fyMonth + 1).padStart(2, '0')}-${String(fyDay).padStart(2, '0')}`;
};

/**
 * Determines the current quarter based on the current date and available quarterly cycles
 * @param quarterCycles - Array of quarterly cycles to check against
 * @param currentDate - Optional date to check against (defaults to current date)
 * @returns The quarterly cycle that contains the current date, next upcoming quarter, or first quarter chronologically
 */
export const getCurrentQuarterByDate = (
  quarterCycles: Cycle[],
  currentDate: Date = new Date()
): Cycle | null => {
  if (!quarterCycles || quarterCycles.length === 0) {
    return null;
  }

  // Find the quarter that contains the current date
  const currentQuarter = quarterCycles.find(cycle => {
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);

    return isWithinInterval(currentDate, {
      start: startDate,
      end: endDate,
    });
  });

  if (currentQuarter) {
    return currentQuarter;
  }

  // If no quarter contains the current date, find the nearest future quarter
  const futureQuarters = quarterCycles
    .filter(cycle => new Date(cycle.startDate) > currentDate)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  if (futureQuarters.length > 0) {
    return futureQuarters[0];
  }

  // If no future quarters, return the first quarter chronologically
  // This ensures consistent behavior, especially for testing scenarios
  const sortedQuarters = quarterCycles.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return sortedQuarters[0] || null;
};

/**
 * Gets the start date of the next quarter based on the current date and available quarterly cycles
 * @param quarterCycles - Array of quarterly cycles to check against
 * @param currentDate - Optional date to check against (defaults to current date)
 * @returns The start date of the next quarter as an ISO string, or current date if no quarters found
 */
export const getNextQuarterStartDate = (
  quarterCycles: Cycle[],
  currentDate: Date = new Date()
): string => {
  if (!quarterCycles || quarterCycles.length === 0) {
    return format(currentDate, 'yyyy-MM-dd');
  }

  // Find the next quarter after the current date
  const futureQuarters = quarterCycles
    .filter(cycle => new Date(cycle.startDate) > currentDate)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  if (futureQuarters.length > 0) {
    return format(new Date(futureQuarters[0].startDate), 'yyyy-MM-dd');
  }

  // If no future quarters, use the current quarter or first available quarter
  const currentQuarter = getCurrentQuarterByDate(quarterCycles, currentDate);
  if (currentQuarter) {
    return format(new Date(currentQuarter.startDate), 'yyyy-MM-dd');
  }

  // Fallback to current date if no quarters available
  return format(currentDate, 'yyyy-MM-dd');
};
