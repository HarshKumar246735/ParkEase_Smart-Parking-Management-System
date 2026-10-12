import { env } from '../config/env.js';

export function dayKey(date, tz = env.timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Last n day keys (YYYY-MM-DD) in the app timezone, oldest first. */
export function lastNDayKeys(n, now = new Date()) {
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) keys.push(dayKey(new Date(now.getTime() - i * 86400000)));
  return keys;
}

/** [start, end) for a YYYY-MM-DD day in the configured offset. Returns null if invalid. */
export function dayRange(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return null;
  const start = new Date(`${dateStr}T00:00:00${env.tzOffset}`);
  if (Number.isNaN(start.getTime())) return null;
  return [start, new Date(start.getTime() + 86400000)];
}
