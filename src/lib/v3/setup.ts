/**
 * The order a plan is set up in, matching the dashboard from top to bottom:
 * Identity & Archetype → Training Block → Player Roadmap → Action Steps.
 */
export interface V3SetupInput {
  profile: { primaryArchetype: string | null; aimTeam: string | null; aimRole: string | null } | null;
  blockCount: number;
  stepCount: number;
}

export type V3SetupStepKey = "identity" | "block" | "roadmap" | "steps";

export interface V3SetupStep {
  key: V3SetupStepKey;
  label: string;
  done: boolean;
}

export function v3SetupSteps(input: V3SetupInput): V3SetupStep[] {
  return [
    { key: "identity", label: "Identity & Archetype", done: Boolean(input.profile?.primaryArchetype) },
    { key: "block", label: "Training Block", done: input.blockCount > 0 },
    { key: "roadmap", label: "Player Roadmap", done: Boolean(input.profile?.aimTeam || input.profile?.aimRole) },
    { key: "steps", label: "Action Steps", done: input.stepCount > 0 },
  ];
}

/** The first step not done yet, or null once everything is set up. */
export function v3NextSetupStep(steps: readonly V3SetupStep[]): V3SetupStep | null {
  return steps.find((s) => !s.done) ?? null;
}
