import { describe, expect, it } from "vitest";
import {
  rangesOverlap,
  suggestedReviewDates,
  v3BlockPhase,
  v3BlockProgress,
  v3BlockWeeks,
  v3CheckInStatus,
  v3MissedWeeks,
  v3StartedWeeks,
  v3WeekOf,
  v3WeekRange,
} from "./blocks";

// Monday 2 Nov 2026 → Sunday 29 Nov 2026: exactly four weeks.
const block = { startDate: "2026-11-02", endDate: "2026-11-29" };
// Ten days: one full week and a three-day second week.
const short = { startDate: "2026-11-02", endDate: "2026-11-11" };

describe("v3 block weeks", () => {
  it("counts whole and partial weeks", () => {
    expect(v3BlockWeeks(block)).toBe(4);
    expect(v3BlockWeeks(short)).toBe(2);
    expect(v3BlockWeeks({ startDate: "2026-11-02", endDate: "2026-11-02" })).toBe(1);
  });

  it("gives each week's range, clipping the last week to the end date", () => {
    expect(v3WeekRange(block, 1)).toEqual({ from: "2026-11-02", to: "2026-11-08" });
    expect(v3WeekRange(block, 4)).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(v3WeekRange(short, 2)).toEqual({ from: "2026-11-09", to: "2026-11-11" });
  });

  it("finds the week a date falls in", () => {
    expect(v3WeekOf(block, "2026-11-01")).toBeNull();
    expect(v3WeekOf(block, "2026-11-02")).toBe(1);
    expect(v3WeekOf(block, "2026-11-08")).toBe(1);
    expect(v3WeekOf(block, "2026-11-09")).toBe(2);
    expect(v3WeekOf(block, "2026-11-29")).toBe(4);
    expect(v3WeekOf(block, "2026-11-30")).toBeNull();
  });

  it("counts started weeks before, during and after the block", () => {
    expect(v3StartedWeeks(block, "2026-10-30")).toBe(0);
    expect(v3StartedWeeks(block, "2026-11-16")).toBe(3);
    expect(v3StartedWeeks(block, "2026-12-25")).toBe(4);
  });
});

describe("v3 block phase and progress", () => {
  it("classifies upcoming, current and past", () => {
    expect(v3BlockPhase(block, "2026-11-01")).toBe("upcoming");
    expect(v3BlockPhase(block, "2026-11-02")).toBe("current");
    expect(v3BlockPhase(block, "2026-11-29")).toBe("current");
    expect(v3BlockPhase(block, "2026-11-30")).toBe("past");
  });

  it("reports days left including today and days until the start", () => {
    const mid = v3BlockProgress(block, "2026-11-13");
    expect(mid).toMatchObject({ phase: "current", currentWeek: 2, totalWeeks: 4, daysLeft: 17 });
    expect(mid.fraction).toBeCloseTo(11 / 28);
    expect(v3BlockProgress(block, "2026-10-29")).toMatchObject({ phase: "upcoming", daysUntilStart: 4, fraction: 0 });
    expect(v3BlockProgress(block, "2026-12-01")).toMatchObject({ phase: "past", daysLeft: 0, fraction: 1 });
  });
});

describe("v3 weekly check-in status", () => {
  it("is open until this week's check-in is in, due on the week's last day", () => {
    expect(v3CheckInStatus(block, [1], "2026-11-10")).toEqual({ kind: "open", week: 2, dueDate: "2026-11-15", dueToday: false });
    expect(v3CheckInStatus(block, [1], "2026-11-15")).toEqual({ kind: "open", week: 2, dueDate: "2026-11-15", dueToday: true });
  });

  it("points at next week's due date once this week is done", () => {
    expect(v3CheckInStatus(block, [1, 2], "2026-11-12")).toEqual({ kind: "done", week: 2, nextDueDate: "2026-11-22" });
    expect(v3CheckInStatus(block, [4], "2026-11-25")).toEqual({ kind: "done", week: 4, nextDueDate: null });
  });

  it("handles blocks that haven't started or have finished", () => {
    expect(v3CheckInStatus(block, [], "2026-10-01")).toEqual({ kind: "not_started", startsOn: "2026-11-02" });
    expect(v3CheckInStatus(block, [], "2026-12-01")).toEqual({ kind: "finished" });
  });

  it("lists finished weeks with no check-in as missed", () => {
    expect(v3MissedWeeks(block, [2], "2026-11-24")).toEqual([1, 3]);
    // This week isn't missed yet – it's still open.
    expect(v3MissedWeeks(block, [], "2026-11-03")).toEqual([]);
  });
});

describe("v3 helpers", () => {
  it("detects overlapping date ranges, including a shared day", () => {
    expect(rangesOverlap(block, { startDate: "2026-11-29", endDate: "2026-12-20" })).toBe(true);
    expect(rangesOverlap(block, { startDate: "2026-11-30", endDate: "2026-12-20" })).toBe(false);
    expect(rangesOverlap(block, { startDate: "2026-10-01", endDate: "2026-12-31" })).toBe(true);
  });

  it("suggests a mid-block and an end-of-block review", () => {
    expect(suggestedReviewDates(block)).toEqual({ mid: "2026-11-15", end: "2026-11-29" });
    expect(suggestedReviewDates({ startDate: "2026-11-02", endDate: "2026-11-08" })).toEqual({ mid: null, end: "2026-11-08" });
  });
});
