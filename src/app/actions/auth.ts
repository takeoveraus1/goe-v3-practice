"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { athleteProfiles, users } from "@/db/schema";
import { generateInviteCode, normalizeInviteCode } from "@/lib/auth/invite-code";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { homePathFor } from "@/lib/auth/session-token";
import { invalid, type FormState } from "@/lib/form-state";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Enter a valid email address." }));

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyAgainstDummy(parsed.data.password);
  if (!user || !ok) return { error: "That email and password don't match an account." };

  await createSession({ userId: user.id, role: user.role });
  redirect(homePathFor(user.role));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email,
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  role: z.enum(["athlete", "coach"], { message: "Choose athlete or coach." }),
  inviteCode: z.string().optional(),
});

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { name, password, role } = parsed.data;

  const existing = await db.query.users.findFirst({ columns: { id: true }, where: eq(users.email, parsed.data.email) });
  if (existing) return { fieldErrors: { email: "An account with this email already exists." }, error: "Please fix the highlighted fields." };

  let coachId: string | null = null;
  const code = parsed.data.inviteCode ? normalizeInviteCode(parsed.data.inviteCode) : "";
  if (role === "athlete" && code) {
    const coach = await db.query.users.findFirst({ columns: { id: true, role: true }, where: eq(users.inviteCode, code) });
    if (!coach || coach.role !== "coach") {
      return { fieldErrors: { inviteCode: "We couldn't find a coach with that code." }, error: "Please fix the highlighted fields." };
    }
    coachId = coach.id;
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  let inviteCode: string | null = null;
  if (role === "coach") {
    // Retry on the (unlikely) chance of a collision.
    for (let attempt = 0; attempt < 5 && !inviteCode; attempt++) {
      const candidate = generateInviteCode();
      const taken = await db.query.users.findFirst({ columns: { id: true }, where: eq(users.inviteCode, candidate) });
      if (!taken) inviteCode = candidate;
    }
  }

  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, name, email: parsed.data.email, passwordHash, role, inviteCode });
    if (role === "athlete") await tx.insert(athleteProfiles).values({ userId, coachId });
  });

  await createSession({ userId, role });
  redirect(role === "athlete" ? "/athlete" : "/coach");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
