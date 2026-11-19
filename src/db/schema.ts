import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * GOE Platform – Version 3 Practice. Accounts (athletes and coaches, linked by a
 * coach's invite code) and each athlete's plan.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Epoch milliseconds. */
const createdAt = () =>
  integer("created_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export type Role = "athlete" | "coach";

export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["athlete", "coach"] }).notNull(),
    /** Coaches share this code so athletes can join their roster. */
    inviteCode: text("invite_code"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), uniqueIndex("users_invite_code_idx").on(t.inviteCode)],
);

/** Which coach an athlete belongs to (set with the coach's invite code). */
export const athleteProfiles = sqliteTable(
  "athlete_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    coachId: text("coach_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("athlete_profiles_coach_idx").on(t.coachId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// The plan: archetype & context, training blocks, categories, weekly check-ins,
// goals with action steps, and road map milestones. See src/config/v3.ts.
// ─────────────────────────────────────────────────────────────────────────────

/** Archetype labels (no weights) and the athlete's current context. One row per athlete. */
export const v3Profiles = sqliteTable("v3_profiles", {
  athleteId: text("athlete_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  primaryArchetype: text("primary_archetype"),
  secondaryArchetype: text("secondary_archetype"),
  /** Context keys from V3_CONTEXTS – off-season, lead-up to trials, coming back from injury… */
  contexts: text("contexts", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  contextNote: text("context_note"),
  /** Player Roadmap: where the athlete is aiming to be in ~3 years – which team, and what role in it. */
  aimTeam: text("aim_team"),
  aimRole: text("aim_role"),
  /** The year they're aiming for (about three years out). */
  aimYear: integer("aim_year"),
  updatedAt: integer("updated_at", { mode: "number" }),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export interface V3ReviewPoint {
  /** YYYY-MM-DD, within the block. */
  date: string;
  label: string;
}

/** A training block: when it starts, when it finishes, and when it gets reviewed. */
export const v3Blocks = sqliteTable(
  "v3_blocks",
  {
    id: id(),
    athleteId: text("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** YYYY-MM-DD */
    startDate: text("start_date").notNull(),
    /** YYYY-MM-DD – the last day of the block. */
    endDate: text("end_date").notNull(),
    reviewPoints: text("review_points", { mode: "json" }).$type<V3ReviewPoint[]>().notNull().default(sql`'[]'`),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "number" }),
  },
  (t) => [index("v3_blocks_athlete_idx").on(t.athleteId, t.startDate)],
);

/** Up to four open-ended categories per block – whatever the athlete wants to work on. */
export const v3Categories = sqliteTable(
  "v3_categories",
  {
    id: id(),
    blockId: text("block_id")
      .notNull()
      .references(() => v3Blocks.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    /** What it looks like when it's going well / cues. */
    detail: text("detail"),
  },
  (t) => [index("v3_categories_block_idx").on(t.blockId, t.position)],
);

/** One weekly check-in per block week. */
export const v3CheckIns = sqliteTable(
  "v3_check_ins",
  {
    id: id(),
    athleteId: text("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockId: text("block_id")
      .notNull()
      .references(() => v3Blocks.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    /** YYYY-MM-DD the check-in was submitted. */
    date: text("date").notNull(),
    notes: text("notes"),
    coachFeedback: text("coach_feedback"),
    coachFeedbackAt: integer("coach_feedback_at", { mode: "number" }),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "number" }),
  },
  (t) => [
    index("v3_check_ins_athlete_idx").on(t.athleteId, t.date),
    uniqueIndex("v3_check_ins_block_week_idx").on(t.blockId, t.weekNumber),
  ],
);

/** Trending up / staying the same / trending down, for one category in one check-in. */
export const v3CheckInTrends = sqliteTable(
  "v3_check_in_trends",
  {
    checkInId: text("check_in_id")
      .notNull()
      .references(() => v3CheckIns.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => v3Categories.id, { onDelete: "cascade" }),
    trend: text("trend", { enum: ["up", "same", "down"] }).notNull(),
    note: text("note"),
  },
  (t) => [primaryKey({ columns: [t.checkInId, t.categoryId] })],
);

/** At most two goals per athlete: the most pressing one and the longer-term one. */
export const v3Goals = sqliteTable(
  "v3_goals",
  {
    id: id(),
    athleteId: text("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    horizon: text("horizon", { enum: ["pressing", "long_term"] }).notNull(),
    title: text("title").notNull(),
    /** Why it matters / what achieving it looks like. */
    detail: text("detail"),
    /** YYYY-MM-DD, optional. */
    targetDate: text("target_date"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "number" }),
  },
  (t) => [uniqueIndex("v3_goals_athlete_horizon_idx").on(t.athleteId, t.horizon)],
);

/** Step-by-step action steps towards a goal, in order. */
export const v3GoalSteps = sqliteTable(
  "v3_goal_steps",
  {
    id: id(),
    goalId: text("goal_id")
      .notNull()
      .references(() => v3Goals.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    /** Epoch ms when ticked off; null while still to do. */
    doneAt: integer("done_at", { mode: "number" }),
  },
  (t) => [index("v3_goal_steps_goal_idx").on(t.goalId, t.position)],
);

/** The anticipated roadmap: dated milestones (trials, season start, camps…). */
export const v3Milestones = sqliteTable(
  "v3_milestones",
  {
    id: id(),
    athleteId: text("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    createdAt: createdAt(),
  },
  (t) => [index("v3_milestones_athlete_idx").on(t.athleteId, t.date)],
);

export const usersRelations = relations(users, ({ one }) => ({
  athleteProfile: one(athleteProfiles, { fields: [users.id], references: [athleteProfiles.userId] }),
}));

export const athleteProfilesRelations = relations(athleteProfiles, ({ one }) => ({
  user: one(users, { fields: [athleteProfiles.userId], references: [users.id] }),
}));

export const v3BlocksRelations = relations(v3Blocks, ({ many }) => ({
  categories: many(v3Categories),
  checkIns: many(v3CheckIns),
}));

export const v3CategoriesRelations = relations(v3Categories, ({ one }) => ({
  block: one(v3Blocks, { fields: [v3Categories.blockId], references: [v3Blocks.id] }),
}));

export const v3CheckInsRelations = relations(v3CheckIns, ({ one, many }) => ({
  block: one(v3Blocks, { fields: [v3CheckIns.blockId], references: [v3Blocks.id] }),
  trends: many(v3CheckInTrends),
}));

export const v3CheckInTrendsRelations = relations(v3CheckInTrends, ({ one }) => ({
  checkIn: one(v3CheckIns, { fields: [v3CheckInTrends.checkInId], references: [v3CheckIns.id] }),
}));

export const v3GoalsRelations = relations(v3Goals, ({ many }) => ({
  steps: many(v3GoalSteps),
}));

export const v3GoalStepsRelations = relations(v3GoalSteps, ({ one }) => ({
  goal: one(v3Goals, { fields: [v3GoalSteps.goalId], references: [v3Goals.id] }),
}));

export type User = typeof users.$inferSelect;
export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type V3Profile = typeof v3Profiles.$inferSelect;
export type V3Block = typeof v3Blocks.$inferSelect;
export type V3Category = typeof v3Categories.$inferSelect;
export type V3CheckIn = typeof v3CheckIns.$inferSelect;
export type V3CheckInTrend = typeof v3CheckInTrends.$inferSelect;
export type V3Goal = typeof v3Goals.$inferSelect;
export type V3GoalStep = typeof v3GoalSteps.$inferSelect;
export type V3Milestone = typeof v3Milestones.$inferSelect;
