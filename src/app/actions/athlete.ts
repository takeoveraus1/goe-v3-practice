"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { athleteProfiles, users } from "@/db/schema";
import { requireAthlete } from "@/lib/auth/dal";
import { normalizeInviteCode } from "@/lib/auth/invite-code";
import type { FormState } from "@/lib/form-state";

/** Join a coach's roster with their invite code. */
export async function linkCoach(_prev: FormState, formData: FormData): Promise<FormState> {
  const athlete = await requireAthlete();
  const code = normalizeInviteCode(String(formData.get("inviteCode") ?? ""));
  if (!code) return { fieldErrors: { inviteCode: "Enter your coach's invite code." } };

  const coach = await db.query.users.findFirst({ columns: { id: true, name: true, role: true }, where: eq(users.inviteCode, code) });
  if (!coach || coach.role !== "coach") return { fieldErrors: { inviteCode: "We couldn't find a coach with that code." } };

  await db
    .insert(athleteProfiles)
    .values({ userId: athlete.id, coachId: coach.id })
    .onConflictDoUpdate({ target: athleteProfiles.userId, set: { coachId: coach.id } });
  revalidatePath("/", "layout");
  // The join card disappears once linked, so confirm on the plan itself.
  redirect("/athlete?saved=coach");
}
