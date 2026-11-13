import { describe, expect, it } from "vitest";
import { v3PlanPath } from "./paths";

describe("v3PlanPath", () => {
  it("sends athletes to their own plan and coaches to the athlete's page", () => {
    expect(v3PlanPath({ role: "athlete" }, "a1")).toBe("/athlete");
    expect(v3PlanPath({ role: "coach" }, "a1")).toBe("/coach/athletes/a1");
  });
});
