import { describe, expect, it } from "vitest";
import {
  addDays,
  blockEndDate,
  blockProgress,
  daysBetween,
  formatTime,
  isIsoDate,
  minutesBetween,
  startOfWeek,
  todayIn,
  weekDates,
} from "./dates";

describe("dates", () => {
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-2-3")).toBe(false);
  });

  it("does day arithmetic across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(daysBetween("2026-10-01", "2026-10-15")).toBe(14);
  });

  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-10-14")).toBe("2026-10-12"); // Wednesday → Monday
    expect(startOfWeek("2026-10-18")).toBe("2026-10-12"); // Sunday → previous Monday
    expect(weekDates("2026-10-14")).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
  });

  it("works out today in a given time zone", () => {
    const now = new Date("2026-10-14T20:00:00Z");
    expect(todayIn("UTC", now)).toBe("2026-10-14");
    expect(todayIn("Australia/Sydney", now)).toBe("2026-10-15");
    expect(todayIn("Not/AZone", now)).toBe("2026-10-14");
  });

  it("formats times and measures durations", () => {
    expect(formatTime("06:30")).toBe("6:30 am");
    expect(formatTime("12:05")).toBe("12:05 pm");
    expect(formatTime("00:00")).toBe("12:00 am");
    expect(minutesBetween("16:00", "17:30")).toBe(90);
  });

  it("tracks progress through a training block", () => {
    expect(blockEndDate("2026-10-05", 6)).toBe("2026-11-15");
    expect(blockProgress("2026-10-05", 6, "2026-10-05")).toMatchObject({ week: 1, daysLeft: 42, hasStarted: true, hasEnded: false });
    expect(blockProgress("2026-10-05", 6, "2026-10-19")).toMatchObject({ week: 3, daysLeft: 28 });
    expect(blockProgress("2026-10-05", 6, "2026-11-15")).toMatchObject({ week: 6, daysLeft: 1, hasEnded: false });
    expect(blockProgress("2026-10-05", 6, "2026-11-16")).toMatchObject({ week: 6, daysLeft: 0, hasEnded: true, fraction: 1 });
    expect(blockProgress("2026-10-05", 6, "2026-10-01")).toMatchObject({ week: 1, hasStarted: false, fraction: 0 });
  });
});

describe("relative days", () => {
  it("describes dates relative to today", async () => {
    const { relativeDay, isoDateOf } = await import("./dates");
    expect(relativeDay("2026-10-14", "2026-10-14")).toBe("today");
    expect(relativeDay("2026-10-13", "2026-10-14")).toBe("yesterday");
    expect(relativeDay("2026-10-10", "2026-10-14")).toBe("4 days ago");
    expect(relativeDay("2026-10-16", "2026-10-14")).toBe("in 2 days");
    expect(isoDateOf(Date.parse("2026-10-14T20:00:00Z"), "Australia/Sydney")).toBe("2026-10-15");
  });
});

describe("time ranges", () => {
  it("shares the am/pm suffix when it can", async () => {
    const { formatTimeRange } = await import("./dates");
    expect(formatTimeRange("06:30", "07:30")).toBe("6:30–7:30 am");
    expect(formatTimeRange("11:00", "12:30")).toBe("11:00 am–12:30 pm");
  });
});

describe("block weeks and check-in days", () => {
  it("numbers the weeks of a block", async () => {
    const { blockWeekOf } = await import("./dates");
    expect(blockWeekOf("2026-10-05", 4, "2026-10-04")).toBe("pre");
    expect(blockWeekOf("2026-10-05", 4, "2026-10-05")).toBe(1);
    expect(blockWeekOf("2026-10-05", 4, "2026-10-12")).toBe(2);
    expect(blockWeekOf("2026-10-05", 4, "2026-11-01")).toBe(4);
    expect(blockWeekOf("2026-10-05", 4, "2026-11-02")).toBe("after");
  });

  it("finds the check-in day inside each block week", async () => {
    const { checkInDateForWeek } = await import("./dates");
    // Block starts Wednesday 7 Oct 2026; check-ins on Mondays.
    expect(checkInDateForWeek("2026-10-07", 0, 1)).toBe("2026-10-12");
    expect(checkInDateForWeek("2026-10-07", 0, 2)).toBe("2026-10-19");
    // Check-ins on the start weekday land on the first day of each week.
    expect(checkInDateForWeek("2026-10-07", 2, 1)).toBe("2026-10-07");
  });
});
