import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { athleteProfiles, users, type Role, type User } from "@/db/schema";
import { readSession } from "./session";
import { homePathFor } from "./session-token";

/**
 * Data access layer for auth. Every page and server action calls one of these,
 * so authorization never relies on the proxy alone.
 */

export type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "inviteCode">;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.query.users.findFirst({
    columns: { id: true, name: true, email: true, role: true, inviteCode: true },
    where: eq(users.id, session.userId),
  });
  if (!user || user.role !== session.role) return null;
  return user;
});

export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(homePathFor(user.role));
  return user;
}

export const requireAthlete = () => requireUser("athlete");
export const requireCoach = () => requireUser("coach");

/** A coach viewing one of their own athletes. Anyone else gets a 404. */
export async function requireCoachOfAthlete(athleteId: string) {
  const coach = await requireCoach();
  const profile = await db.query.athleteProfiles.findFirst({
    where: and(eq(athleteProfiles.userId, athleteId), eq(athleteProfiles.coachId, coach.id)),
  });
  if (!profile) notFound();
  return { coach, profile };
}

/**
 * For actions an athlete can take on themselves and their coach can take on their behalf.
 * Returns the acting user, or null if they aren't allowed.
 */
export async function authorizeAthleteAccess(athleteId: string): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "athlete") return user.id === athleteId ? user : null;
  const profile = await db.query.athleteProfiles.findFirst({
    columns: { userId: true },
    where: and(eq(athleteProfiles.userId, athleteId), eq(athleteProfiles.coachId, user.id)),
  });
  return profile ? user : null;
}
