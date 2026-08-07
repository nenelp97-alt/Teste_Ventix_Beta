import { parseISO } from 'date-fns';

/**
 * Parses a YYYY-MM-DD date string as LOCAL time (midnight local),
 * avoiding the UTC offset that shifts the day back by 1.
 * For full ISO datetime strings, delegates to parseISO.
 */
export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  return parseISO(dateStr);
}