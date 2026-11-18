/** Shared wall-clock time helpers. Times are "HH:mm" strings in clinic time. */

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "09:30" -> 570 minutes. Returns null for invalid input. */
export function timeToMinutes(value) {
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 570 -> "09:30". Clamps to a valid same-day time. */
export function minutesToTime(totalMinutes) {
  const safe = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Normalise a calendar date to UTC midnight.
 *
 * OpenCare stores an appointment's *calendar day* (not an instant) plus a
 * wall-clock time. Pinning the date to UTC midnight keeps a booking on the day
 * the clinic means, no matter what timezone the server or browser runs in.
 *
 * Accepts "YYYY-MM-DD" or a Date. Invalid input is returned untouched so that
 * Mongoose produces its normal CastError instead of silently inventing a date.
 */
export function toUtcMidnight(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    // Reject impossible dates such as 2026-02-31, which Date would roll over.
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed;
    }
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  return value;
}

/** "YYYY-MM-DD" for a stored calendar date (UTC-based, timezone independent). */
export function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** Minutes between two same-day "HH:mm" values, or null if either is invalid. */
export function durationMinutes(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) return null;
  return end - start;
}
