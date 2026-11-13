/** The demo accounts created by `npm run db:seed` and by DEMO_MODE deploys. */
export const DEMO_PASSWORD = "password123";
export const DEMO_INVITE_CODE = "GOEDEMO";

export const DEMO_ACCOUNTS = [
  { email: "jordan@goe.test", label: "Athlete", description: "pre-season block, week 3 check-in open" },
  { email: "coach@goe.test", label: "Coach", description: `invite code ${DEMO_INVITE_CODE}` },
  { email: "mia@goe.test", label: "Athlete", description: "coming back from injury" },
  { email: "tom@goe.test", label: "Athlete", description: "new, nothing set up yet" },
] as const;

/**
 * Demo mode shows one-click demo logins on the login page and loads the demo
 * athletes into an empty hosted database on deploy. It's ON while the app is a
 * prototype; set DEMO_MODE=false before real athletes start using it.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
