import { describe, expect, it } from "vitest";
import { accessToken, configuredAccessCode, hasAccess, isAccessGateOn, safeNextPath } from "./access";

describe("access gate", () => {
  it("is always on on Vercel, and elsewhere only when a code is set", () => {
    expect(isAccessGateOn({ VERCEL: "1" })).toBe(true);
    expect(isAccessGateOn({ ACCESS_CODE: "court-42" })).toBe(true);
    expect(isAccessGateOn({})).toBe(false);
    expect(isAccessGateOn({ ACCESS_CODE: "   " })).toBe(false);
    expect(configuredAccessCode({ ACCESS_CODE: "  court-42 " })).toBe("court-42");
  });

  it("lets everyone in while the gate is off", async () => {
    expect(await hasAccess(undefined, {})).toBe(true);
  });

  it("keeps the app locked on Vercel until a code is set", async () => {
    expect(await hasAccess(undefined, { VERCEL: "1" })).toBe(false);
    expect(await hasAccess("anything", { VERCEL: "1" })).toBe(false);
  });

  it("accepts only a cookie made from the current code", async () => {
    const env = { VERCEL: "1", ACCESS_CODE: "court-42" };
    expect(await hasAccess(await accessToken("court-42"), env)).toBe(true);
    expect(await hasAccess(await accessToken("old-code"), env)).toBe(false);
    expect(await hasAccess("court-42", env)).toBe(false);
    expect(await hasAccess(undefined, env)).toBe(false);
  });

  it("never stores the code itself and is stable for the same code", async () => {
    const token = await accessToken("court-42");
    expect(token).not.toContain("court-42");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(await accessToken("court-42")).toBe(token);
  });

  it("only returns to internal pages after the code is entered", () => {
    expect(safeNextPath("/coach/athletes/abc")).toBe("/coach/athletes/abc");
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil")).toBeNull();
    expect(safeNextPath("/access")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });
});
