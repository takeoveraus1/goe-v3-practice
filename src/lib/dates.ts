/**
 * Calendar-date helpers. Dates are plain `YYYY-MM-DD` strings (no time zone), and
 * all arithmetic happens in UTC so a date never shifts by a day. "Today" is the
 * only thing that depends on a time zone – see `todayIn`.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toUtc(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The current calendar date in `timeZone` (falls back to UTC for unknown zones). */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * DAY_MS);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(iso: string): number {
  return (new Date(toUtc(iso)).getUTCDay() + 6) % 7;
}

/** The Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

/** The seven dates (Mon–Sun) of the week containing `iso`. */
export function weekDates(iso: string): string[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Intl.DateTimeFormat("en-AU", { ...options, timeZone: "UTC" }).format(new Date(toUtc(iso)));
}

export function formatLongDate(iso: string): string {
  return formatDate(iso, { weekday: "long", day: "numeric", month: "long" });
}

/** "6:30 am" from "06:30". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Minutes between two "HH:MM" times on the same day (0 if end is before start). */
export function minutesBetween(start: string, end: string): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(0, toMinutes(end) - toMinutes(start));
}

export interface BlockProgress {
  /** 1-based week number, clamped to the block length. */
  week: number;
  totalWeeks: number;
  /** Days remaining including today; 0 once the block's last day has passed. */
  daysLeft: number;
  /** 0–1 through the block. */
  fraction: number;
  hasStarted: boolean;
  hasEnded: boolean;
}

/** The last day of a block that starts on `startDate` and runs `weeks` weeks. */
export function blockEndDate(startDate: string, weeks: number): string {
  return addDays(startDate, weeks * 7 - 1);
}

export function blockProgress(startDate: string, weeks: number, today: string): BlockProgress {
  const totalDays = weeks * 7;
  const elapsed = daysBetween(startDate, today);
  const clamped = Math.min(Math.max(elapsed, 0), totalDays);
  return {
    week: Math.min(Math.max(Math.floor(elapsed / 7) + 1, 1), weeks),
    totalWeeks: weeks,
    daysLeft: Math.max(totalDays - Math.max(elapsed, 0), 0),
    fraction: clamped / totalDays,
    hasStarted: elapsed >= 0,
    hasEnded: elapsed >= totalDays,
  };
}

/** The calendar date (YYYY-MM-DD) of an epoch-ms timestamp in `timeZone`. */
export function isoDateOf(ms: number, timeZone: string): string {
  return todayIn(timeZone, new Date(ms));
}

/** "today", "yesterday", "3 days ago", "in 2 days". */
export function relativeDay(iso: string, today: string): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "today";
  if (diff === -1) return "yesterday";
  if (diff === 1) return "tomorrow";
  return diff < 0 ? `${-diff} days ago` : `in ${diff} days`;
}

/** "6:30–7:30 am", or "11:00 am–12:30 pm" when the range crosses noon. */
export function formatTimeRange(start: string, end: string): string {
  const [s, e] = [formatTime(start), formatTime(end)];
  const [sTime, sSuffix] = s.split(" ");
  const [, eSuffix] = e.split(" ");
  return sSuffix === eSuffix ? `${sTime}–${e}` : `${s}–${e}`;
}

/** Which week of a block a date falls in (1-based), or "pre"/"after" outside it (5. Schedule, Week #). */
export function blockWeekOf(startDate: string, weeks: number, date: string): number | "pre" | "after" {
  const elapsed = daysBetween(startDate, date);
  if (elapsed < 0) return "pre";
  if (elapsed >= weeks * 7) return "after";
  return Math.floor(elapsed / 7) + 1;
}

/** The date of the weekly check-in for week `week` of a block (checkInDay: 0 = Monday … 6 = Sunday). */
export function checkInDateForWeek(startDate: string, checkInDay: number, week: number): string {
  const weekStart = addDays(startDate, (week - 1) * 7);
  const offset = (checkInDay - weekdayIndex(weekStart) + 7) % 7;
  return addDays(weekStart, offset);
}
