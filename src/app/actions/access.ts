"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, ACCESS_COOKIE_MAX_AGE, accessToken, configuredAccessCode, safeNextPath } from "@/lib/access";
import { readSession } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";

/** Checks the site-wide access code and, if it's right, remembers this browser for 30 days. */
export async function enterAccessCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = configuredAccessCode();
  if (!code) return { error: "This app doesn't have an access code yet." };

  const given = String(formData.get("code") ?? "").trim();
  if (!given) return { fieldErrors: { code: "Enter the access code." } };

  const [givenToken, realToken] = await Promise.all([accessToken(given), accessToken(code)]);
  if (givenToken !== realToken) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { fieldErrors: { code: "That code isn't right." } };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, realToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  // Not logged in yet: the login page comes next, whatever page they were heading for.
  if (!(await readSession())) redirect("/login");
  redirect(safeNextPath(formData.get("next")) ?? "/");
}
