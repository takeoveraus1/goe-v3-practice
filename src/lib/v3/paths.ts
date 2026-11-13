import type { Role } from "@/db/schema";

/** The plan page for an athlete, as seen by whoever is editing it. */
export function v3PlanPath(viewer: { role: Role }, athleteId: string): string {
  return viewer.role === "coach" ? `/coach/athletes/${athleteId}` : "/athlete";
}
