/**
 * Get the Monday of the week containing the given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get array of 7 dates starting from Monday
 */
export function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if report can be submitted based on week and current time
 * Default rule: allowed starting Sunday 6:00 PM local time or later
 */
export function canSubmitReport(
  weekStart: Date,
  now: Date = new Date()
): { allowed: boolean; reason: string } {
  const weekDates = getWeekDates(weekStart);
  const sunday = weekDates[6]; // Sunday is last day
  
  // Set Sunday at 18:00 (6:00 PM) local time
  const submitTime = new Date(sunday);
  submitTime.setHours(18, 0, 0, 0);

  if (now >= submitTime) {
    return { allowed: true, reason: '' };
  }

  // Format the submission time for display
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  const readableTime = submitTime.toLocaleString('en-US', options);

  return {
    allowed: false,
    reason: `Submission opens ${readableTime}`,
  };
}

/**
 * Get readable week range string (e.g., "Jan 26 - Feb 1, 2026")
 */
export function getWeekRangeString(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startMonth = weekStart.toLocaleString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();
  const year = weekEnd.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Get day name for display
 */
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
