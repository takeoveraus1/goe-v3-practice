/**
 * Pure date logic for V3 training blocks. A block runs from its start date to
 * its end date inclusive; week 1 is the first seven days, and the last week can
 * be short. Each block week gets one check-in, due on that week's last day.
 */
import { addDays, daysBetween } from "@/lib/dates";

export type V3BlockPhase = "upcoming" | "current" | "past";

export interface V3BlockDates {
  startDate: string;
  endDate: string;
}

export function v3BlockLengthDays(block: V3BlockDates): number {
  return daysBetween(block.startDate, block.endDate) + 1;
}

export function v3BlockWeeks(block: V3BlockDates): number {
  return Math.max(1, Math.ceil(v3BlockLengthDays(block) / 7));
}

export function v3BlockPhase(block: V3BlockDates, today: string): V3BlockPhase {
  if (today < block.startDate) return "upcoming";
  if (today > block.endDate) return "past";
  return "current";
}

/** First and last day of block week `week` (1-based). The last week stops at the end date. */
export function v3WeekRange(block: V3BlockDates, week: number): { from: string; to: string } {
  const from = addDays(block.startDate, (week - 1) * 7);
  const sixLater = addDays(from, 6);
  return { from, to: sixLater < block.endDate ? sixLater : block.endDate };
}

/** The block week `date` falls in, or null outside the block. */
export function v3WeekOf(block: V3BlockDates, date: string): number | null {
  if (date < block.startDate || date > block.endDate) return null;
  return Math.floor(daysBetween(block.startDate, date) / 7) + 1;
}

/** How many weeks have started by `today` – the latest week that can be checked in. */
export function v3StartedWeeks(block: V3BlockDates, today: string): number {
  if (today < block.startDate) return 0;
  if (today > block.endDate) return v3BlockWeeks(block);
  return v3WeekOf(block, today)!;
}

export interface V3BlockProgress {
  phase: V3BlockPhase;
  totalWeeks: number;
  /** Current week while the block is running; null before and after. */
  currentWeek: number | null;
  /** 0–1 through the block. */
  fraction: number;
  /** Days left including today (current), days until it starts (upcoming), 0 once past. */
  daysLeft: number;
  daysUntilStart: number;
}

export function v3BlockProgress(block: V3BlockDates, today: string): V3BlockProgress {
  const phase = v3BlockPhase(block, today);
  const total = v3BlockLengthDays(block);
  const elapsed = daysBetween(block.startDate, today);
  return {
    phase,
    totalWeeks: v3BlockWeeks(block),
    currentWeek: phase === "current" ? v3WeekOf(block, today) : null,
    fraction: Math.min(Math.max(elapsed / total, 0), 1),
    daysLeft: phase === "current" ? daysBetween(today, block.endDate) + 1 : 0,
    daysUntilStart: phase === "upcoming" ? daysBetween(today, block.startDate) : 0,
  };
}

export type V3CheckInStatus =
  | { kind: "not_started"; startsOn: string }
  | { kind: "open"; week: number; dueDate: string; dueToday: boolean }
  | { kind: "done"; week: number; nextDueDate: string | null }
  | { kind: "finished" };

/** This week's check-in, given the weeks already checked in. */
export function v3CheckInStatus(block: V3BlockDates, doneWeeks: readonly number[], today: string): V3CheckInStatus {
  const phase = v3BlockPhase(block, today);
  if (phase === "upcoming") return { kind: "not_started", startsOn: block.startDate };
  if (phase === "past") return { kind: "finished" };
  const week = v3WeekOf(block, today)!;
  const { to } = v3WeekRange(block, week);
  if (!doneWeeks.includes(week)) return { kind: "open", week, dueDate: to, dueToday: to === today };
  const nextDueDate = week < v3BlockWeeks(block) ? v3WeekRange(block, week + 1).to : null;
  return { kind: "done", week, nextDueDate };
}

/** Weeks that have fully finished without a check-in. */
export function v3MissedWeeks(block: V3BlockDates, doneWeeks: readonly number[], today: string): number[] {
  const started = v3StartedWeeks(block, today);
  const missed: number[] = [];
  for (let week = 1; week <= started; week++) {
    if (doneWeeks.includes(week)) continue;
    if (v3WeekRange(block, week).to < today) missed.push(week);
  }
  return missed;
}

/** True when two date ranges share at least one day. */
export function rangesOverlap(a: V3BlockDates, b: V3BlockDates): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/** Suggested review points for a new block: halfway through and on the last day. */
export function suggestedReviewDates(block: V3BlockDates): { mid: string | null; end: string } {
  const length = v3BlockLengthDays(block);
  // Only suggest a mid-block review for blocks of two weeks or more.
  const mid = length >= 14 ? addDays(block.startDate, Math.floor(length / 2) - 1) : null;
  return { mid, end: block.endDate };
}
