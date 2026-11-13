import { describe, expect, it } from "vitest";
import { buildV3Timeline, splitTimeline } from "./timeline";

const input = {
  blocks: [
    {
      name: "Pre-season",
      startDate: "2026-11-02",
      endDate: "2026-11-29",
      reviewPoints: [
        { date: "2026-11-15", label: "Mid-block review" },
        { date: "2026-11-29", label: "End-of-block review" },
      ],
    },
    { name: "Trials lead-up", startDate: "2026-11-30", endDate: "2027-01-10", reviewPoints: [] },
  ],
  milestones: [{ date: "2027-02-06", title: "State U20 trials", detail: "Two-day camp" }],
  goals: [
    { title: "Start in round 1", horizon: "pressing" as const, targetDate: "2027-03-20" },
    { title: "College roster spot", horizon: "long_term" as const, targetDate: null },
  ],
};

describe("buildV3Timeline", () => {
  it("merges blocks, reviews, milestones and goal dates in date order", () => {
    const timeline = buildV3Timeline(input);
    expect(timeline.map((e) => [e.date, e.kind])).toEqual([
      ["2026-11-02", "block_start"],
      ["2026-11-15", "review"],
      ["2026-11-29", "block_end"],
      ["2026-11-30", "block_start"],
      ["2027-01-10", "block_end"],
      ["2027-02-06", "milestone"],
      ["2027-03-20", "goal"],
    ]);
  });

  it("folds an end-of-block review into the block's finish", () => {
    const end = buildV3Timeline(input).find((e) => e.kind === "block_end");
    expect(end).toMatchObject({ title: "Pre-season finishes", detail: "End-of-block review" });
  });

  it("puts a block finishing before the next one starting on the same day", () => {
    const timeline = buildV3Timeline({
      blocks: [
        { name: "A", startDate: "2026-11-01", endDate: "2026-11-10", reviewPoints: [] },
        { name: "B", startDate: "2026-11-10", endDate: "2026-11-20", reviewPoints: [] },
      ],
      milestones: [],
      goals: [],
    });
    expect(timeline.filter((e) => e.date === "2026-11-10").map((e) => e.title)).toEqual(["A finishes", "B starts"]);
  });
});

describe("splitTimeline", () => {
  it("keeps today and later as upcoming, and only the latest past entries", () => {
    const { past, upcoming, hiddenPast } = splitTimeline(buildV3Timeline(input), "2026-11-29", 1);
    expect(past.map((e) => e.date)).toEqual(["2026-11-15"]);
    expect(hiddenPast).toBe(1);
    expect(upcoming[0]).toMatchObject({ date: "2026-11-29", kind: "block_end" });
  });
});
