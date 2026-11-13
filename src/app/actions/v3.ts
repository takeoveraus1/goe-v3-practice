"use server";

/**
 * GOE Platform – Version 3 Practice. All plan writes. Athletes edit their own
 * plan; a coach can edit the plan of any athlete on their roster. Only the
 * athlete submits weekly check-ins, and only the coach leaves feedback.
 */
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  isV3Archetype,
  isV3Context,
  V3_BLOCK_MAX_WEEKS,
  V3_GOAL_HORIZONS,
  V3_MAX_CATEGORIES,
  V3_MAX_MILESTONES,
  V3_MAX_REVIEW_POINTS,
  V3_MAX_STEPS,
  V3_TRENDS,
  type V3GoalHorizon,
  type V3Trend,
} from "@/config/v3";
import { db } from "@/db";
import {
  athleteProfiles,
  v3Blocks,
  v3Categories,
  v3CheckIns,
  v3CheckInTrends,
  v3Goals,
  v3GoalSteps,
  v3Milestones,
  v3Profiles,
} from "@/db/schema";
import { authorizeAthleteAccess, requireAthlete, requireCoach, type SessionUser } from "@/lib/auth/dal";
import { formatDate, isIsoDate } from "@/lib/dates";
import { invalid, type FormState } from "@/lib/form-state";
import { today } from "@/lib/today";
import { rangesOverlap, v3BlockLengthDays, v3StartedWeeks } from "@/lib/v3/blocks";
import { optionalText } from "@/lib/validation";
import { v3PlanPath } from "@/lib/v3/paths";

const NOT_ALLOWED: FormState = { error: "You can't edit this athlete's plan." };

function revalidateV3() {
  revalidatePath("/", "layout");
}

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

/**
 * Indexed rows posted as `${prefix}.${i}.${field}` (i = 0, 1, 2…). Rows whose
 * fields are all empty are dropped; the rest keep their original index so
 * errors land on the right row.
 */
function indexedRows<F extends string>(formData: FormData, prefix: string, fields: readonly F[]) {
  const rows: Array<{ index: number; values: Record<F, string> }> = [];
  for (let i = 0; i < 50; i++) {
    if (!fields.some((f) => formData.has(`${prefix}.${i}.${f}`))) break;
    const values = Object.fromEntries(fields.map((f) => [f, str(formData, `${prefix}.${i}.${f}`)])) as Record<F, string>;
    if (fields.some((f) => f !== "id" && f !== "done" && values[f])) rows.push({ index: i, values });
  }
  return rows;
}

const fieldErrorState = (fieldErrors: Record<string, string>, error = "Please fix the highlighted fields."): FormState => ({
  error,
  fieldErrors,
});

// ── Archetype & context ─────────────────────────────────────────────────────

const profileSchema = z.object({
  athleteId: z.string().min(1),
  primaryArchetype: z.string().optional().transform((v) => v || null),
  secondaryArchetype: z.string().optional().transform((v) => v || null),
  contextNote: optionalText(500),
});

export async function saveV3Profile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    athleteId: formData.get("athleteId"),
    primaryArchetype: formData.get("primaryArchetype") ?? undefined,
    secondaryArchetype: formData.get("secondaryArchetype") ?? undefined,
    contextNote: formData.get("contextNote") ?? undefined,
  });
  if (!parsed.success) return invalid(parsed.error);
  const { athleteId, primaryArchetype, secondaryArchetype, contextNote } = parsed.data;
  const user = await authorizeAthleteAccess(athleteId);
  if (!user) return NOT_ALLOWED;

  const fieldErrors: Record<string, string> = {};
  if (primaryArchetype && !isV3Archetype(primaryArchetype)) fieldErrors.primaryArchetype = "Pick an archetype from the list.";
  if (secondaryArchetype && !isV3Archetype(secondaryArchetype)) fieldErrors.secondaryArchetype = "Pick an archetype from the list.";
  if (secondaryArchetype && !primaryArchetype) fieldErrors.primaryArchetype = "Pick a primary archetype first.";
  if (secondaryArchetype && secondaryArchetype === primaryArchetype) fieldErrors.secondaryArchetype = "Pick a different secondary archetype.";
  const contexts = [...new Set(formData.getAll("contexts").map(String))];
  if (contexts.some((c) => !isV3Context(c))) fieldErrors.contexts = "Pick from the listed contexts.";
  if (Object.keys(fieldErrors).length) return fieldErrorState(fieldErrors);

  const values = { primaryArchetype, secondaryArchetype, contexts, contextNote, updatedAt: Date.now(), updatedBy: user.id };
  await db
    .insert(v3Profiles)
    .values({ athleteId, ...values })
    .onConflictDoUpdate({ target: v3Profiles.athleteId, set: values });

  revalidateV3();
  redirect(`${v3PlanPath(user, athleteId)}?saved=profile`);
}

