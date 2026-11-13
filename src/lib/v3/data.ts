import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import type { V3GoalHorizon, V3Trend } from "@/config/v3";
import { db } from "@/db";
import {
  athleteProfiles,
  users,
  v3Blocks,
  v3Goals,
  v3Milestones,
  v3Profiles,
  type V3GoalStep,
  type V3Milestone,
  type V3ReviewPoint,
} from "@/db/schema";
import { v3BlockProgress, v3CheckInStatus, v3MissedWeeks, type V3BlockProgress, type V3CheckInStatus } from "./blocks";

/** Everything V3 shows about one athlete, assembled for a given "today". */

export interface V3CategoryView {
  id: string;
  name: string;
  detail: string | null;
  /** One entry per block week (index 0 = week 1); null where there's no check-in yet. */
  weekly: Array<{ week: number; trend: V3Trend | null; note: string | null }>;
  latest: V3Trend | null;
}

export interface V3CheckInView {
  id: string;
  weekNumber: number;
  date: string;
  notes: string | null;
  coachFeedback: string | null;
  coachFeedbackAt: number | null;
  trends: Array<{ categoryId: string; trend: V3Trend; note: string | null }>;
}

export interface V3BlockView {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  reviewPoints: V3ReviewPoint[];
  progress: V3BlockProgress;
  categories: V3CategoryView[];
  checkIns: V3CheckInView[];
  checkInStatus: V3CheckInStatus;
  missedWeeks: number[];
  /** The next review point on or after today. */
  nextReview: V3ReviewPoint | null;
}

export interface V3GoalView {
  id: string;
  horizon: V3GoalHorizon;
  title: string;
  detail: string | null;
  targetDate: string | null;
  steps: V3GoalStep[];
}

export interface V3Plan {
  athlete: { id: string; name: string; email: string };
  coach: { id: string; name: string } | null;
  profile: { primaryArchetype: string | null; secondaryArchetype: string | null; contexts: string[]; contextNote: string | null } | null;
  /** Oldest first. */
  blocks: V3BlockView[];
  currentBlock: V3BlockView | null;
  nextBlock: V3BlockView | null;
  goals: Partial<Record<V3GoalHorizon, V3GoalView>>;
  milestones: V3Milestone[];
  /** True until anything at all has been set up. */
  isEmpty: boolean;
}

export async function getV3Plan(athleteId: string, today: string): Promise<V3Plan | null> {
  const athlete = await db.query.users.findFirst({
    columns: { id: true, name: true, email: true, role: true },
    where: eq(users.id, athleteId),
  });
  if (!athlete || athlete.role !== "athlete") return null;

  const [link, profile, blockRows, goalRows, milestones] = await Promise.all([
    db.query.athleteProfiles.findFirst({ columns: { coachId: true }, where: eq(athleteProfiles.userId, athleteId) }),
    db.query.v3Profiles.findFirst({ where: eq(v3Profiles.athleteId, athleteId) }),
    db.query.v3Blocks.findMany({
      where: eq(v3Blocks.athleteId, athleteId),
      orderBy: [asc(v3Blocks.startDate)],
      with: {
        categories: { orderBy: (c, { asc }) => [asc(c.position)] },
        checkIns: { with: { trends: true }, orderBy: (c, { asc }) => [asc(c.weekNumber)] },
      },
    }),
    db.query.v3Goals.findMany({
      where: eq(v3Goals.athleteId, athleteId),
      with: { steps: { orderBy: (s, { asc }) => [asc(s.position)] } },
    }),
    db.query.v3Milestones.findMany({ where: eq(v3Milestones.athleteId, athleteId), orderBy: [asc(v3Milestones.date)] }),
  ]);

  const coach = link?.coachId
    ? ((await db.query.users.findFirst({ columns: { id: true, name: true }, where: eq(users.id, link.coachId) })) ?? null)
    : null;

  const blocks: V3BlockView[] = blockRows.map((block) => {
    const progress = v3BlockProgress(block, today);
    const checkIns: V3CheckInView[] = block.checkIns.map((c) => ({
      id: c.id,
      weekNumber: c.weekNumber,
      date: c.date,
      notes: c.notes,
      coachFeedback: c.coachFeedback,
      coachFeedbackAt: c.coachFeedbackAt,
      trends: c.trends.map((t) => ({ categoryId: t.categoryId, trend: t.trend, note: t.note })),
    }));
    const doneWeeks = checkIns.map((c) => c.weekNumber);
    const categories: V3CategoryView[] = block.categories.map((cat) => {
      const weekly = Array.from({ length: progress.totalWeeks }, (_, i) => {
        const trend = checkIns.find((c) => c.weekNumber === i + 1)?.trends.find((t) => t.categoryId === cat.id);
        return { week: i + 1, trend: trend?.trend ?? null, note: trend?.note ?? null };
      });
      const latest = [...weekly].reverse().find((w) => w.trend)?.trend ?? null;
      return { id: cat.id, name: cat.name, detail: cat.detail, weekly, latest };
    });
    const reviewPoints = [...block.reviewPoints].sort((a, b) => (a.date < b.date ? -1 : 1));
    return {
      id: block.id,
      name: block.name,
      startDate: block.startDate,
      endDate: block.endDate,
      notes: block.notes,
      reviewPoints,
      progress,
      categories,
      checkIns,
      checkInStatus: v3CheckInStatus(block, doneWeeks, today),
      missedWeeks: v3MissedWeeks(block, doneWeeks, today),
      nextReview: reviewPoints.find((r) => r.date >= today) ?? null,
    };
  });

  const goals: Partial<Record<V3GoalHorizon, V3GoalView>> = {};
  for (const g of goalRows) {
    goals[g.horizon] = { id: g.id, horizon: g.horizon, title: g.title, detail: g.detail, targetDate: g.targetDate, steps: g.steps };
  }

  const profileView = profile
    ? {
        primaryArchetype: profile.primaryArchetype,
        secondaryArchetype: profile.secondaryArchetype,
        contexts: profile.contexts,
        contextNote: profile.contextNote,
      }
    : null;

  return {
    athlete: { id: athlete.id, name: athlete.name, email: athlete.email },
    coach,
    profile: profileView,
    blocks,
    currentBlock: blocks.find((b) => b.progress.phase === "current") ?? null,
    nextBlock: blocks.find((b) => b.progress.phase === "upcoming") ?? null,
    goals,
    milestones,
    isEmpty: !profileView && blocks.length === 0 && goalRows.length === 0 && milestones.length === 0,
  };
}

/** Every athlete on the coach's roster, with their V3 plan. */
export async function getV3Roster(coachId: string, today: string): Promise<V3Plan[]> {
  const links = await db.query.athleteProfiles.findMany({ columns: { userId: true }, where: eq(athleteProfiles.coachId, coachId) });
  if (links.length === 0) return [];
  const athletes = await db.query.users.findMany({
    columns: { id: true, name: true },
    where: inArray(
      users.id,
      links.map((l) => l.userId),
    ),
    orderBy: [asc(users.name)],
  });
  const plans = await Promise.all(athletes.map((a) => getV3Plan(a.id, today)));
  return plans.filter((p): p is V3Plan => p !== null);
}
