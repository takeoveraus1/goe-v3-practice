/**
 * Demo data: a coach with three athletes at different stages, with dates
 * relative to "today" so the demo always looks live. Used by `npm run db:seed`
 * (local reset) and by the deploy step in demo mode (empty database only).
 *
 *   Jordan – pre-season block, week 3 check-in open, next block lined up, full road map.
 *   Mia    – coming back from an ankle injury; week 3 checked in, waiting for feedback.
 *   Tom    – nothing set up yet, to show the empty starting point.
 */
import { DEMO_INVITE_CODE, DEMO_PASSWORD } from "../config/demo";
import { hashPassword } from "../lib/auth/password";
import { db } from "./index";
import { seedDemoPlans, wipePlans } from "./demo-plans";
import { athleteProfiles, users } from "./schema";

/** Deletes every row in every table. */
export async function wipeDatabase() {
  await wipePlans();
  await db.delete(athleteProfiles);
  await db.delete(users);
}

/** True when no one has signed up yet. */
export async function isDatabaseEmpty(): Promise<boolean> {
  const rows = await db.select({ id: users.id }).from(users).limit(1);
  return rows.length === 0;
}

/** Inserts the demo coach, athletes and their plans. Expects an empty database. */
export async function seedDemoData(today: string): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const coachId = crypto.randomUUID();
  await db.insert(users).values({ id: coachId, email: "coach@goe.test", name: "Sam Taylor", role: "coach", passwordHash, inviteCode: DEMO_INVITE_CODE });

  for (const [email, name] of [
    ["jordan@goe.test", "Jordan Ellis"],
    ["mia@goe.test", "Mia Chen"],
    ["tom@goe.test", "Tom Okafor"],
  ] as const) {
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email, name, role: "athlete", passwordHash });
    await db.insert(athleteProfiles).values({ userId: id, coachId });
  }

  await seedDemoPlans(today);
}