// ── Training blocks ─────────────────────────────────────────────────────────

const blockSchema = z.object({
  athleteId: z.string().min(1),
  blockId: z.string().optional().transform((v) => v || null),
  name: z.string().trim().min(1, "Give the block a name.").max(80, "Keep the name under 80 characters."),
  startDate: z.string().refine(isIsoDate, "Choose a start date."),
  endDate: z.string().refine(isIsoDate, "Choose a finish date."),
  notes: optionalText(1000),
});

export async function saveV3Block(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = blockSchema.safeParse({
    athleteId: formData.get("athleteId"),
    blockId: formData.get("blockId") ?? undefined,
    name: formData.get("name") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return invalid(parsed.error);
  const { athleteId, blockId, name, startDate, endDate, notes } = parsed.data;
  const user = await authorizeAthleteAccess(athleteId);
  if (!user) return NOT_ALLOWED;

  const fieldErrors: Record<string, string> = {};
  if (endDate < startDate) fieldErrors.endDate = "The block has to finish on or after its start date.";
  else if (v3BlockLengthDays({ startDate, endDate }) > V3_BLOCK_MAX_WEEKS * 7) fieldErrors.endDate = `Keep a block to ${V3_BLOCK_MAX_WEEKS} weeks or less.`;

  // Categories: open-ended, 1–4.
  const categoryRows = indexedRows(formData, "category", ["id", "name", "detail"] as const);
  for (const row of categoryRows) {
    if (!row.values.name) fieldErrors[`category.${row.index}.name`] = "Name this category, or clear the row.";
    else if (row.values.name.length > 80) fieldErrors[`category.${row.index}.name`] = "Keep it under 80 characters.";
    if (row.values.detail.length > 500) fieldErrors[`category.${row.index}.detail`] = "Keep it under 500 characters.";
  }
  if (categoryRows.length === 0) fieldErrors.categories = "Add at least one category to work on.";
  if (categoryRows.length > V3_MAX_CATEGORIES) fieldErrors.categories = `Up to ${V3_MAX_CATEGORIES} categories per block.`;

  // Review points: dated, inside the block.
  const reviewRows = indexedRows(formData, "review", ["date", "label"] as const);
  if (reviewRows.length > V3_MAX_REVIEW_POINTS) fieldErrors.reviews = `Up to ${V3_MAX_REVIEW_POINTS} review points per block.`;
  for (const row of reviewRows) {
    const key = `review.${row.index}`;
    if (!isIsoDate(row.values.date)) fieldErrors[`${key}.date`] = "Choose a date.";
    else if (!fieldErrors.endDate && (row.values.date < startDate || row.values.date > endDate)) {
      fieldErrors[`${key}.date`] = "Review points fall inside the block.";
    }
    if (row.values.label.length > 60) fieldErrors[`${key}.label`] = "Keep it under 60 characters.";
  }

  let existing: { id: string } | undefined;
  if (blockId) {
    existing = await db.query.v3Blocks.findFirst({
      columns: { id: true },
      where: and(eq(v3Blocks.id, blockId), eq(v3Blocks.athleteId, athleteId)),
    });
    if (!existing) return { error: "That block no longer exists." };
  }

  if (!fieldErrors.endDate && !fieldErrors.startDate) {
    const others = await db.query.v3Blocks.findMany({
      columns: { name: true, startDate: true, endDate: true },
      where: blockId ? and(eq(v3Blocks.athleteId, athleteId), ne(v3Blocks.id, blockId)) : eq(v3Blocks.athleteId, athleteId),
    });
    const clash = others.find((other) => rangesOverlap(other, { startDate, endDate }));
    if (clash) {
      fieldErrors.startDate = `Overlaps "${clash.name}" (${formatDate(clash.startDate)} – ${formatDate(clash.endDate)}). Blocks run one after another.`;
    }
  }
  if (Object.keys(fieldErrors).length) return fieldErrorState(fieldErrors);

  const reviewPoints = reviewRows
    .map((r) => ({ date: r.values.date, label: r.values.label || "Review" }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const now = Date.now();

  await db.transaction(async (tx) => {
    let id = existing?.id;
    if (id) {
      await tx.update(v3Blocks).set({ name, startDate, endDate, notes, reviewPoints, updatedAt: now }).where(eq(v3Blocks.id, id));
    } else {
      const [row] = await tx
        .insert(v3Blocks)
        .values({ athleteId, name, startDate, endDate, notes, reviewPoints, createdBy: user.id, createdAt: now })
        .returning({ id: v3Blocks.id });
      id = row.id;
    }
    // Keep existing categories (and their weekly trends) by id; drop removed ones.
    const current = await tx.query.v3Categories.findMany({ columns: { id: true }, where: eq(v3Categories.blockId, id) });
    const keep = new Set<string>();
    for (const [position, row] of categoryRows.entries()) {
      const values = { name: row.values.name, detail: row.values.detail || null, position };
      if (row.values.id && current.some((c) => c.id === row.values.id)) {
        keep.add(row.values.id);
        await tx.update(v3Categories).set(values).where(eq(v3Categories.id, row.values.id));
      } else {
        await tx.insert(v3Categories).values({ blockId: id, ...values });
      }
    }
    for (const c of current) {
      if (keep.has(c.id)) continue;
      await tx.delete(v3CheckInTrends).where(eq(v3CheckInTrends.categoryId, c.id));
      await tx.delete(v3Categories).where(eq(v3Categories.id, c.id));
    }
    // Check-ins for weeks that no longer exist after shortening the block.
    const weeks = Math.ceil(v3BlockLengthDays({ startDate, endDate }) / 7);
    const checkIns = await tx.query.v3CheckIns.findMany({ columns: { id: true, weekNumber: true }, where: eq(v3CheckIns.blockId, id) });
    for (const c of checkIns) {
      if (c.weekNumber <= weeks) continue;
      await tx.delete(v3CheckInTrends).where(eq(v3CheckInTrends.checkInId, c.id));
      await tx.delete(v3CheckIns).where(eq(v3CheckIns.id, c.id));
    }
  });

  revalidateV3();
  redirect(`${v3PlanPath(user, athleteId)}?saved=block`);
}

export async function deleteV3Block(formData: FormData): Promise<void> {
  const athleteId = str(formData, "athleteId");
  const blockId = str(formData, "blockId");
  const user = await authorizeAthleteAccess(athleteId);
  if (!user) redirect("/v3");
  const block = await db.query.v3Blocks.findFirst({
    columns: { id: true },
    where: and(eq(v3Blocks.id, blockId), eq(v3Blocks.athleteId, athleteId)),
  });
  if (block) {
    await db.transaction(async (tx) => {
      const checkIns = await tx.query.v3CheckIns.findMany({ columns: { id: true }, where: eq(v3CheckIns.blockId, block.id) });
      for (const c of checkIns) await tx.delete(v3CheckInTrends).where(eq(v3CheckInTrends.checkInId, c.id));
      await tx.delete(v3CheckIns).where(eq(v3CheckIns.blockId, block.id));
      await tx.delete(v3Categories).where(eq(v3Categories.blockId, block.id));
      await tx.delete(v3Blocks).where(eq(v3Blocks.id, block.id));
    });
  }
  revalidateV3();
  redirect(`${v3PlanPath(user, athleteId)}?saved=block-deleted`);
}

// ── Goals & action steps ────────────────────────────────────────────────────

export async function saveV3Goals(_prev: FormState, formData: FormData): Promise<FormState> {
  const athleteId = str(formData, "athleteId");
  const user = await authorizeAthleteAccess(athleteId);
  if (!user) return NOT_ALLOWED;

  const fieldErrors: Record<string, string> = {};
  const parsedGoals = V3_GOAL_HORIZONS.map(({ key }) => {
    const title = str(formData, `${key}.title`);
    const detail = str(formData, `${key}.detail`);
    const targetDate = str(formData, `${key}.targetDate`);
    const steps = indexedRows(formData, `${key}.step`, ["id", "text", "done"] as const);
    if (title.length > 120) fieldErrors[`${key}.title`] = "Keep the goal under 120 characters.";
    if (detail.length > 1000) fieldErrors[`${key}.detail`] = "Keep this under 1000 characters.";
    if (targetDate && !isIsoDate(targetDate)) fieldErrors[`${key}.targetDate`] = "Choose a valid date.";
    if (!title && (detail || targetDate || steps.length)) fieldErrors[`${key}.title`] = "Write the goal, or clear this section.";
    if (steps.length > V3_MAX_STEPS) fieldErrors[`${key}.steps`] = `Up to ${V3_MAX_STEPS} action steps per goal.`;
    for (const s of steps) {
      if (s.values.text.length > 200) fieldErrors[`${key}.step.${s.index}.text`] = "Keep each step under 200 characters.";
      if (!s.values.text) fieldErrors[`${key}.step.${s.index}.text`] = "Write the step, or remove it.";
    }
    return { horizon: key as V3GoalHorizon, title, detail: detail || null, targetDate: targetDate || null, steps };
  });
  if (Object.keys(fieldErrors).length) return fieldErrorState(fieldErrors);

  const now = Date.now();
  await db.transaction(async (tx) => {
    for (const goal of parsedGoals) {
      const existing = await tx.query.v3Goals.findFirst({
        where: and(eq(v3Goals.athleteId, athleteId), eq(v3Goals.horizon, goal.horizon)),
        with: { steps: true },
      });
      if (!goal.title) {
        if (existing) {
          await tx.delete(v3GoalSteps).where(eq(v3GoalSteps.goalId, existing.id));
          await tx.delete(v3Goals).where(eq(v3Goals.id, existing.id));
        }
        continue;
      }
      let goalId = existing?.id;
      const values = { title: goal.title, detail: goal.detail, targetDate: goal.targetDate, updatedAt: now };
      if (goalId) {
        await tx.update(v3Goals).set(values).where(eq(v3Goals.id, goalId));
      } else {
        const [row] = await tx
          .insert(v3Goals)
          .values({ athleteId, horizon: goal.horizon, ...values, createdAt: now })
          .returning({ id: v3Goals.id });
        goalId = row.id;
      }
      // Steps are rewritten in order; a step that was already ticked keeps its tick date.
      await tx.delete(v3GoalSteps).where(eq(v3GoalSteps.goalId, goalId));
      if (goal.steps.length) {
        await tx.insert(v3GoalSteps).values(
          goal.steps.map((s, position) => {
            const before = existing?.steps.find((p) => p.id === s.values.id);
            const done = s.values.done === "on";
            return { goalId: goalId!, position, text: s.values.text, doneAt: done ? (before?.doneAt ?? now) : null };
          }),
        );
      }
    }
  });

  revalidateV3();
  redirect(`${v3PlanPath(user, athleteId)}?saved=goals`);
}

/** Tick an action step off (or back on) straight from the plan. */
export async function toggleV3Step(formData: FormData): Promise<void> {
  const stepId = str(formData, "stepId");
  const done = str(formData, "done") === "1";
  const step = await db.query.v3GoalSteps.findFirst({ where: eq(v3GoalSteps.id, stepId), with: { goal: { columns: { athleteId: true } } } });
  if (!step) return;
  const user = await authorizeAthleteAccess(step.goal.athleteId);
  if (!user) return;
  await db.update(v3GoalSteps).set({ doneAt: done ? Date.now() : null }).where(eq(v3GoalSteps.id, stepId));
  revalidateV3();
}

// ── Roadmap ─────────────────────────────────────────────────────────────────

export async function saveV3Roadmap(_prev: FormState, formData: FormData): Promise<FormState> {
  const athleteId = str(formData, "athleteId");
  const user = await authorizeAthleteAccess(athleteId);
  if (!user) return NOT_ALLOWED;

  const rows = indexedRows(formData, "milestone", ["date", "title", "detail"] as const);
  const fieldErrors: Record<string, string> = {};
  if (rows.length > V3_MAX_MILESTONES) fieldErrors.milestones = `Up to ${V3_MAX_MILESTONES} milestones.`;
  for (const row of rows) {
    const key = `milestone.${row.index}`;
    if (!isIsoDate(row.values.date)) fieldErrors[`${key}.date`] = "Choose a date.";
    if (!row.values.title) fieldErrors[`${key}.title`] = "Name the milestone, or clear the row.";
    else if (row.values.title.length > 100) fieldErrors[`${key}.title`] = "Keep it under 100 characters.";
    if (row.values.detail.length > 300) fieldErrors[`${key}.detail`] = "Keep it under 300 characters.";
  }
  if (Object.keys(fieldErrors).length) return fieldErrorState(fieldErrors);

  await db.transaction(async (tx) => {
    await tx.delete(v3Milestones).where(eq(v3Milestones.athleteId, athleteId));
    if (rows.length) {
      await tx.insert(v3Milestones).values(
        rows.map((r) => ({ athleteId, date: r.values.date, title: r.values.title, detail: r.values.detail || null })),
      );
    }
  });

  revalidateV3();
  redirect(`${v3PlanPath(user, athleteId)}?saved=roadmap`);
}

// ── Weekly check-in ─────────────────────────────────────────────────────────

const TREND_KEYS: ReadonlySet<string> = new Set(V3_TRENDS.map((t) => t.key));

export async function saveV3CheckIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const athlete = await requireAthlete();
  const blockId = str(formData, "blockId");
  const week = Number(str(formData, "week"));
  const notes = str(formData, "notes").slice(0, 2000) || null;

  const block = await db.query.v3Blocks.findFirst({
    where: and(eq(v3Blocks.id, blockId), eq(v3Blocks.athleteId, athlete.id)),
    with: { categories: { orderBy: (c, { asc }) => [asc(c.position)] } },
  });
  if (!block) return { error: "That training block couldn't be found." };

  const day = await today();
  const latestWeek = v3StartedWeeks(block, day);
  if (!Number.isInteger(week) || week < 1 || week > latestWeek) {
    return fieldErrorState({ week: "Pick a week that has started." }, "That week hasn't started yet.");
  }

  const fieldErrors: Record<string, string> = {};
  const trends = block.categories.map((cat) => {
    const trend = str(formData, `trend.${cat.id}`);
    if (!TREND_KEYS.has(trend)) fieldErrors[`trend.${cat.id}`] = "Trending up, staying the same, or trending down?";
    return { categoryId: cat.id, trend: trend as V3Trend, note: str(formData, `note.${cat.id}`).slice(0, 1000) || null };
  });
  if (Object.keys(fieldErrors).length) return fieldErrorState(fieldErrors, "Give every category a trend for the week.");

  await db.transaction(async (tx) => {
    const existing = await tx.query.v3CheckIns.findFirst({
      columns: { id: true },
      where: and(eq(v3CheckIns.blockId, block.id), eq(v3CheckIns.weekNumber, week)),
    });
    let id = existing?.id;
    if (id) {
      await tx.update(v3CheckIns).set({ notes, date: day, updatedAt: Date.now() }).where(eq(v3CheckIns.id, id));
      await tx.delete(v3CheckInTrends).where(eq(v3CheckInTrends.checkInId, id));
    } else {
      const [row] = await tx
        .insert(v3CheckIns)
        .values({ athleteId: athlete.id, blockId: block.id, weekNumber: week, date: day, notes, createdAt: Date.now() })
        .returning({ id: v3CheckIns.id });
      id = row.id;
    }
    if (trends.length) await tx.insert(v3CheckInTrends).values(trends.map((t) => ({ ...t, checkInId: id! })));
  });

  revalidateV3();
  redirect(`/athlete/check-ins?saved=${week}`);
}

// ── Coach feedback on a check-in ────────────────────────────────────────────

export async function saveV3Feedback(_prev: FormState, formData: FormData): Promise<FormState> {
  const coach: SessionUser = await requireCoach();
  const checkInId = str(formData, "checkInId");
  const feedback = str(formData, "feedback");
  if (feedback.length > 2000) return fieldErrorState({ feedback: "Keep feedback under 2000 characters." });

  const checkIn = await db.query.v3CheckIns.findFirst({ columns: { id: true, athleteId: true }, where: eq(v3CheckIns.id, checkInId) });
  if (!checkIn) return { error: "That check-in no longer exists." };
  const onRoster = await db.query.athleteProfiles.findFirst({
    columns: { userId: true },
    where: and(eq(athleteProfiles.userId, checkIn.athleteId), eq(athleteProfiles.coachId, coach.id)),
  });
  if (!onRoster) return { error: "This athlete isn't on your roster." };

  await db
    .update(v3CheckIns)
    .set({ coachFeedback: feedback || null, coachFeedbackAt: feedback ? Date.now() : null })
    .where(eq(v3CheckIns.id, checkIn.id));
  revalidateV3();
  return { success: feedback ? "Feedback sent." : "Feedback cleared." };
}
