/**
 * The anticipated roadmap: milestones, block starts and finishes, review points
 * and goal target dates, merged into one dated list.
 */
import type { V3GoalHorizon } from "@/config/v3";
import type { V3ReviewPoint } from "@/db/schema";

export type V3TimelineKind = "milestone" | "block_start" | "block_end" | "review" | "goal";

export interface V3TimelineEntry {
  date: string;
  kind: V3TimelineKind;
  title: string;
  detail: string | null;
  horizon?: V3GoalHorizon;
}

export interface V3TimelineInput {
  blocks: ReadonlyArray<{ name: string; startDate: string; endDate: string; reviewPoints: readonly V3ReviewPoint[] }>;
  milestones: ReadonlyArray<{ date: string; title: string; detail: string | null }>;
  goals: ReadonlyArray<{ title: string; horizon: V3GoalHorizon; targetDate: string | null }>;
}

// Same-day entries read in this order: a block finishing comes before the next one starting.
const KIND_ORDER: Record<V3TimelineKind, number> = { block_end: 0, review: 1, block_start: 2, milestone: 3, goal: 4 };

export function buildV3Timeline(input: V3TimelineInput): V3TimelineEntry[] {
  const entries: V3TimelineEntry[] = [];
  for (const block of input.blocks) {
    entries.push({ date: block.startDate, kind: "block_start", title: `${block.name} starts`, detail: null });
    // A review on the last day folds into the "finishes" entry.
    const endReview = block.reviewPoints.find((r) => r.date === block.endDate);
    entries.push({ date: block.endDate, kind: "block_end", title: `${block.name} finishes`, detail: endReview?.label ?? null });
    for (const review of block.reviewPoints) {
      if (review.date === block.endDate) continue;
      entries.push({ date: review.date, kind: "review", title: review.label, detail: block.name });
    }
  }
  for (const m of input.milestones) entries.push({ date: m.date, kind: "milestone", title: m.title, detail: m.detail });
  for (const g of input.goals) {
    if (g.targetDate) entries.push({ date: g.targetDate, kind: "goal", title: g.title, detail: null, horizon: g.horizon });
  }
  return entries.sort((a, b) => (a.date === b.date ? KIND_ORDER[a.kind] - KIND_ORDER[b.kind] : a.date < b.date ? -1 : 1));
}

/** Splits the roadmap at today, keeping only the most recent `keepPast` entries behind it. */
export function splitTimeline(entries: readonly V3TimelineEntry[], today: string, keepPast = 3) {
  const past = entries.filter((e) => e.date < today);
  return { past: past.slice(Math.max(0, past.length - keepPast)), hiddenPast: Math.max(0, past.length - keepPast), upcoming: entries.filter((e) => e.date >= today) };
}
