import { describe, expect, it } from "vitest";
import { v3NextSetupStep, v3SetupSteps } from "./setup";

describe("plan set-up order", () => {
  it("goes Identity & Archetype, Training Block, Player Roadmap, Action Steps", () => {
    const steps = v3SetupSteps({ profile: null, blockCount: 0, stepCount: 0 });
    expect(steps.map((s) => s.label)).toEqual(["Identity & Archetype", "Training Block", "Player Roadmap", "Action Steps"]);
    expect(steps.every((s) => !s.done)).toBe(true);
    expect(v3NextSetupStep(steps)?.key).toBe("identity");
  });

  it("marks each part done as it's filled in, and points at the next one", () => {
    const steps = v3SetupSteps({ profile: { primaryArchetype: "combo_guard", aimTeam: null, aimRole: null }, blockCount: 1, stepCount: 0 });
    expect(steps.map((s) => s.done)).toEqual([true, true, false, false]);
    expect(v3NextSetupStep(steps)?.key).toBe("roadmap");
  });

  it("counts the roadmap as set once either the team or the role is there", () => {
    const steps = v3SetupSteps({ profile: { primaryArchetype: null, aimTeam: null, aimRole: "Starting point guard" }, blockCount: 0, stepCount: 0 });
    expect(steps.find((s) => s.key === "roadmap")?.done).toBe(true);
  });

  it("has nothing left once all four are done", () => {
    const steps = v3SetupSteps({ profile: { primaryArchetype: "slasher", aimTeam: "Sydney Kings", aimRole: null }, blockCount: 2, stepCount: 3 });
    expect(v3NextSetupStep(steps)).toBeNull();
  });
});
